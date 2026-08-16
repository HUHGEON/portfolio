import {
  type WorkflowCanvasLabels,
  WorkflowCanvas,
} from "@/components/canvas/workflow-canvas";
import { getProjectDetailCanvas } from "@/components/pages/project-detail/definitions";
import type { Project } from "@/types/project";

const projectDetailCanvasShell = {
  border: "border-[var(--border)]",
  panel: "bg-[var(--card)]",
  editor: "bg-[var(--bg)]",
  muted: "text-[var(--dim)]",
  strong: "text-[var(--text)]",
  accent: "text-[var(--accent)]",
  accentBg: "bg-[var(--accent-soft)]",
};

type ProjectDetailCanvasProps = {
  project: Project;
  canvasLabels: WorkflowCanvasLabels;
};

export function ProjectDetailCanvas({
  project,
  canvasLabels,
}: ProjectDetailCanvasProps) {
  const detailCanvas = getProjectDetailCanvas(project);

  return (
    <WorkflowCanvas
      label={`${project.title} project canvas`}
      nodes={detailCanvas.nodes}
      edges={detailCanvas.edges}
      shell={projectDetailCanvasShell}
      labels={canvasLabels}
    />
  );
}
