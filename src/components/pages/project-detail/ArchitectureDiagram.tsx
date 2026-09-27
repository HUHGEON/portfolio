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
import {
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  useEffect,
  useState,
} from "react";
import type { ArchStoryStep } from "@/components/pages/project-detail/arch-stories";
import { GithubIcon } from "@/components/icons/github-icon";
import { ARCH_BOX_W } from "@/components/pages/project-detail/arch-dimensions";
import { useTheme } from "@/components/shell/theme-context";

const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const ic = (name: string) => `${BP}/icons/tech/${name}.svg`;
// monochrome black brand marks: flip to white on dark surfaces
const MONO_LOGOS = new Set(["ollama", "resend"]);
const monoCls = (name: string) => (MONO_LOGOS.has(name) ? " dark:invert" : "");

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
  blue: {
    border: "rgba(255,255,255,.10)",
    head: "#60a5fa",
    soft: "rgba(255,255,255,.035)",
    text: "#93c5fd",
  },
  green: {
    border: "rgba(255,255,255,.10)",
    head: "#4ade80",
    soft: "rgba(255,255,255,.035)",
    text: "#86efac",
  },
  teal: {
    border: "rgba(255,255,255,.10)",
    head: "#2dd4bf",
    soft: "rgba(255,255,255,.035)",
    text: "#5eead4",
  },
  indigo: {
    border: "rgba(255,255,255,.10)",
    head: "#818cf8",
    soft: "rgba(255,255,255,.035)",
    text: "#a5b4fc",
  },
  purple: {
    border: "rgba(255,255,255,.10)",
    head: "#c084fc",
    soft: "rgba(255,255,255,.035)",
    text: "#d8b4fe",
  },
  amber: {
    border: "rgba(255,255,255,.10)",
    head: "#fbbf24",
    soft: "rgba(255,255,255,.035)",
    text: "#fcd34d",
  },
  slate: {
    border: "rgba(255,255,255,.10)",
    head: "#94a3b8",
    soft: "rgba(255,255,255,.035)",
    text: "#cbd5e1",
  },
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

const VIEW_MARGIN = 40; // clear space around the outermost zones
const HEAD_ROW = 76; // container title row (brand · label · GitHub)
const LEGEND_ROW = 70; // legend strip under the zones
const MAX_UPSCALE = 1.1;

/**
 * The part of a spec's design space that is actually drawn: the zones' bounding box
 * plus margins, the container title row and the legend. Fitting this (not the nominal
 * width × height, which is mostly empty) into the frame keeps the text readable.
 */
export function archView(spec: ArchSpec) {
  const x1 = Math.min(...spec.zones.map((z) => z.x));
  const y1 = Math.min(...spec.zones.map((z) => z.y));
  const x2 = Math.max(...spec.zones.map((z) => z.x + zoneWidth(z)));
  const y2 = Math.max(...spec.zones.map((z) => z.y + zoneHeight(z)));
  const m = VIEW_MARGIN + (spec.container ? 16 : 0);
  const top = spec.container ? HEAD_ROW : 0;
  const vx = x1 - m;
  const vy = y1 - m - top;
  const vw = x2 - x1 + 2 * m;
  const vh = y2 - y1 + 2 * m + top + LEGEND_ROW;
  const s = Math.min(MAX_UPSCALE, ARCH_BOX_W / vw);
  return { vx, vy, vw, vh, s, frameH: Math.round(vh * s) };
}

type Pt = { x: number; y: number };
// an anchor plus the span (along its side) it may slide within and still sit on its box
type Anchor = Pt & { lo: number; hi: number };

const SPAN_INSET = 10; // keep the line off rounded corners

function anchor(z: Zone, side: Side, itemIndex?: number): Anchor {
  const h = zoneHeight(z);
  const w = zoneWidth(z);
  let cy = z.y + h / 2;
  let lo = z.y;
  let hi = z.y + h;
  if (itemIndex !== undefined && z.layout !== "row" && z.layout !== "plain") {
    const top = z.y + HEADER_H + PAD + itemIndex * (ITEM_H + GAP);
    cy = top + ITEM_H / 2;
    lo = top;
    hi = top + ITEM_H;
  }
  switch (side) {
    case "top":
      return { x: z.x + w / 2, y: z.y, lo: z.x + SPAN_INSET, hi: z.x + w - SPAN_INSET };
    case "bottom":
      return {
        x: z.x + w / 2,
        y: z.y + h,
        lo: z.x + SPAN_INSET,
        hi: z.x + w - SPAN_INSET,
      };
    case "left":
      return { x: z.x, y: cy, lo: lo + SPAN_INSET, hi: hi - SPAN_INSET };
    case "right":
      return { x: z.x + w, y: cy, lo: lo + SPAN_INSET, hi: hi - SPAN_INSET };
  }
}

