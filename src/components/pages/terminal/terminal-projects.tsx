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
import type { Dictionary } from "@/i18n/dictionaries";

type ProjectItem = Dictionary["projects"][number];

const stripMd = (s: string) => s.replace(/\*\*/g, "").replace(/\n/g, " ").trim();

// derive a display category from the project type
const categoryOf = (type: string) =>
  type.includes("Team")
    ? "팀 프로젝트"
    : type.includes("Personal")
      ? "개인 프로젝트"
      : "사내 실무";
const CATEGORY_ORDER = ["팀 프로젝트", "개인 프로젝트", "사내 실무"];

function ProjectCard({ project }: { project: ProjectItem }) {
  const award = HEO_PROJECT_DETAILS[project.slug]?.award;
  return (
    <Link
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
      <p className="mt-1.5 line-clamp-2 text-[var(--dim)]">{project.description}</p>
      <StackList items={project.stack} className="mt-2.5" />
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
  const groups = CATEGORY_ORDER.map((cat) => ({
    cat,
    items: featured.filter((project) => categoryOf(project.type) === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <TermWindow
      title="~/heo-geon/projects — zsh"
      status={`~/heo-geon/projects · ${featured.length} projects`}
    >
      <Panel
        cmd="cat .description"
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
        comment={`프로젝트 · ${featured.length}개`}
        className="reveal mt-4"
      >
        <div className="space-y-6">
          {groups.map(({ cat, items }) => (
            <div key={cat}>
              <div className="mb-2.5 flex items-baseline gap-2">
                <span className="font-mono text-[14px] font-semibold text-[var(--text)]">
                  {cat}
                </span>
                <span className="font-mono text-[12px] text-[var(--faint)]">
                  ({items.length})
                </span>
                <span className="ml-3 h-px flex-1 bg-[var(--border-soft)]" />
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
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
