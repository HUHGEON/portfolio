import type {
  CanvasEdge,
  CanvasNode,
  CanvasNodeSide,
} from "@/components/canvas/workflow-canvas";
import { archFrameHeightForKey } from "@/components/pages/project-detail/arch-dimensions";
import type { Project } from "@/types/project";
import type { ProjectDetailCanvasDefinition } from "./types";

type ArchNode = {
  id: string;
  label: string;
  sub?: string;
  icon?: string; // filename under /icons/tech, without path
  emphasis?: boolean; // key node -> accent-tinted (mention) card
  col: number; // grid column (0..)
  row: number; // grid row (0..)
};

type ArchEdge = {
  from: string;
  to: string;
  bi?: boolean; // bidirectional
};

type Architecture = {
  nodes: ArchNode[];
  edges: ArchEdge[];
  steps: string[]; // friendly numbered walk-through
};

type TechChoice = {
  name: string;
  reason: string;
};

export type HeoProjectDetail = {
  logo?: string;
  hook: string;
  description: string;
  role: string;
  period?: string; // 본인 커밋 기준 기간 (진행 중 포함)
  evidence?: { label: string; href: string }[]; // 주장 옆 공개 근거 링크
  demo?: { title: string; gif: string; width: number; height: number; youtubeId: string }; // 시연 GIF + 원본 영상
  award?: string;
  repoNote?: string;
  diagramKey?: string; // when set, render the rich ArchitectureDiagram instead of the grid
  works?: { title: string; desc: string; stack: string[] }[]; // résumé-style experience page
  qa?: string;
  goals?: string[]; // 프로젝트 목표
  features?: { emoji?: string; title: string; desc: string }[]; // 주요 기능 카드 그리드
  metrics?: { value: string; label: string; note?: string }[]; // 핵심 수치 (hero)
  cases?: {
    title: string; // 이력서에 옮길 한 줄
    causes: string[]; // 문제 원인
    solutions: string[]; // 해결 과정
    checks?: string[]; // 검증
    results: string[]; // 결과
  }[]; // 문제 해결 사례
  versions?: {
    version: string;
    title: string;
    status: string; // 구현 · 실험 · 설계
    problem: string;
    choice: string; // 이 방식을 고른 이유
    tradeoff: string;
    metric?: string;
    next?: string; // 다음 버전으로 넘어간 이유
  }[]; // 버전별 발전 과정
  benchmark?: {
    caption: string;
    headers: string[];
    rows: { cells: string[]; highlight?: boolean }[];
    bar?: { column: number; max: number; threshold: number; label: string }; // inline magnitude bar
    footnote?: string;
  }; // 측정 결과 표
  architecture: Architecture;
  problemTitle: string;
  problems: string[];
  solutions: string[];
  progressTitle?: string;
  progress?: string[];
  results: string[];
  lessons: string;
  techChoices: TechChoice[];
};

const TECH_ICON: Record<string, string> = {
  fastapi: "fastapi",
  nodejs: "nodejs",
  openai: "openai",
  ollama: "ollama",
  mongodb: "mongodb",
  redis: "redis",
  database: "database",
};

const CIRCLED = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨"];

// architecture grid geometry (percent of the 2000x1400 base canvas)
const ARCH_X0 = 13;
const ARCH_Y0 = 36;
const ARCH_COL = 14.5;
const ARCH_ROW = 13;
const ARCH_W = 12.5;

// ---- unified layout widths / columns (percent of the 2000-wide base) ----
// Common, repeated components share one size so the page reads as a system.
const W_PROSE = 84; // intro summary (kept wide for a paragraph)
const W_LIST = 78; // bulleted lists (동작 흐름 / 목표)
const W_INFO = 44; // compact meta card (역할 · 스택 · 링크)
const HALF_W = 41; // any 2-column body block
const COL_L = 13; // left column x
const COL_R = 56; // right column x

function chips(items: string[]) {
  return items.map((item) => `\`${item}\``).join(" ");
}

// Estimate a 2-column (HALF_W) body's rendered height as a % of the 1400 base,
// from its bullet text. Korean glyphs render wider than Latin/digits/symbols,
// so a Korean-heavy column (해결 과정 6개 등) is taller than its raw char count
// suggests — weight accordingly so it never collides with the next section.
function colHeightPct(items: string[]): number {
  const units = items.reduce((sum, item) => {
    let w = 0;
    for (const ch of item) w += /[가-힣]/.test(ch) ? 1 : 0.45;
    return sum + w;
  }, 0);
  return units * 0.056;
}

function archSides(a: ArchNode, b: ArchNode): [CanvasNodeSide, CanvasNodeSide] {
  if (a.row === b.row) return a.col <= b.col ? ["right", "left"] : ["left", "right"];
  return b.row > a.row ? ["bottom", "top"] : ["top", "bottom"];
}