// Route an edge between two anchors. Both ends always leave/enter perpendicular
// to their side, so arrowheads never meet a box at a slant:
// - the two spans overlap → one straight line on a shared axis (slid within both boxes)
// - otherwise → an orthogonal elbow, with a small per-edge stagger so parallel
//   elbows don't stack on the same line
// The label lands on the middle run of the path.
function routeEdge(
  a: Anchor,
  aSide: Side,
  b: Anchor,
  i: number,
): { path: string; label: Pt; pts: Pt[] } {
  const horiz = aSide === "left" || aSide === "right";
  const along = (p: Anchor) => (horiz ? p.y : p.x);
  const lo = Math.max(a.lo, b.lo);
  const hi = Math.min(a.hi, b.hi);
  if (lo <= hi) {
    // prefer an endpoint's own centre when it already lies inside the shared span
    const pick = [along(a), along(b), (lo + hi) / 2].find((v) => v >= lo && v <= hi)!;
    const p = horiz ? { x: a.x, y: pick } : { x: pick, y: a.y };
    const q = horiz ? { x: b.x, y: pick } : { x: pick, y: b.y };
    return {
      path: `M ${p.x} ${p.y} L ${q.x} ${q.y}`,
      label: { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 },
      pts: [p, q],
    };
  }
  const jitter = ((i % 3) - 1) * 16;
  if (horiz) {
    const bx = (a.x + b.x) / 2 + jitter;
    return {
      path: `M ${a.x} ${a.y} L ${bx} ${a.y} L ${bx} ${b.y} L ${b.x} ${b.y}`,
      label: { x: bx, y: (a.y + b.y) / 2 },
      pts: [a, { x: bx, y: a.y }, { x: bx, y: b.y }, b],
    };
  }
  const by = (a.y + b.y) / 2 + jitter;
  return {
    path: `M ${a.x} ${a.y} L ${a.x} ${by} L ${b.x} ${by} L ${b.x} ${b.y}`,
    label: { x: (a.x + b.x) / 2, y: by },
    pts: [a, { x: a.x, y: by }, { x: b.x, y: by }, b],
  };
}

// ---------- edge labels ----------

/** Pill width for a label: Hangul runs about a full em, Latin/digits about 0.58em. */
function labelWidth(text: string, fs: number) {
  let w = 0;
  for (const ch of text) {
    if (/[\uac00-\ud7a3]/.test(ch)) w += fs * 0.95;
    else if (ch === " ") w += fs * 0.3;
    else if (/[·/]/.test(ch)) w += fs * 0.45;
    else w += fs * 0.58;
  }
  return w + fs * 1.1; // side padding
}

const LABEL_SIDE_MIN = 24; // line that must stay visible on each side of a pill

/**
 * Where a label goes: on the longest run of its line, as long as enough of the line
 * (and its arrowhead) stays visible either side; otherwise beside the line — above a
 * horizontal run, right of a vertical one — so the pill never hides the direction.
 */
function placeLabel(pts: Pt[], w: number, h: number): Pt {
  let best = 0;
  let bestLen = -1;
  for (let k = 0; k < pts.length - 1; k++) {
    const len = Math.hypot(pts[k + 1].x - pts[k].x, pts[k + 1].y - pts[k].y);
    if (len > bestLen + 0.5) {
      best = k;
      bestLen = len;
    }
  }
  const a = pts[best];
  const b = pts[best + 1];
  const horiz = Math.abs(a.y - b.y) < 0.5;
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  if ((bestLen - (horiz ? w : h)) / 2 >= LABEL_SIDE_MIN) return mid;
  return horiz
    ? { x: mid.x, y: mid.y - h / 2 - 7 }
    : { x: mid.x + w / 2 + 8, y: mid.y };
}

