"use client";

import { Check, Maximize2, Minus, Plus, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  ARCH_SPECS,
  ArchitectureDiagram,
} from "@/components/pages/project-detail/ArchitectureDiagram";
import {
  ARCH_BOX_W,
  archFrameHeight,
} from "@/components/pages/project-detail/arch-dimensions";
import { HEO_PROJECT_DETAILS } from "@/components/pages/project-detail/definitions/heogeon-detail";
import { ScrollReveal } from "@/components/pages/terminal/scroll-reveal";
import {
  LivePrompt,
  emphasize,
  StackList,
  stackHue,
  TermWindow,
} from "@/components/pages/terminal/terminal-ui";
import type { ArchSpec } from "@/components/pages/project-detail/ArchitectureDiagram";
import type { Project } from "@/types/project";
import { assetPath } from "@/lib/asset-path";

const branchName = (slug: string) => (slug === "media-inference" ? "intern" : slug);

/* ────────────────────────── architecture viewer ────────────────────────── */

/** Inline diagram (scaled to fit) with a zoomable full-screen viewer. */
function ArchViewer({
  spec,
  diagramKey,
  label,
}: {
  spec: ArchSpec;
  diagramKey: string;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setContainerW(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = containerW ? Math.min(1, containerW / ARCH_BOX_W) : 1;
  const frameH = archFrameHeight(spec.width ?? 1600, spec.height ?? 980);

  return (
    <>
      <div className="group relative overflow-hidden rounded-xl dark:border dark:border-[var(--border)] dark:bg-[var(--card)] dark:p-3 dark:shadow-[var(--shadow-sm)]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="아키텍처 확대"
          className="absolute right-4 top-4 z-10 inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)]/90 px-3 py-2 font-mono text-[12px] text-[var(--dim)] shadow-[var(--shadow-sm)] backdrop-blur transition hover:border-[var(--accent-line)] hover:text-[var(--accent)] focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <Maximize2 size={12} /> 확대
        </button>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="아키텍처 확대"
          className="block w-full cursor-zoom-in text-left"
        >
          <div ref={ref} className="w-full overflow-hidden">
            <div style={{ width: ARCH_BOX_W, height: frameH * scale }}>
              <div
                style={{
                  width: ARCH_BOX_W,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }}
              >
                <ArchitectureDiagram spec={spec} key={diagramKey} />
              </div>
            </div>
          </div>
        </button>
      </div>
      {open ? (
        <ArchLightbox
          spec={spec}
          diagramKey={diagramKey}
          label={label}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function ArchLightbox({
  spec,
  diagramKey,
  label,
  onClose,
}: {
  spec: ArchSpec;
  diagramKey: string;
  label: string;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(
    null,
  );

  const clampZoom = (z: number) => Math.min(3, Math.max(0.4, z));
  const reset = useCallback(() => {
    setZoom(1);
    setPos({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "0") reset();
      if (e.key === "+" || e.key === "=") setZoom((z) => clampZoom(z + 0.2));
      if (e.key === "-") setZoom((z) => clampZoom(z - 0.2));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, reset]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => clampZoom(z - e.deltaY * 0.0015));
  };
  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: pos.x, oy: pos.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setPos({
      x: drag.current.ox + (e.clientX - drag.current.x),
      y: drag.current.oy + (e.clientY - drag.current.y),
    });
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col bg-[var(--bg)]/92 backdrop-blur-md">
      {/* toolbar */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--card-2)] px-4 py-3">
        <span className="flex items-center gap-2 font-mono text-[13px] text-[var(--dim)]">
          <span className="text-[var(--c-cat)]">❯</span> architecture.svg —{" "}
          <span className="text-[var(--text)]">{label}</span>
        </span>
        <div className="flex items-center gap-2">
          {[
            { icon: Minus, fn: () => setZoom((z) => clampZoom(z - 0.2)), l: "축소" },
            {
              icon: Plus,
              fn: () => setZoom((z) => clampZoom(z + 0.2)),
              l: "확대",
            },
            { icon: RotateCcw, fn: reset, l: "초기화" },
          ].map(({ icon: Icon, fn, l }) => (
            <button
              key={l}
              type="button"
              aria-label={l}
              onClick={fn}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--dim)] transition hover:border-[var(--accent-line)] hover:text-[var(--accent)]"
            >
              <Icon size={15} />
            </button>
          ))}
          <span className="mx-1 w-11 text-center font-mono text-[13px] text-[var(--faint)]">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--dim)] transition hover:border-[var(--accent-line)] hover:text-[var(--accent)]"
          >
            <X size={15} />
          </button>
        </div>
      </div>
      {/* canvas */}
      <div
        className="relative flex-1 touch-none overflow-hidden"
        style={{ cursor: drag.current ? "grabbing" : "grab" }}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) scale(${zoom})`,
          }}
        >
          <div style={{ width: ARCH_BOX_W }}>
            <ArchitectureDiagram spec={spec} key={`lb-${diagramKey}`} />
          </div>
        </div>
      </div>
      <p className="border-t border-[var(--border)] bg-[var(--card-2)] py-2 text-center font-mono text-[12px] text-[var(--faint)]">
        스크롤 확대·축소 · 드래그로 이동 · ESC 닫기
      </p>
    </div>,
    document.body,
  );
}

/* ────────────────────────────── helpers ────────────────────────────── */

function Bullets({ items, tone = "dim" }: { items: string[]; tone?: "dim" | "text" }) {
  return (
    <ul className="mt-3 space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className="mt-3 h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]" />
          <span
            className={`min-w-0 leading-[1.75] [overflow-wrap:anywhere] ${
              tone === "text" ? "text-[var(--text)]" : "text-[var(--dim)]"
            }`}
          >
            {emphasize(item)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function TechChip({ name, className }: { name: string; className?: string }) {
  const hue = stackHue(name);
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-md border px-2 py-0.5 align-[1px] font-mono text-[12px] leading-5 ${className ?? ""}`}
      style={{
        color: hue,
        borderColor: `color-mix(in srgb, ${hue} 32%, transparent)`,
        background: `color-mix(in srgb, ${hue} 9%, transparent)`,
      }}
    >
      {name}
    </span>
  );
}

