"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ARCH_SPECS,
  ArchitectureDiagram,
} from "@/components/pages/project-detail/ArchitectureDiagram";
import {
  ARCH_BOX_W,
  archFrameHeight,
} from "@/components/pages/project-detail/arch-dimensions";
import { HEO_PROJECT_DETAILS } from "@/components/pages/project-detail/definitions/heogeon-detail";
import { LivePrompt, Prompt, TermWindow } from "@/components/pages/terminal/terminal-ui";
import type { ArchSpec } from "@/components/pages/project-detail/ArchitectureDiagram";
import type { Project } from "@/types/project";

const branchName = (slug: string) => (slug === "media-inference" ? "intern" : slug);

/** Renders the original architecture diagram, uniformly scaled to fit the
 * terminal width so nothing is clipped. */
function ArchScaler({ spec, diagramKey }: { spec: ArchSpec; diagramKey: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(0);

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
    <div ref={ref} className="w-full overflow-hidden">
      <div
        style={{
          width: ARCH_BOX_W,
          height: frameH * scale,
        }}
      >
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
  );
}

function Bullets({ items, tone = "dim" }: { items: string[]; tone?: "dim" | "text" }) {
  return (
    <ul className="mt-2 space-y-1">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="select-none text-[var(--faint)]">-</span>
          <span
            className={`max-w-[80ch] ${tone === "text" ? "text-[var(--text)]" : "text-[var(--dim)]"}`}
          >
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function TerminalProjectDetail({ project }: { project: Project }) {
  const d = HEO_PROJECT_DETAILS[project.slug];
  const branch = branchName(project.slug);
  const spec = d?.diagramKey ? ARCH_SPECS[d.diagramKey] : undefined;

  if (!d) {
    return (
      <TermWindow title={`~/heo-geon/projects/${project.slug} — zsh`}>
        <Prompt cmd={`cat ${project.slug}/README.md`} />
        <p className="mt-2 text-[19px] font-bold text-[var(--text)]">
          {project.title}
        </p>
        <p className="mt-2 text-[var(--dim)]">{project.description}</p>
        <LivePrompt />
      </TermWindow>
    );
  }

  return (
    <TermWindow title={`~/heo-geon/projects/${branch} — zsh`} wide>
      {/* checkout */}
      <Prompt cmd={`git checkout feat/${branch}`} />
      <p className="mt-1 text-[var(--faint)]">
        Switched to branch <span className="text-[var(--c-cat)]">feat/{branch}</span>
      </p>

      {/* README */}
      <Prompt cmd="cat README.md" />
      <div className="mt-2 flex flex-wrap items-baseline gap-x-3">
        <span className="text-[var(--faint)]">#</span>
        <h1 className="text-[20px] font-bold tracking-tight text-[var(--text)] sm:text-[23px]">
          {project.title}
        </h1>
        {d.award ? (
          <span className="text-[12px] text-[#c39a4d]">★ {d.award}</span>
        ) : null}
        <span className="text-[12px] text-[var(--faint)]">· {project.type}</span>
      </div>
      <p className="mt-2 max-w-[80ch] font-semibold text-[var(--accent)]">
        &gt; {d.hook}
      </p>
      <p className="mt-2 max-w-[80ch] text-[var(--dim)]">{d.description}</p>

      {/* role + stack + repo */}
      <Prompt cmd="cat ROLE && ls --stack" />
      <p className="mt-2 text-[var(--text)]">
        <span className="text-[var(--faint)]">role:</span> {d.role}
      </p>
      <p className="mt-1 text-[var(--faint)]">
        <span>stack:</span>{" "}
        <span className="text-[var(--dim)]">{project.stack.join("  ·  ")}</span>
      </p>
      {project.href ? (
        <a
          href={project.href}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-block text-[var(--dim)] transition hover:text-[var(--accent)]"
        >
          <span className="text-[var(--accent)]">→</span>{" "}
          {project.href.replace("https://", "")}
        </a>
      ) : d.repoNote ? (
        <p className="mt-1 text-[var(--faint)]"># {d.repoNote}</p>
      ) : null}

      {/* architecture — original diagram, scaled to fit the terminal width */}
      {spec && d.diagramKey ? (
        <>
          <Prompt cmd="./render architecture.svg" />
          <div className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
            <ArchScaler spec={spec} diagramKey={d.diagramKey} />
          </div>
        </>
      ) : null}

      {/* flow */}
      {d.architecture.steps.length > 0 ? (
        <>
          <Prompt cmd="cat FLOW.md" comment="동작 흐름" />
          <ol className="mt-2 space-y-1.5">
            {d.architecture.steps.map((step, i) => (
              <li key={step} className="flex gap-2.5">
                <span className="shrink-0 text-[var(--accent)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="max-w-[80ch] text-[var(--dim)]">{step}</span>
              </li>
            ))}
          </ol>
        </>
      ) : null}

      {/* --- intern (works) branch --- */}
      {d.works ? (
        <>
          <Prompt cmd="ls ./work" comment="사내 실무 · 기술 중심" />
          <div className="mt-2 divide-y divide-[var(--border-soft)]">
            {d.works.map((w) => (
              <div key={w.title} className="py-2.5">
                <p className="font-semibold text-[var(--text)]">
                  <span className="text-[var(--c-cat)]">▸</span> {w.title}
                </p>
                <p className="mt-1 max-w-[80ch] pl-5 text-[var(--dim)]">{w.desc}</p>
                <p className="mt-1 pl-5 text-[12px] text-[var(--faint)]">
                  {w.stack.join("  ·  ")}
                </p>
              </div>
            ))}
          </div>
          {d.qa ? (
            <>
              <Prompt cmd="cat QA.md" />
              <div className="mt-2 space-y-1">
                {d.qa.split("\n").map((line) => (
                  <p key={line} className="max-w-[80ch] text-[var(--dim)]">
                    {line.replace(/^- /, "")}
                  </p>
                ))}
              </div>
            </>
          ) : null}
          <p className="mt-4 text-[12px] text-[var(--faint)]">
            ※ 도메인·세부 기능·정량 성과는 대외비로, 사용 기술과 구조만 기재.
          </p>
        </>
      ) : (
        <>
          {/* goals */}
          {d.goals && d.goals.length > 0 ? (
            <>
              <Prompt cmd="cat GOALS.md" comment="프로젝트 목표" />
              <Bullets items={d.goals} />
            </>
          ) : null}

          {/* features */}
          {d.features && d.features.length > 0 ? (
            <>
              <Prompt cmd="cat FEATURES.md" comment="주요 기능" />
              <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
                {d.features.map((f) => (
                  <div key={f.title}>
                    <p className="font-semibold text-[var(--text)]">
                      <span className="text-[var(--accent)]">▸</span> {f.title}
                    </p>
                    <p className="mt-0.5 pl-5 text-[var(--dim)]">{f.desc}</p>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {/* problem / solution */}
          {d.problems.length > 0 || d.solutions.length > 0 ? (
            <>
              <Prompt cmd="cat PROBLEM_SOLUTION.md" />
              {d.problems.length > 0 ? (
                <>
                  <p className="mt-2 text-[var(--text)]">
                    <span className="text-[#e0796b]">$</span> {d.problemTitle}
                  </p>
                  <Bullets items={d.problems} />
                </>
              ) : null}
              {d.solutions.length > 0 ? (
                <>
                  <p className="mt-3 text-[var(--text)]">
                    <span className="text-[var(--c-cat)]">$</span> 해결 과정
                  </p>
                  <Bullets items={d.solutions} />
                  {d.progress && d.progress.length > 0 ? (
                    <>
                      <p className="mt-2 pl-4 text-[var(--faint)]">
                        # {d.progressTitle ?? "현재 진행"}
                      </p>
                      <Bullets items={d.progress} />
                    </>
                  ) : null}
                </>
              ) : null}
            </>
          ) : null}

          {/* results */}
          {d.results.length > 0 ? (
            <>
              <Prompt cmd="cat RESULTS.md" comment="결과" />
              <Bullets items={d.results} tone="text" />
            </>
          ) : null}

          {/* lessons */}
          {d.lessons ? (
            <>
              <Prompt cmd="cat LESSONS.md" comment="배운 점" />
              <p className="mt-2 max-w-[80ch] text-[var(--dim)]">{d.lessons}</p>
            </>
          ) : null}

          {/* tech choices */}
          {d.techChoices.length > 0 ? (
            <>
              <Prompt cmd="cat TECH_CHOICES.md" comment="기술 선택 이유" />
              <div className="mt-2 space-y-2">
                {d.techChoices.map((t) => (
                  <p key={t.name} className="max-w-[82ch]">
                    <span className="text-[var(--accent)]">{t.name}</span>
                    <span className="text-[var(--faint)]"> — </span>
                    <span className="text-[var(--dim)]">{t.reason}</span>
                  </p>
                ))}
              </div>
            </>
          ) : null}
        </>
      )}

      {/* back */}
      <Prompt cmd="cd .." />
      <Link
        href="/"
        className="mt-1 inline-block text-[var(--dim)] transition hover:text-[var(--accent)]"
      >
        <span className="text-[var(--accent)]">←</span> ~/heo-geon
      </Link>
      <LivePrompt />
    </TermWindow>
  );
}
