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
  StackList,
  stackHue,
  TermWindow,
} from "@/components/pages/terminal/terminal-ui";
import type { ArchSpec } from "@/components/pages/project-detail/ArchitectureDiagram";
import type { Project } from "@/types/project";

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
      <div className="group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 shadow-[var(--shadow-sm)]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="아키텍처 확대"
          className="absolute right-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)]/90 px-2.5 py-1.5 font-mono text-[11px] text-[var(--dim)] shadow-[var(--shadow-sm)] backdrop-blur transition hover:border-[var(--accent-line)] hover:text-[var(--accent)] focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
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
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--card-2)] px-4 py-2.5">
        <span className="flex items-center gap-2 font-mono text-[12px] text-[var(--dim)]">
          <span className="text-[var(--c-cat)]">❯</span> architecture.svg —{" "}
          <span className="text-[var(--text)]">{label}</span>
        </span>
        <div className="flex items-center gap-1.5">
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
          <span className="mx-1 w-11 text-center font-mono text-[12px] text-[var(--faint)]">
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
      <p className="border-t border-[var(--border)] bg-[var(--card-2)] py-2 text-center font-mono text-[11px] text-[var(--faint)]">
        스크롤 확대·축소 · 드래그로 이동 · ESC 닫기
      </p>
    </div>,
    document.body,
  );
}

/* ────────────────────────────── helpers ────────────────────────────── */

