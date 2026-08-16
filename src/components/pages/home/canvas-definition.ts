import type {
  CanvasEdge,
  CanvasNode,
  CanvasShell,
} from "@/components/canvas/workflow-canvas";

type HomeCanvasInput = {
  profile: {
    email: string;
    links: {
      github: string;
      blog: string;
    };
  };
  home: {
    title: string;
    github: string;
    email: string;
    blog: string;
    slogan: {
      emphasis: string;
      body: string;
      action: string;
      closing: string;
      final: string;
    };
    techFocus: {
      buildTitle: string;
      buildItems: string[];
      stackTitle: string;
      stacks: string[];
    };
    nodeTitles: {
      profile: string;
      links: string;
      techFocus: string;
    };
    profileCard: {
      koreanName: string;
      englishName: string;
      experiences: Array<{
        icon: "school" | "company";
        title: string;
        detail: string;
        period: string;
      }>;
      skills: string[];
    };
    projectSectionTitle: string;
    projectLinks: {
      overview: string;
      overviewTooltip: string;
      details: string;
      detailsTooltip: string;
    };
    featuredProjects: Array<{
      slug: string;
      title: string;
      description: string;
      highlights: string[];
      stack: string[];
      iconSrc: string;
      iconAlt: string;
    }>;
  };
};

type HomeCanvasDefinition = {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  shell: CanvasShell & {
    page: string;
  };
};

const shell = {
  page: "bg-white text-zinc-700",
  border: "border-[var(--border)]",
  panel: "bg-[var(--card)]",
  editor: "bg-[var(--bg)]",
  muted: "text-[var(--dim)]",
  strong: "text-[var(--text)]",
  accent: "text-[var(--accent)]",
  accentBg: "bg-[var(--accent-soft)]",
};

export function getHomeCanvasDefinition({
  home,
}: HomeCanvasInput): HomeCanvasDefinition {
  const formatTags = (tags: string[]) => tags.map((tag) => `\`${tag}\``).join(" ");

  return {
    shell,
    edges: [],
    nodes: [
      // --- profile header: photo (soft-framed, no box) + identity card ---
      {
        id: "profile-photo",
        kind: "note",
        appearance: "transparent",
        excludeFromSequence: true,
        order: 1,
        x: 13,
        y: 6,
        width: 7.5,
        image: {
          src: "/profile.png",
          alt: `${home.profileCard.koreanName} 프로필 사진`,
          width: 563,
          height: 744,
          frame: "soft",
        },
        markdown: "",
      },
      {
        id: "profile",
        kind: "note",
        appearance: "default",
        order: 1,
        x: 22,
        y: 6,
        width: 41,
        markdown: [
          `## ${home.profileCard.koreanName} ${home.profileCard.englishName}`,
          "**Backend Developer \u00B7 \uBC31\uC5D4\uB4DC \uAC1C\uBC1C\uC790**",
          "",
          ...home.profileCard.experiences.map(
            (experience) =>
              `- :${experience.icon}: **${experience.title}** / ${experience.detail} / ${experience.period}`,
          ),
          "",
          `- :stack: ${formatTags(home.profileCard.skills)}`,
        ].join("\n"),
      },
      // --- philosophy / slogan ---
      {
        id: "slogan",
        kind: "note",
        appearance: "default",
        order: 2,
        x: 13,
        y: 24,
        width: 50,
        markdown: [
          `# ${home.title}`,
          "",
          home.slogan.emphasis,
          "",
          home.slogan.body,
          "",
          home.slogan.action,
          "",
          home.slogan.closing,
          "",
          home.slogan.final,
        ].join("\n"),
      },
      {
        id: "tech-focus-title",
        kind: "note",
        appearance: "transparent",
        excludeFromSequence: true,
        order: 3,
        x: 13,
        y: 46,
        width: 22,
        markdown: [`### ${home.nodeTitles.techFocus}`].join("\n"),
      },
      {
        id: "tech-focus",
        kind: "note",
        order: 3,
        x: 13,
        y: 49,
        width: 33,
        markdown: [
          `### ${home.techFocus.buildTitle}`,
          ...home.techFocus.buildItems.map((item) => `- ${item}`),
          "",
          `### ${home.techFocus.stackTitle}`,
          formatTags(home.techFocus.stacks),
        ].join("\n"),
      },
      {
        id: "projects-heading",
        kind: "note",
        appearance: "transparent",
        excludeFromSequence: true,
        order: 4,
        x: 13,
        y: 70,
        width: 36,
        markdown: [
          `# ${home.projectSectionTitle} [${home.projectLinks.overview}|${home.projectLinks.overviewTooltip}](/projects)`,
        ].join("\n"),
      },
      ...home.featuredProjects.map((project, index) => ({
        id: `project-${index + 1}`,
        kind: "note" as const,
        ...(project.iconSrc
          ? { icon: { src: project.iconSrc, alt: project.iconAlt } }
          : {}),
        order: 4 + index,
        x: index % 2 === 0 ? 13 : 47,
        y: 78 + Math.floor(index / 2) * 24,
        width: 33,
        markdown: [
          `## ${project.title}\u00A0\u00A0[${home.projectLinks.details}|${home.projectLinks.detailsTooltip.replace("{project}", project.title)}](/projects/${project.slug})`,
          project.description,
          "",
          ...project.highlights.map((highlight) => `- ${highlight}`),
          "",
          formatTags(project.stack),
        ].join("\n"),
      })),
    ],
  };
}
