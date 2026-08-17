import { TerminalHome } from "@/components/pages/terminal/terminal-home";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export default function Home() {
  const dictionary = getDictionary(defaultLocale);

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <TerminalHome dictionary={dictionary} />
    </main>
  );
}
