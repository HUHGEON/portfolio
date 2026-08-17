import type { ReactNode } from "react";

export function Prompt({ cmd, comment }: { cmd: string; comment?: string }) {
  return (
    <div className="mt-7 border-t border-[var(--border)] pt-6 first:mt-0 first:border-0 first:pt-0">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="select-none text-[var(--faint)]">~</span>
        <span className="select-none font-bold text-[var(--c-cat)]">❯</span>
        <span className="font-medium text-[var(--text)]">{cmd}</span>
        {comment ? (
          <span className="text-[var(--faint)]"># {comment}</span>
        ) : null}
      </div>
    </div>
  );
}

/** Terminal window frame (traffic lights + title bar) wrapping a CLI session. */
export function TermWindow({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="term min-h-[100dvh] bg-[var(--bg)] px-4 py-8 text-[13.5px] leading-relaxed text-[var(--dim)] sm:px-8 sm:py-12 lg:pl-[236px]">
      <div className="mx-auto w-full max-w-[1600px]">
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow)]">
          <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--card-2)] px-4 py-2.5">
            <span className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#e06c5b]" />
              <span className="h-3 w-3 rounded-full bg-[#e0b23b]" />
              <span className="h-3 w-3 rounded-full bg-[#5bb865]" />
            </span>
            <span className="flex-1 truncate text-center text-[12px] text-[var(--dim)]">
              {title}
            </span>
            <span className="w-[46px]" />
          </div>
          <div className="term-win px-5 py-6 sm:px-8 sm:py-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** A live "$" prompt with a blinking block caret, used to close a session. */
export function LivePrompt() {
  return (
    <div className="flex items-center gap-2 pt-7">
      <span className="text-[var(--faint)]">~</span>
      <span className="font-bold text-[var(--c-cat)]">❯</span>
      <span className="term-block-caret" />
    </div>
  );
}
