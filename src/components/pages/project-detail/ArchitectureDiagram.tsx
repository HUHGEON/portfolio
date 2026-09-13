"use client";

import {
  Bell,
  Cog,
  Database,
  Globe,
  Shield,
  User,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { GithubIcon } from "@/components/icons/github-icon";
import {
  archFrameHeight,
  archScale,
} from "@/components/pages/project-detail/arch-dimensions";
import { useTheme } from "@/components/shell/theme-context";

const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const ic = (name: string) => `${BP}/icons/tech/${name}.svg`;

// fixed design space (px) — the canvas transform scales the whole thing
const W = 1600;
const H = 980;

// zone metrics
const HEADER_H = 48;
const PAD = 12;
const ITEM_H = 56;
const GAP = 8;

type Side = "top" | "right" | "bottom" | "left";
type ColorKey = "blue" | "green" | "teal" | "indigo" | "purple" | "amber" | "slate";
type Flow = "req" | "external" | "data" | "ai";

type Item = {
  label: string;
  sub?: string;
  logo?: string;
  emoji?: string;
  lucide?: LucideIcon;
};

type Zone = {
  id: string;
  title?: string;
  subtitle?: string;
  logo?: string;
  lucide?: LucideIcon;
  color: ColorKey;
  x: number;
  y: number;
  w: number;
  layout?: "card" | "row" | "plain";
  items?: Item[];
};

type Edge = {
  from: string;
  fromItem?: number;
  fromSide: Side;
  to: string;
  toItem?: number;
  toSide: Side;
  label?: string;
  flow: Flow;
  bi?: boolean;
};

export type ArchSpec = {
  container?: boolean;
  containerBrand?: string;
  containerLabel?: string;
  height?: number;
  width?: number;
  zones: Zone[];
  edges: Edge[];
  legend: { flow: Flow; label: string }[];
};

const COLOR: Record<
  ColorKey,
  { border: string; head: string; soft: string; text: string }
> = {
  blue: { border: "#bfdbfe", head: "#2563eb", soft: "#eff6ff", text: "#1d4ed8" },
  green: { border: "#bbf7d0", head: "#16a34a", soft: "#f0fdf4", text: "#15803d" },
  teal: { border: "#99f6e4", head: "#0d9488", soft: "#f0fdfa", text: "#0f766e" },
  indigo: { border: "#c7d2fe", head: "#4f46e5", soft: "#eef2ff", text: "#4338ca" },
  purple: { border: "#e9d5ff", head: "#9333ea", soft: "#faf5ff", text: "#7e22ce" },
  amber: { border: "#fde68a", head: "#d97706", soft: "#fffbeb", text: "#b45309" },
  slate: { border: "#e2e8f0", head: "#475569", soft: "#f8fafc", text: "#334155" },
};

// dark canvas: same hues as translucent tints so zones sit on the page instead of glowing white
const COLOR_DARK: Record<
  ColorKey,
  { border: string; head: string; soft: string; text: string }
> = {
  blue: { border: "rgba(255,255,255,.10)", head: "#60a5fa", soft: "rgba(255,255,255,.035)", text: "#93c5fd" },
  green: { border: "rgba(255,255,255,.10)", head: "#4ade80", soft: "rgba(255,255,255,.035)", text: "#86efac" },
  teal: { border: "rgba(255,255,255,.10)", head: "#2dd4bf", soft: "rgba(255,255,255,.035)", text: "#5eead4" },
  indigo: { border: "rgba(255,255,255,.10)", head: "#818cf8", soft: "rgba(255,255,255,.035)", text: "#a5b4fc" },
  purple: { border: "rgba(255,255,255,.10)", head: "#c084fc", soft: "rgba(255,255,255,.035)", text: "#d8b4fe" },
  amber: { border: "rgba(255,255,255,.10)", head: "#fbbf24", soft: "rgba(255,255,255,.035)", text: "#fcd34d" },
  slate: { border: "rgba(255,255,255,.10)", head: "#94a3b8", soft: "rgba(255,255,255,.035)", text: "#cbd5e1" },
};

// arrow colors — bright on the dark canvas, medium/dark on the light canvas
const FLOW_DARK: Record<Flow, string> = {
  req: "#a1a1aa",
  external: "#c084fc",
  data: "#60a5fa",
  ai: "#2dd4bf",
};
const FLOW_LIGHT: Record<Flow, string> = {
  req: "#64748b",
  external: "#9333ea",
  data: "#2563eb",
  ai: "#0d9488",
};

function zoneHeight(z: Zone) {
  if (z.layout === "plain") return 96;
  if (z.layout === "row") return HEADER_H + PAD * 2 + 96;
  const n = z.items?.length ?? 0;
  return HEADER_H + PAD + n * ITEM_H + Math.max(0, n - 1) * GAP + PAD;
}
function zoneWidth(z: Zone) {
  return z.w;
}

function anchor(z: Zone, side: Side, itemIndex?: number) {
  const h = zoneHeight(z);
  const w = zoneWidth(z);
  let cy = z.y + h / 2;
  if (itemIndex !== undefined && z.layout !== "row" && z.layout !== "plain") {
    cy = z.y + HEADER_H + PAD + itemIndex * (ITEM_H + GAP) + ITEM_H / 2;
  }
  switch (side) {
    case "top":
      return { x: z.x + w / 2, y: z.y };
    case "bottom":
      return { x: z.x + w / 2, y: z.y + h };
    case "left":
      return { x: z.x, y: cy };
    case "right":
      return { x: z.x + w, y: cy };
  }
}

type Pt = { x: number; y: number };

// Route an edge between two anchors.
// - aligned / near-flat / short edges → a clean straight line
// - long diagonals (big perpendicular offset) → an orthogonal elbow so the
//   line never reads as an awkward long slant.
// The label always lands on the middle (vertical/horizontal) run of the path.
function routeEdge(a: Pt, aSide: Side, b: Pt, i: number): { path: string; label: Pt } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const horiz = aSide === "left" || aSide === "right";
  const steep = horiz ? Math.abs(dy) > 30 : Math.abs(dx) > 30;
  if (!steep) {
    return {
      path: `M ${a.x} ${a.y} L ${b.x} ${b.y}`,
      label: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    };
  }
  // small per-edge stagger so parallel elbows don't stack on the same line
  const jitter = ((i % 3) - 1) * 16;
  if (horiz) {
    const bx = (a.x + b.x) / 2 + jitter;
    return {
      path: `M ${a.x} ${a.y} L ${bx} ${a.y} L ${bx} ${b.y} L ${b.x} ${b.y}`,
      label: { x: bx, y: (a.y + b.y) / 2 },
    };
  }
  const by = (a.y + b.y) / 2 + jitter;
  return {
    path: `M ${a.x} ${a.y} L ${a.x} ${by} L ${b.x} ${by} L ${b.x} ${b.y}`,
    label: { x: (a.x + b.x) / 2, y: by },
  };
}

