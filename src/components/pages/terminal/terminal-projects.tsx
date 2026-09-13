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
import type { Dictionary } from "@/i18n/dictionaries";

type ProjectItem = Dictionary["projects"][number];

const stripMd = (s: string) => s.replace(/\*\*/g, "").replace(/\n/g, " ").trim();

function ProjectCard({ project }: { project: ProjectItem }) {
  const award = HEO_PROJECT_DETAILS[project.slug]?.award;
  return (
    <Link
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
      <p className="mt-2 line-clamp-2 text-[var(--dim)]">{emphasize(project.description)}</p>
      <StackList items={project.stack} className="mt-3" />
      <span className="mt-2 text-[12px] text-[var(--faint)] transition group-hover:text-[var(--accent)]">
        자세히 보기 →
      </span>
    </Link>
  );
}

export function TerminalProjects({
  projects,
  projectsPage,
}: {
  projects: Dictionary["projects"];
  projectsPage: Dictionary["projectsPage"];
}) {
  const featured = projects.filter((project) => project.featured);
  const groups = groupProjects(featured);

  return (
    <TermWindow
      title="~/heo-geon/projects — zsh"
      status={`~/heo-geon/projects · ${featured.length} projects`}
    >
      <Panel
        cmd="cat .description"
        index={1}
        comment="프로젝트 소개"
        className="reveal"
      >
        <p className="text-[18px] font-bold text-[var(--text)]">
          {stripMd(projectsPage.title)}
        </p>
        <p className="mt-2 leading-relaxed text-[var(--dim)]">
          {stripMd(projectsPage.description)}
        </p>
      </Panel>

      <Panel
        cmd="git log --oneline --all"
        index={2}
        comment={`프로젝트 · ${featured.length}개`}
        className="reveal mt-4"
      >
        <div className="space-y-6">
          {groups.map(({ id, label: cat, items }) => (
            <div key={id}>
              <div className="mb-3 flex items-baseline gap-2">
                <span className="font-mono text-[14px] font-semibold text-[var(--text)]">
                  {cat}
                </span>
                <span className="font-mono text-[12px] text-[var(--faint)]">
                  ({items.length})
                </span>
                <span className="ml-3 h-px flex-1 bg-[var(--border-soft)]" />
              </div>
              <div data-stagger className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {items.map((project) => (
                  <ProjectCard key={project.slug} project={project} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <LivePrompt />
      <ScrollReveal />
    </TermWindow>
  );
}