export function buildHeoProjectDetail(
  project: Project,
  detail: HeoProjectDetail,
): ProjectDetailCanvasDefinition {
  const nodes: CanvasNode[] = [];
  const edges: CanvasEdge[] = [];

  // --- summary (boxed) then info (boxed) stacked below ---
  nodes.push({
    id: "summary",
    kind: "note",
    appearance: "default",
    order: 1,
    x: COL_L,
    y: 6,
    width: W_PROSE,
    markdown: [
      `# ${project.title}`,
      "",
      `**${detail.hook}**`,
      "",
      detail.description,
    ].join("\n"),
  });

  // --- info card ---
  const infoLines: string[] = [`- :company: ${detail.role}`];
  if (detail.award) infoLines.push(`- :package: ${detail.award}`);
  infoLines.push(`- :stack: ${chips(project.stack)}`);
  if (project.href) {
    infoLines.push(
      `- :github: [GitHub|${project.title} 저장소로 이동](${project.href})`,
    );
  } else if (detail.repoNote) {
    infoLines.push(`- :github: ${detail.repoNote}`);
  }
  nodes.push({
    id: "info",
    kind: "note",
    order: 2,
    x: COL_L,
    y: 18.5,
    width: W_INFO,
    markdown: infoLines.join("\n"),
  });

  // --- résumé-style experience page (optional arch diagram + work cards + QA) ---
  if (detail.works) {
    let worksY = 35;
    if (detail.diagramKey) {
      nodes.push({
        id: "arch-title",
        kind: "note",
        appearance: "transparent",
        order: 3,
        x: 13,
        y: 30,
        width: 60,
        markdown: "# 인턴 아키텍처 · 서버 통신",
      });
      nodes.push({
        id: "arch-diagram",
        kind: "note",
        appearance: "transparent",
        excludeFromSequence: true,
        order: 4,
        x: 13,
        y: 35,
        width: 67,
        diagramKey: detail.diagramKey,
        markdown: "",
      });
      nodes.push({
        id: "exp-title",
        kind: "note",
        appearance: "transparent",
        order: 5,
        x: 13,
        y: 93,
        width: 60,
        markdown: "# 사내 실무 · 기술 중심",
      });
      worksY = 98;
    } else {
      nodes.push({
        id: "exp-title",
        kind: "note",
        appearance: "transparent",
        order: 3,
        x: 13,
        y: 30,
        width: 60,
        markdown: "# 사내 실무 · 기술 중심",
      });
    }
    // 2-column grid: work cards + QA card flow as 2 per row (2 + 2)
    const cw = HALF_W;
    const colX = [COL_L, COL_R];
    const rowH = 21;
    detail.works.forEach((w, i) => {
      nodes.push({
        id: `work-${i}`,
        kind: "note",
        appearance: "default",
        order: 6 + i,
        x: colX[i % 2],
        y: worksY + Math.floor(i / 2) * rowH,
        width: cw,
        markdown: `## ${w.title}\n\n${w.desc}\n\n${chips(w.stack)}`,
      });
    });
    if (detail.qa) {
      const i = detail.works.length;
      nodes.push({
        id: "qa",
        kind: "mention",
        order: 6 + detail.works.length,
        x: colX[i % 2],
        y: worksY + Math.floor(i / 2) * rowH,
        width: cw,
        markdown: `## QA · 테스트\n\n${detail.qa}`,
      });
    }
    return { nodes, edges };
  }

  // --- architecture: title + 2D topology + edges ---
  nodes.push({
    id: "architecture-title",
    kind: "note",
    appearance: "transparent",
    order: 3,
    x: 13,
    y: 30,
    width: 40,
    markdown: "# Architecture",
  });

  let afterFlowY: number;

  if (detail.diagramKey) {
    // rich zone-grouped diagram — frame hugs the content, so place the flow
    // node right below the (per-diagram) frame height.
    const archFrameH = archFrameHeightForKey(detail.diagramKey);
    const archHeightPct = (archFrameH / 1400) * 100;
    nodes.push({
      id: "arch-diagram",
      kind: "note",
      appearance: "transparent",
      excludeFromSequence: true,
      order: 4,
      x: 13,
      y: 35,
      width: 67,
      height: archFrameH,
      diagramKey: detail.diagramKey,
      markdown: "",
    });
    const flowY = 35 + archHeightPct + 3;
    nodes.push({
      id: "flow",
      kind: "note",
      excludeFromSequence: true,
      order: 5,
      x: COL_L,
      y: flowY,
      width: W_LIST,
      markdown: [
        "## 동작 흐름",
        ...detail.architecture.steps.map((step, i) => `- ${CIRCLED[i] ?? "-"} ${step}`),
      ].join("\n"),
    });
    afterFlowY = flowY + 11 + detail.architecture.steps.length * 2.3;
  } else {
    const archById = new Map(detail.architecture.nodes.map((n) => [n.id, n]));
    let maxRow = 0;
    detail.architecture.nodes.forEach((node) => {
      maxRow = Math.max(maxRow, node.row);
      const iconName = node.icon ? (TECH_ICON[node.icon] ?? node.icon) : undefined;
      nodes.push({
        id: `arch-${node.id}`,
        kind: node.emphasis ? "mention" : "note",
        appearance: "default",
        excludeFromSequence: true,
        ...(iconName
          ? { icon: { src: `/icons/tech/${iconName}.svg`, alt: node.label } }
          : {}),
        x: ARCH_X0 + node.col * ARCH_COL,
        y: ARCH_Y0 + node.row * ARCH_ROW,
        width: ARCH_W,
        height: 78,
        markdown: node.sub ? `**${node.label}**\n\n${node.sub}` : `**${node.label}**`,
      });
    });
    detail.architecture.edges.forEach((edge, i) => {
      const a = archById.get(edge.from);
      const b = archById.get(edge.to);
      if (!a || !b) return;
      const [fromSide, toSide] = archSides(a, b);
      edges.push({
        id: `arch-edge-${i}`,
        from: { nodeId: `arch-${edge.from}`, side: fromSide },
        to: { nodeId: `arch-${edge.to}`, side: toSide },
        directed: !edge.bi,
        bidirectional: edge.bi,
      });
    });

    const flowY = ARCH_Y0 + (maxRow + 1) * ARCH_ROW + 3;
    nodes.push({
      id: "flow",
      kind: "note",
      excludeFromSequence: true,
      order: 4,
      x: COL_L,
      y: flowY,
      width: W_LIST,
      markdown: [
        "## 동작 흐름",
        ...detail.architecture.steps.map((step, i) => `- ${CIRCLED[i] ?? "-"} ${step}`),
      ].join("\n"),
    });
    afterFlowY = flowY + 6 + detail.architecture.steps.length * 2.3;
  }

  // running order + vertical cursor for every section below the architecture
  let ord = 5;
  let sectionY = afterFlowY;

  // --- goals (optional) ---
  if (detail.goals && detail.goals.length > 0) {
    nodes.push({
      id: "goals-title",
      kind: "note",
      appearance: "transparent",
      order: ord++,
      x: 13,
      y: sectionY,
      width: 40,
      markdown: "# 프로젝트 목표",
    });
    nodes.push({
      id: "goals",
      kind: "mention",
      order: ord++,
      x: COL_L,
      y: sectionY + 4,
      width: W_LIST,
      markdown: detail.goals.map((item) => `- ${item}`).join("\n"),
    });
    sectionY += 5 + detail.goals.length * 2.4 + 2;
  }

  // --- key features grid (optional) — 3-up cards, replaces screenshot gallery ---
  if (detail.features && detail.features.length > 0) {
    nodes.push({
      id: "features-title",
      kind: "note",
      appearance: "transparent",
      order: ord++,
      x: 13,
      y: sectionY,
      width: 40,
      markdown: "# 주요 기능",
    });
    const perRow = 3;
    const fw = 27;
    const fstep = fw + 2.5;
    const rowH = 9;
    detail.features.forEach((feature, index) => {
      const col = index % perRow;
      const row = Math.floor(index / perRow);
      const glyph = feature.emoji ? `${feature.emoji} ` : "";
      nodes.push({
        id: `feature-${index}`,
        kind: "note",
        appearance: "feature",
        excludeFromSequence: true,
        x: 13 + col * fstep,
        y: sectionY + 5 + row * rowH,
        width: fw,
        markdown: `## ${glyph}${feature.title}\n\n${feature.desc}`,
      });
    });
    sectionY += 4 + Math.ceil(detail.features.length / perRow) * rowH + 2;
  }

  const problemY = sectionY;

  // --- problem / solution (2 columns) ---
  nodes.push({
    id: "problem-title",
    kind: "note",
    appearance: "transparent",
    order: ord++,
    x: 13,
    y: problemY,
    width: 40,
    markdown: `# ${detail.problemTitle}`,
  });
  nodes.push({
    id: "problem",
    kind: "note",
    order: ord++,
    x: COL_L,
    y: problemY + 4,
    width: HALF_W,
    markdown: detail.problems.map((item) => `- ${item}`).join("\n"),
  });

  nodes.push({
    id: "solution-title",
    kind: "note",
    appearance: "transparent",
    order: ord++,
    x: COL_R,
    y: problemY,
    width: 40,
    markdown: "# 해결 과정",
  });
  const solutionMarkdown = detail.solutions.map((item) => `- ${item}`);
  if (detail.progress && detail.progress.length > 0) {
    solutionMarkdown.push("");
    solutionMarkdown.push(`### ${detail.progressTitle ?? "현재 진행"}`);
    solutionMarkdown.push(...detail.progress.map((item) => `- ${item}`));
  }
  nodes.push({
    id: "solution",
    kind: "note",
    order: ord++,
    x: COL_R,
    y: problemY + 4,
    width: HALF_W,
    markdown: solutionMarkdown.join("\n"),
  });

  // Place the result/lessons row below the taller of the two columns, using a
  // content-aware height estimate + a comfortable gap (never cramped).
  const solutionEst =
    colHeightPct(detail.solutions) +
    (detail.progress && detail.progress.length > 0
      ? colHeightPct(detail.progress) + 3
      : 0);
  const resultY =
    problemY + 4 + Math.max(colHeightPct(detail.problems), solutionEst) + 5.5;

  // --- result / lessons (2 columns) ---
  nodes.push({
    id: "result-title",
    kind: "note",
    appearance: "transparent",
    order: ord++,
    x: 13,
    y: resultY,
    width: 40,
    markdown: "# 결과",
  });
  nodes.push({
    id: "result",
    kind: "mention",
    order: ord++,
    x: COL_L,
    y: resultY + 4,
    width: HALF_W,
    markdown: detail.results.map((item) => `- ${item}`).join("\n"),
  });

  nodes.push({
    id: "lessons-title",
    kind: "note",
    appearance: "transparent",
    order: ord++,
    x: COL_R,
    y: resultY,
    width: 40,
    markdown: "# 배운 점",
  });
  nodes.push({
    id: "lessons",
    kind: "note",
    order: ord++,
    x: COL_R,
    y: resultY + 4,
    width: HALF_W,
    markdown: detail.lessons,
  });

  const techY = resultY + 15;

  // --- tech choices ---
  nodes.push({
    id: "tech-title",
    kind: "note",
    appearance: "transparent",
    order: ord++,
    x: 13,
    y: techY,
    width: 40,
    markdown: "# 기술 선택 이유",
  });
  detail.techChoices.forEach((choice, index) => {
    nodes.push({
      id: `tech-${index}`,
      kind: "note",
      appearance: "feature",
      order: ord++,
      x: index % 2 === 0 ? COL_L : COL_R,
      y: techY + 4 + Math.floor(index / 2) * 12,
      width: HALF_W,
      markdown: `## ${choice.name}\n\n${choice.reason}`,
    });
  });

  return { nodes, edges };
}

// ------------------------------------------------------------------
// Per-project content — 실제 GitHub 저장소 코드를 근거로 작성 (허위 없음)
// ------------------------------------------------------------------

