import type { ReactNode } from "react";

export function Prompt({ cmd, comment }: { cmd: string; comment?: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 pt-7 first:pt-0">
      <span className="select-none text-[var(--faint)]">~</span>
      <span className="select-none font-bold text-[var(--c-cat)]">❯</span>
      <span className="font-medium text-[var(--text)]">{cmd}</span>
      {comment ? (
        <span className="text-[var(--faint)]"># {comment}</span>
      ) : null}
    </div>
  );
}

/** Terminal window frame (traffic lights + title bar) wrapping a CLI session. */
export function TermWindow({
  title,
  children,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="term min-h-[100dvh] bg-[var(--bg)] px-4 py-8 text-[13.5px] leading-relaxed text-[var(--dim)] sm:px-8 sm:py-12 lg:pl-[236px]">
      <div
        className={`mx-auto w-full ${wide ? "max-w-[1040px]" : "max-w-[820px]"}`}
      >
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