function ItemGlyph({
  it,
  color,
  size = 22,
}: {
  it: Item;
  color: string;
  size?: number;
}) {
  if (it.logo)
    return (
      <Image
        src={ic(it.logo)}
        alt=""
        width={size}
        height={size}
        unoptimized
        style={{ width: size, height: size }}
        className="shrink-0 object-contain"
      />
    );
  if (it.emoji)
    return (
      <span style={{ fontSize: size - 2 }} className="shrink-0 leading-none">
        {it.emoji}
      </span>
    );
  if (it.lucide) {
    const I = it.lucide;
    return <I size={size - 2} className="shrink-0" style={{ color }} />;
  }
  return null;
}

export function ArchitectureDiagram({ spec }: { spec: ArchSpec }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const flow = isDark ? FLOW_DARK : FLOW_LIGHT;
  const labelFill = isDark ? "#17171c" : "#ffffff";
  const labelStrokeOpacity = isDark ? 0.55 : 0.35;
  const byId = new Map(spec.zones.map((z) => [z.id, z]));
  const HH = spec.height ?? H;
  const WW = spec.width ?? W;
  // frame hugs the content (adaptive height) with inner padding
  const s = archScale(WW, HH);
  const frameH = archFrameHeight(WW, HH);

  return (
    <div
      className="w-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card-2)] dark:shadow-[var(--shadow-sm)]"
      style={{ height: frameH, overflow: "hidden", position: "relative" }}
    >
      <div
        className="font-sans"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: WW,
          height: HH,
          transform: `translate(-50%, -50%) scale(${s})`,
        }}
      >
        {spec.container ? (
          <>
            <div
              className="absolute rounded-[26px] border-2 border-dashed border-[var(--border)] dark:border-white/10 dark:bg-white/[0.03]"
              style={{ left: 8, top: 66, width: WW - 16, height: HH - 74 }}
            />
            <div
              className="absolute flex items-center gap-2"
              style={{ left: 40, top: 14 }}
            >
              <Image
                src={ic("docker")}
                alt=""
                width={30}
                height={30}
                unoptimized
                style={{ width: 30, height: 30 }}
              />
              <span className="text-[19px] font-bold text-sky-600 dark:text-sky-400">
                {spec.containerBrand ?? "Docker Compose"}
              </span>
            </div>
            <div
              className="absolute flex -translate-x-1/2 items-center gap-2 rounded-xl border border-sky-200 bg-white dark:border-sky-400/30 dark:bg-zinc-900/70 px-5 py-2 shadow-sm"
              style={{ left: WW / 2, top: 12 }}
            >
              <Image
                src={ic("docker")}
                alt=""
                width={22}
                height={22}
                unoptimized
                style={{ width: 22, height: 22 }}
              />
              <span className="text-[16px] font-bold text-sky-700 dark:text-sky-300">
                {spec.containerLabel ?? "Docker Compose Environment"}
              </span>
            </div>
            <div
              className="absolute flex items-center gap-2"
              style={{ right: 40, top: 14 }}
            >
              <GithubIcon size={26} className="text-slate-800 dark:text-zinc-100" />
              <div className="leading-tight">
                <div className="text-[16px] font-bold text-slate-800 dark:text-zinc-100">
                  GitHub
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Source Code Repository
                </div>
              </div>
            </div>
          </>
        ) : null}

        {/* edges */}
        <svg
          viewBox={`0 0 ${WW} ${HH}`}
          className="pointer-events-none absolute inset-0"
          style={{ width: WW, height: HH, zIndex: 20 }}
        >
          <defs>
            {(Object.keys(flow) as Flow[]).map((f) => (
              <marker
                key={f}
                id={`ah-${f}`}
                markerWidth="10"
                markerHeight="10"
                refX="7.5"
                refY="5"
                orient="auto-start-reverse"
                markerUnits="userSpaceOnUse"
              >
                <path d="M0,0 L10,5 L0,10 Z" fill={flow[f]} />
              </marker>
            ))}
          </defs>
          {spec.edges.map((e, i) => {
            const za = byId.get(e.from);
            const zb = byId.get(e.to);
            if (!za || !zb) return null;
            const a = anchor(za, e.fromSide, e.fromItem);
            const b = anchor(zb, e.toSide, e.toItem);
            const { path, label: lp0 } = routeEdge(a, e.fromSide, b, i);
            const color = flow[e.flow];
            const lw = e.label ? e.label.length * 12 + 14 : 0;
            const lp = e.label ? lp0 : null;
            return (
              <g key={i}>
                <path
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeWidth={2.4}
                  markerEnd={`url(#ah-${e.flow})`}
                  markerStart={e.bi ? `url(#ah-${e.flow})` : undefined}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {e.label && lp ? (
                  <>
                    <rect
                      x={lp.x - lw / 2}
                      y={lp.y - 13}
                      width={lw}
                      height={24}
                      rx={6}
                      fill={labelFill}
                      stroke={color}
                      strokeOpacity={labelStrokeOpacity}
                    />
                    <text
                      x={lp.x}
                      y={lp.y + 3}
                      textAnchor="middle"
                      fontSize={15}
                      fontWeight={600}
                      fill={color}
                    >
                      {e.label}
                    </text>
                  </>
                ) : null}
              </g>
            );
          })}
        </svg>

        {/* zones */}
        {spec.zones.map((z) => {
          const c = (isDark ? COLOR_DARK : COLOR)[z.color];
          const ZI = z.lucide;
          const h = zoneHeight(z);
          if (z.layout === "plain") {
            return (
              <div
                key={z.id}
                className="absolute flex flex-col items-center justify-center gap-2"
                style={{ left: z.x, top: z.y, width: z.w, height: h }}
              >
                {ZI ? (
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-300 bg-white dark:border-white/15 dark:bg-white/5 text-slate-600 dark:text-zinc-300 shadow-sm">
                    <ZI size={30} />
                  </span>
                ) : null}
                <span className="text-[16px] font-semibold text-slate-700 dark:text-zinc-200">
                  {z.title}
                </span>
              </div>
            );
          }
          return (
            <div
              key={z.id}
              className="absolute rounded-2xl border bg-white shadow-sm dark:bg-[var(--card)] dark:shadow-none"
              style={{
                left: z.x,
                top: z.y,
                width: z.w,
                height: h,
                borderColor: c.border,
              }}
            >
              <div
                className="flex items-center gap-2 px-4"
                style={{ height: HEADER_H }}
              >
                {ZI ? <ZI size={19} style={{ color: c.head }} /> : null}
                {z.logo ? (
                  <Image
                    src={ic(z.logo)}
                    alt=""
                    width={20}
                    height={20}
                    unoptimized
                    style={{ width: 20, height: 20 }}
                  />
                ) : null}
                <span className="text-[16px] font-bold" style={{ color: c.text }}>
                  {z.title}
                </span>
                {z.subtitle ? (
                  <span className="text-[12px] font-semibold text-slate-400 dark:text-zinc-500">
                    {z.subtitle}
                  </span>
                ) : null}
              </div>
              {z.layout === "row" ? (
                <div
                  className="flex items-stretch justify-between gap-2 px-3"
                  style={{ paddingBottom: PAD }}
                >
                  {z.items?.map((it, i) => (
                    <div
                      key={i}
                      className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-xl border px-1 py-2"
                      style={{ borderColor: c.border, background: c.soft, height: 84 }}
                    >
                      <ItemGlyph it={it} color={c.head} size={26} />
                      <div className="text-center text-[12px] font-semibold text-slate-700 dark:text-zinc-200">
                        {it.label}
                      </div>
                      {it.sub ? (
                        <div className="text-center text-[10px] text-slate-500 dark:text-zinc-400">
                          {it.sub}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="flex flex-col gap-2 px-3"
                  style={{ paddingTop: PAD - 4 }}
                >
                  {z.items?.map((it, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-xl border px-3"
                      style={{
                        borderColor: c.border,
                        background: c.soft,
                        height: ITEM_H,
                      }}
                    >
                      <ItemGlyph it={it} color={c.head} size={24} />
                      <div className="min-w-0">
                        <div className="truncate text-[15px] font-bold text-slate-800 dark:text-zinc-100">
                          {it.label}
                        </div>
                        {it.sub ? (
                          <div className="truncate text-[12px] text-slate-500 dark:text-zinc-400">
                            {it.sub}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* legend */}
        <div
          className="absolute left-1/2 flex -translate-x-1/2 flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-full border border-slate-200 bg-white/95 dark:border-white/10 dark:bg-white/[0.05] px-6 py-2 shadow-sm"
          style={{ bottom: 12, zIndex: 30 }}
        >
          {spec.legend.map((l) => (
            <span
              key={l.flow}
              className="flex items-center gap-2 text-[14px] text-slate-600 dark:text-zinc-300"
            >
              <span
                className="inline-block h-[3px] w-7 rounded-full"
                style={{ background: flow[l.flow] }}
              />
              {l.label}
            </span>
          ))}
          {spec.container ? (
            <span className="flex items-center gap-2 text-[14px] text-slate-600 dark:text-zinc-300">
              <Image
                src={ic("docker")}
                alt=""
                width={18}
                height={18}
                unoptimized
                style={{ width: 18, height: 18 }}
              />
              Docker Container
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Per-project specs
// ------------------------------------------------------------------

export const ARCH_SPECS: Record<string, ArchSpec> = {
  haeyaji: {
    container: true,
    zones: [
      {
        id: "user",
        layout: "plain",
        title: "사용자",
        color: "slate",
        lucide: User,
        x: 24,
        y: 334,
        w: 110,
      },
      {
        id: "client",
        title: "Client",
        subtitle: "Frontend",
        color: "blue",
        lucide: Globe,
        x: 160,
        y: 190,
        w: 270,
        items: [
          { label: "React + TypeScript", sub: "카테고리 칩 · SSE 구독", logo: "react" },
          { label: "Axios", sub: "REST 호출", logo: "axios" },
          { label: "Zustand", sub: "상태 관리", emoji: "🐻" },
          { label: "Tailwind CSS", sub: "스타일링", logo: "tailwindcss" },
          { label: "Vite", sub: "빌드 도구", logo: "vite" },
        ],
      },
      {
        id: "tooling",
        layout: "row",
        title: "Build & Tooling",
        color: "amber",
        x: 160,
        y: 640,
        w: 350,
        items: [
          { label: "Vite", logo: "vite" },
          { label: "Tailwind", logo: "tailwindcss" },
          { label: "Vitest", logo: "vitest" },
          { label: "ESLint", logo: "eslint" },
          { label: "Prettier", logo: "prettier" },
        ],
      },
      {
        id: "backend",
        title: "Backend",
        subtitle: "Spring Boot",
        color: "green",
        logo: "springboot",
        x: 660,
        y: 170,
        w: 320,
        items: [
          { label: "REST API", sub: "요청 처리", lucide: Globe },
          { label: "추천 게이트웨이", sub: "nlp 대행 · 트랜잭션 분리", lucide: Cog },
          { label: "개인화 학습", sub: "맥락별 가중치 +2 / -0.05", lucide: Cog },
          { label: "인증 · 스케줄러", sub: "OAuth2 · 배치", lucide: Shield },
          { label: "캐싱 · 알림 (Pub/Sub)", sub: "이벤트 기반 · SSE", lucide: Bell },
        ],
      },
      {
        id: "ai",
        layout: "row",
        title: "AI Service",
        color: "teal",
        x: 660,
        y: 660,
        w: 320,
        items: [
          { label: "FastAPI", sub: "추천 두뇌 · 규칙·RAG", logo: "fastapi" },
          { label: "Ollama · EXAONE", sub: "로컬 LLM · format=schema", logo: "ollama" },
        ],
      },
      {
        id: "data",
        title: "Data Storage",
        color: "indigo",
        lucide: Database,
        x: 1130,
        y: 470,
        w: 320,
        items: [
          { label: "MySQL", sub: "원본 데이터 · JPA/QueryDSL", logo: "mysql" },
          { label: "Redis", sub: "캐시 · 세션 · 메시지 브로커", logo: "redis" },
        ],
      },
      {
        id: "external",
        title: "External Services",
        color: "purple",
        lucide: Globe,
        x: 1360,
        y: 130,
        w: 220,
        items: [
          { label: "Resend", sub: "이메일 전송", logo: "resend" },
          { label: "기상청 · 에어코리아", sub: "날씨 · 미세먼지", emoji: "🌦️" },
          { label: "카카오 로컬", sub: "장소 · 지오코딩", logo: "kakaotalk" },
        ],
      },
    ],
    edges: [
      { from: "user", fromSide: "right", to: "client", toSide: "left", flow: "req" },
      {
        from: "client",
        fromSide: "right",
        to: "backend",
        toSide: "left",
        flow: "req",
        label: "REST/JSON",
        bi: true,
      },
      {
        from: "backend",
        fromItem: 0,
        fromSide: "right",
        to: "external",
        toItem: 0,
        toSide: "left",
        flow: "external",
        label: "Email SMTP",
      },
      {
        from: "backend",
        fromItem: 1,
        fromSide: "right",
        to: "external",
        toItem: 1,
        toSide: "left",
        flow: "external",
        label: "날씨 API",
      },
      {
        from: "backend",
        fromItem: 2,
        fromSide: "right",
        to: "external",
        toItem: 2,
        toSide: "left",
        flow: "external",
        label: "지도 API",
      },
      {
        from: "backend",
        fromItem: 3,
        fromSide: "right",
        to: "data",
        toItem: 0,
        toSide: "left",
        flow: "data",
        label: "원본 저장",
      },
      {
        from: "backend",
        fromItem: 4,
        fromSide: "right",
        to: "data",
        toItem: 1,
        toSide: "left",
        flow: "data",
        label: "캐싱·알림",
      },
      {
        from: "backend",
        fromSide: "bottom",
        to: "ai",
        toSide: "top",
        flow: "ai",
        label: "AI 질의",
      },
    ],
    legend: [
      { flow: "req", label: "요청/응답 흐름" },
      { flow: "external", label: "외부 API 연동" },
      { flow: "data", label: "데이터 저장/조회" },
      { flow: "ai", label: "AI 질의 흐름" },
    ],
  },

  "voice-kiosk": {
    height: 680,
    width: 1900,
    zones: [
      {
        id: "user",
        layout: "plain",
        title: "사용자",
        color: "slate",
        lucide: User,
        x: 30,
        y: 248,
        w: 110,
      },
      {
        id: "client",
        title: "Client",
        subtitle: "키오스크",
        color: "blue",
        lucide: Globe,
        x: 300,
        y: 200,
        w: 250,
        items: [
          { label: "화면 · 터치 UI", sub: "메뉴 · 주문 화면", emoji: "🖥️" },
          { label: "STT 음성 입력", sub: "음성 → 텍스트", logo: "google-cloud" },
        ],
      },
      {
        id: "nlp",
        title: "NLP Server",
        subtitle: "FastAPI",
        color: "teal",
        logo: "fastapi",
        x: 710,
        y: 200,
        w: 280,
        items: [
          { label: "의도 추출", sub: "gpt-4o-mini · intents JSON", logo: "openai" },
          { label: "오케스트레이션", sub: "query.sequence · 재호출", lucide: Cog },
        ],
      },
      {
        id: "api",
        title: "API Server",
        subtitle: "Express",
        color: "green",
        logo: "nodejs",
        x: 1150,
        y: 170,
        w: 300,
        items: [
          { label: "디스패처", sub: "/api/handle · 순차 실행", lucide: Globe },
          { label: "주문 · 추천 · 장바구니", sub: "도메인 컨트롤러", lucide: Cog },
          { label: "세션 · pending", sub: "멀티턴 상태", lucide: Bell },
        ],
      },
      {
        id: "data",
        title: "Data Storage",
        color: "indigo",
        lucide: Database,
        x: 1610,
        y: 230,
        w: 270,
        items: [{ label: "MongoDB", sub: "메뉴 / 주문 · Atlas", logo: "mongodb" }],
      },
      {
        id: "openai",
        title: "External LLM",
        color: "purple",
        lucide: Globe,
        x: 710,
        y: 460,
        w: 280,
        items: [{ label: "OpenAI", sub: "gpt-4o-mini · intent JSON", logo: "openai" }],
      },
    ],
    edges: [
      { from: "user", fromSide: "right", to: "client", toSide: "left", flow: "req" },
      {
        from: "client",
        fromSide: "right",
        to: "nlp",
        toSide: "left",
        flow: "req",
        label: "STT",
      },
      {
        from: "nlp",
        fromSide: "bottom",
        to: "openai",
        toSide: "top",
        flow: "external",
        label: "의도 추출",
      },
      {
        from: "nlp",
        fromSide: "right",
        to: "api",
        toSide: "left",
        flow: "req",
        label: "intents",
      },
      {
        from: "api",
        fromSide: "right",
        to: "data",
        toSide: "left",
        flow: "data",
        label: "저장",
      },
    ],
    legend: [
      { flow: "req", label: "요청/응답" },
      { flow: "external", label: "LLM 호출" },
      { flow: "data", label: "데이터 저장/조회" },
    ],
  },

  "live-chat": {
    container: true,
    height: 760,
    width: 1500,
    zones: [
      {
        id: "viewer",
        layout: "plain",
        title: "시청자",
        color: "slate",
        lucide: User,
        x: 30,
        y: 272,
        w: 110,
      },
      {
        id: "server",
        title: "WebFlux 채팅 서버",
        subtitle: "Spring Boot",
        color: "green",
        logo: "spring",
        x: 300,
        y: 160,
        w: 320,
        items: [
          { label: "WebSocket 핸들러", sub: "이벤트루프 · concatMap", emoji: "🔌" },
          { label: "입장 게이트", sub: "RS256 룸 토큰 검증", lucide: Shield },
          { label: "전송 파이프라인", sub: "권한·레이트리밋·욕설", lucide: Cog },
          { label: "멱등 · fail-open", sub: "clientMsgId · 장애 지속", lucide: Bell },
        ],
      },
      {
        id: "redis",
        title: "Redis",
        color: "indigo",
        logo: "redis",
        x: 780,
        y: 180,
        w: 300,
        items: [
          { label: "Pub/Sub 중계", sub: "chat:pubsub:* 패턴 구독", logo: "redis" },
          { label: "세션 · 강퇴 · 레이트리밋", sub: "인메모리 상태", lucide: Database },
        ],
      },
      {
        id: "pod",
        title: "다른 Pod",
        color: "slate",
        lucide: Globe,
        x: 1200,
        y: 210,
        w: 240,
        items: [{ label: "시청자 fan-out", sub: "로컬 세션 전파", lucide: User }],
      },
      {
        id: "mongo",
        title: "MongoDB",
        color: "purple",
        logo: "mongodb",
        x: 780,
        y: 470,
        w: 300,
        items: [
          { label: "메시지 저장", sub: "원문 + 마스킹본", logo: "mongodb" },
          { label: "커서 페이징", sub: "_id 커서 · TTL", lucide: Database },
        ],
      },
    ],
    edges: [
      {
        from: "viewer",
        fromSide: "right",
        to: "server",
        toSide: "left",
        flow: "req",
        label: "WebSocket",
        bi: true,
      },
      {
        from: "server",
        fromItem: 3,
        fromSide: "right",
        to: "mongo",
        toItem: 0,
        toSide: "left",
        flow: "data",
        label: "저장",
      },
      {
        from: "server",
        fromItem: 2,
        fromSide: "right",
        to: "redis",
        toItem: 0,
        toSide: "left",
        flow: "data",
        label: "발행",
      },
      {
        from: "redis",
        fromSide: "right",
        to: "pod",
        toSide: "left",
        flow: "data",
        label: "fan-out",
      },
    ],
    legend: [
      { flow: "req", label: "요청/응답 (WebSocket)" },
      { flow: "data", label: "저장 · 중계" },
    ],
  },

  "blog-platform": {
    height: 620,
    width: 1250,
    zones: [
      {
        id: "client",
        layout: "plain",
        title: "클라이언트",
        color: "slate",
        lucide: User,
        x: 30,
        y: 262,
        w: 120,
      },
      {
        id: "server",
        title: "Express 서버",
        subtitle: "Node.js",
        color: "green",
        logo: "nodejs",
        x: 330,
        y: 150,
        w: 340,
        items: [
          {
            label: "인증 미들웨어",
            sub: "access · refresh · optional 3종",
            lucide: Shield,
          },
          { label: "업로드 미들웨어", sub: "Multer · MIME 필터", emoji: "🖼️" },
          { label: "라우터 · 컨트롤러", sub: "8개 도메인 REST", lucide: Globe },
          { label: "형태소 분석", sub: "mecab-ya 키워드 추출", emoji: "🔤" },
        ],
      },
      {
        id: "mongo",
        title: "MongoDB",
        subtitle: "Mongoose",
        color: "indigo",
        logo: "mongodb",
        x: 870,
        y: 180,
        w: 320,
        items: [
          { label: "유사글 추천", sub: "형태소 text 인덱스", lucide: Database },
          { label: "검색 · 정렬", sub: "regex · aggregate 인기순", lucide: Database },
          { label: "스토리", sub: "TTL 인덱스 24h 자동 삭제", lucide: Bell },
        ],
      },
    ],
    edges: [
      {
        from: "client",
        fromSide: "right",
        to: "server",
        toSide: "left",
        flow: "req",
        label: "요청",
      },
      {
        from: "server",
        fromSide: "right",
        to: "mongo",
        toSide: "left",
        flow: "data",
        label: "저장 · 조회",
      },
    ],
    legend: [
      { flow: "req", label: "요청/응답" },
      { flow: "data", label: "데이터 저장/조회" },
    ],
  },

  zogakzip: {
    height: 560,
    width: 1580,
    zones: [
      {
        id: "client",
        layout: "plain",
        title: "클라이언트",
        color: "slate",
        lucide: User,
        x: 30,
        y: 232,
        w: 120,
      },
      {
        id: "server",
        title: "Express 서버",
        subtitle: "Node.js",
        color: "green",
        logo: "nodejs",
        x: 330,
        y: 150,
        w: 300,
        items: [
          { label: "게시글 API", sub: "라우트 · 컨트롤러", lucide: Globe },
          { label: "이미지 업로드", sub: "Multer diskStorage", emoji: "🖼️" },
          { label: "KST 시간대 처리", sub: "moment-timezone", emoji: "🕐" },
        ],
      },
      {
        id: "mongo",
        title: "MongoDB",
        subtitle: "Mongoose",
        color: "indigo",
        logo: "mongodb",
        x: 810,
        y: 175,
        w: 300,
        items: [
          {
            label: "Group · Post · Comment · Image",
            sub: "참조 계층",
            logo: "mongodb",
          },
          { label: "카운터 동기화", sub: "$inc postCount 등", lucide: Database },
        ],
      },
      {
        id: "badge",
        title: "배지 시스템",
        subtitle: "팀 기능",
        color: "amber",
        lucide: Bell,
        x: 1290,
        y: 205,
        w: 250,
        items: [{ label: "배지 자동 부여", sub: "이벤트 훅 · 24h 배치", lucide: Bell }],
      },
    ],
    edges: [
      {
        from: "client",
        fromSide: "right",
        to: "server",
        toSide: "left",
        flow: "req",
        label: "요청",
      },
      {
        from: "server",
        fromSide: "right",
        to: "mongo",
        toSide: "left",
        flow: "data",
        label: "저장 · 조회",
      },
      {
        from: "mongo",
        fromSide: "right",
        to: "badge",
        toSide: "left",
        flow: "data",
        label: "활동 집계",
      },
    ],
    legend: [
      { flow: "req", label: "요청/응답" },
      { flow: "data", label: "데이터 저장/조회" },
    ],
  },

  "coupon-yaho": {
    height: 860,
    width: 1400,
    zones: [
      {
        id: "user",
        layout: "plain",
        title: "사용자",
        color: "slate",
        lucide: User,
        x: 30,
        y: 232,
        w: 110,
      },
      {
        id: "gateway",
        title: "대기열 게이트웨이",
        subtitle: "Spring WebFlux",
        color: "teal",
        logo: "spring",
        x: 230,
        y: 152,
        w: 300,
        items: [
          { label: "입장 판정", sub: "종결 · 통과 · 대기 세 갈래", lucide: Shield },
          { label: "전역 순번 · ETA", sub: "입장 토큰 180초", lucide: User },
          { label: "리더 선출 · 크레딧 배분", sub: "가용량 기반 유입 제어", lucide: Cog },
        ],
      },
      {
        id: "coupon",
        title: "쿠폰 서비스",
        subtitle: "Spring MVC · N대",
        color: "green",
        logo: "spring",
        x: 640,
        y: 120,
        w: 320,
        items: [
          { label: "발급 API", sub: "멱등키 IN_PROGRESS · DONE", lucide: Globe },
          { label: "Redis 재고 선점", sub: "Lua 원자 판정 (v2.1)", logo: "redis" },
          { label: "조건부 원자 UPDATE", sub: "active_count < total (v1.2)", lucide: Database },
          { label: "알림 outbox", sub: "SKIP LOCKED 릴레이", lucide: Bell },
        ],
      },
      {
        id: "redis",
        title: "Redis",
        subtitle: "Cache · Store",
        color: "indigo",
        logo: "redis",
        x: 1080,
        y: 90,
        w: 280,
        items: [
          { label: "재고 · 발급 게이트", sub: "Lua 스크립트 5종", logo: "redis" },
          { label: "대기열 상태", sub: "순번 · 스냅샷", lucide: Database },
        ],
      },
      {
        id: "mysql",
        title: "MySQL",
        subtitle: "Flyway",
        color: "blue",
        logo: "mysql",
        x: 1080,
        y: 330,
        w: 280,
        items: [
          { label: "발급 · 이력 · 멱등", sub: "UNIQUE 1인 1매", logo: "mysql" },
          { label: "검증 결과 · 통계", sub: "verification_runs", lucide: Database },
        ],
      },
      {
        id: "kafka",
        title: "Kafka",
        subtitle: "알림 이벤트",
        color: "slate",
        lucide: Bell,
        x: 230,
        y: 560,
        w: 300,
        items: [{ label: "알림 Consumer", sub: "발급 결과 알림", lucide: Bell }],
      },
      {
        id: "batch",
        title: "배치 서버",
        subtitle: "Spring Batch",
        color: "purple",
        logo: "spring",
        x: 640,
        y: 520,
        w: 320,
        items: [
          { label: "정합성 검증", sub: "규칙 6종 · 이력 재생", lucide: Shield },
          { label: "만료 · 정리 · 집계", sub: "발급 API와 분리", lucide: Cog },
          { label: "이상 감지", sub: "알림 규칙 45종", lucide: Bell },
        ],
      },
      {
        id: "prometheus",
        title: "Prometheus",
        subtitle: "관측",
        color: "amber",
        logo: "prometheus",
        x: 1080,
        y: 600,
        w: 280,
        items: [{ label: "API · 배치 · 대기열 지표", sub: "Alertmanager", logo: "prometheus" }],
      },
    ],
    edges: [
      {
        from: "user",
        fromSide: "right",
        to: "gateway",
        toSide: "left",
        flow: "req",
        label: "요청",
      },
      {
        from: "gateway",
        fromSide: "right",
        to: "coupon",
        toSide: "left",
        flow: "req",
        label: "입장 통과",
      },
      {
        from: "coupon",
        fromItem: 1,
        fromSide: "right",
        to: "redis",
        toItem: 0,
        toSide: "left",
        flow: "data",
        label: "선점",
      },
      {
        from: "coupon",
        fromItem: 2,
        fromSide: "right",
        to: "mysql",
        toItem: 0,
        toSide: "left",
        flow: "data",
        label: "저장",
      },
      {
        from: "coupon",
        fromSide: "bottom",
        to: "kafka",
        toSide: "top",
        flow: "external",
        label: "알림 발행",
      },
      {
        from: "batch",
        fromItem: 0,
        fromSide: "right",
        to: "mysql",
        toItem: 1,
        toSide: "left",
        flow: "data",
        label: "검증",
      },
    ],
    legend: [
      { flow: "req", label: "요청 · 입장" },
      { flow: "data", label: "재고 선점 · 저장" },
      { flow: "external", label: "알림 이벤트" },
    ],
  },

  "media-inference": {
    height: 620,
    width: 1550,
    zones: [
      {
        id: "client",
        layout: "plain",
        title: "클라이언트",
        color: "slate",
        lucide: User,
        x: 30,
        y: 262,
        w: 120,
      },
      {
        id: "server",
        title: "Express 서버",
        subtitle: "Node.js",
        color: "green",
        logo: "nodejs",
        x: 330,
        y: 150,
        w: 340,
        items: [
          { label: "REST API", sub: "요청 · 업로드(Multer)", lucide: Globe },
          { label: "데이터 전처리", sub: "전처리 파이프라인", lucide: Cog },
          { label: "외부 연동", sub: "axios · 오케스트레이션", lucide: Cog },
          { label: "저장 · 캐싱", sub: "결과 적재 · 캐시", lucide: Bell },
        ],
      },
      {
        id: "inference",
        title: "External Inference",
        color: "purple",
        lucide: Globe,
        x: 830,
        y: 165,
        w: 300,
        items: [
          { label: "외부 처리 서버", sub: "axios 연동 · 대외비", lucide: Globe },
        ],
      },
      {
        id: "data",
        title: "Data Storage",
        color: "indigo",
        lucide: Database,
        x: 830,
        y: 355,
        w: 300,
        items: [
          { label: "MongoDB", sub: "결과 저장", logo: "mongodb" },
          { label: "Redis", sub: "조회 캐시", logo: "redis" },
        ],
      },
    ],
    edges: [
      {
        from: "client",
        fromSide: "right",
        to: "server",
        toSide: "left",
        flow: "req",
        label: "업로드",
      },
      {
        from: "server",
        fromItem: 2,
        fromSide: "right",
        to: "inference",
        toSide: "left",
        flow: "external",
        label: "외부 연동 요청",
      },
      {
        from: "server",
        fromItem: 3,
        fromSide: "right",
        to: "data",
        toItem: 0,
        toSide: "left",
        flow: "data",
        label: "저장·캐시",
      },
    ],
    legend: [
      { flow: "req", label: "요청 / 업로드" },
      { flow: "external", label: "외부 연동" },
      { flow: "data", label: "저장 / 캐시" },
    ],
  },

  "intern-arch": {
    container: true,
    containerBrand: "Docker",
    containerLabel: "Docker · 컨테이너 배포",
    height: 840,
    width: 1440,
    zones: [
      {
        id: "client",
        title: "Client",
        subtitle: "앱 · 단말",
        color: "blue",
        lucide: User,
        x: 30,
        y: 170,
        w: 250,
      },
      {
        id: "video",
        title: "Source Server",
        subtitle: "원본 데이터 수집",
        color: "slate",
        lucide: Globe,
        x: 30,
        y: 440,
        w: 250,
      },
      {
        id: "frontend",
        title: "Frontend Server",
        subtitle: "웹 · 사용자 UI",
        color: "blue",
        lucide: Globe,
        x: 30,
        y: 680,
        w: 250,
      },
      {
        id: "backend",
        title: "Backend Server",
        subtitle: "처리 파이프라인 허브",
        color: "green",
        logo: "nodejs",
        x: 510,
        y: 330,
        w: 380,
        items: [
          { label: "REST API", sub: "요청 · 업로드(Multer)", lucide: Globe },
          { label: "데이터 전처리", sub: "전처리 파이프라인", lucide: Cog },
          { label: "외부 연동", sub: "axios · 오케스트레이션", lucide: Cog },
          { label: "저장 · 캐싱", sub: "결과 적재 · 캐시", lucide: Bell },
        ],
      },
      {
        id: "inference",
        title: "External Service",
        color: "purple",
        lucide: Globe,
        x: 1120,
        y: 340,
        w: 290,
        items: [{ label: "외부 처리", sub: "axios 연동 · 대외비", lucide: Globe }],
      },
      {
        id: "database",
        title: "Data Storage",
        color: "indigo",
        lucide: Database,
        x: 1120,
        y: 550,
        w: 290,
        items: [
          { label: "MongoDB", sub: "결과 저장", logo: "mongodb" },
          { label: "Redis", sub: "조회 캐시", logo: "redis" },
        ],
      },
    ],
    edges: [
      {
        from: "client",
        fromSide: "right",
        to: "backend",
        toItem: 0,
        toSide: "left",
        flow: "req",
        label: "요청 정보",
        bi: true,
      },
      {
        from: "video",
        fromSide: "right",
        to: "backend",
        toItem: 1,
        toSide: "left",
        flow: "req",
        label: "원본 데이터",
      },
      {
        from: "frontend",
        fromSide: "right",
        to: "backend",
        toItem: 2,
        toSide: "left",
        flow: "req",
        label: "요청/응답",
        bi: true,
      },
      {
        from: "backend",
        fromItem: 0,
        fromSide: "right",
        to: "inference",
        toSide: "left",
        flow: "external",
        label: "요청·결과",
        bi: true,
      },
      {
        from: "backend",
        fromItem: 3,
        fromSide: "right",
        to: "database",
        toItem: 0,
        toSide: "left",
        flow: "data",
        label: "저장/조회",
        bi: true,
      },
    ],
    legend: [
      { flow: "req", label: "요청/응답" },
      { flow: "external", label: "외부 연동" },
      { flow: "data", label: "저장/조회" },
    ],
  },
};
