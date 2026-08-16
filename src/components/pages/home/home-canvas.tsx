import { WorkflowCanvas } from "@/components/canvas/workflow-canvas";
import { getHomeCanvasDefinition } from "@/components/pages/home/canvas-definition";

type HomeCanvasProps = {
  profile: {
    email: string;
    links: {
      github: string;
      blog: string;
    };
  };
  home: {
    eyebrow: string;
    title: string;
    subtitle: string;
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
    canvas: {
      previousNode: string;
      nextNode: string;
      focusPreviousNode: string;
      focusNextNode: string;
      moveViewport: string;
      focusNode: string;
      zoomIn: string;
      zoomOut: string;
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

export function HomeCanvas({ home, profile }: HomeCanvasProps) {
  const canvas = getHomeCanvasDefinition({ home, profile });

  return (
    <WorkflowCanvas
      label={home.title}
      nodes={canvas.nodes}
      edges={canvas.edges}
      shell={canvas.shell}
      labels={home.canvas}
    />
  );
}
