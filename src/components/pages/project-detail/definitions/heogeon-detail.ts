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
  demo?: {
    title: string;
    video: string; // 자동재생 반복 mp4
    poster: string;
    width: number;
    height: number;
    youtubeId?: string; // 없으면 원본 링크 대신 videoUrl 사용
    videoUrl?: string;
    caption?: string; // 무엇을 봐야 하는지
    steps?: { say: string; result: string }[]; // GIF 속 발화 → 처리 결과
  }; // 시연 GIF + 원본 영상
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
    links?: { label: string; href: string }[]; // 이 사례의 근거
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
    bar?: { column: number; max: number; label: string }; // inline magnitude bar
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
    hook: "자유발화 한 문장에 담긴 여러 요청을 순서대로 처리하는 음성 주문 백엔드입니다.",
    description:
      "음성과 터치로 메뉴를 주문하고 추천받는 키오스크 서비스입니다. NLP 서버가 STT 텍스트를 LLM으로 의도(intents)와 필터로 해석하고 오케스트레이터로서 API 서버를 호출해 받은 응답을 클라이언트에 돌려주는 2단 백엔드 구조입니다. 저는 NLP 서버를 맡았고 API 서버(추천·주문·장바구니·Swagger)는 팀원이 구현했습니다.",
    role: "NLP 서버 설계·주도 · API 연동",
    period: "2025.03 ~ 2025.06",
    demo: {
      title: "음성 대화로 추천부터 결제까지 (2.5배속)",
      video: "/demos/voice-kiosk.mp4",
      poster: "/demos/voice-kiosk.jpg",
      width: 360,
      height: 642,
      youtubeId: "QMuGDGB1Jsw",
      caption: "한 번의 주문 대화를 이어서 진행한 장면입니다. NLP 서버가 발화마다 의도를 해석해 추천 · 옵션 선택 · 장바구니 · 결제로 연결합니다.",
      steps: [
        { say: "“인기 메뉴 보여 줘”", result: "추천 의도 → 인기 메뉴 목록 표시" },
        { say: "“아이스 아메리카노 미디움 사이즈로 주문해 줘”", result: "주문 의도 + 온도·크기 옵션 추출 → 장바구니 담기" },
        { say: "“미디움으로 해 줘”", result: "이어서 담은 카페라떼의 사이즈를 묻는 안내에 답해 빠진 옵션을 채우고 장바구니에 추가 (멀티턴)" },
        { say: "“결제해 줘”", result: "결제 의도 → 주문 완료" },
      ],
    },
    evidence: [
      { label: "NLP 서버 의도 해석 코드", href: "https://github.com/Say-It-It-s-OK/nlp/blob/main/app/services/openai_client.py" },
      { label: "NLP 서버 README", href: "https://github.com/Say-It-It-s-OK/nlp/blob/main/README.md" },
    ],
    award: "명지대 캡스톤디자인 금상",
    goals: [
      "자유발화 한 문장에 담긴 여러 요청을 순서대로 처리하는 음성 주문 백엔드 구현",
      "LLM 출력을 intents·filters 스키마로 제한해 자연어 요청을 실행 가능한 형태로 안전하게 변환",
      "멀티턴 대화 상태(pending·세션)를 서버가 직접 관리하는 구조 구축",
    ],
    features: [
      {
        emoji: "🎙️",
        title: "자유발화 의도 분석",
        desc: "한 문장에 담긴 여러 요청을 intents 배열로 나눠 순차 실행",
      },
      {
        emoji: "🔁",
        title: "멀티턴 옵션 완성",
        desc: "온도·크기 등 필수 옵션이 빠지면 pending에 보관하고 다음 발화로 채움",
      },
      {
        emoji: "⭐",
        title: "개인화 추천 (팀 API 서버)",
        desc: "주문↔메뉴 aggregation으로 인기순 집계, 이미 추천한 항목은 제외",
      },
      {
        emoji: "🛒",
        title: "주문·장바구니·결제 (팀 API 서버)",
        desc: "담기·수정·결제를 한 번의 발화 흐름으로 처리하고 Orders에 저장",
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
        "NLP 서버가 gpt-4o-mini로 요청을 의도(intents)·필터 JSON으로 해석(한 문장에 요청이 여러 개면 intents 배열로 추출)",
        "NLP 서버(오케스트레이터)가 intents를 query.sequence로 묶어 API 서버(/api/handle) 호출",
        "API 서버가 intents를 순차 실행(추천·주문·결제)하고 옵션이 빠지면 pending으로 세션에 보관한 뒤 다음 발화로 완성",
        "메뉴·주문은 MongoDB에서 조회·저장, 결과(안내·화면·항목)는 NLP 서버가 클라이언트로 반환",
      ],
    },
    problemTitle: "문제",
    problems: [
      "한 문장에 섞인 여러 요청(‘카페라떼 빼고 아메리카노 추가하고 결제’)을 순서대로 실행해야 함",
      "주문 시 필수 옵션(온도·크기 등)이 빠져도 바로 실패로 끝내지 않고 다음 발화로 채워야 함",
    ],
    solutions: [
      "LLM 시스템 프롬프트에 intents 9종·filters·옵션 정규화(샷 표현·온도 수식어 분리 등) 규칙을 정의하고 gpt-4o-mini로 JSON 추출",
      "intents가 있으면 query.sequence로 묶고 API 서버가 for-loop로 순차 실행, 중첩 응답은 results만 펼쳐(flatten) 병합",
      "옵션이 빠지면 pending으로 세션에 보관, 옵션만 담긴 후속 발화가 오면 남은 옵션을 계산해 다 채워졌을 때 장바구니에 담기 (팀 API 서버와 연동)",
      "추천은 MongoDB aggregation으로 주문↔메뉴 $lookup·인기순 집계, 이미 추천한 항목은 $nin으로 제외해 중복 추천 방지 (팀 API 서버)",
      "menus·​query·​recommend·​order·​cart API를 Swagger(swagger-jsdoc)로 문서화해 프론트·NLP와 연동 규격 공유 (팀 API 서버)",
    ],
    results: [
      "복합 요청 처리: 한 문장에 담긴 여러 의도를 순서대로 실행",
      "멀티턴 처리: 빠진 옵션을 후속 발화로 채우며 주문 진행",
      "추천부터 장바구니 수정·결제까지 이어지는 키오스크 백엔드를 팀 프로젝트로 완성",
      "결제 시 메뉴별 수량을 그룹핑해 Orders 컬렉션(MongoDB Atlas)에 실제 저장, API는 Swagger로 문서화 (팀 API 서버)",
    ],
    lessons:
      "자연어 같은 비정형 입력을 백엔드에서 안전하게 실행하려면 LLM 출력 스키마(intents·filters)를 엄격하게 정의하고 대화 상태(pending·세션)는 서버가 관리해야 한다는 것을 배웠습니다.",
    techChoices: [
      {
        name: "FastAPI · Uvicorn",
        reason:
          "async 라우터로 LLM·백엔드 호출 대기를 비동기로 처리(NLP 서버)",
      },
      {
        name: "gpt-4o-mini",
        reason:
          "자유발화에서 intents·filters JSON을 적은 비용과 짧은 지연으로 추출(코드 기본 모델)",
      },
      {
        name: "Express",
        reason:
          "라우터·컨트롤러를 나눠 intent별 도메인 로직을 위임하는 디스패처 구성에 적합",
      },
      {
        name: "MongoDB · Mongoose",
        reason:
          "메뉴 옵션(온도·샷·크기·optionPrices) 등 가변 스키마를 문서로 저장, 추천은 aggregation으로 계산",
      },
      {
        name: "Swagger",
        reason:
          "라우트 JSDoc으로 API 명세를 자동 생성해 프론트·NLP와 규격 공유",
      },
    ],
  },

  "live-chat": {
    diagramKey: "live-chat",
    hook: "여러 Pod에 흩어진 시청자에게 메시지를 실시간으로 전달하는 라이브 채팅 서버입니다.",
    description:
      "대규모 라이브 스트리밍·커머스 플랫폼 sapari에서 개발 중인 실시간 채팅 서버입니다. Spring WebFlux 논블로킹 WebSocket으로 연결을 받고 Redis Pub/Sub 패턴 구독으로 Pod 간 메시지를 중계합니다. 그 위에 권한 확인·레이트리밋·욕설 필터링과 멱등 처리·fail-open을 하나의 전송 파이프라인으로 묶었습니다. 채팅 서버를 시작으로 다른 도메인까지 맡아 계속 업데이트할 예정입니다.",
    role: "sapari(라이브 스트리밍·커머스) 채팅 서버 담당 · 진행 중 · 도메인 확장 예정",
    period: "2026.06 ~ 진행 중",
    evidence: [
      { label: "크로스 Pod 전달 통합 테스트", href: "https://github.com/sago-panda/sapari-be/blob/87ac3cd5067cb30c739ee1147e188a88f63c1f75/apps/streaming-app/src/test/java/com/sapari/streamingapp/websocket/CrossPodBroadcastTest.java" },
      { label: "채팅 모듈 설계 노트 (전달 보장 수준)", href: "https://github.com/sago-panda/sapari-be/blob/87ac3cd5067cb30c739ee1147e188a88f63c1f75/modules/chat/AGENTS.md" },
    ],
    goals: [
      "여러 Pod에 흩어진 시청자에게 메시지를 중계하는, 수평 확장 가능한 stateless 채팅 서버",
      "논블로킹 리액티브 파이프라인에서 권한·레이트리밋·욕설 필터링을 올바른 순서로 처리",
      "Redis 장애·중복 재전송·처리할 수 없는 메시지가 있어도 채팅이 멈추지 않도록 멱등·fail-open 전송 파이프라인 구성",
    ],
    features: [
      {
        emoji: "🔌",
        title: "WebSocket 실시간 채팅",
        desc: "WebFlux 논블로킹 이벤트 루프로 연결마다 스레드를 두지 않고 다수 동시 연결 처리",
      },
      {
        emoji: "📡",
        title: "Pod 간 메시지 중계",
        desc: "Redis Pub/Sub 패턴 구독으로 어느 Pod에 접속하든 같은 방 메시지를 fan-out",
      },
      {
        emoji: "🛡️",
        title: "전송 파이프라인 방어",
        desc: "권한·강퇴·레이트리밋·욕설 마스킹을 비용이 낮은 검사부터 순서대로 처리",
      },
      {
        emoji: "🔤",
        title: "욕설 우회 차단",
        desc: "Aho-Corasick 1-패스로 특수문자 삽입·토큰을 이어 붙인 우회까지 탐지, 일반 단어는 보존",
      },
      {
        emoji: "♻️",
        title: "멱등 · fail-open",
        desc: "clientMsgId 유니크 인덱스로 중복 발행 차단, Redis 장애 시에도 채팅 유지",
      },
      {
        emoji: "🔑",
        title: "RS256 룸 토큰",
        desc: "chat은 공개키로 검증만 해 구조상 소유자 토큰을 위조할 수 없음",
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
        "시청자가 WebSocket 접속 시 방 토큰(RS256)을 서브프로토콜 헤더에 담아 보내면 입장 게이트에서 토큰 검증·강퇴 여부·방 종료 여부 확인",
        "메시지를 받으면 전송 파이프라인이 비용이 낮은 검사부터(권한 → 강퇴 → 레이트리밋 → 욕설 마스킹) 순서대로 처리",
        "통과한 메시지는 MongoDB에 먼저 저장(원문+마스킹본)한 뒤 Redis로 발행(persist-then-publish)",
        "chat:pubsub:* 패턴을 상시 구독하는 Redis Pub/Sub 스트림이 다른 Pod의 시청자에게 fan-out",
        "clientMsgId + Mongo 유니크 인덱스로 중복 발행 차단, Redis 장애 시 fail-open으로 채팅 유지",
      ],
    },
    problemTitle: "문제",
    problems: [
      "WebSocket은 stateful이라 시청자가 여러 Pod에 나뉘고, A Pod에서 보낸 메시지를 B Pod 시청자에게도 실시간으로 전달해야 함",
      "단일 이벤트 루프를 블로킹하지 않으면서 재전송·중복 프레임·파이프라이닝을 이용한 레이트리밋 회피를 막아야 함",
      "채팅 본문·clientMsgId·프레임 같은 신뢰할 수 없는 입력을 이용한 욕설 우회·로그 위조를 막아야 함",
    ],
    solutions: [
      "비용 0인 검사는 앞에, Redis I/O는 뒤에 두는 순서(방 생존 → 검증 → 권한 → 강퇴 → 레이트리밋 → 욕설 마스킹 → 저장 → 발행)로 전송 파이프라인 구성",
      "Redis Pub/Sub 패턴(chat:pubsub:*)을 hot 스트림으로 상시 구독해, 방별 lazy 구독에서 생기는 ‘구독 완료 전 메시지 유실’ 레이스 없이 Pod 간 fan-out",
      "Aho-Corasick 1-패스 욕설 탐지로 특수문자 삽입·인접 토큰 결합 우회까지 잡고, ‘시발점’ 같은 일반 단어는 화이트리스트로 보존",
      "clientMsgId + Mongo partial unique index로 멱등 처리(persist-then-publish)해 재전송 시 중복 발행을 막고 기존 메시지로 ack",
      "Redis 장애로 강퇴·레이트리밋 조회가 실패해도 채팅 허용(fail-open), onErrorResume 람다 안 throw 금지와 시간 기반 로그 스로틀로 fail-open 정책이 뒤집히지 않게 함",
      "chat-api(계약) ↔ chat-core(도메인·인프라)를 헥사고날 구조로 분리하고 ArchUnit으로 강제, 인바운드는 concatMap으로 순차 처리",
    ],
    results: [
      "어느 Pod에 접속해도 같은 방 메시지를 받는 stateless 수평 확장 구조, 한 JVM에서 Pod 2개를 모사한 TestContainers(Redis) 통합 테스트로 Pod 간 전달 확인 (Pub/Sub 특성상 전달은 best-effort이고 재접속 시 누락 복구는 미구현)",
      "Redis 장애(fail-open)·poison-message(개별 skip)·재전송(멱등 처리) 세 상황 모두에서 전송 파이프라인이 멈추지 않도록 구성",
    ],
    lessons:
      "논블로킹 리액티브 파이프라인에서는 무엇을 검사하느냐만큼 어떤 순서로, 어느 에러 경계에서 검사하느냐가 정확성을 좌우합니다. fail-open 람다 안 throw 금지나 concatMap 강제 같은 불변식을 코드 레벨에서 보장하지 않으면 가용성 정책이 조용히 뒤집힌다는 것을 직접 겪으며 배웠습니다.",
    techChoices: [
      {
        name: "Spring WebFlux",
        reason:
          "이벤트 루프 기반이라 연결마다 스레드를 두지 않고 WebSocket 동시 연결 다수를 처리해 라이브 채팅 동시성 감당",
      },
      {
        name: "WebSocket (raw)",
        reason:
          "채팅 프레임을 직접 제어(TEXT 파싱, close code에 종료 사유 담기)하려고 STOMP 대신 raw WebSocket 선택",
      },
      {
        name: "Redis Pub/Sub",
        reason:
          "패턴 구독 하나로 상시 hot 스트림을 구성해 구독 레이스 없이 Pod 간 fan-out, 규모가 커지면 어댑터만 교체하면 됨",
      },
      {
        name: "Redis (상태)",
        reason:
          "세션·강퇴·레이트리밋 등 Pod 간 공유 상태를 외부화, SET NX EX 단일 원자 연산으로 레이트리밋 TOCTOU 레이스 제거",
      },
      {
        name: "MongoDB (reactive)",
        reason:
          "append 위주인 채팅 메시지를 _id 커서 페이징 + TTL 인덱스로 저장·조회하기에 적합",
      },
      {
        name: "RS256 룸 토큰",
        reason:
          "발급은 개인키(live)로 하고 chat은 공개키 검증만 해, 구조상 chat에서 소유자 토큰을 위조할 수 없는 PII 게이트",
      },
    ],
  },

  haeyaji: {
    logo: "/logos/haeyaji.png",
    diagramKey: "haeyaji",
    hook: "작은 로컬 LLM에 규칙과 RAG를 붙여 ‘오늘 뭐 할지’ 추천이 덜 들쭉날쭉하게 만든 추천 서버입니다.",
    description:
      "날씨·시간대·위치를 보고 할 일을 실제 장소와 함께 추천하는 투두 앱입니다. 추천을 담당하는 NLP 서버를 혼자 개발했고, 백엔드에서는 날씨 중계·추천 게이트웨이·개인화 학습·알림 도메인을 맡았습니다.",
    role: "NLP 추천 서버 단독 개발 · 백엔드 날씨/추천/개인화/알림 도메인",
    period: "2026.06 ~ 2026.07",
    demo: {
      title: "날씨 기반 장소 추천부터 일정 추가까지 (2.5배속)",
      video: "/demos/haeyaji.mp4",
      poster: "/demos/haeyaji.jpg",
      width: 1440,
      height: 810,
      videoUrl: "https://haeyaji.github.io/haeyaji-pages/demo.mp4",
      caption: "팀 시연 영상에서 날씨 · 추천 · 개인화 장면만 잘랐습니다.",
      steps: [
        { say: "날씨 홈", result: "현재 위치의 날씨와 주간 예보, 오늘 할 일을 한 화면에 표시" },
        { say: "지도 추천", result: "현재 위치 기준으로 주변 장소를 거리순으로 정리, 장소를 누르면 사진 · 메뉴 · 후기 확인" },
        { say: "추천 도우미", result: "대화 내용에서 관심 카테고리를 기록하고 쌓인 취향을 바탕으로 맞춤 추천" },
        { say: "일정 추가", result: "마음에 드는 곳을 일정에 추가하면 오늘 할 일에 바로 반영" },
      ],
    },
    evidence: [
      { label: "시나리오 채점 결과 59/80", href: "https://github.com/haeyaji/haeyaji-nlp/blob/main/eval/results.md" },
      { label: "도메인 가드 강화 · 한계 (PR #12)", href: "https://github.com/haeyaji/haeyaji-nlp/pull/12" },
    ],
    goals: [
      "작은 로컬 LLM에 규칙·RAG를 붙인 ‘오늘 뭐 할지’ 추천 서버 구현",
      "환각·JSON 형식 깨짐·오분류를 스키마 강제와 LLM 호출 전 규칙 라우팅으로 방어",
      "LLM 응답이 느려도 커넥션풀·외부 API·알림이 안전하게 동작하는 백엔드 설계",
    ],
    features: [
      {
        emoji: "🧠",
        title: "RAG 장소 검증",
        desc: "카카오 장소 후보를 프롬프트에 넣어 후보 목록 안에서만 장소를 고르고, 후보에 없으면 장소 연결 해제",
      },
      {
        emoji: "⚙️",
        title: "규칙 선-라우팅",
        desc: "막연한 표현·부정·프롬프트 인젝션을 LLM 호출 전에 규칙으로 걸러 검색어·카테고리 확정",
      },
      {
        emoji: "📐",
        title: "스키마 강제 출력",
        desc: "Ollama format=schema로 JSON 출력을 강제하고, 실패·타임아웃 때도 규칙 폴백 반환",
      },
      {
        emoji: "📈",
        title: "개인화 학습",
        desc: "고른 것 +2 / 안 고른 것 -0.05를 (날씨×시간대) 맥락별 가중치로 누적하고 decay 적용",
      },
      {
        emoji: "🌦️",
        title: "날씨 중계 파이프라인",
        desc: "위경도→격자 변환·발표시각 자동 계산·Redis 캐시로 기상청·에어코리아 중계, 외부 API 장애 때도 응답 유지",
      },
      {
        emoji: "🔔",
        title: "이벤트 기반 알림",
        desc: "도메인 간 직접 호출을 없애고 AFTER_COMMIT + REQUIRES_NEW로 알림 유실 방지",
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
        "프론트에서 들어온 사용자 발화에 Spring 백엔드가 개인화 프로필·일정 맥락을 붙여 NLP 서버로 전달",
        "NLP 서버가 막연한 표현·부정·프롬프트 인젝션을 규칙으로 먼저 거르고 검색어·카테고리 확정",
        "백엔드가 카카오 로컬의 실제 장소 후보를 프록시하고, 기상청·에어코리아 날씨는 Redis 캐시를 거쳐 중계",
        "NLP 서버가 후보 목록을 프롬프트에 넣고 Ollama(EXAONE)를 format=schema로 호출 → 후보 목록 안에서만 장소 선택",
        "구조화된 JSON 결과를 백엔드를 거쳐 프론트로 전달, 고른 것/안 고른 것은 맥락별 가중치로 학습",
      ],
    },
    problemTitle: "문제",
    problems: [
      "작은 로컬 LLM(2.4~7.8b)의 막연한 발화 오분류·없는 가게를 지어내는 환각·구조화 JSON 형식 깨짐",
      "LLM 응답이 최대 20~45초 걸리는 동안 트랜잭션·커넥션을 붙잡으면 커넥션풀 고갈, 외부 API 호출 폭주와 알림 유실도 막아야 함",
    ],
    solutions: [
      "LLM은 활동·검색어만 정하고, 카카오 후보 목록을 넣어 그 안에서만 고르게 하는 RAG로 없는 장소 추천 방지(후보에 없으면 장소 연결 해제)",
      "막연한 표현·재요청·부정·인사·도메인 밖 거절·프롬프트 인젝션은 LLM 호출 전에 규칙으로 확정, 카테고리는 날씨×시간대 가점으로 점수화",
      "Ollama 호출에 format=<Pydantic schema>로 출력 스키마를 강제하고, 실패·타임아웃·깨진 JSON에도 500 대신 규칙 폴백 반환",
      "추천 게이트웨이 트랜잭션을 분리해 느린 nlp 호출 전에 DB 조립과 커넥션 반납을 끝내고, LLM 응답 중 커넥션풀 고갈 방지",
      "고른 것 +2 / 함께 노출됐지만 안 고른 것 -0.05를 (날씨×시간대) 맥락별로 원자적으로 누적하고 주간 decay를 적용하는 개인화 가중치 학습",
      "위경도→격자·중기 지역코드·최근접 측정소 변환, 발표시각 자동 계산, Redis 캐시, 외부 API 장애 때도 응답을 유지하는 기상청·에어코리아 날씨 중계 파이프라인 구축",
    ],
    results: [
      "nlp 시나리오 자동 채점 59/80 통과 (2026-07-06 기준: 날씨·위치 19/20, 막연한 요청 17/20, 상세 추천 17/20, 도메인 밖 거절 6/20)",
      "도메인 밖 거절 실패 14건(요리법·번역·운세 등에서 거절이 동작하지 않음)을 확인해 LLM 호출 전 규칙 라우팅을 보강했고, 7.8b 모델로는 작정하고 시도하는 사회공학을 완전히 막을 수 없다는 한계를 PR에 명시 (보강 후 동일 평가셋 재측정 결과는 기록 없음)",
      "LLM·네트워크 없이 도는 결정적 테스트(nlp 119개·be 36개)로 규칙·라우팅·폴백·날씨 변환·알림 멱등성 회귀 검증",
    ],
    lessons:
      "작은 로컬 LLM을 실서비스에 쓰려면 모델을 키우기보다 결과가 자주 바뀌는 부분(라우팅·검색어·환각)을 규칙·스키마 강제·RAG로 감싸 LLM이 판단하는 범위를 좁혀야 한다는 걸 배웠습니다. 그래야 품질·지연·장애 내성을 함께 챙길 수 있었습니다.",
    techChoices: [
      {
        name: "Ollama + EXAONE 3.5",
        reason:
          "외부 LLM API 비용·키 없이 로컬에서 구동, 한국어 추천 태스크에서 7.8b(정확도)/2.4b(속도)를 실측 비교한 뒤 선택",
      },
      {
        name: "규칙 선-라우팅 + format=schema",
        reason:
          "작은 모델의 오분류·JSON 형식 깨짐을 LLM 호출 전·출력 단계에서 걸러 출력 편차 감소",
      },
      {
        name: "nlp stateless + be 단일 진실원천",
        reason:
          "장소 검색·지오코딩·시크릿을 be 프록시로 모으고 nlp의 외부 의존을 Ollama 하나로 줄여 확장·교체가 쉬움",
      },
      {
        name: "Redis 캐시",
        reason:
          "여러 인스턴스 간 공유·재시작 내성, 외부 API(기상청·에어코리아) 호출량 상한·장애 격리",
      },
      {
        name: "도메인 이벤트 기반 알림",
        reason:
          "도메인 간 직접 호출을 없애고 AFTER_COMMIT + REQUIRES_NEW로 알림 유실 방지",
      },
    ],
  },

  "blog-platform": {
    diagramKey: "blog-platform",
    hook: "엔드포인트마다 다른 인증 요구는 미들웨어로, 한국어 검색은 형태소 분석으로 해결한 블로그 백엔드입니다.",
    description:
      "인증·게시글·댓글·좋아요·팔로우·쪽지·스토리를 갖춘 블로그 플랫폼 백엔드 개인 프로젝트입니다.",
    role: "Express · MongoDB 백엔드 (개인)",
    period: "2025.08",
    demo: {
      title: "스토리 · 검색 · 유사 글 · 팔로우 · 쪽지 (2.5배속)",
      video: "/demos/blog-platform.mp4",
      poster: "/demos/blog-platform.jpg",
      width: 1440,
      height: 900,
      steps: [
        { say: "스토리", result: "로그인 후 이미지 스토리를 올리고 상세 화면에서 확인" },
        { say: "검색 · 상세", result: "‘강아지’로 검색해 글을 열고 좋아요 · 댓글 작성, 하단에 형태소 분석으로 찾은 유사 강아지 글 표시" },
        { say: "팔로우 · 쪽지", result: "작성자 페이지에서 팔로우한 뒤 쪽지를 보내고 보낸 쪽지함에서 확인" },
        { say: "새 글 작성", result: "이미지와 함께 강아지 산책 글을 올리자 기존 강아지 글들이 유사 글로 추천" },
      ],
    },
    evidence: [
      { label: "README · 기능별 구성", href: "https://github.com/HUHGEON/Blog-Platform/blob/main/README.md" },
    ],
    goals: [
      "엔드포인트마다 다른 인증 요구 수준을 미들웨어 분리로 해결",
      "조사·어미가 붙는 한국어 글도 형태소 분석으로 유사글을 추천하도록 구현",
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
        desc: "mecab-ya로 명사를 추출하고 제목에 3배 가중치를 준 뒤 text 인덱스 $text 유사도로 추천",
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
        "엔드포인트에 따라 인증 미들웨어 3종(필수·선택·refresh) 중 하나가 클라이언트 요청 토큰 검증",
        "이미지가 있으면 업로드 미들웨어(Multer)가 MIME·용량 검사 후 저장",
        "라우터/컨트롤러가 게시글·댓글·좋아요·팔로우·쪽지·스토리 등 8개 도메인 로직 처리",
        "게시글 본문에서 mecab-ya 형태소 분석으로 명사 추출, 검색·추천 키워드로 저장",
        "MongoDB에 저장, 추천은 형태소 text 인덱스로·일반 검색은 regex로 나눠 인덱스 충돌 회피",
      ],
    },
    problemTitle: "문제",
    problems: [
      "조사·어미가 붙는 한국어는 단순 문자열 매칭으로 ‘비슷한 글 추천’에 쓸 만한 유사도가 나오지 않음",
      "엔드포인트마다 인증 요구 수준이 달라(작성=필수, 상세 조회=비로그인 허용+로그인 시 좋아요 상태, 갱신=refresh만) 인증 로직 하나로 처리 불가",
    ],
    solutions: [
      "인증을 authenticateToken / optionalAuth / authenticateRefreshToken 3종으로 분리, 라우트별 요구 수준에 맞춰 적용",
      "토큰 payload의 type(access/refresh)으로 종류 구분, 발급·검증 로직은 JWT 유틸로 모듈화",
      "mecab-ya로 게시글의 한국어 명사를 추출하고 제목 키워드에 3배 가중치를 준 뒤 analyzed_keywords_text의 text 인덱스로 $text + textScore 유사글 추천",
      "컬렉션당 text 인덱스는 1개뿐인데 추천용이 이미 사용 → 일반 제목·본문 검색은 regex $or로 분리해 인덱스 충돌 회피",
      "비밀번호는 스키마 pre-save 훅에서 bcrypt(cost 12)로 해싱, 좋아요는 unique 복합 인덱스로 중복 방지·$inc로 카운터 동기화",
      "스토리는 TTL 인덱스로 24시간 뒤 자동 삭제",
    ],
    results: [
      "인증(3종)·게시글·댓글·좋아요·팔로우·쪽지·스토리 8개 도메인 REST API 백엔드 완성",
      "형태소 기반 유사글 추천·조회수+좋아요+댓글 합산 인기순 정렬·24시간 TTL 스토리 등 기본 CRUD를 넘어서는 기능을 인덱스·aggregate로 구현",
    ],
    lessons:
      "한글에서 의미 단위(명사)를 뽑으려면 형태소 분석기가 필요했습니다. MongoDB text 인덱스 제약(컬렉션당 1개)에 부딪히면서 같은 데이터라도 목적에 따라 검색 전략(추천은 형태소+text, 검색은 regex)을 나눠야 한다는 것도 체감했습니다.",
    techChoices: [
      {
        name: "Express",
        reason:
          "8개 도메인을 Router로 분리하고 미들웨어 체인(인증→업로드→핸들러)으로 요청을 처리하는 경량 프레임워크",
      },
      {
        name: "MongoDB · Mongoose",
        reason:
          "팔로워 배열·스키마 validation·TTL·text·unique 인덱스·aggregate를 스키마 레벨에서 처리",
      },
      {
        name: "jsonwebtoken",
        reason:
          "무상태 인증, access/refresh 토큰을 type 필드로 구분하고 만료 시간을 따로 관리",
      },
      {
        name: "mecab-ya",
        reason:
          "형태소 분석으로 한국어 명사를 추출해 유사글 추천 키워드 생성",
      },
      {
        name: "multer · bcryptjs",
        reason:
          "이미지 업로드(파일명 충돌 방지·MIME·5MB 필터)·비밀번호 해싱(cost 12)을 표준 라이브러리로 안전하게 처리",
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
      "그룹 > 게시글 > 댓글·이미지 계층의 추억 기록 서비스 백엔드입니다. 게시글 API·이미지 업로드와 한국 시간대(KST) 일관 처리를 맡았고 활동 기반 배지 시스템은 팀이 함께 만들었습니다.",
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
      "참조 계층·카운터·시간대가 어긋나지 않도록 데이터 규칙 정립",
    ],
    features: [
      {
        emoji: "📝",
        title: "게시글 API",
        desc: "그룹>게시글>댓글 계층 CRUD와 정렬·페이지네이션 제공",
      },
      {
        emoji: "🖼️",
        title: "이미지 업로드",
        desc: "Multer diskStorage로 고유 파일명 생성·MIME 이중 검사 후 절대 URL로 서빙",
      },
      {
        emoji: "🕐",
        title: "KST 시간대 통일",
        desc: "moment-timezone으로 저장·응답 시각을 Asia/Seoul 기준으로 통일",
      },
      {
        emoji: "🔢",
        title: "카운터 동기화",
        desc: "게시글·댓글 등록 시 상위 문서의 postCount·commentCount를 $inc로 동기화",
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
        "Express 라우트에서 클라이언트 요청의 ObjectId·필수 필드 검증",
        "이미지는 Multer로 고유 파일명 생성·MIME 이중 검사 후 저장하고 절대 URL로 서빙",
        "게시글·댓글 등록 시 상위 문서의 카운터(postCount·commentCount)를 $inc로 동기화",
        "moment-timezone으로 저장·응답 시각을 KST로 맞춰 시간대 오차 제거",
        "활동 조건 충족 시 이벤트 훅(즉시)·24시간 배치(시간 경과형)로 배지 갱신 — 팀 공동 구현",
      ],
    },
    problemTitle: "문제",
    problems: [
      "그룹 > 게시글 > 이미지 계층의 참조 구조를 잡고 게시글 수 등 카운터를 일관되게 동기화해야 함",
      "저장(UTC)과 응답(KST) 시각이 어긋나 모든 도메인에서 저장·표시 시각을 통일해야 함",
    ],
    solutions: [
      "Group/Post/Comment/Image 스키마를 참조 필드로 계층화하고 게시글·댓글 등록 시 상위 문서의 postCount·commentCount를 $inc로 동기화",
      "Multer diskStorage로 고유 파일명 생성, MIME·확장자 이중 검사 후 절대 URL로 저장하고 express.static으로 서빙",
      "moment-timezone으로 저장 시 Asia/Seoul로 변환하고 응답도 KST 포맷으로 맞춰 시간대 오차 제거",
      "게시글 목록 정렬·페이지네이션 지원, 배지 개수로 정렬할 때만 $addFields로 aggregation을 동적 구성",
      "활동 조건(연속 게시·누적 공감 등)을 채우면 배지를 자동 부여하는 시스템 팀 공동 구축, 이벤트 훅·24시간 배치로 갱신",
    ],
    results: [
      "그룹·게시글·댓글·이미지 CRUD와 공감·공개 여부 조회 등 REST API 백엔드를 팀으로 완성",
      "담당한 게시글 API·이미지 업로드·KST 시간대 처리를 안정적으로 구현·통합",
    ],
    lessons:
      "팀 개발에서는 도메인 경계를 나누고 각자 맡은 API와 데이터 규칙(참조 계층·카운터·시간대)을 일관되게 지켜야 전체 통합 속도가 빨라진다는 것을 배웠습니다.",
    techChoices: [
      {
        name: "Express",
        reason:
          "가볍고 라우팅이 단순해 소규모 팀이 CRUD API를 나눠 빠르게 구축하기에 적합",
      },
      {
        name: "MongoDB · Mongoose",
        reason:
          "그룹 > 게시글 > 댓글처럼 유연한 계층 문서 구조를 스키마 변경 부담 없이 처리",
      },
      {
        name: "moment-timezone",
        reason:
          "저장·응답 시각을 KST로 통일해 시간대 오차 제거",
      },
      {
        name: "Multer",
        reason:
          "multipart 이미지 업로드·디스크 저장·파일 필터링을 표준 방식으로 처리",
      },
    ],
  },

  "coupon-yaho": {
    diagramKey: "coupon-yaho",
    hook: "선착순 요청이 한꺼번에 몰려도 한정 수량 쿠폰을 정확히 발급하고, 그 결과를 데이터로 검증하는 시스템입니다.",
    description:
      "LG유플러스 유레카 백엔드 종합 프로젝트에서 5인 팀이 만든 통신사 브랜드데이 선착순 쿠폰 발급 시스템(쿠폰 야호~)입니다. 팀은 병목을 측정하면서 MySQL 락, 조건부 원자 UPDATE, Redis Lua 선점, 적응형 대기열 순으로 구조를 바꿔 왔고, 저는 조장으로서 검증 배치, 시드 생성기, 부하 시험 결과의 DB 대조를 맡았습니다.",
    role: "조장 · 배치 · 검증 · 스키마 (5인 팀)",
    period: "2026.08",
    demo: {
      title: "대기열 입장부터 발급 관제 · 검증 배치까지 (2.5배속)",
      video: "/demos/coupon-yaho.mp4",
      poster: "/demos/coupon-yaho.jpg",
      width: 1440,
      height: 810,
      youtubeId: "hS4aFDgdmNM",
      caption: "팀 시연 영상에서 대기열 · 발급 관제 · 검증 배치 장면만 잘랐습니다.",
      steps: [
        { say: "대기열 입장", result: "혼잡 시 번호표와 앞선 인원 · 예상 대기 시간을 보여 주고, 차례가 오면 3분 유효한 입장 토큰 발급" },
        { say: "발급 관제", result: "관리자 화면에서 재고가 1초마다 갱신되며 10,000장 발급 완료까지 실시간 확인" },
        { say: "검증 배치", result: "오류 700건을 심은 데이터에서 기대한 800건을 판정하고, 정상 데이터 300만 행에서는 0건 확인" },
      ],
    },
    metrics: [
      {
        value: "800 / 800",
        label: "오염 데이터 기대 검출",
        note: "700건 주입(1개 유형이 규칙 2개에 걸려 기대 800행) · 누락 0 · 오탐 0",
      },
      {
        value: "4/7 → 0/7",
        label: "500 req/s 중앙값 1초 이상 회차",
        note: "7회 중 성공 응답 중앙값이 1초 이상인 횟수",
      },
      {
        value: "2,240 → 802ms",
        label: "500 req/s 성공 응답 p99",
        note: "성공 응답 기준 · 중앙값 1초 이상 회차 제외 · p95 2,160 → 641ms",
      },
      { value: "0건", label: "초과 발급", note: "105회차 전체" },
    ],
    cases: [
      {
        title:
          "오류 700건을 심은 데이터셋으로 검증 배치가 실제로 오류를 찾아내는지 확인, 누락 0 · 오탐 0",
        links: [
          { label: "검증 배치 정답 양방향 대조 (PR #15)", href: "https://github.com/coupon-yaho/cy-be/pull/15" },
          { label: "시드 생성기 실행 결과", href: "https://github.com/coupon-yaho/cy-seed-data-generator/blob/main/README.md" },
        ],
        causes: [
          "검증 배치 결과 0건이 오류가 없어서인지 검증기가 못 찾아서인지 구분할 근거가 없음",
          "검출 개수만 비교하면 누락과 오탐이 같은 수만큼 섞여도 합계가 기대치와 같아져 통과",
          "회원 100만 · 발급 300만 규모를 작은 MySQL 컨테이너에 적재해야 했고 이메일을 난수로 만들면 해시 인덱스 충돌로 적재 전체가 실패할 수 있음",
        ],
        solutions: [
          "시드 생성기로 정상셋(CLEAN)과 오류 7유형 × 100건 = 700건을 심은 오염셋(CORRUPT) 두 벌을 만들고 기대 검출 결과도 기록",
          "기대 검출이 800행인 이유: 7유형 중 '사용 취소 이중 기록' 100건은 재고 불일치(V1)와 불법 상태 전이(V4) 두 규칙에 동시에 걸려 200행으로 잡힘 → 600 + 200 = 800행",
          "검출 결과를 (finding_type, target_key) 집합 단위로 양방향 대조해 누락과 오탐을 따로 집계",
          "시드 고정 RNG와 Feistel 순열로 겹치지 않는 값을 만들어 UNIQUE 충돌 0 보장, 보조 인덱스 없이 적재한 뒤 제약을 한 번에 생성",
        ],
        checks: [
          "배포 서버와 같은 조건(MySQL 2 vCPU · 768MB · 버퍼풀 128MB)에서 돌린 실제 실행 로그로 확인",
        ],
        results: [
          "CLEAN: 회원 100만 · 발급 300만 · 이력 534만 행에서 검증 규칙 6종 모두 0건, 이력 전체 리플레이 57초",
          "CORRUPT: 기대 800행 → 검출 800 · 누락 0 · 오탐 0",
          "CLEAN 생성 · 적재 199.7초, 제약 생성 81초",
        ],
      },
      {
        title:
          "팀에서 재고 잠금을 FOR UPDATE에서 조건부 원자 UPDATE로 바꿔 500 req/s 중앙값 1초 이상 회차 4/7 → 0/7, 성공 응답 p99 2,240ms → 802ms",
        links: [{ label: "부하 시험 결과 DB 대조 (PR #304)", href: "https://github.com/coupon-yaho/cy-be/pull/304" }],
        causes: [
          "재고 행이 회차당 하나뿐이라 모든 발급이 같은 잠금을 순서대로 통과하고 FOR UPDATE는 조회 시점부터 INSERT까지 임계구간에 넣어 잠금 구간이 김",
          "도착률을 올리자 450 req/s부터 성공 응답 중앙값이 1초 이상인 회차가 나왔고(1/7), 500 req/s에선 7회 중 4회로 늘어남",
          "지연이 커진 회차도 5xx 없이 느려지기만 해서 가용성 지표만으로는 문제를 잡지 못함",
        ],
        solutions: [
          "검사와 차감을 UPDATE … WHERE active_count < total_quantity 한 문장으로 합쳐 잠금이 UPDATE에서 시작되게 하고 영향 행이 0이면 소진으로 판정",
          "1인 1매는 UNIQUE(coupon_id, member_id)로 DB에서 최종 보장",
          "이후 재고 판정을 Redis Lua 선점으로 옮기고 앞단에 적응형 대기열을 두는 구조로 확장 (아래 버전별 발전 과정)",
        ],
        checks: [
          "같은 커밋에서 잠금 방식만 바꾼 이미지로 재고 1만 · 요청 2만 조건, 300~500 req/s 도착률마다 7회씩 측정",
          "k6 constant-arrival-rate로 도착률 고정, 회차마다 발급 · 이력 · 멱등 · Redis 키를 롤백해 같은 상태에서 시작",
        ],
        results: [
          "500 req/s 성공 응답 p99 2,240 → 802ms, p95 2,160 → 641ms(중앙값 1초 이상 회차는 지연 집계에서 제외), 중앙값 1초 이상 회차 4/7 → 0/7",
          "105회차 전체에서 초과 발급 0건",
        ],
      },
      {
        title:
          "측정 환경에 다른 컨테이너가 함께 돌던 것을 발견해 이전 수치를 모두 폐기하고, 외부 요인을 통제한 환경에서 세 잠금 구현을 105회차 재측정",
        causes: [
          "첫 측정 때 다른 프로젝트 컨테이너 6개가 함께 돌고 있어 같은 FOR UPDATE 구현의 300 req/s p99가 6,873ms로 부풀려짐",
        ],
        solutions: [
          "외부 컨테이너를 모두 내리고 회차마다 외부 컨테이너 수와 호스트 CPU 기록",
          "세 이미지를 번갈아 실행해 시간대 편향을 없애고 회차마다 예열 후 측정",
        ],
        checks: [
          "105회차 모두 외부 컨테이너 0개로 기록된 것 확인",
          "k6 constant-arrival-rate로 도착률을 고정하고 요청 수 2만을 유지해 구현만 바뀐 비교가 되도록 함",
        ],
        results: [
          "같은 조건 FOR UPDATE 300 req/s p99 6,873 → 222.72ms로 외부 영향 제거, 이전 수치는 전부 폐기",
          "500 req/s 중앙값 1초 이상 회차: FOR UPDATE 4/7 · 조건부 UPDATE 0/7 · Redis 분리 실험 0/7",
        ],
      },
    ],
    versions: [
      {
        version: "v1.1",
        title: "비관적 락",
        status: "구현",
        problem:
          "동시 요청이 회차당 재고 행 하나를 두고 경쟁해 정합성 확보가 먼저",
        choice:
          "SELECT … FOR UPDATE로 재고 행을 잠근 뒤 검사·차감. DB가 정확성을 보장하는 가장 단순한 방식이라 이후 버전 비교의 기준선으로 삼음",
        tradeoff:
          "모든 발급이 같은 잠금을 순서대로 통과하고 INSERT까지 임계구간에 들어가 커넥션 풀을 늘려도 대기가 줄지 않음",
        metric:
          "450 req/s 중앙값 1초 이상 회차 1/7 · 500 req/s 성공 p95 2,160ms · p99 2,240ms · 중앙값 1초 이상 회차 4/7",
        next: "잠금 구간이 길어 포화 지점이 400~450 req/s에 머묾",
      },
      {
        version: "v1.2",
        title: "조건부 원자 UPDATE",
        status: "구현 · 제품 코드",
        problem:
          "요청마다 잠금 조회와 차감 UPDATE로 두 번 왕복하며 잠금을 오래 잡음",
        choice:
          "UPDATE … WHERE active_count < total_quantity 한 문장으로 검사와 차감을 합치고 영향 행이 0이면 소진 판정. 잠금이 UPDATE에서 시작돼 구간이 짧아짐",
        tradeoff:
          "재고 행 하나를 두고 경쟁하는 구조와 요청별 동기 DB 트랜잭션은 그대로 남음",
        metric:
          "500 req/s 성공 p95 641ms · p99 802ms · 중앙값 1초 이상 회차 0/7",
        next: "경합 지점이 여전히 DB의 재고 행 하나라 재고 카운트를 DB 밖으로 옮김",
      },
      {
        version: "v2.1",
        title: "Redis Lua 원자 선점",
        status: "구현",
        problem:
          "DB에 직렬 구간이 남아 있으면 커넥션을 늘려도 처리량이 늘지 않음",
        choice:
          "Lua 스크립트 5종(claim · complete · compensate · restore · reclaim)이 회차 상태 · 등급 · 1인 1매 · 재고를 한 번에 판정하고 차감. 발급은 선점 → 트랜잭션 → 완료 CAS 세 단계로 분리",
        tradeoff:
          "저장소가 둘로 나뉘어 선점 직후 중단되면 Redis가 DB보다 앞서감. 요청 토큰으로 보상, Redis 유실 시 DB 기준으로 재구성, Redis↔DB 격차 모니터링 지표 추가",
        metric:
          "재고 UPDATE를 별도 트랜잭션으로 분리한 실험(v2-split): 500 req/s 성공 p95 562ms · p99 748ms · 중앙값 1초 이상 회차 0/7 · 발급당 DB 쓰기 7행 → 3행 (실험 · 미커밋)",
        next: "DB 경합은 줄었지만 순간 유입 자체와 건별 영속화는 그대로 남음",
      },
      {
        version: "v2.2",
        title: "적응형 대기열",
        status: "핵심 경로 구현",
        problem:
          "순간적으로 몰리는 유입이 애플리케이션과 DB에 함께 과부하를 줌",
        choice:
          "게이트웨이를 별도 서비스로 분리한 이유는 세 가지. 경계(입장만 담당, 재고 차감은 쿠폰 서비스만) · 스택(입장은 WebFlux, 발급은 MVC + JPA라 한 프로세스에 두면 블로킹이 이벤트 루프를 막음) · 장애 격리(뒷단이 멈춰도 대기열 유지)",
        tradeoff:
          "입장은 순서만 보장할 뿐 발급은 보장하지 않음. 컴포넌트가 늘고 성공 요청마다 동기 DB 커밋도 여전히 필요",
        metric:
          "페이즈 게이트 7단계 통과 · 요청 경로 Redis 명령 0건 · 오버헤드 p99 < 5ms · 크레딧 초과 배분 0/10만 회 · 매진 후 동시 조회 1만 → 뒷단 1건",
      },
    ],
    goals: [
      "재고 1만·요청 2만 동시 발급에서 초과 발급 0건, 회차별 1인 1매 보장",
      "병목을 측정하며 DB 락 → 조건부 원자 UPDATE → Redis 선점 → 적응형 대기열 순으로 구조를 단계적으로 개선",
      "발급 이력을 재계산해 저장된 상태와 교차 검증하고 검증기 자체도 오류를 심은 데이터로 검증",
    ],
    features: [
      {
        title: "선착순 쿠폰 발급",
        desc: "멱등키(UUID)로 재시도해도 한 장만 발급, 조건부 원자 UPDATE와 UNIQUE(coupon_id, member_id)로 초과·중복 발급 차단",
      },
      {
        title: "적응형 대기열",
        desc: "평시엔 바로 통과, 혼잡하면 백엔드 가용량에 맞춰 입장량을 조절하고 순번·예상 대기시간·입장 토큰 제공",
      },
      {
        title: "정합성 검증 배치",
        desc: "검증 규칙 6종이 발급 이력을 런타임과 같은 상태 머신으로 재생해 재고 카운터·사용 실적과 대조",
      },
      {
        title: "대용량 시드 생성기",
        desc: "회원 100만·발급 300만·이력 534만 행을 정상셋과 오류를 심은 오염셋 두 벌로 생성, 시드 고정 RNG로 같은 시드면 같은 데이터 재현",
      },
      {
        title: "배치 이상 감지",
        desc: "알림 규칙 45종(critical 12 · warning 33), 잡은 성공했지만 데이터가 어긋난 경우도 별도 규칙으로 감지",
      },
    ],
    architecture: {
      nodes: [],
      edges: [],
      steps: [
        "사용자 요청이 NGINX를 거쳐 대기열 게이트웨이(WebFlux)로 들어오면 즉시 종결 · 무대기 통과 · 대기열 진입 중 하나로 판정",
        "통과한 발급 요청은 쿠폰 서비스가 멱등키를 IN_PROGRESS로 먼저 기록한 뒤 재고 판정. v1.2는 조건부 원자 UPDATE, v2.1은 Redis Lua 선점",
        "MySQL이 발급 · 상태 이력 · 사용 실적 · 멱등 응답을 저장하고 UNIQUE(coupon_id, member_id)로 1인 1매를 최종 보장",
        "발급 결과 알림은 Kafka로 발행",
        "배치 서버가 만료 · 정리 · 정합성 검증 · 집계를 발급 API와 분리해 수행, Prometheus가 API · 배치 · 대기열 지표 수집",
      ],
    },
    problemTitle: "측정 · 검증",
    problems: [],
    solutions: [],
    benchmark: {
      caption:
        "같은 커밋에서 재고 잠금 방식만 바꿔 재고 10,000 · 요청 20,000 조건으로 도착률마다 7회씩 측정했습니다. p95 · p99(ms)는 성공 응답 중앙값이 1초 미만인 회차들의 중앙값이며, 1초 이상인 회차 수는 오른쪽 열에 따로 표시했습니다.",
      headers: ["도착률", "구현", "p95", "p99", "1초 이상 회차"],
      rows: [
        { cells: ["300/s", "v1.1 FOR UPDATE", "50.10", "222.72", "0/7"] },
        { cells: ["", "v1.2 조건부", "28.12", "158.64", "0/7"], highlight: true },
        { cells: ["400/s", "v1.1 FOR UPDATE", "409.35", "481.83", "0/7"] },
        { cells: ["", "v1.2 조건부", "190.41", "264.03", "0/7"], highlight: true },
        { cells: ["450/s", "v1.1 FOR UPDATE", "562.01", "648.15", "1/7"] },
        { cells: ["", "v1.2 조건부", "368.66", "575.49", "0/7"], highlight: true },
        { cells: ["500/s", "v1.1 FOR UPDATE", "2,159.79", "2,239.89", "4/7"] },
        { cells: ["", "v1.2 조건부", "640.92", "802.16", "0/7"], highlight: true },
      ],
      footnote:
        "k6 constant-arrival-rate · 로컬 Docker(API 2대 · MySQL 단일) · 외부 컨테이너 0개 · 회차마다 상태 롤백. 1초 이상 회차는 성공 응답 중앙값이 1,000ms 이상인 회차로, 지연 집계에서 제외했습니다. 따라서 FOR UPDATE 450 · 500 req/s의 p95 · p99는 나머지 회차만의 값이며 실제 꼬리 지연은 더 나쁩니다.",
    },
    results: [],
    lessons:
      "평상 부하(300 req/s)에서는 세 구현의 성공 응답 중앙값이 3.4~4.0ms로 차이가 드러나지 않았습니다. 개선 효과는 평소 지연을 줄인 것이 아니라 포화 지점을 끌어올린 데 있었고, 이 차이는 지표를 제대로 고르고 측정 환경을 통제해야만 보인다는 것을 배웠습니다. 검증도 마찬가지로 '0건'이라는 결과는 오류를 심어 두고 전부 찾아냈을 때만 믿을 수 있다는 기준을 세웠습니다.",
    techChoices: [
      {
        name: "Spring Batch",
        reason:
          "만료 · 정리 · 검증 · 집계를 발급 API와 분리하고 실행·재시작 상태를 메타데이터로 추적",
      },
      {
        name: "MySQL · Flyway",
        reason:
          "UNIQUE 제약과 조건부 UPDATE로 정합성의 최종 보장을 DB에 두고 스키마 마이그레이션을 버전 관리",
      },
      {
        name: "Redis · Lua",
        reason:
          "재고 · 1인 1매 · 멱등 요청 판정을 원자적 스크립트 한 번으로 처리해 DB 재고 행 경합 감소",
      },
      {
        name: "k6 · Prometheus",
        reason:
          "도착률을 고정하고 구현만 바꿔 비교하려고 k6 constant-arrival-rate로 부하를 주고 서버 지표는 같은 회차에 맞춰 수집",
      },
      {
        name: "Python 시드 생성기",
        reason:
          "시드 고정 RNG와 Feistel 순열로 같은 시드에서 같은 데이터를 재현하고 UNIQUE 충돌 0을 설계상 보장하도록 직접 제작",
      },
    ],
  },

  "media-inference": {
    diagramKey: "intern-arch",
    hook: "백엔드 프로토타입 개발부터 데이터 분석 자동화, QA까지 맡은 사내 실무입니다.",
    description:
      "엠트리센 인턴 기간에 맡은 사내 실무를 기술 위주로 정리했습니다. 기획팀이 조사용으로 반복하던 엑셀 작업을 함께 맡으면서 대시보드로 자동화했습니다. 도메인·세부 기능·정량 성과는 대외비라 사용 기술과 구조만 공개합니다.",
    role: "백엔드 · 데이터 분석 자동화 · QA (사내 프로토타입)",
    period: "2025.08 ~ 2026.01",
    repoNote: "사내 · 비공개 저장소",
    works: [
      {
        title: "백엔드 프로토타입 · 처리 파이프라인",
        desc: "업로드 데이터 전처리 → 외부 처리 서버 연동 → 결과 저장·캐싱으로 이어지는 백엔드 파이프라인 구현, 업로드·전처리·외부 연동·저장을 서비스 레이어로 분리",
        stack: ["Node.js", "Express", "MongoDB", "Redis", "Docker"],
      },
      {
        title: "데이터 분석·시각화 대시보드 ①",
        desc: "기획팀이 조사용으로 반복하던 엑셀 작업을 부탁받아 자동화. 엑셀 데이터 로드·가공·통계 분석·차트 시각화를 하는 Streamlit 대시보드로 수작업 분석 대체",
        stack: ["Python", "Streamlit", "pandas", "numpy", "matplotlib", "scipy"],
      },
      {
        title: "데이터 분석·시각화 대시보드 ②",
        desc: "같은 기획팀 조사 업무에서 기간·조건별 엑셀 집계·분석을 Altair 차트 기반 Streamlit 대시보드로 자동화. 데이터 로드·가공·시각화는 유틸 모듈로 분리",
        stack: ["Python", "Streamlit", "pandas", "numpy", "Altair"],
      },
    ],
    qa: "- 자체 프로젝트(백엔드·데이터 도구): 테스트 케이스를 직접 설계·수행해 동작 검증. 백엔드는 Jest 단위·통합 테스트, 데이터 도구는 입력·경계(엣지) 케이스로 결과 검증\n- 타사 앱 QA: 사내에서 다른 회사 앱을 직접 테스트하고 결과를 테스트 보고서로 정리·보고하는 업무를 자주 담당",
    problemTitle: "문제",
    problems: [],
    solutions: [],
    results: [],
    lessons: "",
    techChoices: [],
    architecture: { nodes: [], edges: [], steps: [] },
  },
};
