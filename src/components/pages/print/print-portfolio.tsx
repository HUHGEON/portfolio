"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import {
  ARCH_SPECS,
  ArchitectureDiagram,
} from "@/components/pages/project-detail/ArchitectureDiagram";
import {
  ARCH_BOX_W,
  archFrameHeight,
} from "@/components/pages/project-detail/arch-dimensions";
import {
  HEO_PROJECT_DETAILS,
  type HeoProjectDetail,
} from "@/components/pages/project-detail/definitions/heogeon-detail";
import {
  emphasize,
  groupProjects,
  PROJECT_GROUPS,
  serviceLabel,
  StackList,
} from "@/components/pages/terminal/terminal-ui";
import type { Dictionary } from "@/i18n/dictionaries";
import { assetPath } from "@/lib/asset-path";
import type { Project } from "@/types/project";
import { useTheme } from "@/components/shell/theme-context";

/*
 * A4 summary edition of the portfolio for PDF submission (`npm run pdf`).
 * Light theme only, no site chrome or motion; every page is a fixed A4 sheet.
 * Content comes from the same data as the site, trimmed to the summary fields.
 */

const SITE = "https://huhgeon.github.io/portfolio";
// A4 at 96dpi minus the 12mm × 13mm sheet padding
const CONTENT_W = 696;

const typeLabel = (type: string) =>
  ({ "Team Project": "팀 프로젝트", "Personal Project": "개인 프로젝트" })[type] ??
  type.split(" · ")[0];

const groupLabel = (slug: string) =>
  PROJECT_GROUPS.find((group) => group.slugs.includes(slug))?.label ?? "";

function Sheet({ children, footer }: { children: ReactNode; footer: string }) {
  return (
    <section className="print-sheet">
      <div className="print-body">{children}</div>
      <p className="print-footer">
        <span>허건 · Backend Developer</span>
        <span>{footer}</span>
      </p>
    </section>
  );
}

function Heading({ children, note }: { children: ReactNode; note?: string }) {
  return (
    <h3 className="mb-2 flex items-baseline gap-2 border-b border-[var(--border)] pb-1 text-[13px] font-bold text-[var(--heading)]">
      {children}
      {note ? (
        <span className="text-[11px] font-normal text-[var(--faint)]">{note}</span>
      ) : null}
    </h3>
  );
}

