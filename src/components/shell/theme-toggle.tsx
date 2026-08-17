"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/shell/theme-context";
import { Tooltip } from "@/components/ui/tooltip";

/** Full-width theme switch row, used in the expanded sidebar footer. */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "라이트 모드로 전환" : "다크 모드로 전환";

  return (
    <button
      type="button"
      aria-label={label}
      onClick={toggleTheme}
      className="flex h-9 w-full items-center gap-2.5 rounded-md border border-[var(--border)] bg-[var(--card-2)] pl-3 pr-2 text-[13px] text-[var(--dim)] transition hover:border-[var(--accent-line)] hover:text-[var(--accent)]"
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
      <span className="min-w-0 flex-1 truncate text-left font-mono text-[12px]">
        {isDark ? "light" : "dark"} mode
      </span>
      <span className="rounded-sm bg-[var(--surface)] px-1.5 py-px font-mono text-[10px] text-[var(--faint)]">
        ⌘
      </span>
    </button>
  );
}

/** Compact icon-only theme switch, used in the collapsed sidebar rail. */
export function ThemeToggleRail() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "라이트 모드로 전환" : "다크 모드로 전환";

  return (
    <Tooltip content={label} placement="right">
      <button
        type="button"
        aria-label={label}
        onClick={toggleTheme}
        className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--dim)] transition hover:bg-[var(--card-2)] hover:text-[var(--accent)]"
      >
        {isDark ? <Sun size={14} /> : <Moon size={14} />}
      </button>
    </Tooltip>
  );
}
