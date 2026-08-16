import type { Project } from "@/types/project";
import { getFallbackProjectDetailCanvas } from "./fallback";
import { buildHeoProjectDetail, HEO_PROJECT_DETAILS } from "./heogeon-detail";
import type { ProjectDetailCanvasDefinition } from "./types";

export function getProjectDetailCanvas(
  project: Project,
): ProjectDetailCanvasDefinition {
  const detail = HEO_PROJECT_DETAILS[project.slug];

  if (detail) {
    return buildHeoProjectDetail(project, detail);
  }

  return getFallbackProjectDetailCanvas(project);
}
