import {
  HEO_PROJECT_DETAILS,
  type HeoProjectDetail,
} from "@/components/pages/project-detail/definitions/heogeon-detail";
import type { Dictionary } from "@/i18n/dictionaries";

// How many A4 sheets the /print edition spends on one project.
// A project without 문제 해결 사례 fits on one; one with 사례 takes a second sheet,
// plus one each for an infra diagram and a 버전별 발전 과정 table.
export function printSheetCount(detail?: HeoProjectDetail) {
  if (!detail?.cases) return 1;
  return 2 + (detail.infraDiagramKey ? 1 : 0) + (detail.versions ? 1 : 0);
}

// Total pages in the exported PDF: the profile sheet plus every featured project.
// The home page prints this number, so it must come from the same place the
// sheets do — a hardcoded count goes stale the moment a project grows.
export function printPageTotal(dictionary: Dictionary) {
  return dictionary.home.featuredProjects.reduce(
    (total, card) => total + printSheetCount(HEO_PROJECT_DETAILS[card.slug]),
    1,
  );
}
