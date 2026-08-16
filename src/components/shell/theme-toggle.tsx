"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/shell/theme-context";
import { Tooltip } from "@/components/ui/tooltip";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const label = theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환";

  return (
    <div className="theme-toggle-fixed fixed right-4 top-4 z-50">
      <Tooltip content={label} placement="left">
        <button
          type="button"
          aria-label={label}
          onClick={toggleTheme}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--dim)] shadow-[var(--shadow-sm)] backdrop-blur transition hover:border-[var(--accent-line)] hover:text-[var(--accent)]"
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </Tooltip>
    </div>
  );
}
