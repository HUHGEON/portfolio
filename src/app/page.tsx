import { HomeCanvas } from "@/components/pages/home/home-canvas";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export default function Home() {
  const dictionary = getDictionary(defaultLocale);

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <HomeCanvas home={dictionary.home} profile={dictionary.profile} />
    </main>
  );
}
