import Image from "next/image";
import Link from "next/link";
import { HEO_PROJECT_DETAILS } from "@/components/pages/project-detail/definitions/heogeon-detail";
import { LivePrompt, Prompt, TermWindow } from "@/components/pages/terminal/terminal-ui";
import { assetPath } from "@/lib/asset-path";
import type { Dictionary } from "@/i18n/dictionaries";

const branchName = (slug: string) => (slug === "media-inference" ? "intern" : slug);

export function TerminalHome({ dictionary }: { dictionary: Dictionary }) {
  const { profile, home, about, skills } = dictionary;
  const featured = home.featuredProjects;

  return (
    <TermWindow title="~/heo-geon — zsh — 96×40">
      {/* whoami */}
      <Prompt cmd="whoami" />
      <div className="mt-2 flex items-start justify-between gap-6">
        <div>
          <p className="text-[19px] font-bold tracking-tight text-[var(--text)]">
            {home.profileCard.koreanName}{" "}
            <span className="text-[var(--accent)]">
              {home.profileCard.englishName}
            </span>
          </p>
          <p className="mt-0.5 text-[var(--dim)]">
            Backend Developer · 백엔드 개발자
          </p>
          <div className="mt-2 space-y-0.5 text-[var(--dim)]">
            {home.profileCard.experiences.map((exp) => (
              <p key={exp.title}>
                <span className="text-[var(--faint)]">#</span>{" "}
                <span className="text-[var(--text)]">{exp.title}</span>{" "}
                {exp.detail} · {exp.period}
              </p>
            ))}
          </div>
        </div>
        <Image
          src={assetPath("/profile.png")}
          alt={`${home.profileCard.koreanName} 프로필 사진`}
          width={563}
          height={744}
          unoptimized
          className="hidden h-[104px] w-[80px] shrink-0 rounded-lg border-2 border-[var(--accent)] object-cover sm:block"
        />
      </div>

      {/* cat about.md */}
      <Prompt cmd="cat about.md" />
      <p className="mt-2 text-[20px] font-bold leading-snug tracking-tight text-[var(--text)] sm:text-[23px]">
        {home.title}
      </p>
      <div className="mt-2 space-y-1.5">
        {about.paragraphs.map((p) => (
          <p key={p} className="max-w-[64ch] text-[var(--dim)]">
            {p}
          </p>
        ))}
      </div>

      {/* focus */}
      <Prompt cmd="cat ~/focus" comment="what I build" />
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {home.techFocus.buildItems.map((item) => (
          <span key={item} className="text-[var(--text)]">
            <span className="text-[var(--accent)]">▸</span> {item}
          </span>
        ))}
      </div>

      {/* stack */}
      <Prompt cmd="ls ~/stack" />
      <div className="mt-2 space-y-1">
        {skills.groups.map((group) => (
          <div key={group.title} className="flex flex-wrap gap-x-3">
            <span className="w-[84px] shrink-0 text-[var(--accent)]">
              {group.title.toLowerCase()}/
            </span>
            <span className="text-[var(--text)]">{group.items.join("  ")}</span>
          </div>
        ))}
      </div>

      {/* git log projects */}
      <Prompt cmd="git log ./projects" comment={`${featured.length} commits`} />
      <div className="mt-2 divide-y divide-[var(--border-soft)]">
        {featured.map((project) => {
          const award = HEO_PROJECT_DETAILS[project.slug]?.award;
          return (
            <Link
              key={project.slug}
              href={`/projects/${project.slug}`}
              className="group relative -mx-3 block rounded-md px-3 py-2.5 transition hover:bg-[var(--card-2)]"
            >
              <span className="pointer-events-none absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-[var(--accent)] opacity-0 transition group-hover:opacity-100" />
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-[var(--c-cat)]">●</span>
                <span className="text-[var(--accent)] group-hover:underline">
                  feat/{branchName(project.slug)}
                </span>
                <span className="font-semibold text-[var(--text)]">
                  {project.title}
                </span>
                {award ? (
                  <span className="text-[12px] text-[#c39a4d]">
                    ★ {award.replace("명지대 ", "").replace("코드잇 ", "")}
                  </span>
                ) : null}
                <span className="ml-auto hidden text-[12px] text-[var(--faint)] transition group-hover:text-[var(--accent)] sm:inline">
                  cd ./{branchName(project.slug)} →
                </span>
              </div>
              <p className="mt-1 max-w-[74ch] pl-5 text-[var(--dim)]">
                {project.description}
              </p>
              <p className="mt-1.5 pl-5 text-[12px] text-[var(--faint)]">
                {project.stack.join("  ·  ")}
              </p>
            </Link>
          );
        })}
      </div>

      {/* contact */}
      <Prompt cmd="cat ./contact" />
      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
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

      <LivePrompt />
    </TermWindow>
  );
}
