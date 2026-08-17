import Link from "next/link";
import { HEO_PROJECT_DETAILS } from "@/components/pages/project-detail/definitions/heogeon-detail";
import { LivePrompt, Prompt, TermWindow } from "@/components/pages/terminal/terminal-ui";
import type { Dictionary } from "@/i18n/dictionaries";

const branchName = (slug: string) => (slug === "media-inference" ? "intern" : slug);
const stripMd = (s: string) => s.replace(/\*\*/g, "").replace(/\n/g, " ").trim();

export function TerminalProjects({
  projects,
  projectsPage,
}: {
  projects: Dictionary["projects"];
  projectsPage: Dictionary["projectsPage"];
}) {
  const featured = projects.filter((project) => project.featured);

  return (
    <TermWindow title="~/heo-geon/projects — zsh">
      <Prompt cmd="pwd" />
      <p className="mt-1 text-[var(--dim)]">~/heo-geon/projects</p>

      <Prompt cmd="cat .description" comment="projects" />
      <p className="mt-2 max-w-[80ch] text-[var(--text)]">
        {stripMd(projectsPage.title)}
      </p>
      <p className="mt-1.5 max-w-[80ch] text-[var(--dim)]">
        {stripMd(projectsPage.description)}
      </p>

      <Prompt cmd="git log --oneline --all" comment={`${featured.length} projects`} />
      <div className="mt-2 divide-y divide-[var(--border-soft)]">
        {featured.map((project) => {
          const award = HEO_PROJECT_DETAILS[project.slug]?.award;
          return (
            <Link
              key={project.slug}
              href={`/projects/${project.slug}`}
              className="group -mx-2 block rounded-md px-2 py-2.5 transition hover:bg-[var(--card-2)]"
            >
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
                <span className="text-[12px] text-[var(--faint)]">
                  · {project.type}
                </span>
                <span className="ml-auto text-[12px] text-[var(--faint)] transition group-hover:text-[var(--accent)]">
                  cd ./{branchName(project.slug)} →
                </span>
              </div>
              <p className="mt-1 max-w-[80ch] pl-5 text-[var(--dim)]">
                {project.description}
              </p>
              <p className="mt-1.5 pl-5 text-[12px] text-[var(--faint)]">
                {project.stack.join("  ·  ")}
              </p>
            </Link>
          );
        })}
      </div>

      <LivePrompt />
    </TermWindow>
  );
}