// ---------- relationships (hover highlight · click details) ----------

/** `zone` for a whole zone, `zone/index` for one item inside it. */
export const nodeKey = (zone: string, item?: number) =>
  item === undefined ? zone : `${zone}/${item}`;

export type ArchTarget =
  | { kind: "node"; key: string }
  | { kind: "edge"; index: number };

type Related = {
  edges: Set<number>;
  nodes: Set<string>; // item keys and zone ids that stay lit
  wholeZones: Set<string>; // zones lit as a whole (their items never dim)
};

function edgeTouches(e: Edge, zone: string, item?: number) {
  const hit = (z: string, it?: number) =>
    z === zone && (item === undefined || it === item);
  return hit(e.from, e.fromItem) || hit(e.to, e.toItem);
}

function related(spec: ArchSpec, target: ArchTarget): Related {
  const out: Related = { edges: new Set(), nodes: new Set(), wholeZones: new Set() };
  const addEnd = (zone: string, item?: number) => {
    out.nodes.add(zone);
    if (item === undefined) out.wholeZones.add(zone);
    else out.nodes.add(nodeKey(zone, item));
  };
  const addEdge = (i: number) => {
    const e = spec.edges[i];
    out.edges.add(i);
    addEnd(e.from, e.fromItem);
    addEnd(e.to, e.toItem);
  };
  if (target.kind === "edge") {
    addEdge(target.index);
    return out;
  }
  const [zone, raw] = target.key.split("/");
  const item = raw === undefined ? undefined : Number(raw);
  addEnd(zone, item);
  let found = spec.edges.flatMap((e, i) => (edgeTouches(e, zone, item) ? [i] : []));
  // an item with no line of its own inherits its zone-level lines
  if (item !== undefined && found.length === 0) {
    found = spec.edges.flatMap((e, i) =>
      (e.from === zone && e.fromItem === undefined) ||
      (e.to === zone && e.toItem === undefined)
        ? [i]
        : [],
    );
  }
  found.forEach(addEdge);
  return out;
}

/** Everything one playback step lights: its nodes plus both ends of its lines. */
function relatedStory(spec: ArchSpec, step: ArchStoryStep): Related {
  const out: Related = { edges: new Set(), nodes: new Set(), wholeZones: new Set() };
  const addEnd = (zone: string, item?: number) => {
    out.nodes.add(zone);
    if (item === undefined) out.wholeZones.add(zone);
    else out.nodes.add(nodeKey(zone, item));
  };
  for (const key of step.nodes) {
    const [zone, raw] = key.split("/");
    addEnd(zone, raw === undefined ? undefined : Number(raw));
  }
  for (const i of [...(step.edges ?? []), ...(step.reverse ?? [])]) {
    const e = spec.edges[i];
    if (!e) continue;
    out.edges.add(i);
    addEnd(e.from, e.fromItem);
    addEnd(e.to, e.toItem);
  }
  return out;
}

type FlowDir = "fwd" | "rev" | "both";

export type ArchNodeInfo = {
  key: string;
  title: string;
  sub?: string;
  zoneTitle?: string;
  items?: string[]; // when a whole zone is selected
  links: { dir: "in" | "out" | "both"; peer: string; label?: string }[];
};

const zoneName = (z: Zone) => z.title ?? z.id;

