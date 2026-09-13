"use client";

import {
  ArrowUpRight,
  BookOpenText,
  ChevronsLeft,
  GitBranch,
  Home,
  type LucideIcon,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { animate, stagger } from "animejs";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { GithubIcon } from "@/components/icons/github-icon";
import { groupProjects, serviceLabel } from "@/components/pages/terminal/terminal-ui";
import { ThemeToggle, ThemeToggleRail } from "@/components/shell/theme-toggle";
import { PortfolioViewportProvider } from "@/components/shell/viewport-context";
import { Tooltip } from "@/components/ui/tooltip";
import type { Dictionary } from "@/i18n/dictionaries";

type PortfolioFrameProps = {
  children: ReactNode;
  navigation: Dictionary["nav"];
  profile: Dictionary["profile"];
  linkLabels: Pick<Dictionary["home"], "github" | "email" | "blog">;
  projects: Dictionary["projects"];
};

type SidebarChild = {
  id: string;
  label: string;
  href: string;
};

type SidebarGroup = {
  id: string;
  label: string;
  children: SidebarChild[];
};

type SidebarSection = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  groups?: SidebarGroup[];
};

export function PortfolioFrame({
  children,
  navigation,
  profile,
  linkLabels,
  projects,
}: PortfolioFrameProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <PortfolioViewportProvider>
      <section className="relative min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <a href="#main-content" className="skip-link">
          본문으로 건너뛰기
        </a>
        <aside className="fixed bottom-3 left-3 top-3 z-30 hidden xl:block">
          <PortfolioSidebar
            collapsed={isSidebarCollapsed}
            navigation={navigation}
            profile={profile}
            linkLabels={linkLabels}
            projects={projects}
            onToggle={() => setIsSidebarCollapsed((value) => !value)}
          />
        </aside>
        <div
          id="main-content"
          tabIndex={-1}
          className="min-w-0 focus:outline-none"
        >
          {children}
        </div>
      </section>
    </PortfolioViewportProvider>
  );
}

type PortfolioSidebarProps = Omit<PortfolioFrameProps, "children"> & {
  collapsed: boolean;
  onToggle: () => void;
};