function Bullets({ items, strong }: { items: string[]; strong?: boolean }) {
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-[11.5px] leading-[1.6]">
          <span className="mt-[7px] h-[3px] w-[3px] shrink-0 rounded-full bg-[var(--accent)]" />
          <span className={strong ? "text-[var(--text)]" : "text-[var(--dim)]"}>
            {emphasize(item)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Arch({ diagramKey }: { diagramKey: string }) {
  const spec = ARCH_SPECS[diagramKey];
  if (!spec) return null;
  const scale = CONTENT_W / ARCH_BOX_W;
  const frameH = archFrameHeight(spec.width ?? 1600, spec.height ?? 980);
  return (
    // `contain: strict` keeps the 1340px design box out of the print layout width;
    // otherwise Chrome shrinks the whole sheet to fit it
    <div
      className="avoid-break overflow-hidden"
      style={{ width: CONTENT_W, height: frameH * scale, contain: "strict" }}
    >
      <div
        style={{
          width: ARCH_BOX_W,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <ArchitectureDiagram spec={spec} />
      </div>
    </div>
  );
}

function ProjectHeader({
  index,
  total,
  project,
  d,
}: {
  index: number;
  total: number;
  project: Project;
  d: HeoProjectDetail;
}) {
  const page = `${SITE}/projects/${project.slug}/`;
  return (
    <header className="mb-3">
      <p className="flex items-center gap-2 font-mono text-[10.5px] text-[var(--faint)]">
        <span className="font-semibold text-[var(--accent)]">
          {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <span className="font-sans">{groupLabel(project.slug)}</span>
      </p>
      <div className="mt-1 flex items-baseline gap-3">
        <h2 className="text-[22px] font-extrabold tracking-tight text-[var(--heading)]">
          {project.title}
        </h2>
        {d.award ? (
          <span className="ml-auto whitespace-nowrap text-[11.5px] font-semibold text-[var(--hue-amber)]">
            ★ {d.award}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-[11.5px] text-[var(--dim)]">
        {[d.role, d.period, typeLabel(project.type)].filter(Boolean).join(" · ")}
      </p>
      <p className="mt-2 text-[13.5px] font-semibold leading-snug text-[var(--heading)]">
        {d.hook}
      </p>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <StackList items={project.stack} className="!text-[10.5px]" />
        <p className="flex gap-3 text-[10.5px]">
          {project.href ? (
            <a href={project.href} className="text-[var(--accent)]">
              {project.href.replace("https://", "")}
            </a>
          ) : d.repoNote ? (
            <span className="text-[var(--faint)]">{d.repoNote}</span>
          ) : null}
          <a href={page} className="text-[var(--accent)]">
            {d.demo ? "상세 · 시연 영상" : "상세 페이지"} ↗
          </a>
        </p>
      </div>
    </header>
  );
}

function DemoStrip({ d, slug }: { d: HeoProjectDetail; slug: string }) {
  if (!d.demo) return null;
  const portrait = d.demo.height > d.demo.width;
  return (
    <a
      href={`${SITE}/projects/${slug}/#demo`}
      className="avoid-break flex items-center gap-3 rounded-md border border-[var(--border)] p-2"
    >
      <Image
        src={assetPath(d.demo.poster)}
        alt=""
        width={d.demo.width}
        height={d.demo.height}
        unoptimized
        loading="eager"
        className={`shrink-0 rounded border border-[var(--border)] object-cover ${portrait ? "h-[64px] w-[36px]" : "h-[54px] w-[96px]"}`}
      />
      <div className="min-w-0">
        <p className="text-[11.5px] font-semibold text-[var(--text)]">
          시연 영상 · {d.demo.title.replace(/\s*\(.*\)$/, "")}
        </p>
        <p className="mt-0.5 text-[10.5px] leading-snug text-[var(--dim)]">
          {d.demo.steps?.map((step) => step.say.replace(/[“”]/g, "")).join(" → ")}
        </p>
        <p className="mt-0.5 text-[10px] text-[var(--accent)]">
          {SITE.replace("https://", "")}/projects/{slug}/
        </p>
      </div>
    </a>
  );
}

/* ─────────────── page 1: profile ─────────────── */

function ProfileSheet({
  dictionary,
  featured,
}: {
  dictionary: Dictionary;
  featured: Project[];
}) {
  const { profile, home, about, skills, projects } = dictionary;
  const awards = projects.flatMap((p) => {
    const award = HEO_PROJECT_DETAILS[p.slug]?.award;
    return award ? [{ award, project: p.title }] : [];
  });
  return (
    <Sheet footer="1">
      <div className="flex items-start gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-[32px] font-extrabold leading-none tracking-tight text-[var(--heading)]">
            {home.profileCard.koreanName}{" "}
            <span className="text-[var(--accent)]">{home.profileCard.englishName}</span>
          </p>
          <p className="mt-2 text-[13px] font-medium text-[var(--dim)]">
            Backend Developer · 백엔드 개발자
          </p>
          <p className="mt-4 text-[18px] font-bold leading-snug text-[var(--heading)]">
            {home.title}
          </p>
          <div className="mt-3 space-y-1.5">
            {about.paragraphs.map((p) => (
              <p key={p} className="text-[12px] leading-[1.7] text-[var(--dim)]">
                {p}
              </p>
            ))}
          </div>
        </div>
        <Image
          src={assetPath("/profile.jpg")}
          alt="허건 프로필 사진"
          width={348}
          height={460}
          unoptimized
          loading="eager"
          className="h-[140px] w-[106px] shrink-0 rounded-xl object-cover ring-1 ring-[var(--border)]"
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <Heading>학력 · 경력</Heading>
          <ul className="space-y-1 text-[12px]">
            {home.profileCard.experiences.map((exp) => (
              <li key={exp.title} className="flex gap-2">
                <span className="font-semibold text-[var(--text)]">{exp.title}</span>
                <span className="text-[var(--dim)]">{exp.detail}</span>
                <span className="ml-auto text-[var(--faint)]">{exp.period}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <Heading>수상</Heading>
          <ul className="space-y-1 text-[12px]">
            {awards.map((a) => (
              <li key={a.award} className="flex gap-2">
                <span className="text-[var(--hue-amber)]">★</span>
                <span className="font-semibold text-[var(--text)]">{a.award}</span>
                <span className="text-[var(--faint)]">· {a.project}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <Heading>기술 스택</Heading>
          <div className="space-y-1">
            {skills.groups.map((group) => (
              <div key={group.title} className="flex items-baseline gap-2">
                <span className="w-[62px] shrink-0 font-mono text-[10.5px] text-[var(--faint)]">
                  {group.title}
                </span>
                <StackList items={group.items} className="!text-[11px]" />
              </div>
            ))}
          </div>
        </div>
        <div>
          <Heading>연락처</Heading>
          <ul className="space-y-1 text-[12px]">
            <li>
              <span className="inline-block w-[62px] text-[var(--faint)]">Email</span>
              <a href={`mailto:${profile.email}`} className="text-[var(--accent)]">
                {profile.email}
              </a>
            </li>
            <li>
              <span className="inline-block w-[62px] text-[var(--faint)]">GitHub</span>
              <a href={profile.links.github} className="text-[var(--accent)]">
                {profile.links.github.replace("https://", "")}
              </a>
            </li>
            <li>
              <span className="inline-block w-[62px] text-[var(--faint)]">Blog</span>
              <a href={profile.links.blog} className="text-[var(--accent)]">
                {profile.links.blog.replace("https://", "")}
              </a>
            </li>
            <li>
              <span className="inline-block w-[62px] text-[var(--faint)]">
                Portfolio
              </span>
              <a href={`${SITE}/`} className="text-[var(--accent)]">
                {SITE.replace("https://", "")}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-5">
        <Heading>할 수 있는 것</Heading>
        <ul className="space-y-1.5">
          {home.proficiency.map((item) => (
            <li key={item.text} className="flex gap-3 text-[11.5px] leading-[1.6]">
              <span className="flex-1 text-[var(--dim)]">{emphasize(item.text)}</span>
              <span className="w-[150px] shrink-0 text-right text-[10.5px] text-[var(--faint)]">
                {item.projects.map((slug) => serviceLabel(slug, slug)).join(" · ")}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5">
        <Heading>프로젝트</Heading>
        <ol className="space-y-2">
          {featured.map((project, i) => {
            const card = home.featuredProjects.find((f) => f.slug === project.slug);
            return (
              <li key={project.slug} className="flex gap-3">
                <span className="w-5 shrink-0 font-mono text-[11px] font-semibold text-[var(--accent)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-baseline gap-2">
                    <span className="text-[12.5px] font-bold text-[var(--heading)]">
                      {project.title}
                    </span>
                    <span className="text-[10.5px] text-[var(--faint)]">
                      {groupLabel(project.slug)}
                    </span>
                  </p>
                  {card?.highlights[0] ? (
                    <p className="text-[11px] leading-[1.55] text-[var(--dim)]">
                      {emphasize(card.highlights[0])}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </Sheet>
  );
}

/* ─────────────── coupon-yaho: three sheets (metrics · cases · versions) ─────────────── */

function CouponSheets({
  project,
  d,
  index,
  total,
  startPage,
}: {
  project: Project;
  d: HeoProjectDetail;
  index: number;
  total: number;
  startPage: number;
}) {
  return (
    <>
      <Sheet footer={String(startPage)}>
        <ProjectHeader index={index} total={total} project={project} d={d} />
        {d.metrics ? (
          <dl className="mb-3 grid grid-cols-4 gap-2">
            {d.metrics.map((m) => (
              <div
                key={m.label}
                className="rounded-md border border-[var(--border)] px-2.5 py-2"
              >
                <dt className="text-[10.5px] text-[var(--faint)]">{m.label}</dt>
                <dd className="mt-0.5 font-mono text-[15px] font-bold text-[var(--heading)]">
                  {m.value}
                </dd>
                {m.note ? (
                  <dd className="mt-0.5 text-[9.5px] leading-snug text-[var(--dim)]">
                    {m.note}
                  </dd>
                ) : null}
              </div>
            ))}
          </dl>
        ) : null}
        <p className="mb-3 text-[11.5px] leading-[1.65] text-[var(--dim)]">
          {d.description}
        </p>
        {d.diagramKey ? <Arch diagramKey={d.diagramKey} /> : null}
        <div className="mt-3 grid grid-cols-2 gap-5">
          <div>
            <Heading>동작 흐름</Heading>
            <Bullets items={d.architecture.steps} />
          </div>
          <div>
            <Heading>주요 기능</Heading>
            <ul className="space-y-1">
              {d.features?.map((f) => (
                <li key={f.title} className="text-[11.5px] leading-[1.6]">
                  <span className="font-semibold text-[var(--text)]">{f.title}</span>{" "}
                  <span className="text-[var(--dim)]">{emphasize(f.desc)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-3">
          <DemoStrip d={d} slug={project.slug} />
        </div>
      </Sheet>

      <Sheet footer={String(startPage + 1)}>
        <p className="mb-3 text-[10.5px] text-[var(--faint)]">
          {project.title} · 문제 해결 사례
        </p>
        <ol className="space-y-3">
          {d.cases?.map((c, ci) => (
            <li
              key={c.title}
              className="avoid-break rounded-md border border-[var(--border)] p-3"
            >
              <p className="font-mono text-[10.5px] font-semibold text-[var(--accent)]">
                사례 {ci + 1}
              </p>
              <p className="mt-0.5 text-[13px] font-bold leading-snug text-[var(--heading)]">
                {c.title}
              </p>
              <div className="mt-2 grid grid-cols-[64px_1fr] gap-x-2 gap-y-1.5">
                {(
                  [
                    ["문제 원인", c.causes],
                    ["해결 과정", c.solutions],
                    ["결과", c.results],
                  ] as const
                ).map(([label, items]) => (
                  <div key={label} className="contents">
                    <p className="pt-[1px] text-[10.5px] font-semibold text-[var(--faint)]">
                      {label}
                    </p>
                    <Bullets items={[...items]} strong={label === "결과"} />
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </Sheet>

      <Sheet footer={String(startPage + 2)}>
        <p className="mb-3 text-[10.5px] text-[var(--faint)]">
          {project.title} · 버전별 발전 과정 · 측정 결과
        </p>
        <table className="w-full border-collapse text-[10.5px] leading-[1.5]">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-[var(--faint)]">
              <th className="w-[92px] py-1 pr-2 font-semibold">버전</th>
              <th className="py-1 pr-2 font-semibold">선택 이유</th>
              <th className="py-1 pr-2 font-semibold">트레이드오프</th>
              <th className="w-[150px] py-1 font-semibold">수치</th>
            </tr>
          </thead>
          <tbody>
            {d.versions?.map((v) => (
              <tr
                key={v.version}
                className="avoid-break border-b border-[var(--border-soft)] align-top"
              >
                <td className="py-1.5 pr-2">
                  <p className="font-mono font-bold text-[var(--accent)]">
                    {v.version}
                  </p>
                  <p className="font-semibold text-[var(--text)]">{v.title}</p>
                  <p className="text-[9.5px] text-[var(--faint)]">{v.status}</p>
                </td>
                <td className="py-1.5 pr-2 text-[var(--dim)]">
                  <p className="text-[var(--text)]">{v.problem}</p>
                  <p className="mt-1">{v.choice}</p>
                </td>
                <td className="py-1.5 pr-2 text-[var(--dim)]">
                  {v.tradeoff}
                  {v.next ? (
                    <p className="mt-1 text-[var(--faint)]">→ {v.next}</p>
                  ) : null}
                </td>
                <td className="py-1.5 text-[10px] tabular-nums text-[var(--text)]">
                  {emphasize(v.metric ?? "")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {d.benchmark ? (
          <div className="avoid-break mt-5">
            <Heading note="ms">잠금 방식별 부하 측정</Heading>
            <p className="mb-2 text-[10.5px] leading-[1.6] text-[var(--dim)]">
              {d.benchmark.caption}
            </p>
            <table className="w-full border-collapse text-[10.5px] tabular-nums">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--faint)]">
                  {d.benchmark.headers.map((h, hi) => (
                    <th
                      key={h}
                      className={`py-1 font-semibold ${hi < 2 ? "text-left" : "text-right"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.benchmark.rows.map((row, ri) => (
                  <tr
                    key={ri}
                    className={`border-b border-[var(--border-soft)] ${row.highlight ? "bg-[var(--accent-soft)] font-semibold text-[var(--heading)]" : "text-[var(--dim)]"}`}
                  >
                    {row.cells.map((cell, ci) => (
                      <td
                        key={ci}
                        className={`px-1 py-1 ${ci < 2 ? "text-left" : "text-right"}`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {d.benchmark.footnote ? (
              <p className="mt-2 text-[9.5px] leading-[1.6] text-[var(--faint)]">
                {d.benchmark.footnote}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="avoid-break mt-5">
          <Heading>배운 점</Heading>
          <p className="text-[11.5px] leading-[1.7] text-[var(--dim)]">{d.lessons}</p>
        </div>
      </Sheet>
    </>
  );
}

/* ─────────────── other projects: one sheet each ─────────────── */

function ProjectSheet({
  project,
  d,
  index,
  total,
  page,
}: {
  project: Project;
  d: HeoProjectDetail;
  index: number;
  total: number;
  page: number;
}) {
  return (
    <Sheet footer={String(page)}>
      <ProjectHeader index={index} total={total} project={project} d={d} />
      {d.diagramKey ? <Arch diagramKey={d.diagramKey} /> : null}

      {d.works ? (
        <div className="mt-3 space-y-3">
          <div>
            <Heading>사내 실무 · 기술 중심</Heading>
            <ul className="space-y-2">
              {d.works.map((w) => (
                <li key={w.title}>
                  <p className="text-[12px] font-semibold text-[var(--text)]">
                    {w.title}
                  </p>
                  <p className="text-[11.5px] leading-[1.6] text-[var(--dim)]">
                    {w.desc}
                  </p>
                  <StackList items={w.stack} className="!text-[10px]" />
                </li>
              ))}
            </ul>
          </div>
          {d.qa ? (
            <div>
              <Heading>테스트 · QA</Heading>
              <Bullets
                items={d.qa.split("\n").map((line) => line.replace(/^- /, ""))}
              />
            </div>
          ) : null}
          <p className="text-[10px] text-[var(--faint)]">
            ※ 도메인·세부 기능·정량 성과는 대외비로, 사용 기술과 구조만 기재.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-2 gap-5">
            <div>
              <Heading>{d.problemTitle === "문제" ? "문제" : d.problemTitle}</Heading>
              <Bullets items={d.problems} />
              <div className="mt-3">
                <Heading>결과</Heading>
                <Bullets items={d.results} strong />
              </div>
            </div>
            <div>
              <Heading>해결</Heading>
              <Bullets items={d.solutions} />
            </div>
          </div>
          <div className="mt-3">
            <DemoStrip d={d} slug={project.slug} />
          </div>
        </>
      )}
    </Sheet>
  );
}

export function PrintPortfolio({ dictionary }: { dictionary: Dictionary }) {
  const featured = groupProjects(dictionary.home.featuredProjects)
    .flatMap((group) => group.items)
    .map((card) => dictionary.projects.find((p) => p.slug === card.slug))
    .filter((p): p is Project => Boolean(p));

  const { theme } = useTheme();

  // page 1 is the profile; coupon-yaho (the only project with cases) takes three sheets
  const startPages = featured.reduce<number[]>((acc, _project, i) => {
    const prev =
      i === 0
        ? 2
        : acc[i - 1] + (HEO_PROJECT_DETAILS[featured[i - 1].slug]?.cases ? 3 : 1);
    return [...acc, prev];
  }, []);

  return (
    // data-ready once hydrated into the light theme; the export script waits for it
    <div className="print-root" data-ready={theme === "light" ? "" : undefined}>
      <ProfileSheet dictionary={dictionary} featured={featured} />
      {featured.map((project, i) => {
        const d = HEO_PROJECT_DETAILS[project.slug];
        if (!d) return null;
        return d.cases ? (
          <CouponSheets
            key={project.slug}
            project={project}
            d={d}
            index={i + 1}
            total={featured.length}
            startPage={startPages[i]}
          />
        ) : (
          <ProjectSheet
            key={project.slug}
            project={project}
            d={d}
            index={i + 1}
            total={featured.length}
            page={startPages[i]}
          />
        );
      })}
    </div>
  );
}