/** What a click on `key` should explain: the node and every line into or out of it. */
export function describeNode(spec: ArchSpec, key: string): ArchNodeInfo | null {
  const [zoneId, raw] = key.split("/");
  const zone = spec.zones.find((z) => z.id === zoneId);
  if (!zone) return null;
  const item = raw === undefined ? undefined : zone.items?.[Number(raw)];
  const peerName = (zid: string, idx?: number) => {
    const z = spec.zones.find((zz) => zz.id === zid);
    if (!z) return zid;
    const it = idx === undefined ? undefined : z.items?.[idx];
    return it ? `${zoneName(z)} · ${it.label}` : zoneName(z);
  };
  const rel = related(spec, { kind: "node", key });
  const links = [...rel.edges].map((i) => {
    const e = spec.edges[i];
    const outgoing = e.from === zoneId;
    const peer = outgoing ? peerName(e.to, e.toItem) : peerName(e.from, e.fromItem);
    return {
      dir: e.bi ? ("both" as const) : outgoing ? ("out" as const) : ("in" as const),
      peer,
      label: e.label,
    };
  });
  if (item) {
    return { key, title: item.label, sub: item.sub, zoneTitle: zoneName(zone), links };
  }
  return {
    key,
    title: zoneName(zone),
    sub: zone.subtitle,
    items: zone.items?.map((it) => it.label),
    links,
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
        className={`shrink-0 object-contain${monoCls(it.logo)}`}
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

export function ArchitectureDiagram({
  spec,
  interactive = false,
  selected = null,
  onSelect,
  story = null,
  detail = "full",
}: {
  spec: ArchSpec;
  /** hover highlights related lines, click selects (off for static renders like the PDF) */
  interactive?: boolean;
  selected?: string | null;
  onSelect?: (key: string) => void;
  /** a playback step to light; hover still previews on top of it */
  story?: ArchStoryStep | null;
  /**
   * "read": names only, set large, for the scaled-down inline view and the PDF;
   * sublabels move to the hover/click panel. "full": every label (zoom viewer).
   */
  detail?: "full" | "read";
}) {
  const { theme } = useTheme();
  const [hover, setHover] = useState<ArchTarget | null>(null);
  // tokens and glows are decoration: skip them for readers who asked for less motion
  const [motion, setMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setMotion(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  const active: ArchTarget | null =
    hover ?? (selected && !story ? { kind: "node", key: selected } : null);
  const rel = !interactive
    ? null
    : active
      ? related(spec, active)
      : story
        ? relatedStory(spec, story)
        : null;
  // which lit lines carry a moving token, and which way it travels
  const flowDir = new Map<number, FlowDir>();
  if (rel) {
    const reverse = !active && story ? new Set(story.reverse ?? []) : new Set<number>();
    rel.edges.forEach((i) =>
      flowDir.set(i, spec.edges[i].bi ? "both" : reverse.has(i) ? "rev" : "fwd"),
    );
  }
  const glowKeys = new Set(!active && story ? story.nodes : []);
  const glow = (key: string, color: string): CSSProperties =>
    motion && glowKeys.has(key)
      ? ({
          "--glow": color,
          animation: "arch-glow 1.8s ease-in-out infinite",
        } as CSSProperties)
      : {};
  const zoneDim = (id: string) => (rel && !rel.nodes.has(id) ? 0.28 : 1);
  const itemDim = (zone: string, key: string) =>
    rel && rel.nodes.has(zone) && !rel.wholeZones.has(zone) && !rel.nodes.has(key)
      ? 0.38
      : 1;
  const fade = { transition: "opacity 150ms ease" };
  // a zone, item or plain node becomes a keyboard-reachable button when interactive
  const nodeProps = (key: string) =>
    interactive
      ? {
          role: "button" as const,
          tabIndex: 0,
          "aria-pressed": selected === key,
          onClick: (ev: MouseEvent) => {
            ev.stopPropagation();
            onSelect?.(key);
          },
          onKeyDown: (ev: KeyboardEvent) => {
            if (ev.key === "Enter" || ev.key === " ") {
              ev.preventDefault();
              ev.stopPropagation();
              onSelect?.(key);
            }
          },
          onMouseEnter: () => setHover({ kind: "node", key }),
          onMouseLeave: () => setHover(null),
          onFocus: () => setHover({ kind: "node", key }),
          onBlur: () => setHover(null),
        }
      : {};
  const ring = (key: string, color: string) =>
    interactive && selected === key ? { boxShadow: `0 0 0 2px ${color}` } : {};
  const isDark = theme === "dark";
  const flow = isDark ? FLOW_DARK : FLOW_LIGHT;
  const labelFill = isDark ? "#17171c" : "#ffffff";
  const labelStrokeOpacity = isDark ? 0.55 : 0.35;
  const byId = new Map(spec.zones.map((z) => [z.id, z]));
  const HH = spec.height ?? H;
  const WW = spec.width ?? W;
  const view = archView(spec);
  const R = detail === "read";

  return (
    <div
      className="w-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card-2)] dark:shadow-[var(--shadow-sm)]"
      style={{ height: view.frameH, overflow: "hidden", position: "relative" }}
    >
      {/* the drawn view (content box), centred and scaled to the frame width */}
      <div
        className="font-sans"
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          width: view.vw,
          height: view.vh,
          transform: `translateX(-50%) scale(${view.s})`,
          transformOrigin: "top center",
        }}
      >
        {spec.container ? (
          <>
            <div
              className="absolute rounded-[26px] border-2 border-dashed border-[var(--border)] dark:border-white/10 dark:bg-white/[0.03]"
              style={{
                left: 8,
                top: HEAD_ROW - 10,
                width: view.vw - 16,
                height: view.vh - HEAD_ROW + 2,
              }}
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
              style={{ left: view.vw / 2, top: 12 }}
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

        {/* spec coordinates, shifted so the content box starts at the view origin */}
        <div
          className="absolute"
          style={{ left: -view.vx, top: -view.vy, width: WW, height: HH }}
        >
          {/* edges */}
          <svg
            viewBox={`0 0 ${WW} ${HH}`}
            className="pointer-events-none absolute inset-0"
            // Chromium paints hinted SVG text off its layout box under the scaled-down
            // dark frame; geometric rendering keeps edge labels inside their pills
            textRendering="geometricPrecision"
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
              const { path, pts } = routeEdge(a, e.fromSide, b, i);
              const color = flow[e.flow];
              const fs = R ? 18.9 : 15; // edge label font size
              const lw = e.label ? labelWidth(e.label, fs) : 0;
              const lp = e.label ? placeLabel(pts, lw, fs * 1.6) : null;
              const lit = rel?.edges.has(i);
              return (
                <g key={i} style={{ opacity: rel && !lit ? 0.15 : 1, ...fade }}>
                  {lit && motion ? (
                    <path
                      d={path}
                      fill="none"
                      stroke={color}
                      strokeWidth={10}
                      strokeOpacity={0.14}
                    />
                  ) : null}
                  <path
                    d={path}
                    fill="none"
                    stroke={color}
                    strokeWidth={lit ? 3.4 : 2.4}
                    // pathLength=1 lets CSS draw the line in without measuring it
                    pathLength={interactive ? 1 : undefined}
                    className={interactive ? "arch-edge" : undefined}
                    style={interactive ? ({ "--i": i } as CSSProperties) : undefined}
                    markerEnd={`url(#ah-${e.flow})`}
                    markerStart={e.bi ? `url(#ah-${e.flow})` : undefined}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {motion && flowDir.has(i)
                    ? (flowDir.get(i) === "both"
                        ? (["0;1", "1;0"] as const)
                        : flowDir.get(i) === "rev"
                          ? (["1;0"] as const)
                          : (["0;1"] as const)
                      ).map((points, k) => (
                        <circle
                          key={points}
                          r={6}
                          fill={color}
                          stroke={labelFill}
                          strokeWidth={2}
                        >
                          <animateMotion
                            dur="1.6s"
                            begin={`${k * 0.8}s`}
                            repeatCount="indefinite"
                            path={path}
                            keyPoints={points}
                            keyTimes="0;1"
                            calcMode="linear"
                          />
                        </circle>
                      ))
                    : null}
                  {interactive ? (
                    // wide invisible stroke so a thin line is easy to hover
                    <path
                      d={path}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={18}
                      style={{ pointerEvents: "stroke", cursor: "help" }}
                      onMouseEnter={() => setHover({ kind: "edge", index: i })}
                      onMouseLeave={() => setHover(null)}
                    />
                  ) : null}
                  {e.label && lp ? (
                    <>
                      <rect
                        x={lp.x - lw / 2}
                        y={lp.y - fs * 0.8}
                        width={lw}
                        height={fs * 1.6}
                        rx={6}
                        fill={labelFill}
                        stroke={color}
                        strokeOpacity={labelStrokeOpacity}
                      />
                      <text
                        x={lp.x}
                        y={lp.y + fs * 0.34}
                        textAnchor="middle"
                        fontSize={fs}
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
                  {...nodeProps(z.id)}
                  className={`absolute flex flex-col items-center justify-center gap-2 ${interactive ? "cursor-pointer" : ""}`}
                  style={{
                    left: z.x,
                    top: z.y,
                    width: z.w,
                    height: h,
                    opacity: zoneDim(z.id),
                    ...fade,
                    ...glow(z.id, "#64748b"),
                    borderRadius: 16,
                  }}
                >
                  {ZI ? (
                    <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-300 bg-white dark:border-white/15 dark:bg-white/5 text-slate-600 dark:text-zinc-300 shadow-sm">
                      <ZI size={30} />
                    </span>
                  ) : null}
                  <span
                    className={`${R ? "text-[20.7px]" : "text-[16px]"} font-semibold text-slate-700 dark:text-zinc-200`}
                  >
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
                  opacity: zoneDim(z.id),
                  ...fade,
                  ...ring(z.id, c.head),
                  ...glow(z.id, c.head),
                }}
              >
                <div
                  {...nodeProps(z.id)}
                  className={`flex flex-wrap content-start items-center gap-x-2 gap-y-6 overflow-hidden rounded-t-2xl px-4 ${interactive ? "cursor-pointer" : ""}`}
                  style={{ height: HEADER_H, paddingTop: R ? 11 : 12 }}
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
                      className={monoCls(z.logo)}
                    />
                  ) : null}
                  <span
                    className={`${R ? "text-[19.8px]" : "text-[16px]"} shrink-0 whitespace-nowrap font-bold`}
                    style={{ color: c.text }}
                  >
                    {z.title}
                  </span>
                  {z.subtitle ? (
                    <span
                      className={`${R ? "text-[14.4px]" : "text-[12px]"} whitespace-nowrap font-semibold text-slate-500 dark:text-zinc-400`}
                    >
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
                        {...nodeProps(nodeKey(z.id, i))}
                        className={`flex flex-1 flex-col items-center justify-center gap-1.5 rounded-xl border px-1 py-2 ${interactive ? "cursor-pointer" : ""}`}
                        style={{
                          borderColor: c.border,
                          background: c.soft,
                          height: 84,
                          opacity: itemDim(z.id, nodeKey(z.id, i)),
                          ...fade,
                          ...ring(nodeKey(z.id, i), c.head),
                          ...glow(nodeKey(z.id, i), c.head),
                        }}
                      >
                        <ItemGlyph it={it} color={c.head} size={26} />
                        <div
                          className={`text-center ${R ? "text-[17.1px] leading-tight" : "text-[12px]"} font-semibold text-slate-700 dark:text-zinc-200`}
                        >
                          {it.label}
                        </div>
                        {it.sub && !R ? (
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
                        {...nodeProps(nodeKey(z.id, i))}
                        className={`flex items-center gap-3 rounded-xl border px-3 ${interactive ? "cursor-pointer" : ""}`}
                        style={{
                          borderColor: c.border,
                          background: c.soft,
                          height: ITEM_H,
                          opacity: itemDim(z.id, nodeKey(z.id, i)),
                          ...fade,
                          ...ring(nodeKey(z.id, i), c.head),
                          ...glow(nodeKey(z.id, i), c.head),
                        }}
                      >
                        <ItemGlyph it={it} color={c.head} size={24} />
                        <div className="min-w-0">
                          <div
                            className={`${R ? "line-clamp-2 text-[21.6px] leading-[1.12]" : "truncate text-[15px]"} font-bold text-slate-800 dark:text-zinc-100`}
                          >
                            {it.label}
                          </div>
                          {it.sub && !R ? (
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
        </div>

        {/* legend */}
        <div
          className="absolute left-1/2 flex w-max max-w-[96%] -translate-x-1/2 flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-full border border-slate-200 bg-white/95 dark:border-white/10 dark:bg-white/[0.05] px-6 py-2 shadow-sm"
          style={{ bottom: 12, zIndex: 30 }}
        >
          {spec.legend.map((l) => (
            <span
              key={l.flow}
              className={`flex items-center gap-2 ${R ? "text-[15.3px]" : "text-[14px]"} text-slate-600 dark:text-zinc-300`}
            >
              <span
                className="inline-block h-[3px] w-7 rounded-full"
                style={{ background: flow[l.flow] }}
              />
              {l.label}
            </span>
          ))}
          {spec.container ? (
            <span
              className={`flex items-center gap-2 ${R ? "text-[15.3px]" : "text-[14px]"} text-slate-600 dark:text-zinc-300`}
            >
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
        x: 200,
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
        x: 200,
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
        x: 1300,
        y: 130,
        w: 280,
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
    height: 700,
    width: 1400,
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
        x: 270,
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
        x: 650,
        y: 200,
        w: 280,
        items: [
          { label: "의도 추출", sub: "gpt-4o-mini · intents JSON", logo: "openai" },
          {
            label: "오케스트레이션",
            sub: "query.sequence · /api/handle 전송",
            lucide: Cog,
          },
        ],
      },
      {
        id: "api",
        title: "API Server",
        subtitle: "Express",
        color: "green",
        logo: "nodejs",
        x: 1060,
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
        x: 1060,
        y: 500,
        w: 300,
        items: [{ label: "MongoDB", sub: "메뉴 / 주문 · Atlas", logo: "mongodb" }],
      },
      {
        id: "openai",
        title: "External LLM",
        color: "purple",
        lucide: Globe,
        x: 650,
        y: 480,
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
        fromSide: "bottom",
        to: "data",
        toSide: "top",
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
          {
            label: "리더 선출 · 크레딧 배분",
            sub: "가용량 기반 유입 제어",
            lucide: Cog,
          },
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
          { label: "발급 API", sub: "발급 + 멱등 DONE 한 트랜잭션", lucide: Globe },
          { label: "Redis 재고 선점", sub: "Lua 원자 판정 (v2.1)", logo: "redis" },
          {
            label: "조건부 원자 UPDATE",
            sub: "active_count < total (v1.2)",
            lucide: Database,
          },
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
          { label: "이상 감지", sub: "알림 규칙 48종", lucide: Bell },
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
        items: [
          {
            label: "API · 배치 · 대기열 지표",
            sub: "Alertmanager",
            logo: "prometheus",
          },
        ],
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
        items: [{ label: "외부 처리 서버", sub: "axios 연동 · 대외비", lucide: Globe }],
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
        id: "frontend",
        title: "Frontend Server",
        subtitle: "웹 · 사용자 UI",
        color: "blue",
        lucide: Globe,
        x: 30,
        y: 300,
        w: 300,
      },
      {
        id: "source",
        title: "데이터 소스",
        subtitle: "단말 · 원본 서버",
        color: "slate",
        lucide: Globe,
        x: 30,
        y: 560,
        w: 300,
      },
      {
        id: "backend",
        title: "Backend Server",
        subtitle: "처리 파이프라인 허브",
        color: "green",
        logo: "nodejs",
        x: 510,
        y: 300,
        w: 380,
        items: [
          { label: "REST API", sub: "처리 요청 · 목록 · 검색", lucide: Globe },
          { label: "전처리", sub: "파일명 파싱 · 교차 검증", lucide: Cog },
          { label: "외부 연동", sub: "서버 2곳 병렬 호출 (Promise.all)", lucide: Cog },
          { label: "압축", sub: "FFmpeg", lucide: Cog },
          {
            label: "저장 · 캐싱",
            sub: "테넌트별 DB · 쓰기 시 캐시 무효화",
            lucide: Bell,
          },
        ],
      },
      {
        id: "external",
        title: "External Services",
        color: "purple",
        lucide: Globe,
        x: 1120,
        y: 420,
        w: 290,
        items: [
          { label: "외부 처리 서버", sub: "추론 · axios · 대외비", lucide: Globe },
          { label: "외부 조회 서버", sub: "조회 · axios · 대외비", lucide: Globe },
        ],
      },
      {
        id: "database",
        title: "Data Storage",
        color: "indigo",
        lucide: Database,
        x: 1120,
        y: 640,
        w: 290,
        items: [
          { label: "MongoDB", sub: "결과 저장 · 테넌트별 DB", logo: "mongodb" },
          { label: "Redis", sub: "목록 캐시 · TTL", logo: "redis" },
        ],
      },
    ],
    edges: [
      {
        from: "frontend",
        fromSide: "right",
        to: "backend",
        toItem: 0,
        toSide: "left",
        flow: "req",
        label: "요청/응답",
        bi: true,
      },
      {
        from: "source",
        fromSide: "right",
        to: "backend",
        toItem: 1,
        toSide: "left",
        flow: "req",
        label: "원본 데이터",
      },
      {
        // one handler calls both servers at once (Promise.all)
        from: "backend",
        fromItem: 2,
        fromSide: "right",
        to: "external",
        toSide: "left",
        flow: "external",
        label: "병렬 호출",
        bi: true,
      },
      {
        from: "backend",
        fromItem: 4,
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
