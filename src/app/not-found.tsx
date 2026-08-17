import Link from "next/link";
import { LivePrompt, TermWindow } from "@/components/pages/terminal/terminal-ui";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <TermWindow title="~/heo-geon — zsh — 404" branch="main" status="error · 404">
        <p className="font-mono text-[12px] text-[var(--faint)]">
          <span className="text-[var(--c-cat)]">❯</span> cd ./&lt;unknown&gt;
        </p>
        <p className="mt-2 font-mono text-[13px] text-[var(--hue-rose)]">
          zsh: no such file or directory
        </p>

        <p className="mt-10 font-mono text-[64px] font-extrabold leading-none tracking-tight text-[var(--text)] sm:text-[88px]">
          404
        </p>
        <p className="mt-4 text-[15px] text-[var(--dim)]">
          요청한 경로를 찾을 수 없습니다. 브랜치를 잘못 체크아웃했을 수 있어요.
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 font-mono text-[13px] text-[var(--dim)] transition hover:-translate-y-0.5 hover:border-[var(--accent-line)] hover:text-[var(--accent)]"
        >
          <span className="text-[var(--accent)]">←</span> cd ~/heo-geon
        </Link>

        <LivePrompt />
      </TermWindow>
    </main>
  );
}
