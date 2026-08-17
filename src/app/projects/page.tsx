import { TerminalProjects } from "@/components/pages/terminal/terminal-projects";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export default function ProjectsPage() {
  const dictionary = getDictionary(defaultLocale);

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <TerminalProjects
        projects={dictionary.projects}
        projectsPage={dictionary.projectsPage}
      />
    </main>
  );
}
