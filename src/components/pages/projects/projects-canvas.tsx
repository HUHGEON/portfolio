import {
  type WorkflowCanvasLabels,
  WorkflowCanvas,
} from "@/components/canvas/workflow-canvas";
import { getProjectsCanvasDefinition } from "@/components/pages/projects/canvas-definition";
import type { Project } from "@/types/project";

const projectCanvasShell = {
  border: "border-[var(--border)]",
  panel: "bg-[var(--card)]",
  editor: "bg-[var(--bg)]",
  muted: "text-[var(--dim)]",
  strong: "text-[var(--text)]",
  accent: "text-[var(--accent)]",
  accentBg: "bg-[var(--accent-soft)]",
};

type ProjectsCanvasProps = {
  projects: Project[];
  projectsPage: {
    eyebrow: string;
    title: string;
    description: string;
    note: string;
  };
  canvasLabels: WorkflowCanvasLabels;
};

export function ProjectsCanvas({
  projects,
  projectsPage,
  canvasLabels,
}: ProjectsCanvasProps) {
  const canvas = getProjectsCanvasDefinition({ projects, projectsPage });

  return (
    <WorkflowCanvas
      label="Projects overview canvas"
      nodes={canvas.nodes}
      edges={canvas.edges}
      shell={projectCanvasShell}
      labels={canvasLabels}
    />
  );
}
