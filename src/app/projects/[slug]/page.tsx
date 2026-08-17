import { notFound } from "next/navigation";
import { TerminalProjectDetail } from "@/components/pages/terminal/terminal-project-detail";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export const dynamicParams = false;

export function generateStaticParams() {
  return getDictionary(defaultLocale).projects.map((project) => ({
    slug: project.slug,
  }));
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dictionary = getDictionary(defaultLocale);
  const project = dictionary.projects.find((item) => item.slug === slug);

  if (!project) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <TerminalProjectDetail project={project} />
    </main>
  );
}
