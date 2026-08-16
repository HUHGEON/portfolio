import { ProjectsCanvas } from "@/components/pages/projects/projects-canvas";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export default function ProjectsPage() {
  const dictionary = getDictionary(defaultLocale);

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <ProjectsCanvas
        projects={dictionary.projects}
        projectsPage={dictionary.projectsPage}
        canvasLabels={dictionary.home.canvas}
      />
    </main>
  );
}
