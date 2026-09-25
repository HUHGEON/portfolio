import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TerminalProjectDetail } from "@/components/pages/terminal/terminal-project-detail";
import { defaultLocale } from "@/i18n/config";
import { HEO_PROJECT_DETAILS } from "@/components/pages/project-detail/definitions/heogeon-detail";
import { getDictionary } from "@/i18n/dictionaries";

export const dynamicParams = false;

export function generateStaticParams() {
  return getDictionary(defaultLocale).projects.map((project) => ({
    slug: project.slug,
  }));
}

// each project gets its own tab title and link preview, so several open tabs stay apart
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getDictionary(defaultLocale).projects.find(
    (item) => item.slug === slug,
  );
  if (!project) return {};
  const detail = HEO_PROJECT_DETAILS[slug];
  const title = `${project.title} | 허건 포트폴리오`;
  const description = detail?.hook ?? project.description;
  return {
    title,
    description,
    openGraph: { title, description, url: `/projects/${slug}/` },
    twitter: { title, description },
  };
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