function Bullets({ items, tone = "dim" }: { items: string[]; tone?: "dim" | "text" }) {
  return (
    <ul className="mt-3 space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]" />
          <span
            className={
              tone === "text"
                ? "leading-relaxed text-[var(--text)]"
                : "leading-relaxed text-[var(--dim)]"
            }
          >
            {item}
          </span>
        </li>
      ))}
    </ul>
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
    <div className="mb-4 flex items-baseline gap-3 border-b border-[var(--border)] pb-2.5">
      <span className="font-mono text-[13px] font-semibold text-[var(--accent)]">
        {String(index).padStart(2, "0")}
      </span>
      <h2 className="text-[18px] font-bold tracking-tight text-[var(--text)]">
        {label}
      </h2>
      <span className="ml-auto hidden font-mono text-[11px] text-[var(--faint)] sm:inline">
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
        <ArchViewer spec={spec} diagramKey={d.diagramKey} label={project.title} />
      ),
    });
  }
  if (d.architecture.steps.length > 0) {
    sections.push({
      id: "flow",
      label: "동작 흐름",
      cmd: "cat FLOW.md",
      node: (
        <ol className="relative ml-[11px] border-l border-[var(--border)]">
          {d.architecture.steps.map((step, i) => (
            <li key={step} className="relative flex gap-4 pb-6 pl-6 last:pb-0">
              <span className="absolute -left-[11px] top-0 z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full border border-[var(--accent-line)] bg-[var(--card-2)] font-mono text-[11px] font-semibold text-[var(--accent)]">
                {i + 1}
              </span>
              <span className="pt-0.5 leading-relaxed text-[var(--dim)]">
                {step}
              </span>
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
                <p className="mt-1.5 leading-relaxed text-[var(--dim)]">
                  {w.desc}
                </p>
                <StackList items={w.stack} className="mt-2.5" />
              </div>
            ))}
          </div>
          {d.qa ? (
            <div className="mt-4 space-y-1.5 border-t border-[var(--border-soft)] pt-4">
              {d.qa.split("\n").map((line) => (
                <p key={line} className="leading-relaxed text-[var(--dim)]">
                  {line.replace(/^- /, "")}
                </p>
              ))}
            </div>
          ) : null}
          <p className="mt-4 font-mono text-[11px] text-[var(--faint)]">
            ※ 도메인·세부 기능·정량 성과는 대외비로, 사용 기술과 구조만 기재.
          </p>
        </>
      ),
    });
  } else {
    if (d.goals && d.goals.length > 0) {
      sections.push({
        id: "goals",
        label: "프로젝트 목표",
        cmd: "cat GOALS.md",
        node: <Bullets items={d.goals} />,
      });
    }
    if (d.features && d.features.length > 0) {
      sections.push({
        id: "features",
        label: "주요 기능",
        cmd: "cat FEATURES.md",
        node: (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {d.features.map((f) => (
              <div
                key={f.title}
                className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--accent-line)] hover:bg-[var(--card-2)]"
              >
                <p className="flex items-center gap-2 font-semibold text-[var(--text)]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--accent-soft)] text-[12px] text-[var(--accent)]">
                    ▸
                  </span>
                  {f.title}
                </p>
                <p className="mt-2 leading-relaxed text-[var(--dim)]">{f.desc}</p>
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
                <p className="font-semibold text-[var(--hue-rose)]">
                  # 문제 — {d.problemTitle}
                </p>
                <Bullets items={d.problems} />
              </div>
            ) : null}
            {d.solutions.length > 0 ? (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
                <p className="font-semibold text-[var(--c-cat)]"># 해결 과정</p>
                <Bullets items={d.solutions} />
                {d.progress && d.progress.length > 0 ? (
                  <div className="mt-3 border-t border-[var(--border-soft)] pt-3">
                    <p className="font-mono text-[12px] text-[var(--faint)]">
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
    if (d.results.length > 0) {
      sections.push({
        id: "results",
        label: "결과",
        cmd: "cat RESULTS.md",
        node: (
          <ul className="space-y-2.5">
            {d.results.map((r) => (
              <li key={r} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--c-cat-soft)]">
                  <Check size={13} className="text-[var(--c-cat)]" />
                </span>
                <span className="leading-relaxed text-[var(--text)]">{r}</span>
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
          <p className="leading-relaxed text-[var(--dim)]">{d.lessons}</p>
        ),
      });
    }
    if (d.techChoices.length > 0) {
      sections.push({
        id: "tech",
        label: "기술 선택 이유",
        cmd: "cat TECH_CHOICES.md",
        node: (
          <div className="divide-y divide-[var(--border-soft)] overflow-hidden rounded-lg border border-[var(--border)]">
            {d.techChoices.map((t) => (
              <div
                key={t.name}
                className="grid gap-1 px-4 py-3 transition hover:bg-[var(--card-2)] sm:grid-cols-[170px_1fr] sm:gap-6"
              >
                <span className="font-mono text-[13px] font-semibold text-[var(--accent)]">
                  {t.name}
                </span>
                <span className="leading-relaxed text-[var(--dim)]">
                  {t.reason}
                </span>
              </div>
            ))}
          </div>
        ),
      });
    }
  }

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
          <dl className="space-y-2.5">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
                role
              </dt>
              <dd className="mt-1 text-[13px] leading-snug text-[var(--text)]">
                {d.role}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
                type
              </dt>
              <dd className="mt-1 text-[13px] text-[var(--dim)]">
                {project.type}
              </dd>
            </div>
            {d.award ? (
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
                  award
                </dt>
                <dd className="mt-1 text-[13px] text-[var(--hue-amber)]">
                  ★ {d.award}
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
                stack
              </dt>
              <dd className="mt-1.5 flex flex-wrap gap-1.5">
                {project.stack.map((s) => {
                  const hue = stackHue(s);
                  return (
                    <span
                      key={s}
                      className="rounded-md border px-2 py-[3px] font-mono text-[11px]"
                      style={{
                        color: hue,
                        borderColor: `color-mix(in srgb, ${hue} 32%, transparent)`,
                        background: `color-mix(in srgb, ${hue} 9%, transparent)`,
                      }}
                    >
                      {s}
                    </span>
                  );
                })}
              </dd>
            </div>
            {project.href ? (
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
                  repo
                </dt>
                <dd className="mt-1">
                  <a
                    href={project.href}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[12px] text-[var(--dim)] transition hover:text-[var(--accent)]"
                  >
                    → {project.href.replace("https://", "")}
                  </a>
                </dd>
              </div>
            ) : d.repoNote ? (
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
                  repo
                </dt>
                <dd className="mt-1 font-mono text-[12px] text-[var(--faint)]">
                  {d.repoNote}
                </dd>
              </div>
            ) : null}
          </dl>

          {/* section nav / TOC */}
          <nav className="mt-4 border-t border-[var(--border)] pt-3.5">
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--faint)]">
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
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[12.5px] transition ${
                        active
                          ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                          : "text-[var(--dim)] hover:bg-[var(--card-2)] hover:text-[var(--text)]"
                      }`}
                    >
                      <span className="font-mono text-[11px] text-[var(--faint)]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {s.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* ── content column ── */}
        <div className="min-w-0 md:col-start-1 md:row-start-1">
          {/* hero */}
          <Link
            href="/"
            className="mb-5 inline-flex items-center gap-1.5 font-mono text-[12px] text-[var(--dim)] transition hover:text-[var(--accent)] md:hidden"
          >
            <span className="text-[var(--accent)]">←</span> cd ~/heo-geon
          </Link>
          <p className="font-mono text-[12px] text-[var(--faint)]">
            <span className="text-[var(--c-cat)]">❯</span> git checkout feat/
            {branch}
          </p>
          <h1 className="mt-3 text-[30px] font-extrabold leading-[1.1] tracking-tight text-[var(--text)] sm:text-[40px]">
            {project.title}
          </h1>
          <p className="mt-4 max-w-[60ch] border-l-2 border-[var(--accent)] pl-4 text-[17px] font-medium leading-snug text-[var(--accent)]">
            {d.hook}
          </p>
          <p className="mt-4 max-w-[70ch] text-[15px] leading-relaxed text-[var(--dim)]">
            {d.description}
          </p>

          {/* mobile meta */}
          <div className="mt-5 space-y-3 border-y border-[var(--border)] py-4 md:hidden">
            <p className="text-[13px] text-[var(--text)]">
              <span className="font-mono text-[11px] text-[var(--faint)]">
                role:{" "}
              </span>
              {d.role}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {project.stack.map((s) => {
                const hue = stackHue(s);
                return (
                  <span
                    key={s}
                    className="rounded-md border px-2 py-[3px] font-mono text-[11px]"
                    style={{
                      color: hue,
                      borderColor: `color-mix(in srgb, ${hue} 32%, transparent)`,
                      background: `color-mix(in srgb, ${hue} 9%, transparent)`,
                    }}
                  >
                    {s}
                  </span>
                );
              })}
            </div>
            {d.award ? (
              <p className="text-[13px] text-[var(--hue-amber)]">★ {d.award}</p>
            ) : null}
            {project.href ? (
              <a
                href={project.href}
                target="_blank"
                rel="noreferrer"
                className="inline-block font-mono text-[12px] text-[var(--dim)] transition hover:text-[var(--accent)]"
              >
                → {project.href.replace("https://", "")}
              </a>
            ) : null}
          </div>

          {/* sections */}
          <div className="mt-12 space-y-12">
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
              className="inline-block font-mono text-[13px] text-[var(--dim)] transition hover:text-[var(--accent)]"
            >
              <span className="text-[var(--accent)]">←</span> cd ~/heo-geon
            </Link>
          </div>
          <LivePrompt />
        </div>
      </div>
      <ScrollReveal />
    </TermWindow>
  );
}
