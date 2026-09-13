import { Building2, GraduationCap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { HEO_PROJECT_DETAILS } from "@/components/pages/project-detail/definitions/heogeon-detail";
import { ScrollReveal } from "@/components/pages/terminal/scroll-reveal";
import {
  groupProjects,
  LivePrompt,
  Panel,
  serviceLabel,
  emphasize,
  StackList,
  TermWindow,
} from "@/components/pages/terminal/terminal-ui";
import { assetPath } from "@/lib/asset-path";
import type { Dictionary } from "@/i18n/dictionaries";

const HUES = [
  "var(--hue-blue)",
  "var(--hue-amber)",
  "var(--hue-green)",
  "var(--hue-teal)",
  "var(--hue-purple)",
  "var(--hue-rose)",
];

const tint = (hue: string, pct: number) =>
  `color-mix(in srgb, ${hue} ${pct}%, transparent)`;

const ABOUT_HIGHLIGHTS = [
  "API·DB 구조 설계",
  "데이터 수집·가공 자동화",
  "ERD·DB 모델링",
  "데이터 파이프라인",
  "실시간 서버",
  "API 설계",
];

function highlightKeywords(text: string) {
  const re = new RegExp(
    `(${ABOUT_HIGHLIGHTS.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(
      "|",
    )})`,
    "g",
  );
  return text.split(re).map((part, i) =>
    ABOUT_HIGHLIGHTS.includes(part) ? (
      <span key={i} className="font-semibold text-[var(--text)]">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

export function TerminalHome({ dictionary }: { dictionary: Dictionary }) {
  const { profile, home, about, skills, projects } = dictionary;
  const featured = groupProjects(home.featuredProjects).flatMap((group) => group.items);
  // every award, including projects no longer featured on the cards
  const awards = projects.flatMap((p) => {
    const award = HEO_PROJECT_DETAILS[p.slug]?.award;
    return award
      ? [{ slug: p.slug, award, project: serviceLabel(p.slug, p.title) }]
      : [];
  });

  return (
    <TermWindow
      title="~/heo-geon — zsh — 96×40"
      status={`~/heo-geon · ${featured.length} projects`}
    >
      {/* ── hero: identity + one-line strength + experience, one block ── */}
      <section className="reveal flex flex-col rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
        <div className="flex items-start justify-between gap-4 sm:gap-8">
          <div className="min-w-0 flex-1">
            <p className="mb-2 font-mono text-[12px] text-[var(--faint)]">
              <span className="text-[var(--c-cat)]">❯</span>{" "}
              <span data-type>whoami</span>
            </p>
            <p
              data-split
              className="whitespace-nowrap text-[26px] font-extrabold leading-none tracking-tight text-[var(--heading)] sm:text-[40px]"
            >
              {home.profileCard.koreanName}{" "}
              <span className="text-[var(--accent)]">
                {home.profileCard.englishName}
              </span>
            </p>
            <p className="mt-3 text-[16px] font-medium text-[var(--dim)]">
              Backend Developer
              <span className="hidden sm:inline">
                {" "}
                <span className="text-[var(--faint)]">·</span> 백엔드 개발자
              </span>
            </p>
            <p className="mt-5 text-balance text-[20px] font-bold leading-snug tracking-tight text-[var(--heading)] sm:text-[22px]">
              {home.title}
            </p>
          </div>
          <Image
            src={assetPath("/profile.jpg")}
            alt={`${home.profileCard.koreanName} 프로필 사진`}
            width={348}
            height={460}
            priority
            unoptimized
            className="h-[92px] w-[72px] shrink-0 rounded-xl object-cover shadow-[var(--shadow-sm)] ring-1 ring-[var(--accent-line)] sm:h-[150px] sm:w-[116px] sm:rounded-2xl"
          />
        </div>

        <div className="order-2 mt-5 max-w-[72ch] space-y-2 sm:order-none sm:mt-3">
          {about.paragraphs.map((p, i) => (
            <p
              key={p}
              // phones: the tagline already carries the last sentence, keep the intro to two lines of thought
              className={`text-balance leading-[1.75] text-[var(--dim)] ${
                i === about.paragraphs.length - 1 ? "hidden sm:block" : ""
              }`}
            >
              {highlightKeywords(p)}
            </p>
          ))}
        </div>

        <div className="order-1 mt-5 space-y-2 border-t border-[var(--border-soft)] pt-5 sm:order-none">
          <div className="flex flex-wrap gap-2">
            {home.profileCard.experiences.map((exp) => {
              const Icon = exp.icon === "school" ? GraduationCap : Building2;
              return (
                <span
                  key={exp.title}
                  className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--card-2)] px-3 py-1.5 text-[13px]"
                >
                  <Icon size={13} className="shrink-0 text-[var(--accent)]" />
                  <span className="font-semibold text-[var(--text)]">{exp.title}</span>
                  <span className="text-[var(--dim)]">{exp.detail}</span>
                  <span className="text-[var(--faint)]">· {exp.period}</span>
                </span>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            {awards.map((a) => (
              <Link
                key={a.slug}
                href={`/projects/${a.slug}`}
                className="group inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--card-2)] px-3 py-1.5 text-[13px] transition hover:border-[var(--accent-line)]"
              >
                <span className="text-[var(--hue-amber)]">★</span>
                <span className="font-semibold text-[var(--text)] group-hover:text-[var(--accent)]">
                  {a.award}
                </span>
                <span className="text-[var(--faint)]">· {a.project}</span>
              </Link>
            ))}
          </div>
        </div>
        <a
          href="#projects"
          className="order-3 mt-5 inline-flex items-center gap-1 self-start text-[14px] font-semibold text-[var(--accent)] transition hover:gap-2 sm:order-none"
        >
          대표 프로젝트 보기 <span aria-hidden>↓</span>
        </a>
      </section>

      {/* ── projects: bare section (no outer card), lead project spans full width ── */}
      <section id="projects" className="reveal mt-10 scroll-mt-4">
        <div className="mb-4 flex items-baseline gap-3 border-b border-[var(--border)] pb-3">
          <span className="font-mono text-[14px] font-semibold text-[var(--accent)]">
            01
          </span>
          <h2 className="text-[20px] font-bold tracking-tight text-[var(--heading)]">
            프로젝트 · {featured.length}개
          </h2>
          <span className="ml-auto hidden font-mono text-[12px] text-[var(--faint)] sm:inline">
            ❯ git log ./projects
          </span>
        </div>
        <div data-stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {featured.map((project, i) => {
            const award = HEO_PROJECT_DETAILS[project.slug]?.award;
            const lead = i === 0;
            const rest = featured.length - 1;
            const lastAlone = !lead && rest % 2 === 1 && i === featured.length - 1;
            return (
              <Link
                key={project.slug}
                href={`/projects/${project.slug}`}
                className={`spotlight group relative flex min-w-0 flex-col rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition-[translate,scale,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)] active:translate-y-0 active:scale-[0.99] ${
                  lead
                    ? "sm:col-span-2 bg-[color-mix(in_srgb,var(--accent)_4%,var(--card))] dark:bg-[var(--card-2)]"
                    : lastAlone
                      ? "sm:col-span-2"
                      : ""
                }`}
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h3
                    className={`font-bold tracking-tight text-[var(--heading)] transition group-hover:text-[var(--accent)] ${
                      lead ? "text-[22px]" : "text-[18px]"
                    }`}
                  >
                    {serviceLabel(project.slug, project.title)}
                    <span
                      aria-hidden
                      className="ml-1.5 inline-block text-[var(--faint)] transition group-hover:translate-x-0.5 group-hover:text-[var(--accent)]"
                    >
                      →
                    </span>
                  </h3>
                  {lead ? (
                    <span className="rounded-md border border-[var(--accent-line)] px-2 py-0.5 text-[12px] font-semibold text-[var(--accent)]">
                      대표 프로젝트
                    </span>
                  ) : null}
                  {award ? (
                    <span className="ml-auto text-[13px] text-[var(--dim)]">
                      <span className="text-[var(--hue-amber)]">★</span>{" "}
                      {award.replace("명지대 ", "").replace("코드잇 ", "")}
                    </span>
                  ) : null}
                </div>
                {lead && project.lead ? (
                  <div className="mt-4">
                    <p className="text-[26px] font-extrabold leading-tight tracking-tight text-[var(--heading)] sm:text-[30px]">
                      {emphasize(project.lead.headline)}
                    </p>
                    <p className="mt-1 text-[16px] font-medium text-[var(--text)]">
                      {emphasize(project.lead.detail)}
                    </p>
                    <p className="mt-2 text-[13px] text-[var(--dim)]">
                      {project.lead.role}
                    </p>
                  </div>
                ) : null}
                <ul
                  className={`mt-3 flex-1 space-y-2 ${lead ? "border-t border-[var(--border-soft)] pt-3" : ""}`}
                >
                  {(lead && project.lead
                    ? project.highlights.slice(1)
                    : project.highlights
                  ).map((highlight) => (
                    <li
                      key={highlight}
                      className="flex gap-2 leading-[1.7] text-[var(--dim)]"
                    >
                      <span className="mt-[11px] h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]" />
                      <span className="min-w-0">{emphasize(highlight)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-t border-[var(--border-soft)] pt-3">
                  <StackList items={project.stack} />
                  <span className="text-[13px] font-semibold text-[var(--accent)]">
                    자세히 보기 →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── panel grid ── */}
      <div className="mt-10 grid gap-8 sm:grid-cols-2">
        <Panel
          cmd="cat PROFICIENCY.md"
          index={2}
          comment="할 수 있는 것"
          className="reveal sm:col-span-2"
        >
          <ul data-stagger className="divide-y divide-[var(--border-soft)]">
            {home.proficiency.map((item) => (
              <li
                key={item.text}
                className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 md:flex-row md:items-baseline md:gap-6"
              >
                <p className="flex-1 text-balance leading-[1.75] text-[var(--dim)]">
                  {emphasize(item.text)}
                </p>
                <span className="flex shrink-0 flex-wrap gap-x-3 gap-y-1 text-[13px]">
                  {item.projects.map((slug) => {
                    const project = projects.find((p) => p.slug === slug);
                    return project ? (
                      <Link
                        key={slug}
                        href={`/projects/${slug}`}
                        className="whitespace-nowrap text-[var(--dim)] transition hover:text-[var(--accent)]"
                      >
                        <span className="text-[var(--accent)]">→</span>{" "}
                        {serviceLabel(slug, project.title)}
                      </Link>
                    ) : null;
                  })}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          cmd="ls ~/stack"
          index={3}
          comment="기술 스택"
          className="reveal sm:col-span-2"
        >
          <div data-stagger className="space-y-3">
            {skills.groups.map((group, gi) => {
              const hue = HUES[gi % HUES.length];
              return (
                <div key={group.title} className="flex flex-wrap items-center gap-2">
                  <span className="mr-1 w-[74px] shrink-0 font-mono text-[12px] text-[var(--faint)]">
                    {group.title.toLowerCase()}/
                  </span>
                  {group.items.map((it) => (
                    <span
                      key={it}
                      className="rounded-md border px-2 py-1 text-[13px] font-medium"
                      style={{
                        color: hue,
                        borderColor: tint(hue, 34),
                        background: tint(hue, 11),
                      }}
                    >
                      {it}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel
          cmd="cat ./contact"
          index={4}
          comment="연락처"
          className="reveal sm:col-span-2"
        >
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <a
              href={profile.links.github}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--dim)] transition hover:text-[var(--accent)]"
            >
              <span className="text-[var(--accent)]">→</span> github/HUHGEON
            </a>
            <a
              href={profile.links.blog}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--dim)] transition hover:text-[var(--accent)]"
            >
              <span className="text-[var(--accent)]">→</span> huhgeon.github.io
            </a>
            <a
              href={`mailto:${profile.email}`}
              className="text-[var(--dim)] transition hover:text-[var(--accent)]"
            >
              <span className="text-[var(--accent)]">→</span> {profile.email}
            </a>
          </div>
        </Panel>
      </div>

      <LivePrompt />
      <ScrollReveal />
    </TermWindow>
  );
}