export const HEO_PROJECT_DETAILS: Record<string, HeoProjectDetail> = {
  "voice-kiosk": {
    logo: "/logos/voice-kiosk.png",
    diagramKey: "voice-kiosk",
    hook: "자유발화 한 문장을 여러 실행으로 나눠 처리하는 음성 주문 백엔드입니다.",
    description:
      "음성·터치로 메뉴 주문·추천을 처리하는 키오스크 서비스입니다. NLP 서버가 STT 텍스트를 LLM으로 의도(intents)·필터로 해석하고, 오케스트레이터로서 API 서버를 호출해 그\u00A0응답을 클라이언트에 돌려주는 2단 백엔드 구조입니다. 저는 NLP 서버를 맡았고, API 서버(추천·주문·장바구니·Swagger)는 팀원이 구현했습니다.",
    role: "NLP 서버 설계·주도 · API 연동",
    period: "2025.03 ~ 2025.06",
    demo: { title: "음성인식 키오스크 시연 — 음성 주문 → 옵션 → 장바구니 → 결제 (4배속)", gif: "/demos/voice-kiosk.gif", width: 300, height: 536, youtubeId: "QMuGDGB1Jsw" },
    evidence: [
      { label: "NLP 서버 의도 해석 코드", href: "https://github.com/Say-It-It-s-OK/nlp/blob/main/app/services/openai_client.py" },
      { label: "NLP 서버 README", href: "https://github.com/Say-It-It-s-OK/nlp/blob/main/README.md" },
    ],
    award: "명지대 캡스톤디자인 금상",
    goals: [
      "자유발화 한 문장을 여러 실행으로 분할 처리하는 음성 주문 백엔드 구현",
      "LLM 출력을 intents·filters 스키마로 강제, 자연어를 안전하게 ‘실행’으로 변환",
      "멀티턴 대화 상태(pending·세션)를 서버가 책임 관리하는 구조 확립",
    ],
    features: [
      {
        emoji: "🎙️",
        title: "자유발화 의도 분석",
        desc: "한 문장 속 여러 요청을 intents 배열로 분리해 순차 실행",
      },
      {
        emoji: "🔁",
        title: "멀티턴 옵션 완성",
        desc: "온도·크기 등 필수 옵션 누락 시 pending 보관 후 후속 발화로 완성",
      },
      {
        emoji: "⭐",
        title: "개인화 추천 (팀 API 서버)",
        desc: "주문↔메뉴 aggregation 인기순 집계, 이미 추천한 항목 제외",
      },
      {
        emoji: "🛒",
        title: "주문·장바구니·결제 (팀 API 서버)",
        desc: "담기·수정·결제까지 한 발화 흐름으로 처리, Orders에 저장",
      },
      {
        emoji: "📄",
        title: "API 명세 자동화 (팀 API 서버)",
        desc: "menus·​query·​recommend·​order·​cart를 Swagger로 문서화해 연동 규격 공유",
      },
    ],
    architecture: {
      nodes: [
        { id: "user", label: "사용자", sub: "음성 · 터치", col: 0, row: 0 },
        {
          id: "client",
          label: "키오스크 클라이언트",
          sub: "STT · 화면(page)",
          col: 1,
          row: 0,
        },
        {
          id: "nlp",
          label: "NLP 서버 · FastAPI",
          sub: "오케스트레이터",
          icon: "fastapi",
          emphasis: true,
          col: 2,
          row: 0,
        },
        {
          id: "api",
          label: "API 서버 · Express",
          sub: "/api/handle 디스패처",
          icon: "nodejs",
          col: 3,
          row: 0,
        },
        {
          id: "mongo",
          label: "MongoDB",
          sub: "메뉴 / 주문",
          icon: "mongodb",
          col: 4,
          row: 0,
        },
        {
          id: "llm",
          label: "gpt-4o-mini",
          sub: "intents · filters JSON",
          icon: "openai",
          col: 2,
          row: 1,
        },
        {
          id: "session",
          label: "세션 · pending",
          sub: "장바구니 · 보류 주문",
          col: 3,
          row: 1,
        },
      ],
      edges: [
        { from: "user", to: "client" },
        { from: "client", to: "nlp" },
        { from: "nlp", to: "llm" },
        { from: "nlp", to: "api" },
        { from: "api", to: "session" },
        { from: "api", to: "mongo" },
      ],
      steps: [
        "음성·터치 요청 시 클라이언트가 STT 텍스트와 현재 화면(page)을 NLP 서버로 전송",
        "NLP 서버가 gpt-4o-mini로 요청을 의도(intents)·필터 JSON으로 해석(한 문장 속 여러 요청도 intents 배열로 추출)",
        "NLP 서버(오케스트레이터)가 intents를 query.sequence로 묶어 API 서버(/api/handle) 호출",
        "API 서버가 intents를 순차 실행(추천·주문·결제), 옵션 누락 시 pending으로 세션 보관 후 다음 발화로 완성",
        "메뉴·주문은 MongoDB에서 조회·저장, 결과(안내·화면·항목)는 NLP 서버가 클라이언트로 반환",
      ],
    },
    problemTitle: "문제",
    problems: [
      "한 문장 속 여러 요청(‘카페라떼 빼고 아메리카노 추가하고 결제’)의 순차 실행 필요",
      "주문 시 필수 옵션(온도·크기 등) 누락을 즉시 실패 처리하지 않고 후속 발화로 완성 필요",
    ],
    solutions: [
      "LLM 시스템 프롬프트로 intents 9종·filters·옵션 정규화(샷 표현·온도 수식어 분리 등) 규칙화, gpt-4o-mini로 JSON 추출",
      "intents 존재 시 query.sequence로 묶어 API 서버가 for-loop로 순차 실행, 중첩 응답은 results만 펼쳐(flatten) 병합",
      "옵션 누락 시 pending으로 세션 보관, 후속 발화(옵션만) 수신 시 남은 옵션 계산 후 완성되면 장바구니에 담기 (팀 API 서버와 연동)",
      "추천은 MongoDB aggregation으로 주문↔메뉴 $lookup·인기순 집계, 이미 추천한 항목은 $nin으로 제외해 재추천 중복 방지 (팀 API 서버)",
      "menus·​query·​recommend·​order·​cart API를 Swagger(swagger-jsdoc)로 문서화, 프론트·NLP 연동 규격 명세화 (팀 API 서버)",
    ],
    results: [
      "발화 한 건으로 추천 → 주문 담기 → 옵션 선택(멀티턴) → 장바구니 수정 → 결제까지 도는 키오스크 백엔드를 팀으로 완성",
      "결제 시 메뉴별 수량을 그룹핑해 Orders 컬렉션(MongoDB Atlas)에 실제 저장, API는 Swagger로 명세화 (팀 API 서버)",
    ],
    lessons:
      "자연어라는 비정형 입력을 백엔드가 안전하게 ‘실행’으로 옮기려면 LLM 출력 스키마(intents·filters)를 강하게 규정하고 대화 상태(pending·세션)는 서버가 책임져야 함을 배웠습니다.",
    techChoices: [
      {
        name: "FastAPI · Uvicorn",
        reason:
          "async 라우터로 LLM·백엔드 호출 대기시간을 비동기 흡수(NLP 서버)",
      },
      {
        name: "gpt-4o-mini",
        reason:
          "자유발화에서 intents·filters JSON을 저비용·저지연 추출(코드 기본 모델)",
      },
      {
        name: "Express",
        reason:
          "라우터·컨트롤러 분리로 intent별 도메인 로직을 위임하는 디스패처 구성에 적합",
      },
      {
        name: "MongoDB · Mongoose",
        reason:
          "메뉴 옵션(온도·샷·크기·optionPrices) 등 가변 스키마를 문서로 저장, 추천은 aggregation으로 계산",
      },
      {
        name: "Swagger",
        reason:
          "라우트 JSDoc으로 API 명세 자동화, 프론트·NLP 협업 규격 공유",
      },
    ],
  },

  "live-chat": {
    diagramKey: "live-chat",
    hook: "여러 Pod에 흩어진 시청자에게도 메시지를 실시간 전달하는 라이브 채팅 서버입니다.",
    description:
      "대규모 라이브 스트리밍 + 커머스 플랫폼 sapari에서 진행 중인 실시간 채팅 서버입니다. Spring WebFlux 논블로킹 + WebSocket 연결과 Redis Pub/Sub 패턴 구독 기반 Pod 간 중계 위에, 권한·레이트리밋·욕설 방어와 멱등·fail-open을 하나의 전송 파이프라인으로 묶었습니다. 채팅 서버를 시작으로 다른 도메인도 맡아 계속 업데이트할 예정입니다.",
    role: "sapari(라이브 스트리밍·커머스) 채팅 서버 담당 · 진행 중 · 도메인 확장 예정",
    period: "2026.06 ~ 진행 중",
    evidence: [
      { label: "크로스 Pod 전달 통합 테스트", href: "https://github.com/sago-panda/sapari-be/blob/87ac3cd5067cb30c739ee1147e188a88f63c1f75/apps/streaming-app/src/test/java/com/sapari/streamingapp/websocket/CrossPodBroadcastTest.java" },
      { label: "채팅 모듈 설계 노트 (전달 보장 수준)", href: "https://github.com/sago-panda/sapari-be/blob/87ac3cd5067cb30c739ee1147e188a88f63c1f75/modules/chat/AGENTS.md" },
    ],
    goals: [
      "여러 Pod에 흩어진 시청자에게 메시지를 중계하는 stateless 수평 확장 채팅 서버",
      "논블로킹 리액티브 파이프라인에서 권한·레이트리밋·욕설 방어를 정확한 순서로 처리",
      "Redis 장애·중복 재전송·처리 불가 메시지에도 채팅이 멈추지 않는 멱등·fail-open 전송 파이프라인 확보",
    ],
    features: [
      {
        emoji: "🔌",
        title: "WebSocket 실시간 채팅",
        desc: "WebFlux 논블로킹 이벤트루프로 연결당 스레드 없이 다수 동시 연결 처리",
      },
      {
        emoji: "📡",
        title: "Pod 간 메시지 중계",
        desc: "Redis Pub/Sub 패턴 구독으로 어느 Pod에 붙든 같은 방 메시지 fan-out",
      },
      {
        emoji: "🛡️",
        title: "전송 파이프라인 방어",
        desc: "권한·강퇴·레이트리밋·욕설 마스킹을 비용 낮은 검사부터 순차 처리",
      },
      {
        emoji: "🔤",
        title: "욕설 우회 차단",
        desc: "Aho-Corasick 1-패스로 특수문자 삽입·토큰 조인 우회까지 탐지, 사전어는 보존",
      },
      {
        emoji: "♻️",
        title: "멱등 · fail-open",
        desc: "clientMsgId 유니크 인덱스로 중복 발행 차단, Redis 장애 시 채팅 지속",
      },
      {
        emoji: "🔑",
        title: "RS256 룸 토큰",
        desc: "chat은 공개키 검증만 수행해 소유자 토큰 위조를 구조적으로 차단",
      },
    ],
    architecture: {
      nodes: [
        { id: "viewer", label: "시청자", sub: "WebSocket", col: 0, row: 0 },
        {
          id: "server",
          label: "WebFlux 채팅 서버",
          sub: "이벤트루프 · concatMap",
          emphasis: true,
          col: 1,
          row: 0,
        },
        {
          id: "pipeline",
          label: "전송 파이프라인",
          sub: "권한·레이트리밋·욕설",
          emphasis: true,
          col: 2,
          row: 0,
        },
        {
          id: "redis",
          label: "Redis · Pub/Sub",
          sub: "chat:pubsub:* 패턴 구독",
          icon: "redis",
          col: 3,
          row: 0,
        },
        { id: "pod", label: "다른 Pod", sub: "로컬 세션 fan-out", col: 4, row: 0 },
        { id: "gate", label: "입장 게이트", sub: "RS256 룸 토큰 검증", col: 1, row: 1 },
        {
          id: "mongo",
          label: "MongoDB",
          sub: "원문+마스킹본 저장",
          icon: "mongodb",
          col: 2,
          row: 1,
        },
      ],
      edges: [
        { from: "viewer", to: "server", bi: true },
        { from: "server", to: "gate" },
        { from: "server", to: "pipeline" },
        { from: "pipeline", to: "mongo" },
        { from: "pipeline", to: "redis" },
        { from: "redis", to: "pod" },
      ],
      steps: [
        "시청자 WebSocket 접속 시 방 토큰(RS256)을 서브프로토콜 헤더로 제시, 입장 게이트가 검증·강퇴·방 종료 확인",
        "메시지 수신 시 전송 파이프라인이 비용 낮은 검사부터(권한 → 강퇴 → 레이트리밋 → 욕설 마스킹) 순차 처리",
        "통과 메시지는 MongoDB에 먼저 저장(원문+마스킹본) 후 Redis 발행(persist-then-publish)",
        "Redis Pub/Sub chat:pubsub:* 패턴 상시 구독 스트림이 다른 Pod 시청자에게 fan-out",
        "clientMsgId + Mongo 유니크 인덱스로 중복 발행 차단, Redis 장애 시 fail-open으로 채팅 지속",
      ],
    },
    problemTitle: "문제",
    problems: [
      "WebSocket은 stateful이라 시청자가 여러 Pod에 분산, A Pod 발신 메시지를 B Pod 시청자에게 실시간 전달 필요",
      "단일 이벤트루프를 블로킹 없이 유지하며 재전송·중복 프레임·레이트리밋 회피(파이프라이닝) 차단 필요",
      "채팅 본문·clientMsgId·프레임 등 신뢰경계 밖 입력의 욕설 우회·로그 위조 방어 필요",
    ],
    solutions: [
      "비용 0 검사는 앞, Redis I/O는 뒤로 둔 순서(방 생존 → 검증 → 권한 → 강퇴 → 레이트리밋 → 욕설 마스킹 → 저장 → 발행)로 전송 파이프라인 구성",
      "Redis Pub/Sub 패턴(chat:pubsub:*)을 상시 hot 스트림으로 구독해 방별 lazy 구독의 ‘구독 전 유실 레이스’ 없이 Pod 간 fan-out",
      "Aho-Corasick 1-패스 욕설 탐지로 특수문자 삽입·인접 토큰 조인 우회까지 포착, ‘시발점’ 같은 사전어는 화이트리스트로 보존",
      "clientMsgId + Mongo partial unique index 멱등 처리(persist-then-publish)로 재전송 시 중복 발행 억제, 기존 메시지로 ack",
      "Redis 장애로 강퇴·레이트리밋 조회 실패 시 채팅 허용(fail-open), onErrorResume 람다 안 throw 금지·시간 기반 스로틀 로그로 정책 역전 방지",
      "chat-api(계약) ↔ chat-core(도메인·인프라) 헥사고날 분리·ArchUnit으로 강제, 인바운드는 concatMap 순차 처리",
    ],
    results: [
      "어느 Pod에 붙든 같은 방 메시지를 받는 stateless 수평 확장 구조, 한 JVM에서 Pod 2개를 모사한 TestContainers(Redis) 통합 테스트로 크로스 Pod 전달 확인 (Pub/Sub 특성상 전달은 best-effort, 재접속 시 누락 복구는 미구현)",
      "Redis 장애 시 fail-open, poison-message 개별 skip, 재전송 멱등 처리로 세 가지 상황에서 전송 파이프라인이 멈추지 않도록 구성",
    ],
    lessons:
      "논블로킹 리액티브 파이프라인에서는 ‘무엇을 검사하느냐’만큼 ‘어느 순서로, 어느 에러 경계에서 검사하느냐’가 정확성을 좌우합니다. fail-open 람다 안 throw 금지·concatMap 강제 같은 불변식을 코드에 못 박지 않으면 가용성 정책이 조용히 뒤집힌다는 것을 체득했습니다.",
    techChoices: [
      {
        name: "Spring WebFlux",
        reason:
          "이벤트루프로 WebSocket 다수 동시 연결을 연결당 스레드 없이 처리해 라이브 채팅 동시성 감당",
      },
      {
        name: "WebSocket (raw)",
        reason:
          "채팅 프레임 직접 제어(TEXT 파싱, close code에 종료 사유 탑재)를 위해 STOMP 대신 raw WebSocket 채택",
      },
      {
        name: "Redis Pub/Sub",
        reason:
          "패턴 구독 하나로 상시 hot 스트림 구성, 구독 레이스 없는 Pod 간 fan-out·규모 확대 시 어댑터만 교체 가능",
      },
      {
        name: "Redis (상태)",
        reason:
          "크로스 Pod 공유 상태(세션·강퇴·레이트리밋) 외재화, SET NX EX 단일 원자 연산으로 레이트리밋 TOCTOU 레이스 제거",
      },
      {
        name: "MongoDB (reactive)",
        reason:
          "append-heavy 채팅 메시지를 _id 커서 페이징 + TTL 인덱스로 저장·조회하기에 적합",
      },
      {
        name: "RS256 룸 토큰",
        reason:
          "발급은 개인키(live), chat은 공개키 검증만 해 chat의 소유자 토큰 위조를 막는 구조적으로 안전한 PII 게이트",
      },
    ],
  },

  haeyaji: {
    logo: "/logos/haeyaji.png",
    diagramKey: "haeyaji",
    hook: "작은 로컬 LLM을 규칙·RAG로 감싸 ‘오늘 뭐 할지’ 추천의 흔들림을 줄인 추천 두뇌입니다.",
    description:
      "날씨·시간대·위치 기반으로 할 일을 실제 장소와 함께 추천하는 투두 앱입니다. 추천 두뇌(NLP 서버)를 단독 개발했고, 백엔드는 날씨 중계·추천 게이트웨이·개인화 학습·알림 도메인을 맡았습니다.",
    role: "NLP 추천 두뇌 단독 개발 · 백엔드 날씨/추천/개인화/알림 도메인",
    period: "2026.06 ~ 2026.07",
    evidence: [
      { label: "시나리오 채점 결과 59/80", href: "https://github.com/haeyaji/haeyaji-nlp/blob/main/eval/results.md" },
      { label: "도메인 가드 강화 · 한계 (PR #12)", href: "https://github.com/haeyaji/haeyaji-nlp/pull/12" },
    ],
    goals: [
      "작은 로컬 LLM을 규칙·RAG로 감싼 ‘오늘 뭐 할지’ 추천 두뇌 구현",
      "환각·JSON 붕괴·오분류를 스키마 강제·규칙 선-라우팅으로 흡수",
      "느린 LLM 응답에도 커넥션풀·외부 API·알림이 안전한 백엔드 설계",
    ],
    features: [
      {
        emoji: "🧠",
        title: "RAG 장소 검증",
        desc: "카카오 장소 후보를 프롬프트에 주입해 후보 목록 안에서만 장소 선택, 후보 밖이면 장소 연결 해제",
      },
      {
        emoji: "⚙️",
        title: "규칙 선-라우팅",
        desc: "막연어·부정·프롬프트 인젝션을 LLM 전 결정론적으로 걸러 검색어·카테고리 확정",
      },
      {
        emoji: "📐",
        title: "스키마 강제 출력",
        desc: "Ollama format=schema로 JSON 강제, 실패·타임아웃에도 규칙 폴백 반환",
      },
      {
        emoji: "📈",
        title: "개인화 학습",
        desc: "고른 것 +2 / 안 고른 것 -0.05를 (날씨×시간대) 맥락별 가중치로 누적·decay",
      },
      {
        emoji: "🌦️",
        title: "날씨 중계 파이프라인",
        desc: "위경도→격자 변환·발표시각 자동 계산·Redis 캐시·fail-soft로 기상청·에어코리아 중계",
      },
      {
        emoji: "🔔",
        title: "이벤트 기반 알림",
        desc: "도메인 직접 호출 제거, AFTER_COMMIT + REQUIRES_NEW로 알림 유실 방지",
      },
    ],
    architecture: {
      nodes: [
        { id: "fe", label: "React 프론트", sub: "카테고리 칩 · SSE", col: 0, row: 0 },
        {
          id: "be",
          label: "Spring 백엔드",
          sub: "추천 게이트웨이 · 개인화",
          emphasis: true,
          col: 1,
          row: 0,
        },
        {
          id: "nlp",
          label: "NLP 두뇌 · FastAPI",
          sub: "규칙 라우팅 · RAG",
          icon: "fastapi",
          emphasis: true,
          col: 2,
          row: 0,
        },
        {
          id: "llm",
          label: "Ollama · EXAONE",
          sub: "format=schema",
          icon: "ollama",
          col: 3,
          row: 0,
        },
        {
          id: "ext",
          label: "외부 데이터",
          sub: "기상청 · 에어코리아 · 카카오",
          col: 1,
          row: 1,
        },
      ],
      edges: [
        { from: "fe", to: "be", bi: true },
        { from: "be", to: "nlp", bi: true },
        { from: "nlp", to: "llm", bi: true },
        { from: "be", to: "ext", bi: true },
      ],
      steps: [
        "프론트 발화에 Spring 백엔드가 개인화 프로필·일정 맥락을 붙여 NLP 서버로 전달",
        "NLP 서버가 막연어·부정·프롬프트 인젝션을 규칙으로 선필터, 검색어·카테고리 결정론적 확정",
        "백엔드가 카카오 로컬 실제 장소 후보 프록시, 기상청·에어코리아 날씨 Redis 캐시 중계",
        "후보 목록을 프롬프트에 주입해 NLP 서버가 Ollama(EXAONE)를 format=schema로 호출 → 후보 목록 안에서만 장소 선택",
        "결과는 구조화 JSON으로 백엔드 거쳐 프론트 전달, 고른 것/안 고른 것은 맥락별 가중치로 학습",
      ],
    },
    problemTitle: "문제",
    problems: [
      "작은 로컬 LLM(2.4~7.8b)의 막연한 발화 오분류·없는 가게 날조(환각)·구조화 JSON 붕괴",
      "최대 20~45초인 LLM 응답 동안 트랜잭션·커넥션풀 점유 시 고갈, 외부 API 호출 폭주·알림 유실도 방어 필요",
    ],
    solutions: [
      "LLM은 활동·검색어만 결정, 카카오 후보 목록 주입 후 그중에서만 고르는 RAG로 없는 장소 추천 방지(후보에 없으면 장소 연결 해제)",
      "막연어·재요청·부정·인사·도메인 밖 거절·프롬프트 인젝션은 LLM 전 규칙으로 결정론적 확정, 카테고리는 날씨×시간대 가점 점수화",
      "Ollama 호출에 format=<Pydantic schema>로 출력 스키마 강제, 실패·타임아웃·깨진 JSON도 500 대신 규칙 폴백 반환",
      "추천 게이트웨이 트랜잭션 분리로 느린 nlp 호출 전 DB 조립·커넥션 반납, LLM 응답 중 커넥션풀 고갈 방지",
      "고른 것 +2 / 같이 떴지만 안 고른 것 -0.05를 (날씨×시간대) 맥락별 원자적 누적·주간 decay하는 개인화 가중치 학습",
      "위경도→격자·중기 지역코드·최근접 측정소 변환, 발표시각 자동 계산, Redis 캐시·fail-soft 기반 기상청·에어코리아 날씨 중계 파이프라인 구축",
    ],
    results: [
      "nlp 시나리오 자동 채점 59/80 통과 (2026-07-06 기준: 날씨·위치 19/20, 막연한 요청 17/20, 상세 추천 17/20, 도메인 밖 거절 6/20)",
      "도메인 밖 거절 실패 14건(요리법·번역·운세 등 거절 미작동)을 확인해 규칙 선-라우팅을 보강했고, 7.8b 모델로는 작정한 사회공학을 완전히 막을 수 없다는 한계를 PR에 명시",
      "LLM·네트워크 없는 결정론 테스트(nlp 119개·be 36개)로 규칙·라우팅·폴백·날씨 변환·알림 멱등 회귀 검증",
    ],
    lessons:
      "작은 로컬 LLM을 실서비스에 쓰려면 모델을 키우기보다 흔들리는 부분(라우팅·검색어·환각)을 결정론적 규칙·스키마 강제·RAG로 감싸 LLM의 자유도를 좁히는 게 품질·지연·장애 내성을 동시에 얻는 길이라는 걸 배웠습니다.",
    techChoices: [
      {
        name: "Ollama + EXAONE 3.5",
        reason:
          "외부 LLM API 비용·키 없는 로컬 구동, 한국어 추천 태스크에서 7.8b(정확도)/2.4b(속도) 실측 비교 후 선택",
      },
      {
        name: "규칙 선-라우팅 + format=schema",
        reason:
          "작은 모델의 오분류·JSON 붕괴를 LLM 전/출력 단계에서 흡수해 출력 흔들림 감소",
      },
      {
        name: "nlp stateless + be 단일 진실원천",
        reason:
          "장소검색·지오코딩·시크릿을 be 프록시로 집약, nlp 외부 의존을 Ollama 하나로 줄여 확장·교체 용이",
      },
      {
        name: "Redis 캐시",
        reason:
          "인스턴스 공유·재시작 내성, 외부 API(기상청·에어코리아) 호출량 상한·장애 격리",
      },
      {
        name: "도메인 이벤트 기반 알림",
        reason:
          "도메인 간 직접 호출 제거, AFTER_COMMIT + REQUIRES_NEW로 알림 유실 방지",
      },
    ],
  },

  "blog-platform": {
    diagramKey: "blog-platform",
    hook: "엔드포인트별 인증 요구와 한국어 검색, 두 난제를 미들웨어·형태소 분석으로 푼 블로그 백엔드입니다.",
    description:
      "인증·게시글·댓글·좋아요·팔로우·쪽지·스토리를 갖춘 블로그 플랫폼 백엔드 개인 프로젝트입니다.",
    role: "Express · MongoDB 백엔드 (개인)",
    period: "2025.08",
    evidence: [
      { label: "README · 기능별 구성", href: "https://github.com/HUHGEON/Blog-Platform/blob/main/README.md" },
    ],
    goals: [
      "엔드포인트마다 다른 인증 요구 수준을 미들웨어 분리로 해결",
      "조사·어미가 붙는 한국어에서 형태소 분석으로 의미 있는 유사글 추천 구현",
      "게시글·댓글·좋아요·팔로우·쪽지·스토리 등 8개 도메인 REST API 완성",
    ],
    features: [
      {
        emoji: "🔐",
        title: "엔드포인트별 인증 3종",
        desc: "필수·선택·refresh 미들웨어를 라우트별 요구 수준에 맞춰 적용",
      },
      {
        emoji: "🔤",
        title: "형태소 유사글 추천",
        desc: "mecab-ya로 명사 추출·제목 3배 가중 후 text 인덱스 $text 유사도로 추천",
      },
      {
        emoji: "🔎",
        title: "검색 전략 분리",
        desc: "text 인덱스는 추천용, 일반 검색은 regex $or로 분리해 인덱스 충돌 회피",
      },
      {
        emoji: "📊",
        title: "인기순 정렬",
        desc: "조회수+좋아요+댓글 합산 aggregate로 인기순 계산",
      },
      {
        emoji: "⏳",
        title: "24h TTL 스토리",
        desc: "TTL 인덱스로 스토리 24시간 뒤 자동 삭제",
      },
      {
        emoji: "🖼️",
        title: "안전한 업로드·해싱",
        desc: "Multer로 MIME·5MB 필터링, 비밀번호는 bcrypt(cost 12)로 해싱",
      },
    ],
    architecture: {
      nodes: [
        { id: "client", label: "클라이언트", sub: "요청 + 토큰", col: 0, row: 0 },
        {
          id: "mw",
          label: "인증·업로드 미들웨어",
          sub: "JWT 3종 · Multer",
          emphasis: true,
          col: 1,
          row: 0,
        },
        {
          id: "router",
          label: "라우터/컨트롤러",
          sub: "8개 도메인 REST",
          icon: "nodejs",
          col: 2,
          row: 0,
        },
        {
          id: "mongo",
          label: "MongoDB",
          sub: "text · TTL · unique 인덱스",
          icon: "mongodb",
          col: 3,
          row: 0,
        },
        {
          id: "morph",
          label: "형태소 분석",
          sub: "mecab-ya 키워드 추출",
          col: 2,
          row: 1,
        },
      ],
      edges: [
        { from: "client", to: "mw" },
        { from: "mw", to: "router" },
        { from: "router", to: "mongo" },
        { from: "router", to: "morph" },
      ],
      steps: [
        "인증 미들웨어가 엔드포인트별 3종(필수·선택·refresh) 중 하나로 클라이언트 요청 토큰 검증",
        "이미지 포함 시 업로드 미들웨어(Multer)가 MIME·용량 검사 후 저장",
        "라우터/컨트롤러가 게시글·댓글·좋아요·팔로우·쪽지·스토리 등 8개 도메인 로직 처리",
        "게시글 본문에서 mecab-ya 형태소 분석으로 명사 추출, 검색·추천 키워드로 저장",
        "MongoDB 저장, 추천은 형태소 text 인덱스·일반 검색은 regex로 분리해 인덱스 충돌 회피",
      ],
    },
    problemTitle: "문제",
    problems: [
      "‘비슷한 글 추천’에 필요한 한국어(조사·어미 결합)의 의미 있는 유사도가 단순 문자열 매칭으로는 안 나옴",
      "엔드포인트별 인증 요구 수준 상이(작성=필수, 상세 조회=비로그인 허용+로그인 시 좋아요 상태, 갱신=refresh만)로 단일 인증 로직 처리 불가",
    ],
    solutions: [
      "인증을 authenticateToken / optionalAuth / authenticateRefreshToken 3종으로 분리, 라우트별 요구 수준에 맞춰 적용",
      "토큰 payload의 type(access/refresh)으로 종류 구분, 발급·검증 로직은 JWT 유틸로 모듈화",
      "mecab-ya로 게시글 한국어 명사 추출·제목 키워드 3배 가중 후 analyzed_keywords_text의 text 인덱스로 $text + textScore 유사글 추천",
      "컬렉션당 text 인덱스 1개 제약으로 추천용이 자리 차지 → 일반 제목·본문 검색은 regex $or로 분리해 인덱스 충돌 회피",
      "비밀번호는 스키마 pre-save 훅에서 bcrypt(cost 12)로 해싱, 좋아요는 unique 복합 인덱스로 중복 방지·$inc로 카운터 동기화",
      "스토리는 TTL 인덱스로 24시간 뒤 자동 삭제",
    ],
    results: [
      "인증(3종)·게시글·댓글·좋아요·팔로우·쪽지·스토리 8개 도메인 REST API 백엔드 완성",
      "형태소 기반 유사글 추천·조회수+좋아요+댓글 합산 인기순 정렬·24시간 TTL 스토리 등 기본 CRUD 이상 기능을 인덱스·aggregate로 구현",
    ],
    lessons:
      "한글의 의미 단위(명사) 추출엔 형태소 분석기가 필요하고, MongoDB text 인덱스 제약(컬렉션당 1개)에 부딪히며 같은 데이터도 목적별로 검색 전략(추천은 형태소+text, 검색은 regex)을 나눠야 함을 체감했습니다.",
    techChoices: [
      {
        name: "Express",
        reason:
          "8개 도메인을 Router로 분리, 미들웨어 체인(인증→업로드→핸들러)으로 요청을 조립하는 경량 프레임워크",
      },
      {
        name: "MongoDB · Mongoose",
        reason:
          "팔로워 배열·스키마 validation·TTL·text·unique 인덱스·aggregate를 스키마 레벨에서 처리",
      },
      {
        name: "jsonwebtoken",
        reason:
          "무상태 인증, access/refresh 토큰을 type 필드로 구분·만료 분리 관리",
      },
      {
        name: "mecab-ya",
        reason:
          "형태소 분석으로 한국어 명사를 추출해 유사글 추천 키워드 생성",
      },
      {
        name: "multer · bcryptjs",
        reason:
          "이미지 업로드(파일명 충돌 방지·MIME·5MB 필터)·비밀번호 해싱(cost 12)을 표준 라이브러리로 안전 처리",
      },
      {
        name: "helmet",
        reason:
          "보안 HTTP 헤더 적용, 업로드 이미지 cross-origin 접근용 crossOriginResourcePolicy 조정",
      },
    ],
  },

  zogakzip: {
    logo: "/logos/zogakzip.png",
    diagramKey: "zogakzip",
    hook: "그룹·게시글·이미지 계층의 추억 기록 서비스 백엔드를 2인 팀으로 개발했습니다.",
    description:
      "그룹 > 게시글 > 댓글·이미지 계층의 추억 기록 서비스 백엔드입니다. 게시글 API·이미지 업로드·한국 시간대(KST) 일관 처리를 맡았고, 활동 기반 배지 시스템은 팀이 함께 갖췄습니다.",
    role: "게시글 API · 이미지 업로드 · KST 시간대 처리 (2인 팀)",
    period: "2024.08 ~ 2024.09",
    evidence: [
      { label: "태그 검색 (PR #19)", href: "https://github.com/ZOGAKZIP-4team/BE/pull/19" },
      { label: "시간대 변경 (PR #9)", href: "https://github.com/ZOGAKZIP-4team/BE/pull/9" },
    ],
    award: "코드잇 데모데이 대상",
    goals: [
      "그룹 > 게시글 > 이미지 계층의 추억 기록 서비스 백엔드 구현",
      "2인 팀에서 게시글 API·이미지 업로드·KST 시간대 처리 도메인 담당",
      "참조 계층·카운터·시간대 일관성을 지키는 데이터 규칙 확립",
    ],
    features: [
      {
        emoji: "📝",
        title: "게시글 API",
        desc: "그룹>게시글>댓글 계층 CRUD, 정렬·페이지네이션 제공",
      },
      {
        emoji: "🖼️",
        title: "이미지 업로드",
        desc: "Multer diskStorage로 유니크 파일명·MIME 이중 검사 후 절대 URL로 서빙",
      },
      {
        emoji: "🕐",
        title: "KST 시간대 통일",
        desc: "moment-timezone으로 저장·응답 시각을 Asia/Seoul로 일관 처리",
      },
      {
        emoji: "🔢",
        title: "카운터 동기화",
        desc: "게시글·댓글 등록 시 상위 문서 postCount·commentCount를 $inc로 동기화",
      },
      {
        emoji: "🏅",
        title: "활동 배지 (팀 기능)",
        desc: "활동 조건 충족 시 이벤트 훅·24시간 배치로 배지 자동 부여",
      },
    ],
    architecture: {
      nodes: [
        { id: "client", label: "클라이언트", sub: "HTTP / JSON", col: 0, row: 0 },
        {
          id: "server",
          label: "Express 서버",
          sub: "라우트 · 컨트롤러",
          icon: "nodejs",
          emphasis: true,
          col: 1,
          row: 0,
        },
        {
          id: "mongo",
          label: "MongoDB",
          sub: "Group / Post / Comment / Image",
          icon: "mongodb",
          col: 2,
          row: 0,
        },
        {
          id: "badge",
          label: "배지 (팀 기능)",
          sub: "이벤트 훅 · 24h 배치",
          col: 3,
          row: 0,
        },
        {
          id: "upload",
          label: "이미지 업로드",
          sub: "Multer diskStorage",
          col: 1,
          row: 1,
        },
        { id: "tz", label: "KST 처리", sub: "moment-timezone", col: 2, row: 1 },
      ],
      edges: [
        { from: "client", to: "server" },
        { from: "server", to: "mongo" },
        { from: "mongo", to: "badge" },
        { from: "server", to: "upload" },
        { from: "mongo", to: "tz" },
      ],
      steps: [
        "Express 서버 라우트에서 클라이언트 요청의 ObjectId·필수 필드 검증",
        "이미지는 Multer로 유니크 파일명·MIME 이중 검사 후 저장, 절대 URL로 서빙",
        "게시글·댓글 등록 시 상위 문서 카운터(postCount·commentCount)를 $inc로 동기화",
        "저장·응답 시각을 moment-timezone으로 KST 통일해 시간대 오차 제거",
        "활동 조건 충족 시 이벤트 훅(즉시)·24시간 배치(시간 경과형)로 배지 갱신 — 팀 공동 구현",
      ],
    },
    problemTitle: "문제",
    problems: [
      "그룹 > 게시글 > 이미지 계층의 참조 구조화와 게시글 수 등 카운터의 일관된 동기화 필요",
      "저장(UTC)·응답(KST) 시각이 어긋나 모든 도메인의 저장·표시 시각 통일 필요",
    ],
    solutions: [
      "Group/Post/Comment/Image 스키마를 참조 필드로 계층화, 게시글 등록·댓글 시 상위 문서 postCount·commentCount를 $inc로 동기화",
      "Multer diskStorage로 유니크 파일명 생성·MIME·확장자 이중 검사 후 절대 URL로 저장, express.static으로 서빙",
      "moment-timezone으로 저장 시 Asia/Seoul 변환, 응답도 KST 포맷으로 통일해 시간대 오차 제거",
      "게시글 목록 정렬·페이지네이션 지원, 배지 개수 정렬 시에만 $addFields로 동적 aggregation 구성",
      "활동 조건(연속 게시·누적 공감 등) 충족 시 배지 자동 부여 시스템 팀 공동 구축, 이벤트 훅·24시간 배치로 갱신",
    ],
    results: [
      "그룹·게시글·댓글·이미지 CRUD, 공감·공개여부 조회 등 REST API 백엔드 팀으로 완성",
      "담당한 게시글 API·이미지 업로드·KST 시간대 처리를 안정적으로 구현·통합",
    ],
    lessons:
      "팀 개발에서는 도메인 경계를 나누고 각자 맡은 API·데이터 규칙(참조 계층·카운터·시간대)을 일관되게 지키는 것이 전체 통합 속도를 좌우함을 배웠습니다.",
    techChoices: [
      {
        name: "Express",
        reason:
          "가볍고 라우팅이 단순해 소규모 팀의 빠른 CRUD API 분담·구축에 적합",
      },
      {
        name: "MongoDB · Mongoose",
        reason:
          "그룹 > 게시글 > 댓글의 유연한 계층 문서 구조를 스키마 변경 부담 없이 처리",
      },
      {
        name: "moment-timezone",
        reason:
          "저장·응답 시각을 KST로 일관 변환해 시간대 오차 제거",
      },
      {
        name: "Multer",
        reason:
          "multipart 이미지 업로드·디스크 저장·필터링 표준 처리",
      },
    ],
  },

  "coupon-yaho": {
    diagramKey: "coupon-yaho",
    hook: "순간 몰리는 선착순 요청에도 한정 수량 쿠폰을 정확히 발급하고 결과를 데이터로 검증하는 시스템입니다.",
    description:
      "LG유플러스 유레카 백엔드 종합 프로젝트로 5인 팀이 만든 통신사 브랜드데이 선착순 쿠폰 발급 시스템(쿠폰 야호~)입니다. 병목을 측정하며 MySQL 락에서 조건부 원자 UPDATE, Redis Lua 선점, 적응형 대기열 순으로 팀이 함께 구조를 발전시켰고, 저는 조장으로 검증 배치·시드 생성기·부하 시험 결과 DB 대조·알림 outbox 릴레이를 맡았습니다.",
    role: "조장 · 배치 · 검증 · 스키마 (5인 팀)",
    period: "2026.08 ~ 진행 중",
    evidence: [
      { label: "검증 배치 정답 양방향 대조 (PR #15)", href: "https://github.com/coupon-yaho/cy-be/pull/15" },
      { label: "부하 시험 결과 DB 대조 (PR #304)", href: "https://github.com/coupon-yaho/cy-be/pull/304" },
      { label: "시드 생성기 실행 결과 (CLEAN · CORRUPT)", href: "https://github.com/coupon-yaho/cy-seed-data-generator/blob/main/README.md" },
      { label: "시연 영상 (YouTube)", href: "https://youtu.be/hS4aFDgdmNM" },
    ],
    metrics: [
      {
        value: "약 500 req/s",
        label: "락 대기 1.0 도달 도착률",
        note: "FOR UPDATE 400~450 req/s 대비",
      },
      {
        value: "2,240 → 802ms",
        label: "500 req/s 성공 응답 p99",
        note: "성공 응답 기준 · 붕괴 회차 제외 · p95 2,160 → 641ms",
      },
      { value: "0건", label: "초과 발급", note: "105회차 전체" },
      {
        value: "800 / 800",
        label: "오염 데이터 기대 검출",
        note: "700건 주입 → 기대 800행 · 누락 0 · 오탐 0",
      },
    ],
    cases: [
      {
        title:
          "팀에서 재고 잠금을 FOR UPDATE에서 조건부 원자 UPDATE로 전환해 500 req/s의 강한 경합(락 대기 1.0 초과)을 해소하고 성공 응답 p99를 2,240ms → 802ms로 개선",
        causes: [
          "재고 행이 회차당 하나라 모든 발급이 같은 잠금 구간을 한 줄로 통과, FOR UPDATE는 조회 시점부터 INSERT까지 임계구간에 넣어 구간이 김",
          "450 req/s부터 발급당 락 대기 1.133으로 발급 1건당 평균 1회 이상 잠금을 기다리는 강한 경합 도달, 500 req/s에선 7회 중 4회 응답 붕괴(성공 응답 중앙값 1초 이상)",
          "무너진 회차도 5xx 없이 지연으로만 나타나 가용성 지표만으로는 결함 미검출",
        ],
        solutions: [
          "검사와 차감을 UPDATE … WHERE active_count < total_quantity 한 문장으로 합쳐 잠금을 UPDATE에서 시작, 영향 행 0이면 소진으로 판정",
          "1인 1매는 UNIQUE(coupon_id, member_id)로 DB에서 최종 보장",
          "이후 재고 판정은 Redis Lua 선점으로 옮기고 앞단에 적응형 대기열을 두는 구조로 확장 (아래 버전별 발전 과정)",
        ],
        checks: [
          "같은 커밋에서 잠금 방식만 바꾼 이미지로 재고 1만 · 요청 2만, 300~500 req/s 도착률마다 7회씩 측정",
          "k6 constant-arrival-rate로 도착률 고정, 회차마다 발급 · 이력 · 멱등 · Redis 키 롤백으로 같은 상태에서 출발",
        ],
        results: [
          "락 대기 1.0 도달 도착률: 400~450 → 약 500 req/s",
          "500 req/s 성공 응답 p99 2,240 → 802ms, p95 2,160 → 641ms(붕괴 회차는 지연 집계에서 제외), 응답 붕괴 4/7 → 0/7",
          "105회차 전체 초과 발급 0건",
        ],
      },
      {
        title:
          "용량 비교 기준을 '발급당 InnoDB 락 대기'로 정하고 측정 환경 오염을 걷어내 세 잠금 구현을 105회차 재측정",
        causes: [
          "성공 응답 med · p95 · p99는 도착률에 따라 오르내려 구현 간 용량 한계 교차점 판정 불가",
          "첫 측정은 다른 프로젝트 컨테이너 6개가 함께 돈 환경이라 같은 FOR UPDATE 구현의 300 req/s p99가 6,873ms로 부풀려짐",
        ],
        solutions: [
          "세 구현 모두에서 단조 증가하는 발급당 락 대기(Innodb_row_lock_waits 증가분 ÷ 발급 수)를 임계 지표로 선정, 1.0(발급 1건당 평균 1회 대기)을 강한 경합의 기준선으로 사용",
          "외부 컨테이너 전부 제거, 회차마다 외부 컨테이너 수와 호스트 CPU 기록",
          "세 이미지를 교차 실행해 시간대 편향 제거, 회차마다 예열 후 측정",
        ],
        checks: [
          "105회차 전부 외부 컨테이너 0개 기록 확인",
          "어느 도착률에서도 세 구현 간 락 대기 범위가 겹치지 않음 확인",
        ],
        results: [
          "같은 조건 FOR UPDATE 300 req/s p99 6,873 → 222.72ms로 측정 오염 제거, 이전 수치 전부 폐기",
          "락 대기 1.0 도달점을 FOR UPDATE 400~450 · 조건부 UPDATE 약 500 · Redis 분리 실험 500 초과 req/s로 구분",
        ],
      },
      {
        title:
          "오류 700건을 심은 오염 데이터셋으로 검증 배치가 실제로 오류를 찾는지 입증, 누락 0 · 오탐 0 확인",
        causes: [
          "검증 배치 0건이 오류가 없어서인지 검증기가 못 찾아서인지 구분할 근거 부재",
          "검출 개수만 비교하면 400건 누락 + 400건 오탐도 합계 800으로 합격",
          "회원 100만 · 발급 300만 규모를 작은 MySQL 컨테이너에 넣어야 했고, 난수 이메일은 해시 인덱스 충돌로 적재 전체가 실패할 위험",
        ],
        solutions: [
          "시드 생성기로 정상셋(CLEAN)과 7유형 700건을 심은 오염셋(CORRUPT) 두 벌 생성, 기대 검출 결과도 기록",
          "검출 결과를 (finding_type, target_key) 집합으로 비교해 누락과 오탐을 따로 세는 양방향 대조 구현",
          "결정론 RNG와 Feistel 순열로 겹칠 수 없는 값을 구성해 UNIQUE 충돌 0 보장, 보조 인덱스 없이 적재 후 제약 일괄 생성",
        ],
        checks: [
          "배포 서버와 같은 조건(MySQL 2 vCPU · 768MB · 버퍼풀 128MB)의 실제 실행 로그로 확인",
        ],
        results: [
          "CLEAN: 회원 100만 · 발급 300만 · 이력 534만 행에서 검증 규칙 6종 모두 0건, 이력 전수 리플레이 57초",
          "CORRUPT: 기대 800행 → 검출 800 · 누락 0 · 오탐 0 (주입 700건 중 한 유형이 규칙 2개에 동시에 걸려 기대 800행)",
          "CLEAN 생성 · 적재 199.7초, 제약 생성 81초",
        ],
      },
    ],
    versions: [
      {
        version: "v1.1",
        title: "비관적 락",
        status: "구현",
        problem:
          "동시 요청이 회차 재고 행 하나를 두고 경쟁해 정합성 보장이 우선",
        choice:
          "SELECT … FOR UPDATE로 재고 행을 잠근 뒤 검사·차감. DB가 정확성을 보장하는 가장 단순한 방식이라 이후 버전 비교의 기준선으로 설정",
        tradeoff:
          "모든 발급이 같은 잠금 구간을 한 줄로 통과하고 INSERT까지 임계구간에 포함돼 커넥션 풀을 늘려도 대기가 줄지 않음",
        metric:
          "300 req/s 발급당 락 시간 4.5ms · 450 req/s부터 락 대기 1.133(1.0 초과) · 500 req/s 성공 p95 2,160ms · p99 2,240ms · 붕괴 4/7",
        next: "잠금 구간이 길어 포화 지점이 400~450 req/s에 머묾",
      },
      {
        version: "v1.2",
        title: "조건부 원자 UPDATE",
        status: "구현 · 제품 코드",
        problem:
          "요청마다 잠금 조회와 차감 UPDATE 두 번 왕복하며 잠금을 오래 점유",
        choice:
          "UPDATE … WHERE active_count < total_quantity 한 문장으로 검사와 차감을 합치고 영향 행 0이면 소진 판정. 잠금이 UPDATE에서 시작해 구간 단축",
        tradeoff:
          "단일 재고 행 경쟁 구조와 요청별 동기 DB 트랜잭션은 그대로 남음",
        metric:
          "락 대기 1.0 도달 약 500 req/s (500 req/s 락 대기 1.010) · 500 req/s 성공 p95 641ms · p99 802ms · 붕괴 0/7",
        next: "경합 지점이 여전히 DB 안의 재고 행 하나라 재고 계수를 DB 밖으로 이전",
      },
      {
        version: "v2.1",
        title: "Redis Lua 원자 선점",
        status: "구현",
        problem:
          "DB 직렬 구간이 남으면 커넥션 증설로도 처리량이 늘지 않음",
        choice:
          "Lua 스크립트 5종(claim · complete · compensate · restore · reclaim)이 회차 상태 · 등급 · 1인 1매 · 재고를 한 번에 판정하고 차감. 발급은 선점 → 트랜잭션 → 완료 CAS 세 단계로 분리",
        tradeoff:
          "저장소가 둘로 나뉘어 선점 직후 중단 시 Redis가 DB보다 앞섬. 요청 토큰으로 보상, Redis 유실 시 DB 기준 재구성, Redis↔DB 격차 관제 지표 추가",
        metric:
          "재고 UPDATE를 별도 트랜잭션으로 뗀 실험(v2-split): 500 req/s 락 대기 0.472로 1.0 미도달 · 락 대기 63~73% 감소 · 발급당 DB 쓰기 7행 → 3행 (실험 · 미커밋)",
        next: "DB 경합은 줄었으나 순간 유입 자체와 건별 영속화는 그대로 남음",
      },
      {
        version: "v2.2",
        title: "적응형 대기열",
        status: "핵심 경로 구현",
        problem:
          "순간 몰리는 유입이 애플리케이션과 DB를 함께 과부하",
        choice:
          "세 가지 이유로 게이트웨이를 별도 서비스로 분리. 경계(입장만 책임, 재고는 쿠폰 서비스만 차감) · 스택(입장은 WebFlux, 발급은 MVC + JPA라 한 프로세스면 블로킹이 이벤트 루프를 막음) · 장애 격리(뒷단이 멈춰도 대기열 유지)",
        tradeoff:
          "입장은 순서만 보장하고 발급은 보장하지 않음. 컴포넌트가 늘고 성공 요청마다 동기 DB 커밋은 여전히 필요",
        metric:
          "페이즈 게이트 7단계 통과 · 요청 경로 Redis 명령 0건 · 오버헤드 p99 < 5ms · 크레딧 초과 배분 0/10만 회 · 매진 후 동시 조회 1만 → 뒷단 1건",
      },
    ],
    goals: [
      "재고 1만·요청 2만 동시 발급에서 초과 발급 0건과 회차별 1인 1매 보장",
      "병목을 측정하며 DB 락 → 조건부 원자 UPDATE → Redis 선점 → 적응형 대기열로 구조를 단계적 발전",
      "발급 이력을 재계산해 저장 상태와 교차 검증, 검증기 자체도 오류 데이터로 검증",
    ],
    features: [
      {
        title: "선착순 쿠폰 발급",
        desc: "멱등키(UUID)로 재시도해도 한 장만 발급, 조건부 원자 UPDATE와 UNIQUE(coupon_id, member_id)로 초과·중복 발급 차단",
      },
      {
        title: "적응형 대기열",
        desc: "평시 즉시 통과, 혼잡 시 백엔드 가용량에 맞춰 입장량을 조절하고 순번·예상 대기시간·입장 토큰 제공",
      },
      {
        title: "정합성 검증 배치",
        desc: "검증 규칙 6종이 발급 이력을 런타임과 같은 상태 머신으로 재생해 재고 카운터·사용 실적과 대조",
      },
      {
        title: "대용량 시드 생성기",
        desc: "회원 100만·발급 300만·이력 534만 행을 정상셋과 오류를 심은 오염셋 두 벌로 생성, 결정론 RNG로 같은 시드에서 같은 데이터 재현",
      },
      {
        title: "배치 이상 감지",
        desc: "알림 규칙 45종(critical 12 · warning 33), 잡은 성공했으나 데이터가 어긋난 경우까지 별도 규칙으로 감지",
      },
      {
        title: "알림 outbox 릴레이",
        desc: "발급 결과 알림을 outbox에 기록 후 SKIP LOCKED 배치 클레임과 Full Jitter 재시도로 Kafka에 발행",
      },
    ],
    architecture: {
      nodes: [],
      edges: [],
      steps: [
        "사용자 요청이 NGINX를 거쳐 대기열 게이트웨이(WebFlux)로 진입, 즉시 종결 · 무대기 통과 · 대기열 진입 세 갈래로 판정",
        "통과한 발급 요청은 쿠폰 서비스가 멱등키를 IN_PROGRESS로 먼저 기록한 뒤 재고 판정. v1.2는 조건부 원자 UPDATE, v2.1은 Redis Lua 선점",
        "MySQL이 발급 · 상태 이력 · 사용 실적 · 멱등 응답을 보관, UNIQUE(coupon_id, member_id)가 1인 1매의 최종 방어선",
        "발급 결과 알림은 outbox에 기록, 릴레이가 Kafka로 발행",
        "배치 서버가 만료 · 정리 · 정합성 검증 · 집계를 발급 API와 분리 수행, Prometheus가 API · 배치 · 대기열 지표 수집",
      ],
    },
    problemTitle: "측정 · 검증",
    problems: [],
    solutions: [],
    benchmark: {
      caption:
        "같은 커밋에서 재고 잠금 방식만 바꿔 재고 10,000 · 요청 20,000 조건으로 도착률마다 7회씩 측정했습니다. 각 지표는 7회 중앙값이며, p95 · p99는 성공 응답 지연(ms)입니다.",
      headers: ["도착률", "구현", "락 대기", "p95", "p99", "붕괴"],
      bar: { column: 2, max: 2, threshold: 1, label: "발급당 락 대기" },
      rows: [
        { cells: ["300/s", "v1.1 FOR UPDATE", "0.254", "50.10", "222.72", "0/7"] },
        { cells: ["", "v1.2 조건부", "0.180", "28.12", "158.64", "0/7"], highlight: true },
        { cells: ["400/s", "v1.1 FOR UPDATE", "0.703", "409.35", "481.83", "0/7"] },
        { cells: ["", "v1.2 조건부", "0.499", "190.41", "264.03", "0/7"], highlight: true },
        { cells: ["450/s", "v1.1 FOR UPDATE", "1.133", "562.01", "648.15", "1/7"] },
        { cells: ["", "v1.2 조건부", "0.546", "368.66", "575.49", "0/7"], highlight: true },
        { cells: ["500/s", "v1.1 FOR UPDATE", "1.588", "2,159.79", "2,239.89", "4/7"] },
        { cells: ["", "v1.2 조건부", "1.010", "640.92", "802.16", "0/7"], highlight: true },
      ],
      footnote:
        "발급당 락 대기 = 측정 구간의 Innodb_row_lock_waits 증가분 ÷ 발급 수. 1.0은 발급 1건당 평균 1회 이상 행 잠금을 기다렸다는 뜻으로, 모든 요청이 대기했다는 증명이 아니라 강한 경합을 가르는 관측 기준으로 썼습니다. 막대 세로선이 1.0(눈금 끝 2.0)입니다. k6 constant-arrival-rate · 로컬 Docker(API 2대 · MySQL 단일) · 외부 컨테이너 0개 · 회차마다 상태 롤백. 붕괴 = 성공 응답 중앙값 1,000ms 이상이며, 붕괴 회차는 지연 집계에서 제외해 FOR UPDATE 450 · 500 req/s의 p95 · p99는 버틴 회차만의 값입니다(실제 꼬리 지연은 더 나쁨).",
    },
    results: [],
    lessons:
      "평상 부하(300 req/s)에서는 세 구현의 성공 응답 중앙값이 3.4~4.0ms로 구분되지 않았습니다. 개선은 상시 지연이 아니라 포화 지점을 올린 것이었고, 그 차이는 지표를 제대로 고르고 측정 환경을 통제해야만 보인다는 것을 배웠습니다. 검증에서도 마찬가지로 '0건'이라는 결과는 오류를 심어 두고 전부 찾아낼 때만 믿을 수 있다는 기준을 세웠습니다.",
    techChoices: [
      {
        name: "Spring Batch",
        reason:
          "만료 · 정리 · 검증 · 집계를 발급 API와 분리, 실행과 재시작 상태를 메타데이터로 추적",
      },
      {
        name: "MySQL · Flyway",
        reason:
          "UNIQUE 제약과 조건부 UPDATE로 정합성 최종 방어선을 DB에 두고 스키마 마이그레이션을 버전 관리",
      },
      {
        name: "Redis · Lua",
        reason:
          "재고 · 1인 1매 · 멱등 요청 판정을 한 번의 원자 스크립트로 처리해 DB 재고 행 경합 감소",
      },
      {
        name: "k6 · Prometheus",
        reason:
          "도착률을 고정한 채 구현만 바꿔 비교하도록 k6 constant-arrival-rate로 부하, 서버 지표는 같은 회차로 수집",
      },
      {
        name: "Python 시드 생성기",
        reason:
          "결정론 RNG와 Feistel 순열로 같은 시드에서 같은 데이터 재현, UNIQUE 충돌 0을 구성적으로 보장하도록 직접 제작",
      },
    ],
  },

  "media-inference": {
    diagramKey: "intern-arch",
    hook: "백엔드 프로토타입부터 데이터 분석 자동화·QA까지 수행한 사내 실무입니다.",
    description:
      "엠트리센 인턴 중 사내 실무를 기술 중심으로 정리했습니다. 기획팀이 조사를 위해 반복하던 엑셀 작업을 함께 맡게 되면서 이를 대시보드로 자동화했습니다. 도메인·세부 기능·정량 성과는 대외비라 사용 기술·구조만 공개합니다.",
    role: "백엔드 · 데이터 분석 자동화 · QA (사내 프로토타입)",
    period: "2025.08 ~ 2026.01",
    repoNote: "사내 · 비공개 저장소",
    works: [
      {
        title: "백엔드 프로토타입 · 처리 파이프라인",
        desc: "업로드 데이터 전처리·외부 처리 서버 연동·결과 저장·캐싱 백엔드 파이프라인, 업로드·전처리·외부 연동·저장을 서비스 레이어로 분리",
        stack: ["Node.js", "Express", "MongoDB", "Redis", "Docker"],
      },
      {
        title: "데이터 분석·시각화 대시보드 ①",
        desc: "기획팀이 조사용으로 반복하던 엑셀 작업을 부탁받아 자동화. 엑셀 데이터 로드·가공·통계 분석·차트 시각화 Streamlit 대시보드로 수작업 분석 대체",
        stack: ["Python", "Streamlit", "pandas", "numpy", "matplotlib", "scipy"],
      },
      {
        title: "데이터 분석·시각화 대시보드 ②",
        desc: "같은 기획팀 조사 업무의 기간·조건별 엑셀 집계·분석을 Altair 차트 Streamlit 대시보드로 자동화. 데이터 로드·가공·시각화를 유틸로 모듈화",
        stack: ["Python", "Streamlit", "pandas", "numpy", "Altair"],
      },
    ],
    qa: "- 자체 프로젝트(백엔드·데이터 도구): 테스트 케이스 직접 설계·수행으로 동작 검증. 백엔드는 Jest 단위·통합 테스트, 데이터 도구는 입력·경계(엣지) 케이스로 결과 검증\n- 타사 앱 QA: 사내에서 다른 회사 앱을 직접 테스트하고 테스트 보고서로 정리·보고하는 업무 자주 담당",
    problemTitle: "문제",
    problems: [],
    solutions: [],
    results: [],
    lessons: "",
    techChoices: [],
    architecture: { nodes: [], edges: [], steps: [] },
  },
};
