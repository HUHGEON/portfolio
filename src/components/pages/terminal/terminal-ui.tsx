import type { ReactNode } from "react";

/** Human Korean service label per project (shown instead of the git-style slug). */
export const SERVICE_LABEL: Record<string, string> = {
  "voice-kiosk": "음성인식 키오스크",
  "live-chat": "라이브 채팅 서버",
  haeyaji: "날씨 추천 앱",
  zogakzip: "이미지 아카이브",
  "blog-platform": "블로그 플랫폼",
  "media-inference": "사내 실무 (인턴)",
};
export const serviceLabel = (slug: string, fallback: string) =>
  SERVICE_LABEL[slug] ?? fallback;

/** Category colour for a tech token — matches the home "기술 스택" palette. */
export function stackHue(tech: string): string {
  const t = tech.toLowerCase();
  if (/(gpt|ollama|exaone|openai|llm)/.test(t)) return "var(--hue-purple)";
  if (/(javascript|typescript|java|python|kotlin)/.test(t))
    return "var(--hue-green)";
  if (/(mysql|mongo|redis|postgres|mariadb|sqlite)/.test(t))
    return "var(--hue-amber)";
  if (/(node|express|spring|fastapi|nest|webflux|websocket|flask|django)/.test(t))
    return "var(--hue-blue)";
  if (
    /(docker|git|swagger|jest|querydsl|multer|moment|mecab|jwt|streamlit|pandas|numpy|matplotlib|altair|scipy|ffmpeg)/.test(
      t,
    )
  )
    return "var(--hue-teal)";
  return "var(--faint)";
}

/** A gap-separated tech list, each token coloured by its category. */
export function StackList({
  items,
  className,
}: {
  items: string[];
  className?: string;
}) {
  return (
    <p
      className={`flex flex-wrap gap-x-3 font-mono text-[12.5px] leading-relaxed ${className ?? ""}`}
    >
      {items.map((t, i) => (
        <span
          key={`${t}-${i}`}
          className="whitespace-nowrap"
          style={{ color: stackHue(t) }}
        >
          {t}
        </span>
      ))}
    </p>
  );
}

export function Prompt({ cmd, comment }: { cmd: string; comment?: string }) {
  return (
    <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-[var(--border)] pt-4 first:mt-0 first:border-0 first:pt-0">
      {comment ? (
        <span className="flex items-center gap-2">
          <span className="h-3.5 w-1 rounded-full bg-[var(--accent)]" />
          <h2 className="text-[15px] font-bold tracking-tight text-[var(--text)]">
            {comment}
          </h2>
        </span>
      ) : null}
      <span className="flex items-baseline gap-x-1.5 text-[12px]">
        <span className="select-none text-[var(--faint)]">~</span>
        <span className="select-none font-bold text-[var(--c-cat)]">❯</span>
        <span className="text-[var(--dim)]">{cmd}</span>
      </span>
    </div>
  );
}

/** A titled panel — a section rendered as a distinct "tool output" card with a
 * bold Korean topic and a monospace shell-command label. */
export function Panel({
  cmd,
  comment,
  className,
  bodyClassName,
  children,
}: {
  cmd: string;
  comment?: string;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)] ${className ?? ""}`}
    >
      <header className="flex items-center gap-2.5 border-b border-[var(--border-soft)] bg-[var(--card-2)] px-4 py-2.5 sm:px-5">
        {comment ? (
          <h2 className="whitespace-nowrap text-[15px] font-bold tracking-tight text-[var(--text)]">
            {comment}
          </h2>
        ) : null}
        <span className="ml-auto hidden items-baseline gap-1.5 font-mono text-[11px] text-[var(--faint)] sm:flex">
          <span className="text-[var(--c-cat)]">❯</span>
          <span className="truncate">{cmd}</span>
        </span>
      </header>
      <div className={`px-4 py-4 sm:px-5 sm:py-5 ${bodyClassName ?? ""}`}>
        {children}
      </div>
    </section>
  );
}

/** Terminal window frame (traffic lights + title bar) wrapping a CLI session. */
export function TermWindow({
  title,
  branch = "main",
  status = "~/heo-geon",
  children,
}: {
  title: string;
  branch?: string;
  status?: string;
  children: ReactNode;
}) {
  return (
    <div className="term h-[100dvh] overflow-hidden bg-[var(--bg)] px-3 py-3 text-[15px] leading-relaxed text-[var(--dim)] sm:px-4 lg:pl-[232px]">
      <div className="mx-auto flex h-full w-full max-w-[1240px] flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow)]">
        {/* pinned title bar */}
        <div className="flex shrink-0 items-center gap-2 border-b border-[var(--border)] bg-[var(--card-2)] px-4 py-2.5">
          <span aria-hidden className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#e06c5b]" />
            <span className="h-3 w-3 rounded-full bg-[#e0b23b]" />
            <span className="h-3 w-3 rounded-full bg-[#5bb865]" />
          </span>
          <span className="flex-1 truncate text-center text-[12px] text-[var(--dim)]">
            {title}
          </span>
          <span className="w-[46px]" />
        </div>
        {/* scrollable session body */}
        <div className="term-win flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          {children}
        </div>
        {/* tmux-style status bar */}
        <div className="flex shrink-0 items-center gap-3 border-t border-[var(--border)] bg-[var(--card-2)] px-4 py-1.5 font-mono text-[11px] text-[var(--faint)]">
          <span className="flex items-center gap-1.5 rounded bg-[var(--c-cat-soft)] px-1.5 py-0.5 font-semibold text-[var(--c-cat)]">
            <span aria-hidden>⎇</span> {branch}
          </span>
          <span className="truncate text-[var(--dim)]">{status}</span>
          <span className="ml-auto hidden sm:inline">UTF-8</span>
          <span className="hidden sm:inline">LF</span>
          <span className="text-[var(--dim)]">zsh</span>
        </div>
      </div>
    </div>
  );
}

/** A live "$" prompt with a blinking block caret, used to close a session. */
export function LivePrompt() {
  return (
    <div aria-hidden className="flex items-center gap-2 pt-5">
      <span className="text-[var(--faint)]">~</span>
      <span className="font-bold text-[var(--c-cat)]">❯</span>
      <span className="term-block-caret" />
    </div>
  );
}
