"use client";

import { GitBranch, Menu, Moon, Sun, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { groupProjects, serviceLabel } from "@/components/pages/terminal/terminal-ui";
import { useTheme } from "@/components/shell/theme-context";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

/**
 * Top bar for screens without the sidebar (< lg): home link, project branches
 * menu and the theme switch, which otherwise live only in the sidebar.
 */
export function MobileNav() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const isDark = theme === "dark";
  // computed at render (not module load): terminal-ui imports this file too
  const groups = groupProjects(
    getDictionary(defaultLocale).projects.filter((project) => project.featured),
  );

  return (
    <div className="relative shrink-0 border-b border-[var(--border)] bg-[var(--card-2)] xl:hidden">
      <div className="flex h-12 items-center gap-2 px-3">
        <Link
          href="/"
          className="flex min-w-0 flex-1 items-center font-mono text-[14px] font-semibold text-[var(--text)]"
        >
          <span className="text-[var(--accent)]">~/</span>
          <span className="truncate">Heo Geon</span>
        </Link>
        <button
          type="button"
          aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--dim)] transition hover:bg-[var(--card)] hover:text-[var(--accent)]"
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <button
          type="button"
          aria-label={open ? "프로젝트 메뉴 닫기" : "프로젝트 메뉴 열기"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--dim)] transition hover:bg-[var(--card)] hover:text-[var(--accent)]"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open ? (
        <nav
          aria-label="프로젝트"
          className="absolute inset-x-0 top-full z-40 max-h-[70dvh] overflow-y-auto border-b border-[var(--border)] bg-[var(--card)] px-3 py-3 shadow-[var(--shadow)]"
        >
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className={`flex h-10 items-center rounded-md px-3 text-[14px] ${
              pathname === "/"
                ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                : "text-[var(--text)]"
            }`}
          >
            홈
          </Link>
          {groups.map((group) => (
            <div key={group.id} className="mt-3">
              <p className="flex items-center gap-2 px-3 text-[12px] font-semibold text-[var(--c-cat)]">
                <GitBranch size={12} />
                {group.label}
              </p>
              {group.items.map((project) => {
                const href = `/projects/${project.slug}`;
                const active = pathname === href || pathname === `${href}/`;
                return (
                  <Link
                    key={project.slug}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`mt-1 flex h-10 items-center rounded-md px-3 pl-8 text-[14px] ${
                      active
                        ? "bg-[var(--c-cat-soft)] font-medium text-[var(--c-cat)]"
                        : "text-[var(--dim)]"
                    }`}
                  >
                    {serviceLabel(project.slug, project.title)}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
