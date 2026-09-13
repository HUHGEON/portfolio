import { Building2, GraduationCap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { HEO_PROJECT_DETAILS } from "@/components/pages/project-detail/definitions/heogeon-detail";
import { ScrollReveal } from "@/components/pages/terminal/scroll-reveal";
import {
  LivePrompt,
  Panel,
  serviceLabel,
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
  const { profile, home, about, skills } = dictionary;
  const featured = home.featuredProjects;
  const awardCount = featured.filter((p) => HEO_PROJECT_DETAILS[p.slug]?.award).length;

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
        <div className="relative flex flex-col gap-5 p-5 sm:p-6">
          <div className="flex flex-col-reverse gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
            <div>
              <p className="mb-2 font-mono text-[12px] text-[var(--faint)]">
                <span className="text-[var(--c-cat)]">❯</span> whoami
              </p>
              <p className="text-[30px] font-extrabold leading-none tracking-tight text-[var(--text)] sm:text-[40px]">
                {home.profileCard.koreanName}{" "}
                <span className="text-[var(--accent)]">
                  {home.profileCard.englishName}
                </span>
              </p>
              <p className="mt-2.5 text-[16px] font-medium text-[var(--dim)]">
                Backend Developer <span className="text-[var(--faint)]">·</span> 백엔드
                개발자
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {home.profileCard.experiences.map((exp) => {
                  const Icon = exp.icon === "school" ? GraduationCap : Building2;
                  return (
                    <span
                      key={exp.title}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--card-2)] px-3 py-1.5 text-[13px]"
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
                className="relative h-[150px] w-[116px] rounded-2xl object-cover shadow-[var(--shadow)] ring-1 ring-[var(--border)]"
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
                  {s.value}
                  {s.unit ? (
                    <span className="ml-0.5 text-[16px] font-bold">{s.unit}</span>
                  ) : null}
                </p>
                <p className="mt-1.5 text-[13px] text-[var(--dim)]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── panel grid ── */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Panel
          cmd="cat about.md"
          comment="소개"
          className="reveal sm:col-span-2"
        >
          <p className="text-[19px] font-bold leading-snug tracking-tight text-[var(--text)] sm:text-[22px]">
            {home.title}
          </p>
          <div className="mt-2.5 space-y-1.5 leading-relaxed">
            {about.paragraphs.map((p) => (
              <p key={p} className="text-[var(--dim)]">
                {highlightKeywords(p)}
              </p>
            ))}
          </div>
        </Panel>

        <Panel
          cmd="cat ~/focus"
          comment="무엇을 만드는가"
          className="reveal"
        >
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {home.techFocus.buildItems.map((item) => (
              <div
                key={item}
                className="flex items-center gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--card-2)] px-3.5 py-3 text-[15px] font-medium text-[var(--text)] transition hover:border-[var(--accent-line)] hover:bg-[var(--card)]"
              >
                <span className="text-[var(--faint)]">▸</span> {item}
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          cmd="ls ~/stack"
          comment="기술 스택"
          className="reveal"
        >
          <div className="space-y-2.5">
            {skills.groups.map((group, gi) => {
              const hue = HUES[gi % HUES.length];
              return (
                <div key={group.title} className="flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 w-[74px] shrink-0 font-mono text-[12px] text-[var(--faint)]">
                    {group.title.toLowerCase()}/
                  </span>
                  {group.items.map((it) => (
                    <span
                      key={it}
                      className="rounded-md border px-2 py-[3px] text-[13px] font-medium"
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
          cmd="git log ./projects"
          comment={`프로젝트 · ${featured.length}개`}
          className="reveal sm:col-span-2"
        >
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {featured.map((project) => {
              const award = HEO_PROJECT_DETAILS[project.slug]?.award;
              return (
                <Link
                  key={project.slug}
                  href={`/projects/${project.slug}`}
                  className="group relative flex min-w-0 flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--accent-line)] hover:shadow-[var(--shadow-sm)]"
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
                  <p className="mt-1.5 line-clamp-2 text-[var(--dim)]">
                    {project.description}
                  </p>
                  <StackList items={project.stack} className="mt-2.5" />
                  <span className="mt-2 text-[12px] text-[var(--faint)] transition group-hover:text-[var(--accent)]">
                    자세히 보기 →
                  </span>
                </Link>
              );
            })}
          </div>
        </Panel>

        <Panel
          cmd="cat ./contact"
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
