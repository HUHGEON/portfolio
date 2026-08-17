import Link from "next/link";
import { HEO_PROJECT_DETAILS } from "@/components/pages/project-detail/definitions/heogeon-detail";
import { ScrollReveal } from "@/components/pages/terminal/scroll-reveal";
import {
  LivePrompt,
  Panel,
  StackList,
  TermWindow,
} from "@/components/pages/terminal/terminal-ui";
import type { Dictionary } from "@/i18n/dictionaries";

type ProjectItem = Dictionary["projects"][number];

const branchName = (slug: string) => (slug === "media-inference" ? "intern" : slug);
const stripMd = (s: string) => s.replace(/\*\*/g, "").replace(/\n/g, " ").trim();

const HUES = [
  "var(--hue-blue)",
  "var(--hue-amber)",
  "var(--hue-green)",
  "var(--hue-teal)",
  "var(--hue-purple)",
  "var(--hue-rose)",
];

// derive a display category from the project type
const categoryOf = (type: string) =>
  type.includes("Team")
    ? "팀 프로젝트"
    : type.includes("Personal")
      ? "개인 프로젝트"
      : "사내 실무";
const CATEGORY_ORDER = ["팀 프로젝트", "개인 프로젝트", "사내 실무"];

function ProjectCard({ project, hue }: { project: ProjectItem; hue: string }) {
  const award = HEO_PROJECT_DETAILS[project.slug]?.award;
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group relative flex min-w-0 flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 pl-[18px] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--accent-line)] hover:shadow-[var(--shadow-sm)]"
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px] opacity-70 transition-opacity duration-200 group-hover:opacity-100"
        style={{ background: hue }}
      />
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span style={{ color: hue }}>●</span>
        <span
          className="font-mono text-[13px] group-hover:underline"
          style={{ color: hue }}
        >
          feat/{branchName(project.slug)}
        </span>
        {award ? (
          <span className="ml-auto text-[12px] text-[var(--hue-amber)]">
            ★ {award.replace("명지대 ", "").replace("코드잇 ", "")}
          </span>
        ) : null}
      </div>
      <p className="mt-1.5 font-semibold text-[var(--text)]">{project.title}</p>
      <p className="mt-1 line-clamp-2 text-[var(--dim)]">
        {project.description}
      </p>
      <StackList items={project.stack} className="mt-2.5" />
      <span className="mt-2 font-mono text-[11px] text-[var(--faint)] transition group-hover:text-[var(--accent)]">
        cd ./{branchName(project.slug)} →
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
  // keep the original index → stable branch color per project (matches home)
  const groups = CATEGORY_ORDER.map((cat) => ({
    cat,
    items: featured
      .map((project, i) => ({ project, hue: HUES[i % HUES.length] }))
      .filter(({ project }) => categoryOf(project.type) === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <TermWindow
      title="~/heo-geon/projects — zsh"
      status={`~/heo-geon/projects · ${featured.length} projects`}
    >
      <Panel
        cmd="cat .description"
        comment="프로젝트 소개"
        hue="var(--hue-blue)"
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
        hue="var(--hue-purple)"
        className="reveal mt-4"
      >
        <div className="space-y-6">
          {groups.map(({ cat, items }) => (
            <div key={cat}>
              <div className="mb-2.5 flex items-baseline gap-2">
                <span className="font-mono text-[13px] font-semibold text-[var(--text)]">
                  {cat}
                </span>
                <span className="font-mono text-[11px] text-[var(--faint)]">
                  ({items.length})
                </span>
                <span className="ml-3 h-px flex-1 bg-[var(--border-soft)]" />
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {items.map(({ project, hue }) => (
                  <ProjectCard key={project.slug} project={project} hue={hue} />
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
