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
  const awardCount = awards.length;

  const stats: {
    value: string;
    unit?: string;
    label: string;
  }[] = [
    { value: String(featured.length), label: "프로젝트" },
    { value: String(awardCount), label: "수상" },
    { value: "6", unit: "개월", label: "실무 인턴" },
  ];

  return (
    <TermWindow
      title="~/heo-geon — zsh — 96×40"
      status={`~/heo-geon · ${featured.length} projects`}
    >
      {/* ── hero feature panel ── */}
      <section className="reveal relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
        <div className="relative flex flex-col gap-5 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4 sm:items-center sm:gap-8">
            <div className="min-w-0 flex-1">
              <p className="mb-2 font-mono text-[12px] text-[var(--faint)]">
                <span className="text-[var(--c-cat)]">❯</span> <span data-type>whoami</span>
              </p>
              <p data-split className="text-[30px] font-extrabold leading-none tracking-tight text-[var(--text)] sm:text-[40px]">
                {home.profileCard.koreanName}{" "}
                <span className="text-[var(--accent)]">
                  {home.profileCard.englishName}
                </span>
              </p>
              <p className="mt-3 text-[16px] font-medium text-[var(--dim)]">
                Backend Developer <span className="text-[var(--faint)]">·</span> 백엔드
                개발자
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {home.profileCard.experiences.map((exp) => {
                  const Icon = exp.icon === "school" ? GraduationCap : Building2;
                  return (
                    <span
                      key={exp.title}
                      className="inline-flex flex-wrap items-center gap-x-2 rounded-2xl border border-[var(--border)] bg-[var(--card-2)] px-3 py-2 text-[13px] sm:whitespace-nowrap sm:rounded-full"
                    >
                      <Icon size={13} className="shrink-0 text-[var(--accent)]" />
                      <span className="font-semibold text-[var(--text)]">
                        {exp.title}
                      </span>
                      <span className="text-[var(--dim)]">{exp.detail}</span>
                      <span className="text-[var(--faint)]">· {exp.period}</span>
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="relative shrink-0 self-start sm:self-auto">
              <Image
                src={assetPath("/profile.jpg")}
                alt={`${home.profileCard.koreanName} 프로필 사진`}
                width={348}
                height={460}
                priority
                unoptimized
                className="relative h-[92px] w-[72px] rounded-xl object-cover sm:h-[150px] sm:w-[116px] sm:rounded-2xl shadow-[var(--shadow-sm)] ring-1 ring-[var(--accent-line)]"
              />
            </div>
          </div>
          {/* stats */}
          <div className="grid grid-cols-3 divide-x divide-[var(--border-soft)] border-t border-[var(--border-soft)] pt-4">
            {stats.map((s, i) => (
              <div key={s.label} className={i > 0 ? "pl-6" : ""}>
                <p
                  className="font-mono text-[26px] font-extrabold leading-none text-[var(--text)]"
                >
                  <span data-countup>{s.value}</span>
                  {s.unit ? (
                    <span className="ml-0.5 text-[16px] font-bold">{s.unit}</span>
                  ) : null}
                </p>
                <p className="mt-2 text-[13px] text-[var(--dim)]">{s.label}</p>
              </div>
            ))}
          </div>
          {awards.length > 0 ? (
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-[var(--border-soft)] pt-4 text-[13px]">
              <span className="text-[var(--dim)]">수상</span>
              {awards.map((a) => (
                <Link
                  key={a.slug}
                  href={`/projects/${a.slug}`}
                  className="group whitespace-nowrap transition"
                >
                  <span className="text-[var(--hue-amber)]">★</span>{" "}
                  <span className="font-semibold text-[var(--text)] group-hover:text-[var(--accent)]">
                    {a.award}
                  </span>
                  <span className="text-[var(--faint)]"> · {a.project}</span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* ── panel grid ── */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Panel
          cmd="cat about.md"
          index={1}
          comment="소개"
          className="reveal sm:col-span-2"
        >
          <p className="text-[19px] font-bold leading-snug tracking-tight text-[var(--text)] sm:text-[22px]">
            {home.title}
          </p>
          <div className="mt-3 space-y-2 leading-relaxed">
            {about.paragraphs.map((p) => (
              <p key={p} className="text-balance leading-[1.75] text-[var(--dim)]">
                {highlightKeywords(p)}
              </p>
            ))}
          </div>
        </Panel>

        <Panel
          cmd="git log ./projects"
          index={2}
          comment={`프로젝트 · ${featured.length}개`}
          className="reveal sm:col-span-2"
        >
          <div data-stagger className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {featured.map((project) => {
              const award = HEO_PROJECT_DETAILS[project.slug]?.award;
              return (
                <Link
                  key={project.slug}
                  href={`/projects/${project.slug}`}
                  className="spotlight group relative flex min-w-0 flex-col rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 transition-[translate,scale,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)] active:translate-y-0 active:scale-[0.99]"
                >
                  <div className="flex flex-wrap items-center gap-x-2">
                    <span className="font-semibold text-[16px] text-[var(--text)] transition group-hover:text-[var(--accent)]">
                      {serviceLabel(project.slug, project.title)}
                    </span>
                    {award ? (
                      <span className="ml-auto text-[13px] text-[var(--hue-amber)]">
                        ★ {award.replace("명지대 ", "").replace("코드잇 ", "")}
                      </span>
                    ) : null}
                  </div>
                  <ul className="mt-2 space-y-1">
                    {project.highlights.map((highlight) => (
                      <li key={highlight} className="flex gap-2 leading-[1.7] text-[var(--dim)]">
                        <span className="mt-[11px] h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]" />
                        <span className="min-w-0">{emphasize(highlight)}</span>
                      </li>
                    ))}
                  </ul>
                  <StackList items={project.stack} className="mt-3" />
                  <span className="mt-2 text-[12px] text-[var(--faint)] transition group-hover:text-[var(--accent)]">
                    자세히 보기 →
                  </span>
                </Link>
              );
            })}
          </div>
        </Panel>

        <Panel
          cmd="cat PROFICIENCY.md"
          index={3}
          comment="할 수 있는 것"
          className="reveal sm:col-span-2"
        >
          <ul data-stagger className="divide-y divide-[var(--border-soft)]">
            {home.proficiency.map((item) => (
              <li
                key={item.text}
                className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 md:flex-row md:items-baseline md:gap-6"
              >
                <p className="flex-1 text-balance leading-[1.75] text-[var(--dim)]">{emphasize(item.text)}</p>
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
          index={4}
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
          index={5}
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