function PortfolioSidebar({
  collapsed,
  navigation,
  profile,
  linkLabels,
  projects,
  onToggle,
}: PortfolioSidebarProps) {
  const pathname = usePathname();
  const graphRef = useRef<HTMLElement>(null);

  // draw the branch graph once: lines grow top-down, then commit dots pop in
  useEffect(() => {
    const nav = graphRef.current;
    if (!nav || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lines = nav.querySelectorAll<HTMLElement>('[data-graph="line"]');
    const nodes = nav.querySelectorAll<HTMLElement>('[data-graph="node"]');
    animate(lines, {
      scaleY: [0, 1],
      duration: 420,
      delay: stagger(28),
      ease: "outQuad",
    });
    animate(nodes, {
      scale: [0, 1],
      opacity: [0, 1],
      duration: 380,
      delay: stagger(40, { start: 160 }),
      ease: "outBack(2)",
    });
  }, []);
  const projectGroups = groupProjects(
    projects.filter((project) => project.featured),
  ).map((group) => ({
    id: group.id,
    label: group.label,
    children: group.items.map((project) => ({
      id: project.slug,
      label: serviceLabel(project.slug, project.title),
      href: `/projects/${project.slug}`,
    })),
  }));
  const sections: SidebarSection[] = [
    {
      id: "overview",
      label: "main",
      href: "/",
      icon: Home,
      groups: projectGroups,
    },
  ];
  const links = [
    {
      label: linkLabels.github,
      href: profile.links.github,
      icon: GithubIcon,
    },
    {
      label: linkLabels.blog,
      href: profile.links.blog,
      icon: BookOpenText,
    },
    {
      label: linkLabels.email,
      href: `mailto:${profile.email}`,
      icon: Mail,
    },
  ];
  const railItems = [...sections, ...links];
  const isActive = (href: string) =>
    href === "/"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);
  const isSectionActive = (section: SidebarSection) =>
    isActive(section.href) ||
    Boolean(
      section.groups?.some((group) =>
        group.children.some((child) => isActive(child.href)),
      ),
    );

  return (
    <div
      className={[
        "relative h-full overflow-hidden border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)] backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        collapsed ? "w-12 rounded-[1.75rem]" : "w-52 rounded-[1.75rem]",
      ].join(" ")}
    >
      <nav
        aria-label={navigation.collapsedLabel}
        className={[
          "absolute inset-0 flex h-full w-12 flex-col items-center gap-1 px-1.5 py-3 text-[var(--dim)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          collapsed
            ? "translate-x-0 opacity-100"
            : "pointer-events-none -translate-x-2 opacity-0",
        ].join(" ")}
      >
        <Tooltip content={navigation.expandSidebar} placement="right" className="mb-3">
          <button
            type="button"
            aria-label={navigation.expandSidebar}
            onClick={onToggle}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text)] transition hover:bg-[var(--card-2)]"
          >
            <ChevronsLeft size={14} className="rotate-180" />
          </button>
        </Tooltip>
        {railItems.map((item) => {
          const Icon = item.icon;
          const isExternal = item.href.startsWith("http");
          const active =
            "id" in item &&
            typeof item.id === "string" &&
            sections.some(
              (section) => section.id === item.id && isSectionActive(section),
            );
          const RailLink = isExternal || item.href.startsWith("mailto:") ? "a" : Link;

          return (
            <Tooltip key={item.label} content={item.label} placement="right">
              <RailLink
                href={item.href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noreferrer" : undefined}
                aria-label={item.label}
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-full transition",
                  active
                    ? "bg-[var(--accent-soft)] text-[var(--accent)] ring-1 ring-[var(--accent-line)]"
                    : "text-[var(--dim)] hover:bg-[var(--card-2)] hover:text-[var(--text)]",
                ].join(" ")}
              >
                <Icon size={14} />
              </RailLink>
            </Tooltip>
          );
        })}
        <div className="mt-auto pt-2">
          <ThemeToggleRail />
        </div>
      </nav>

      <div
        className={[
          "absolute inset-0 flex h-full w-52 min-h-0 flex-col gap-4 p-3 pt-4 text-[13px] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          collapsed
            ? "pointer-events-none translate-x-4 opacity-0"
            : "translate-x-0 scale-100 opacity-100",
        ].join(" ")}
      >
        <div className="px-2 pb-2 pr-9">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--faint)]">
            {navigation.portfolio}
          </p>
          <p className="mt-1 flex items-center font-mono text-sm font-semibold text-[var(--text)]">
            <span className="text-[var(--accent)]">~/</span>
            <span className="truncate">{profile.name}</span>
            <span className="term-caret" />
          </p>
          <Tooltip
            content={navigation.collapseSidebar}
            placement="right"
            className="absolute right-3 top-3"
          >
            <button
              type="button"
              aria-label={navigation.collapseSidebar}
              onClick={onToggle}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card-2)] text-[var(--dim)] transition hover:border-[var(--faint)] hover:bg-[var(--card-2)] hover:text-[var(--text)]"
            >
              <ChevronsLeft size={15} />
            </button>
          </Tooltip>
        </div>

        {/* --- git-graph navigation: main trunk + commits + forked branch --- */}
        <nav
          ref={graphRef}
          aria-label={navigation.pagesLabel}
          className="min-h-0 overflow-y-auto overscroll-contain pb-1"
        >
          {/* branch-graph title */}
          <div className="mb-2 flex items-center gap-1.5 pl-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--faint)]">
            <GitBranch size={12} className="shrink-0" />
            <span>branches</span>
          </div>

          {sections.map((section, si) => {
            const Icon = section.icon;
            const active = isSectionActive(section);
            const isHead = pathname === section.href;
            const groups = section.groups ?? [];

            return (
              <div key={section.id}>
                {/* branch-tip commit on the trunk */}
                <Link
                  href={section.href}
                  className={[
                    "group relative flex h-9 min-w-0 items-center gap-2.5 rounded-md pl-7 pr-2 transition",
                    active
                      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "text-[var(--dim)] hover:bg-[var(--card-2)] hover:text-[var(--text)]",
                  ].join(" ")}
                >
                  <span data-graph="line"
                    className="pointer-events-none absolute left-[11px] w-px bg-[var(--accent)]"
                    style={{ top: si === 0 ? "50%" : 0, bottom: 0 }}
                  />
                  <span data-graph="node"
                    className={[
                      "pointer-events-none absolute left-[11px] top-1/2 z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--accent)] transition",
                      active
                        ? "bg-[var(--accent)]"
                        : "bg-[var(--surface)]",
                    ].join(" ")}
                  />
                  <Icon size={14} className="shrink-0" />
                  <span className="min-w-0 flex-1 truncate font-mono text-[13px]">
                    {section.label}
                  </span>
                  {isHead ? (
                    <span className="shrink-0 rounded-sm bg-[var(--accent-soft)] px-1 py-px font-mono text-[9px] font-bold tracking-wide text-[var(--accent)]">
                      HEAD
                    </span>
                  ) : null}
                </Link>

                {/* topic branches forked off main, each holding its project commits */}
                {groups.map((group, gi) => {
                  const lastGroup = gi === groups.length - 1;
                  const groupActive = group.children.some((child) =>
                    isActive(child.href),
                  );
                  return (
                    <div key={group.id} className="relative">
                      {/* branch tip: forks right off the main trunk */}
                      <div className="relative flex h-8 min-w-0 items-center pl-[46px] pr-2">
                        <span data-graph="line"
                          className="pointer-events-none absolute left-[11px] top-0 w-px bg-[var(--accent)]"
                          style={{ bottom: lastGroup ? "50%" : "0" }}
                        />
                        <span className="pointer-events-none absolute left-[11px] top-0 h-1/2 w-[17px] rounded-bl-[9px] border-b border-l border-[var(--c-cat)]" />
                        <span data-graph="line" className="pointer-events-none absolute left-[28px] top-1/2 bottom-0 w-px bg-[var(--c-cat)]" />
                        <span data-graph="node"
                          className={[
                            "pointer-events-none absolute left-[28px] top-1/2 z-10 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--c-cat)]",
                            groupActive ? "bg-[var(--c-cat)]" : "bg-[var(--surface)]",
                          ].join(" ")}
                        />
                        <GitBranch
                          size={12}
                          className="mr-1.5 shrink-0 text-[var(--c-cat)]"
                        />
                        <span
                          className={[
                            "min-w-0 flex-1 truncate text-[12px] font-semibold",
                            groupActive ? "text-[var(--c-cat)]" : "text-[var(--text)]",
                          ].join(" ")}
                        >
                          {group.label}
                        </span>
                      </div>
                      {group.children.map((child, ci) => {
                        const lastChild = ci === group.children.length - 1;
                        const cactive = isActive(child.href);
                        return (
                          <Link
                            key={child.id}
                            href={child.href}
                            aria-current={cactive ? "page" : undefined}
                            className={[
                              "group relative flex h-8 min-w-0 items-center rounded-md pl-[58px] pr-2 text-xs transition",
                              cactive
                                ? "bg-[var(--c-cat-soft)] font-medium text-[var(--c-cat)]"
                                : "text-[var(--dim)] hover:bg-[var(--card-2)] hover:text-[var(--text)]",
                            ].join(" ")}
                          >
                            {/* main trunk keeps going past this branch */}
                            {!lastGroup ? (
                              <span data-graph="line" className="pointer-events-none absolute inset-y-0 left-[11px] w-px bg-[var(--accent)]" />
                            ) : null}
                            {/* topic branch line */}
                            <span data-graph="line"
                              className="pointer-events-none absolute left-[28px] top-0 w-px bg-[var(--c-cat)]"
                              style={{ bottom: lastChild ? "50%" : "0" }}
                            />
                            <span className="pointer-events-none absolute left-[28px] top-1/2 h-px w-[16px] bg-[var(--c-cat)]" />
                            <span data-graph="node"
                              className={[
                                "pointer-events-none absolute left-[48px] top-1/2 z-10 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--c-cat)] transition",
                                cactive ? "bg-[var(--c-cat)]" : "bg-[var(--surface)]",
                              ].join(" ")}
                            />
                            <span className="min-w-0 flex-1 truncate text-[12.5px]">
                              {child.label}
                            </span>
                            {cactive ? (
                              <span className="shrink-0 rounded-sm bg-[var(--c-cat-soft)] px-1 py-px font-mono text-[9px] font-bold tracking-wide text-[var(--c-cat)]">
                                HEAD
                              </span>
                            ) : null}
                          </Link>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* origin remote ref + external commits */}
          <div className="mb-1 mt-3 flex items-center gap-1.5 pl-1.5 font-mono text-[11px] text-[var(--dim)]">
            <GitBranch size={12} className="shrink-0" />
            <span className="font-semibold">origin</span>
          </div>
          {links.map((link, li) => {
            const Icon = link.icon;
            const isExternal = link.href.startsWith("http");
            const last = li === links.length - 1;

            return (
              <a
                key={link.label}
                href={link.href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noreferrer" : undefined}
                className="group relative flex h-8 min-w-0 items-center justify-between gap-2 rounded-md pl-7 pr-2 text-[var(--dim)] transition hover:bg-[var(--card-2)] hover:text-[var(--text)]"
              >
                <span
                  className="pointer-events-none absolute left-[11px] top-0 w-px bg-[var(--border)]"
                  style={{ bottom: last ? "50%" : "0" }}
                />
                <span className="pointer-events-none absolute left-[11px] top-1/2 z-10 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--faint)] bg-[var(--surface)] transition group-hover:border-[var(--accent)]" />
                <span className="flex min-w-0 items-center gap-2">
                  <Icon size={14} className="shrink-0" />
                  <span className="truncate">{link.label}</span>
                </span>
                {isExternal ? <ArrowUpRight size={13} className="shrink-0" /> : null}
              </a>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-[var(--border-soft)] pt-3">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