function EvidenceLinks({
  items,
  inline = false,
}: {
  items: { label: string; href: string }[];
  inline?: boolean;
}) {
  return (
    <ul className={inline ? "flex flex-wrap gap-x-4 gap-y-1" : "space-y-1"}>
      {items.map((item) => (
        <li key={item.href}>
          <a
            href={item.href}
            target="_blank"
            rel="noreferrer"
            className="text-[13px] leading-snug text-[var(--dim)] underline decoration-[var(--border)] underline-offset-2 transition hover:text-[var(--accent)] hover:decoration-[var(--accent-line)]"
          >
            {item.label} ↗
          </a>
        </li>
      ))}
    </ul>
  );
}

function FlowSteps({ steps }: { steps: string[] }) {
  return (
    <div className="mt-6">
      <p className="mb-3 text-[13px] font-semibold text-[var(--faint)]">동작 흐름</p>
      <ol className="relative ml-[11px] border-l border-[var(--border)]">
        {steps.map((step, i) => (
          <li key={step} className="relative flex gap-4 pb-5 pl-6 last:pb-0">
            <span className="absolute -left-[11px] top-0 z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full border border-[var(--accent-line)] bg-[var(--card-2)] font-mono text-[12px] font-semibold text-[var(--accent)]">
              {i + 1}
            </span>
            <span className="pt-0.5 leading-[1.75] text-[var(--dim)]">{emphasize(step)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

type SectionDef = { id: string; label: string; cmd: string; node: ReactNode };

function SectionHead({
  index,
  label,
  cmd,
}: {
  index: number;
  label: string;
  cmd: string;
}) {
  return (
    <div className="mb-4 flex items-baseline gap-3 border-b border-[var(--border)] pb-3">
      <span className="font-mono text-[14px] font-semibold text-[var(--accent)]">
        {String(index).padStart(2, "0")}
      </span>
      <h2 className="text-[20px] font-bold tracking-tight text-[var(--heading)]">
        {label}
      </h2>
      <span className="ml-auto hidden font-mono text-[12px] text-[var(--faint)] sm:inline">
        ❯ {cmd}
      </span>
    </div>
  );
}

/* ────────────────────────────── page ────────────────────────────── */

export function TerminalProjectDetail({ project }: { project: Project }) {
  const d = HEO_PROJECT_DETAILS[project.slug];
  const branch = branchName(project.slug);
  const spec = d?.diagramKey ? ARCH_SPECS[d.diagramKey] : undefined;
  const [activeId, setActiveId] = useState<string>("");

  // build the ordered content sections (drives both the rail TOC and the body)
  const sections: SectionDef[] = [];
  if (d) {
  if (spec && d.diagramKey) {
    sections.push({
      id: "architecture",
      label: "아키텍처",
      cmd: "render architecture.svg",
      node: (
        <>
          <ArchViewer spec={spec} diagramKey={d.diagramKey} label={project.title} />
          {d.architecture.steps.length > 0 ? <FlowSteps steps={d.architecture.steps} /> : null}
        </>
      ),
    });
  } else if (d.architecture.steps.length > 0) {
    sections.push({
      id: "flow",
      label: "동작 흐름",
      cmd: "cat FLOW.md",
      node: <FlowSteps steps={d.architecture.steps} />,
    });
  }
  if (d.demo) {
    const demo = d.demo;
    sections.push({
      id: "demo",
      label: "시연 · 음성 한 문장이 주문이 되기까지",
      cmd: "open demo.gif",
      node: (
        <div>
          {demo.caption ? (
            <p className="mb-4 leading-[1.75] text-[var(--dim)]">{demo.caption}</p>
          ) : null}
          <div className={demo.steps ? "grid items-start gap-6 md:grid-cols-[300px_minmax(0,1fr)]" : ""}>
          {/* eslint-disable-next-line @next/next/no-img-element -- animated GIF, static export */}
          <img
            src={assetPath(demo.gif)}
            alt={demo.title}
            width={demo.width}
            height={demo.height}
            loading="lazy"
            className={`block h-auto rounded-lg border border-[var(--border)] ${
              demo.height > demo.width ? "mx-auto w-full max-w-[300px]" : "w-full"
            }`}
          />
          {demo.steps ? (
            <ol className="space-y-4">
              {demo.steps.map((step, i) => (
                <li key={step.say} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--accent-line)] font-mono text-[12px] font-semibold text-[var(--accent)]">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--heading)]">{step.say}</p>
                    <p className="mt-0.5 leading-[1.7] text-[var(--dim)]">{step.result}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : null}
          </div>
          <a
            href={`https://www.youtube.com/watch?v=${demo.youtubeId}`}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-[13px] text-[var(--dim)] underline decoration-[var(--border)] underline-offset-2 transition hover:text-[var(--accent)]"
          >
            {demo.title} · 전체 영상 YouTube ↗
          </a>
        </div>
      ),
    });
  }
  if (d.cases && d.cases.length > 0) {
    sections.push({
      id: "cases",
      label: "문제 해결 사례",
      cmd: "cat CASES.md",
      node: (
        <ol data-stagger className="space-y-4">
          {d.cases.map((c, ci) => (
            <li
              key={c.title}
              className="spotlight rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5"
            >
              <p className="font-mono text-[13px] font-semibold text-[var(--accent)]">
                사례 {ci + 1}
              </p>
              <h3 className="mt-1 text-balance text-[17px] font-bold leading-snug text-[var(--text)]">
                {c.title}
              </h3>
              {c.links && c.links.length > 0 ? (
                <div className="mt-2">
                  <EvidenceLinks items={c.links} inline />
                </div>
              ) : null}
              <div className="mt-4 space-y-4">
                {(
                  [
                    ["문제 원인", c.causes],
                    ["해결 과정", c.solutions],
                    ["검증", c.checks ?? []],
                    ["결과", c.results],
                  ] as const
                )
                  .filter(([, items]) => items.length > 0)
                  .map(([label, items]) => (
                    <div key={label}>
                      <p className="text-[13px] font-semibold text-[var(--faint)]">
                        {label}
                      </p>
                      <ol className="mt-2 space-y-2">
                        {items.map((item, ii) => (
                          <li key={item} className="flex gap-3">
                            <span className="w-5 shrink-0 font-mono text-[13px] leading-relaxed text-[var(--faint)]">
                              {ii + 1})
                            </span>
                            <span
                              className={
                                label === "결과"
                                  ? "font-semibold leading-[1.75] text-[var(--text)]"
                                  : "leading-[1.75] text-[var(--dim)]"
                              }
                            >
                              {emphasize(item)}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
              </div>
            </li>
          ))}
        </ol>
      ),
    });
  }
  if (d.versions && d.versions.length > 0) {
    sections.push({
      id: "versions",
      label: "버전별 발전 과정",
      cmd: "git log --oneline versions",
      node: (
        <ol data-stagger className="relative space-y-4 pl-7 before:absolute before:bottom-6 before:left-[7px] before:top-6 before:w-px before:bg-[var(--accent-line)]">
          {d.versions.map((v) => (
            <li
              key={v.version}
              className="spotlight rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5"
            >
              <span
                aria-hidden
                className="absolute -left-7 top-6 z-10 h-[15px] w-[15px] rounded-full border-2 border-[var(--accent)] bg-[var(--surface)]"
              />
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono text-[14px] font-bold text-[var(--accent)]">
                  {v.version}
                </span>
                <h3 className="text-[16px] font-bold text-[var(--text)]">{v.title}</h3>
                <span className="rounded-md border border-[var(--border)] px-2 py-0.5 text-[12px] text-[var(--dim)]">
                  {v.status}
                </span>
              </div>
              <dl className="mt-3 grid gap-x-4 gap-y-2 sm:grid-cols-[88px_1fr]">
                {(
                  [
                    ["문제", v.problem],
                    ["선택 이유", v.choice],
                    ["트레이드오프", v.tradeoff],
                    ["수치", v.metric],
                    ["다음 단계로", v.next],
                  ] as const
                )
                  .filter(([, text]) => Boolean(text))
                  .map(([label, text]) => (
                    <div key={label} className="contents">
                      <dt className="text-[13px] font-semibold text-[var(--faint)] sm:pt-0.5">
                        {label}
                      </dt>
                      <dd
                        className={
                          label === "수치"
                            ? "font-mono text-[14px] leading-relaxed text-[var(--text)]"
                            : "leading-[1.75] text-[var(--dim)]"
                        }
                      >
                        {emphasize(text ?? "")}
                      </dd>
                    </div>
                  ))}
              </dl>
            </li>
          ))}
        </ol>
      ),
    });
  }
  if (d.works) {
    sections.push({
      id: "work",
      label: "사내 실무 · 기술 중심",
      cmd: "ls ./work",
      node: (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {d.works.map((w) => (
              <div
                key={w.title}
                className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4"
              >
                <p className="font-semibold text-[var(--text)]">{w.title}</p>
                <p className="mt-2 leading-[1.75] text-[var(--dim)]">
                  {emphasize(w.desc)}
                </p>
                <StackList items={w.stack} className="mt-3" />
              </div>
            ))}
          </div>
          {d.qa ? (
            <div className="mt-4 space-y-2 border-t border-[var(--border-soft)] pt-4">
              {d.qa.split("\n").map((line) => (
                <p key={line} className="leading-[1.75] text-[var(--dim)]">
                  {line.replace(/^- /, "")}
                </p>
              ))}
            </div>
          ) : null}
          <p className="mt-4 font-mono text-[12px] text-[var(--faint)]">
            ※ 도메인·세부 기능·정량 성과는 대외비로, 사용 기술과 구조만 기재.
          </p>
        </>
      ),
    });
  } else {
    if (d.features && d.features.length > 0) {
      sections.push({
        id: "features",
        label: "주요 기능",
        cmd: "cat FEATURES.md",
        node: (
          <div data-stagger className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {d.features.map((f) => (
              <div
                key={f.title}
                className="spotlight rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 transition-[translate,scale,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]"
              >
                <p className="font-semibold text-[var(--text)]">{f.title}</p>
                <p className="mt-2 leading-[1.75] text-[var(--dim)]">{emphasize(f.desc)}</p>
              </div>
            ))}
          </div>
        ),
      });
    }
    if (d.problems.length > 0 || d.solutions.length > 0) {
      sections.push({
        id: "problem",
        label: "문제 · 해결",
        cmd: "cat PROBLEM_SOLUTION.md",
        node: (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {d.problems.length > 0 ? (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
                <p className="font-semibold text-[var(--text)]">
                  # 문제 — {d.problemTitle}
                </p>
                <Bullets items={d.problems} />
              </div>
            ) : null}
            {d.solutions.length > 0 ? (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
                <p className="font-semibold text-[var(--text)]"># 해결 과정</p>
                <Bullets items={d.solutions} />
                {d.progress && d.progress.length > 0 ? (
                  <div className="mt-3 border-t border-[var(--border-soft)] pt-3">
                    <p className="font-mono text-[13px] text-[var(--faint)]">
                      {d.progressTitle ?? "현재 진행"}
                    </p>
                    <Bullets items={d.progress} />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ),
      });
    }
    if (d.benchmark) {
      const b = d.benchmark;
      sections.push({
        id: "benchmark",
        label: "측정 결과",
        cmd: "cat BENCHMARK.md",
        node: (
          <>
            <p className="leading-[1.75] text-[var(--dim)]">{emphasize(b.caption)}</p>
            <div className="mt-4 overflow-x-auto rounded-lg border border-[var(--border)]">
              <table className="w-full border-collapse font-mono text-[13px] tabular-nums">
                <thead>
                  <tr className="bg-[var(--card-2)]">
                    {b.headers.map((h, i) => (
                      <th
                        key={h}
                        className={`whitespace-nowrap border-b border-[var(--border)] px-2 py-2 text-[12px] font-semibold text-[var(--dim)] ${i < 2 ? "text-left" : "text-right"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody data-stagger>
                  {b.rows.map((row, ri) => (
                    <tr
                      key={`${row.cells.join("|")}-${ri}`}
                      className={
                        row.cells[0]
                          ? "border-t border-[var(--border)]"
                          : "border-t border-[var(--border-soft)]"
                      }
                    >
                      {row.cells.map((cell, ci) => (
                        <td
                          key={`${ci}-${cell}`}
                          className={`whitespace-nowrap px-2 py-2 ${ci < 2 ? "text-left" : "text-right"} ${row.highlight ? "font-semibold text-[var(--text)]" : "text-[var(--dim)]"}`}
                        >
                          {b.bar && ci === b.bar.column ? (
                            <span className="inline-flex flex-col items-end gap-1">
                              <span>{cell}</span>
                              <span
                                title={`${row.cells[1]} · ${b.bar.label} ${cell} (상대값, 눈금 끝 ${b.bar.max.toFixed(1)})`}
                                className="relative block h-1.5 w-14 rounded-full bg-[var(--border-soft)]"
                              >
                                <span
                                  data-bar
                                  className="absolute inset-y-0 left-0 origin-left rounded-full bg-[var(--accent)]"
                                  style={{
                                    width: `${Math.min(100, (Number(cell) / b.bar.max) * 100)}%`,
                                  }}
                                />
                              </span>
                            </span>
                          ) : (
                            cell
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {b.footnote ? (
              <p className="mt-3 text-[13px] leading-relaxed text-[var(--faint)]">
                {b.footnote}
              </p>
            ) : null}
          </>
        ),
      });
    }
    if (d.results.length > 0) {
      sections.push({
        id: "results",
        label: "결과",
        cmd: "cat RESULTS.md",
        node: (
          <ul className="space-y-3">
            {d.results.map((r) => (
              <li key={r} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--c-cat-soft)]">
                  <Check size={13} className="text-[var(--c-cat)]" />
                </span>
                <span className="leading-[1.75] text-[var(--text)]">{emphasize(r)}</span>
              </li>
            ))}
          </ul>
        ),
      });
    }
    if (d.lessons) {
      sections.push({
        id: "lessons",
        label: "배운 점",
        cmd: "cat LESSONS.md",
        node: (
          <p className="leading-[1.75] text-[var(--dim)]">{emphasize(d.lessons)}</p>
        ),
      });
    }
    if (d.techChoices.length > 0) {
      sections.push({
        id: "tech",
        label: "기술 선택 이유",
        cmd: "cat TECH_CHOICES.md",
        node: (
          <ul
            data-stagger
            className="divide-y divide-[var(--border-soft)] rounded-lg border border-[var(--border)]"
          >
            {d.techChoices.map((t) => (
              <li key={t.name} className="px-4 py-3 leading-[1.75] text-[var(--dim)]">
                <TechChip name={t.name} className="mr-2" />
                {emphasize(t.reason)}
              </li>
            ))}
          </ul>
        ),
      });
    }
  }

  }

  // case-driven pages lead with problem solving; intro sections move down
  if (d?.cases && d.cases.length > 0) {
    const order = [
      "architecture",
      "demo",
      "cases",
      "versions",
      "benchmark",
      "features",
      "lessons",
      "tech",
    ];
    const rank = (id: string) => {
      const i = order.indexOf(id);
      return i === -1 ? order.length : i;
    };
    sections.sort((a, b) => rank(a.id) - rank(b.id));
  }

  // scroll-spy: highlight the section currently in view within the .term-win scroller
  useEffect(() => {
    const root = document.querySelector(".term-win");
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { root, rootMargin: "-12% 0px -70% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.slug]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!d) {
    return (
      <TermWindow
        title={`~/heo-geon/projects/${project.slug} — zsh`}
        branch={`feat/${project.slug}`}
      >
        <h1 className="text-[22px] font-bold text-[var(--text)]">
          {project.title}
        </h1>
        <p className="mt-2 text-[var(--dim)]">{project.description}</p>
        <LivePrompt />
      </TermWindow>
    );
  }

  return (
    <TermWindow
      title={`~/heo-geon/projects/${branch} — zsh`}
      branch={`feat/${branch}`}
      status={`~/heo-geon/projects/${branch}`}
    >
      <div className="md:grid md:grid-cols-[minmax(0,1fr)_212px] md:gap-8 lg:grid-cols-[minmax(0,1fr)_232px] lg:gap-10">
        {/* ── sticky meta rail (tablet+ , right) — pinned & self-scrolling ── */}
        <aside className="hidden md:sticky md:top-0 md:col-start-2 md:row-start-1 md:block md:self-start md:border-l md:border-[var(--border)] md:py-1 md:pl-5 lg:pl-6">
          {/* section nav / TOC */}
          <nav>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--faint)]">
              on this page
            </p>
            <ul>
              {sections.map((s, i) => {
                const active = activeId === s.id;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => scrollTo(s.id)}
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[13.5px] transition ${
                        active
                          ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                          : "text-[var(--dim)] hover:bg-[var(--card-2)] hover:text-[var(--text)]"
                      }`}
                    >
                      <span className="font-mono text-[12px] text-[var(--faint)]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {s.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <dl className="mt-5 space-y-3 border-t border-[var(--border)] pt-4">
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--faint)]">
                stack
              </dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {project.stack.map((s) => (
                  <span
                    key={s}
                    className="rounded-md border px-2 py-1 font-mono text-[12px]"
                    style={{
                      color: stackHue(s),
                      borderColor: `color-mix(in srgb, ${stackHue(s)} 32%, transparent)`,
                      background: `color-mix(in srgb, ${stackHue(s)} 9%, transparent)`,
                    }}
                  >
                    {s}
                  </span>
                ))}
              </dd>
            </div>
            {project.href ? (
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--faint)]">
                  repo
                </dt>
                <dd className="mt-1">
                  <a
                    href={project.href}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[13px] text-[var(--dim)] transition hover:text-[var(--accent)]"
                  >
                    → {project.href.replace("https://", "")}
                  </a>
                </dd>
              </div>
            ) : d.repoNote ? (
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--faint)]">
                  repo
                </dt>
                <dd className="mt-1 font-mono text-[13px] text-[var(--faint)]">
                  {d.repoNote}
                </dd>
              </div>
            ) : null}
          </dl>
        </aside>

        {/* ── content column ── */}
        <div className="min-w-0 md:col-start-1 md:row-start-1">
          {/* hero */}
          <Link
            href="/"
            className="mb-5 inline-flex items-center gap-2 font-mono text-[13px] text-[var(--dim)] transition hover:text-[var(--accent)] md:hidden"
          >
            <span className="text-[var(--accent)]">←</span> 홈으로
          </Link>
          <p className="font-mono text-[13px] text-[var(--faint)]">
            <span className="text-[var(--c-cat)]">❯</span>{" "}
            <span data-type>{`git checkout feat/${branch}`}</span>
          </p>
          <h1 className="mt-3 text-[30px] font-extrabold leading-[1.1] tracking-tight text-[var(--heading)] sm:text-[40px]">
            {project.title}
          </h1>
          <p className="mt-4 text-balance text-[17px] font-medium leading-snug text-[var(--accent)]">
            {d.hook}
          </p>
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-[var(--dim)]">
            <span className="font-semibold text-[var(--text)]">{d.role}</span>
            {d.period ? (
              <>
                <span aria-hidden className="text-[var(--faint)]">·</span>
                <span>{d.period}</span>
              </>
            ) : null}
            <span aria-hidden className="text-[var(--faint)]">·</span>
            <span>{project.type}</span>
            {d.award ? (
              <>
                <span aria-hidden className="text-[var(--faint)]">·</span>
                <span>
                  <span className="text-[var(--hue-amber)]">★</span> {d.award}
                </span>
              </>
            ) : null}
          </p>
          {/* phone TOC: the right rail is hidden below md, keep a sticky section strip */}
          <nav
            aria-label="이 페이지 목차"
            className="sticky -top-5 z-20 -mx-4 mt-5 flex gap-2 overflow-x-auto border-b border-[var(--border-soft)] bg-[var(--surface)] px-4 py-2 md:hidden"
          >
            {sections.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollTo(s.id)}
                className={`shrink-0 rounded-full border px-3 py-1 text-[13px] transition ${
                  activeId === s.id
                    ? "border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "border-[var(--border)] text-[var(--dim)]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>
          <p className="mt-4 text-[16px] leading-[1.75] text-[var(--dim)]">
            {emphasize(d.description)}
          </p>
          {d.goals && d.goals.length > 0 ? (
            <div className="mt-5">
              <p className="text-[13px] font-semibold text-[var(--faint)]">목표</p>
              <Bullets items={d.goals} />
            </div>
          ) : null}
          {d.metrics && d.metrics.length > 0 ? (
            <dl data-stagger className="reveal mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2">
              {d.metrics.map((m) => (
                <div key={m.label} className="flex flex-col bg-[var(--card)] px-4 py-3">
                  <dt className="text-[12px] font-semibold text-[var(--faint)]">{m.label}</dt>
                  <dd
                    data-countup
                    className="mt-1 font-mono text-[22px] font-bold leading-tight text-[var(--text)]"
                  >
                    {m.value}
                  </dd>
                  {m.note ? (
                    <dd className="mt-1 text-[12px] leading-snug text-[var(--faint)]">
                      {m.note}
                    </dd>
                  ) : null}
                </div>
              ))}
            </dl>
          ) : null}

          {d.evidence && d.evidence.length > 0 ? (
            <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="text-[13px] font-semibold text-[var(--faint)]">근거</span>
              <EvidenceLinks items={d.evidence} inline />
            </div>
          ) : null}

          {/* mobile meta */}
          <div className="mt-5 space-y-3 border-y border-[var(--border)] py-4 md:hidden">
            <div className="flex flex-wrap gap-2">
              {project.stack.map((s) => (
                <span
                  key={s}
                  className="rounded-md border px-2 py-1 font-mono text-[12px]"
                    style={{
                      color: stackHue(s),
                      borderColor: `color-mix(in srgb, ${stackHue(s)} 32%, transparent)`,
                      background: `color-mix(in srgb, ${stackHue(s)} 9%, transparent)`,
                    }}
                >
                  {s}
                </span>
              ))}
            </div>
            {project.href ? (
              <a
                href={project.href}
                target="_blank"
                rel="noreferrer"
                className="inline-block font-mono text-[13px] text-[var(--dim)] transition hover:text-[var(--accent)]"
              >
                → {project.href.replace("https://", "")}
              </a>
            ) : null}
          </div>


          {/* sections */}
          <div className="mt-8 space-y-12 md:mt-12">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="reveal scroll-mt-4">
                <SectionHead index={i + 1} label={s.label} cmd={s.cmd} />
                {s.node}
              </section>
            ))}
          </div>

          <div className="mt-12 border-t border-[var(--border)] pt-5">
            <Link
              href="/"
              className="inline-block font-mono text-[14px] text-[var(--dim)] transition hover:text-[var(--accent)]"
            >
              <span className="text-[var(--accent)]">←</span> 홈으로
            </Link>
          </div>
          <LivePrompt />
        </div>
      </div>
      <ScrollReveal />
    </TermWindow>
  );
}
