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
  award?: string;
  repoNote?: string;
  diagramKey?: string; // when set, render the rich ArchitectureDiagram instead of the grid
  works?: { title: string; desc: string; stack: string[] }[]; // résumé-style experience page
  qa?: string;
  goals?: string[]; // 프로젝트 목표
  features?: { emoji?: string; title: string; desc: string }[]; // 주요 기능 카드 그리드
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
    hook: "자유발화 한 문장을 여러 개의 실행으로 나눠 처리하는 음성 주문 백엔드입니다.",
    description:
      "음성·터치로 메뉴 주문·추천을 처리하는 키오스크 서비스입니다. NLP 서버가 STT 텍스트를 LLM으로 의도(intents)·필터로 해석한 뒤, 오케스트레이터로서 API 서버를 호출하고 그 응답을 클라이언트에 되돌려주는 2단 백엔드 구조입니다.",
    role: "NLP 서버 설계·주도 · API 연동",
    award: "명지대 캡스톤디자인 금상",
    goals: [
      "자유발화 한 문장을 여러 개의 실행으로 나눠 처리하는 음성 주문 백엔드 구현",
      "LLM 출력을 intents·filters 스키마로 강제해 자연어를 안전하게 ‘실행’으로 변환",
      "멀티턴 대화 상태(pending·세션)를 서버가 책임지고 관리하는 구조 확립",
    ],
    features: [
      {
        emoji: "🎙️",
        title: "자유발화 의도 분석",
        desc: "한 문장에 섞인 여러 요청을 intents 배열로 분리해 순서대로 실행합니다.",
      },
      {
        emoji: "🔁",
        title: "멀티턴 옵션 완성",
        desc: "온도·크기 등 필수 옵션이 빠지면 pending으로 보관해 후속 발화로 완성합니다.",
      },
      {
        emoji: "⭐",
        title: "개인화 추천",
        desc: "주문↔메뉴를 aggregation으로 인기순 집계하고 이미 추천한 항목은 제외합니다.",
      },
      {
        emoji: "🛒",
        title: "주문·장바구니·결제",
        desc: "담기·수정·결제까지 하나의 발화 흐름으로 처리하고 Orders에 저장합니다.",
      },
      {
        emoji: "📄",
        title: "API 명세 자동화",
        desc: "menus·query·recommend·order·cart를 Swagger로 문서화해 연동 규격을 공유합니다.",
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
        "사용자가 음성 또는 터치로 요청하면, 클라이언트가 STT 텍스트와 현재 화면(page)을 NLP 서버로 보냅니다.",
        "NLP 서버는 gpt-4o-mini로 요청을 의도(intents)·필터 JSON으로 해석합니다. 한 문장에 여러 요청이 섞여도 intents 배열로 뽑습니다.",
        "NLP 서버가 오케스트레이터로서 그 intents를 query.sequence로 묶어 API 서버(/api/handle)를 호출합니다.",
        "API 서버는 intents를 순서대로 실행(추천·주문·결제)하고, 옵션이 빠지면 pending으로 세션에 보관해 다음 발화로 완성합니다.",
        "메뉴·주문은 MongoDB에서 조회·저장하고, 결과(안내·화면·항목)를 NLP 서버가 클라이언트로 되돌려줍니다.",
      ],
    },
    problemTitle: "문제",
    problems: [
      "한 문장에 여러 요청(‘카페라떼 빼고 아메리카노 추가하고 결제’)이 섞여 와도 순서대로 실행해야 했습니다.",
      "주문 시 온도·크기 같은 필수 옵션이 빠지면 즉시 실패시키지 않고 후속 발화로 이어 완성해야 했습니다.",
    ],
    solutions: [
      "LLM 시스템 프롬프트로 intents 9종·filters·옵션 정규화(샷 표현·온도 수식어 분리 등)를 규칙화하고, gpt-4o-mini로 JSON을 추출했습니다.",
      "intents가 있으면 query.sequence로 묶어 API 서버가 for-loop로 순차 실행하고, 중첩 응답은 results만 펼쳐(flatten) 하나로 합쳤습니다.",
      "옵션이 빠지면 pending 상태로 세션에 보관하고, 후속 발화(옵션만)가 오면 남은 옵션을 계산해 완성 시 장바구니에 담았습니다.",
      "추천은 MongoDB aggregation으로 주문↔메뉴를 $lookup·인기순 집계하고, 이미 추천한 항목은 $nin으로 제외해 재추천 중복을 막았습니다.",
      "menus·query·recommend·order·cart API를 Swagger(swagger-jsdoc)로 문서화해 프론트·NLP 연동 규격을 명세화했습니다.",
    ],
    results: [
      "발화 한 건으로 추천 → 주문 담기 → 옵션 선택(멀티턴) → 장바구니 수정 → 결제까지 도는 키오스크 백엔드를 구현했습니다.",
      "결제 시 메뉴별 수량을 그룹핑해 Orders 컬렉션(MongoDB Atlas)에 실제 저장하고, API를 Swagger로 명세화했습니다.",
    ],
    lessons:
      "자연어라는 비정형 입력을 백엔드가 안전하게 ‘실행’으로 옮기려면, LLM 출력의 스키마(intents·filters)를 강하게 규정하고 대화 상태(pending·세션)는 서버가 책임지고 관리해야 한다는 것을 배웠습니다.",
    techChoices: [
      {
        name: "FastAPI · Uvicorn",
        reason:
          "async 라우터로 LLM·백엔드 호출의 대기시간을 비동기로 흡수하기 위해 NLP 서버에 선택했습니다.",
      },
      {
        name: "gpt-4o-mini",
        reason:
          "자유발화에서 intents·filters JSON을 저비용·저지연으로 추출할 수 있어 채택했습니다(코드 기본 모델).",
      },
      {
        name: "Express",
        reason:
          "라우터·컨트롤러 분리로 intent별 도메인 로직을 위임하는 디스패처 구조를 구성하기 좋아 선택했습니다.",
      },
      {
        name: "MongoDB · Mongoose",
        reason:
          "메뉴 옵션(온도·샷·크기·optionPrices)처럼 가변 스키마를 문서로 저장하고 추천을 aggregation으로 계산하기 위함입니다.",
      },
      {
        name: "Swagger",
        reason:
          "라우트 JSDoc으로 API 명세를 자동화해 프론트·NLP 협업 규격을 공유하기 위해 도입했습니다.",
      },
    ],
  },

  "live-chat": {
    diagramKey: "live-chat",
    hook: "여러 Pod로 흩어진 시청자에게도 실시간으로 메시지가 도달하는 라이브 채팅 서버입니다.",
    description:
      "대규모 라이브 스트리밍 + 커머스 플랫폼 sapari에서 진행 중인 실시간 채팅 서버입니다. Spring WebFlux 논블로킹 + WebSocket으로 연결하고, Redis Pub/Sub 패턴 구독으로 Pod 간 메시지를 중계하며, 권한·레이트리밋·욕설 방어와 멱등·fail-open을 하나의 전송 파이프라인에 녹였습니다. 채팅 서버를 시작으로 다른 도메인도 맡아 지속적으로 업데이트할 예정입니다.",
    role: "sapari(라이브 스트리밍·커머스) 채팅 서버 담당 · 진행 중 · 도메인 확장 예정",
    goals: [
      "여러 Pod로 흩어진 시청자에게도 실시간으로 도달하는 stateless 수평 확장 채팅 서버",
      "논블로킹 리액티브 파이프라인에서 권한·레이트리밋·욕설 방어를 정확한 순서로 처리",
      "장애·악성 입력에도 죽지 않는 멱등·fail-open 전송 파이프라인 확보",
    ],
    features: [
      {
        emoji: "🔌",
        title: "WebSocket 실시간 채팅",
        desc: "WebFlux 논블로킹 이벤트루프로 연결당 스레드 없이 다수 동시 연결을 처리합니다.",
      },
      {
        emoji: "📡",
        title: "Pod 간 메시지 중계",
        desc: "Redis Pub/Sub 패턴 구독으로 어느 Pod에 붙든 같은 방 메시지를 fan-out 합니다.",
      },
      {
        emoji: "🛡️",
        title: "전송 파이프라인 방어",
        desc: "권한·강퇴·레이트리밋·욕설 마스킹을 비용이 낮은 검사부터 순서대로 처리합니다.",
      },
      {
        emoji: "🔤",
        title: "욕설 우회 차단",
        desc: "Aho-Corasick 1-패스로 특수문자 삽입·토큰 조인 우회까지 탐지하되 사전어는 보존합니다.",
      },
      {
        emoji: "♻️",
        title: "멱등 · fail-open",
        desc: "clientMsgId 유니크 인덱스로 중복 발행을 막고 Redis 장애 시 채팅을 지속합니다.",
      },
      {
        emoji: "🔑",
        title: "RS256 룸 토큰",
        desc: "chat은 공개키 검증만 하게 해 소유자 토큰 위조를 구조적으로 차단합니다.",
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
        "시청자가 WebSocket으로 접속하며 방 토큰(RS256)을 서브프로토콜 헤더로 제시하면, 입장 게이트가 검증·강퇴·방 종료를 확인합니다.",
        "메시지가 오면 전송 파이프라인이 비용이 낮은 검사부터(권한 → 강퇴 → 레이트리밋 → 욕설 마스킹) 순서대로 처리합니다.",
        "통과한 메시지는 MongoDB에 먼저 저장(원문+마스킹본)한 뒤 Redis에 발행합니다(persist-then-publish).",
        "Redis Pub/Sub의 chat:pubsub:* 패턴을 상시 구독하는 스트림이 이를 받아 다른 Pod의 시청자에게 fan-out 합니다.",
        "clientMsgId + Mongo 유니크 인덱스로 중복 발행을 막고, Redis 장애 시에는 fail-open으로 채팅을 지속합니다.",
      ],
    },
    problemTitle: "문제",
    problems: [
      "WebSocket은 stateful이라 시청자가 여러 Pod에 흩어져 붙고, A Pod에 붙은 발신자의 메시지를 B Pod 시청자에게 실시간 전달해야 했습니다.",
      "단일 이벤트루프를 블로킹 없이 유지하면서 재전송·중복 프레임·레이트리밋 회피(파이프라이닝)를 막아야 했습니다.",
      "채팅 본문·clientMsgId·프레임 등 신뢰경계 밖 입력의 욕설 우회·로그 위조를 방어해야 했습니다.",
    ],
    solutions: [
      "비용 0인 검사를 앞에, Redis I/O를 뒤에 두는 순서(방 생존 → 검증 → 권한 → 강퇴 → 레이트리밋 → 욕설 마스킹 → 저장 → 발행)로 전송 파이프라인을 구성했습니다.",
      "Redis Pub/Sub 패턴(chat:pubsub:*)을 상시 hot 스트림으로 구독해, 방별 lazy 구독의 ‘구독 전 유실 레이스’ 없이 Pod 간 fan-out 했습니다.",
      "욕설은 Aho-Corasick 1-패스로 탐지하고, 특수문자 삽입·인접 토큰 조인 우회까지 잡되 ‘시발점’ 같은 사전어는 화이트리스트로 보존했습니다.",
      "clientMsgId + Mongo partial unique index로 멱등 처리해(persist-then-publish) 재전송 시 중복 발행을 억제하고 기존 메시지로 ack 했습니다.",
      "강퇴·레이트리밋 조회가 Redis 장애로 실패하면 채팅을 허용하는 fail-open을 택하되, onErrorResume 람다 안 throw 금지·시간 기반 스로틀 로그로 정책 역전을 막았습니다.",
      "chat-api(계약) ↔ chat-core(도메인·인프라)를 헥사고날로 분리하고 ArchUnit으로 강제했으며, 인바운드는 concatMap으로 순차 처리했습니다.",
    ],
    results: [
      "어느 Pod에 붙든 같은 방 메시지를 받는 stateless 수평 확장 구조를 만들고, TestContainers 통합 테스트(크로스 Pod 브로드캐스트)로 검증했습니다.",
      "Redis 장애 시 fail-open, poison-message는 개별 skip, 재전송은 멱등으로 처리해 장애·악성 입력에도 죽지 않는 파이프라인을 확보했습니다.",
    ],
    lessons:
      "논블로킹 리액티브 파이프라인에서는 ‘무엇을 검사하느냐’만큼 ‘어느 순서로, 어느 에러 경계에서 검사하느냐’가 정확성을 좌우해서, fail-open 람다 안 throw 금지나 concatMap 강제 같은 불변식을 코드에 못 박아 두지 않으면 가용성 정책이 조용히 뒤집힌다는 것을 체득했습니다.",
    techChoices: [
      {
        name: "Spring WebFlux",
        reason:
          "WebSocket 다수 동시 연결을 이벤트루프로 처리해, 연결당 스레드를 쓰지 않고 라이브 채팅의 동시성을 감당하기 위해 선택했습니다.",
      },
      {
        name: "WebSocket (raw)",
        reason:
          "채팅 프레임을 직접 제어(TEXT 파싱, close code에 종료 사유 탑재)하려 STOMP 대신 raw WebSocket을 채택했습니다.",
      },
      {
        name: "Redis Pub/Sub",
        reason:
          "패턴 구독 하나로 상시 hot 스트림을 만들어 구독 레이스 없이 Pod 간 fan-out 하고, 규모가 커지면 어댑터만 교체할 여지를 남겼습니다.",
      },
      {
        name: "Redis (상태)",
        reason:
          "크로스 Pod 공유 상태(세션·강퇴·레이트리밋)를 외재화하고, SET NX EX 단일 원자 연산으로 레이트리밋 TOCTOU 레이스를 제거했습니다.",
      },
      {
        name: "MongoDB (reactive)",
        reason:
          "append-heavy한 채팅 메시지를 _id 커서 페이징 + TTL 인덱스로 저장·조회하기에 적합해 선택했습니다.",
      },
      {
        name: "RS256 룸 토큰",
        reason:
          "발급은 개인키(live), chat은 공개키 검증만 하게 해 chat이 소유자 토큰을 위조하지 못하도록 PII 게이트를 구조적으로 안전하게 만들었습니다.",
      },
    ],
  },

  haeyaji: {
    logo: "/logos/haeyaji.png",
    diagramKey: "haeyaji",
    hook: "작은 로컬 LLM을 규칙과 RAG로 감싸 ‘오늘 뭐 할지’를 결정론적으로 추천하는 두뇌입니다.",
    description:
      "날씨·시간대·위치를 근거로 할 일을 실제 장소와 함께 추천하는 투두 앱입니다. 추천 두뇌(NLP 서버)를 단독으로 만들고, 백엔드에서는 날씨 중계·추천 게이트웨이·개인화 학습·알림 도메인을 맡았습니다.",
    role: "NLP 추천 두뇌 단독 개발 · 백엔드 날씨/추천/개인화/알림 도메인",
    goals: [
      "작은 로컬 LLM을 규칙·RAG로 감싸 ‘오늘 뭐 할지’를 결정론적으로 추천하는 두뇌 구현",
      "환각·JSON 붕괴·오분류를 스키마 강제와 규칙 선-라우팅으로 흡수",
      "느린 LLM 응답 중에도 커넥션풀·외부 API·알림이 안전한 백엔드 도메인 설계",
    ],
    features: [
      {
        emoji: "🧠",
        title: "RAG 환각 차단",
        desc: "카카오 장소 후보를 프롬프트에 주입해 실재하는 후보 안에서만 추천하게 합니다.",
      },
      {
        emoji: "⚙️",
        title: "규칙 선-라우팅",
        desc: "막연어·부정·프롬프트 인젝션을 LLM 전에 결정론적으로 걸러 검색어·카테고리를 확정합니다.",
      },
      {
        emoji: "📐",
        title: "스키마 강제 출력",
        desc: "Ollama format=schema로 JSON을 강제하고 실패·타임아웃에도 규칙 폴백을 반환합니다.",
      },
      {
        emoji: "📈",
        title: "개인화 학습",
        desc: "고른 것 +2 / 안 고른 것 -0.05를 (날씨×시간대) 맥락별 가중치로 누적·decay 합니다.",
      },
      {
        emoji: "🌦️",
        title: "날씨 중계 파이프라인",
        desc: "위경도→격자 변환·발표시각 자동 계산·Redis 캐시·fail-soft로 기상청·에어코리아를 중계합니다.",
      },
      {
        emoji: "🔔",
        title: "이벤트 기반 알림",
        desc: "도메인 직접 호출을 없애고 AFTER_COMMIT + REQUIRES_NEW로 알림 유실을 방지합니다.",
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
        "프론트에서 발화가 오면 Spring 백엔드가 개인화 프로필·일정 맥락을 붙여 NLP 서버로 넘깁니다.",
        "NLP 서버는 막연어·부정·프롬프트 인젝션을 규칙으로 먼저 걸러 결정론적으로 검색어·카테고리를 정합니다.",
        "백엔드가 카카오 로컬로 실제 장소 후보를 프록시하고, 기상청·에어코리아 날씨를 Redis 캐시로 중계합니다.",
        "NLP 서버가 후보 목록을 프롬프트에 주입해 Ollama(EXAONE)를 format=schema로 호출 → 후보 안에서만 고르게 해 환각을 막습니다.",
        "결과는 구조화 JSON으로 백엔드를 거쳐 프론트로. 고른 것/안 고른 것은 맥락별 가중치로 학습됩니다.",
      ],
    },
    problemTitle: "문제",
    problems: [
      "작은 로컬 LLM(2.4~7.8b)이 막연한 발화를 오분류하고, 존재하지 않는 가게를 지어내며(환각), 구조화 JSON을 깨뜨렸습니다.",
      "LLM 응답이 최대 20~45초라 트랜잭션·커넥션풀을 붙잡으면 고갈되고, 외부 API 호출 폭주와 알림 유실도 함께 막아야 했습니다.",
    ],
    solutions: [
      "LLM은 활동·검색어만 정하게 하고 카카오 후보 목록을 프롬프트에 주입해 그중에서만 고르게 하는 RAG로 환각을 차단했습니다(후보에 없으면 장소 연결 해제).",
      "막연어·재요청·부정·인사·도메인 밖 거절·프롬프트 인젝션을 LLM 전에 규칙이 결정론적으로 확정하고, 카테고리는 날씨×시간대 가점으로 점수화했습니다.",
      "Ollama 호출에 format=<Pydantic schema>로 출력 스키마를 강제하고, 실패·타임아웃·깨진 JSON에도 500 대신 규칙 기반 폴백을 반환했습니다.",
      "느린 nlp 호출 전에 DB 조립을 끝내 커넥션을 반납하도록 추천 게이트웨이의 트랜잭션을 분리해, LLM 응답 동안 커넥션풀이 고갈되지 않게 했습니다.",
      "고른 것 +2 / 같이 떴는데 안 고른 것 -0.05를 (날씨×시간대) 맥락별로 원자적 누적하고 주간 decay하는 개인화 가중치를 학습했습니다.",
      "위경도→격자·중기 지역코드·최근접 측정소 변환과 발표시각 자동 계산, Redis 캐시·fail-soft로 기상청·에어코리아 날씨 중계 파이프라인을 만들었습니다.",
    ],
    results: [
      "nlp 시나리오 자동 채점 59/80을 통과했습니다(날씨/위치 인텐트 19/20, 멀티턴·프롬프트 인젝션 방어 17/20).",
      "LLM·네트워크를 쓰지 않는 결정론 테스트(nlp 119개·be 36개)로 규칙·라우팅·폴백·날씨 변환·알림 멱등을 회귀 검증했습니다.",
    ],
    lessons:
      "작은 로컬 LLM을 실서비스에 쓰려면 모델을 더 키우기보다, 흔들리는 부분(라우팅·검색어·환각)을 결정론적 규칙과 스키마 강제·RAG로 감싸 LLM의 자유도를 좁히는 게 품질과 지연·장애 내성을 동시에 얻는 길이라는 걸 배웠습니다.",
    techChoices: [
      {
        name: "Ollama + EXAONE 3.5",
        reason:
          "외부 LLM API 비용·키 없이 로컬 구동하고, 한국어 추천 태스크에서 7.8b(정확도)/2.4b(속도)를 실측 비교해 선택했습니다.",
      },
      {
        name: "규칙 선-라우팅 + format=schema",
        reason:
          "작은 모델의 오분류·JSON 붕괴를 LLM 전/출력 단계에서 흡수해 결정론적 품질을 확보하기 위함입니다.",
      },
      {
        name: "nlp stateless + be 단일 진실원천",
        reason:
          "장소검색·지오코딩·시크릿을 be 프록시로 몰아 nlp 외부 의존을 Ollama 하나로 줄여 확장·교체를 쉽게 했습니다.",
      },
      {
        name: "Redis 캐시",
        reason:
          "인스턴스 공유·재시작 내성과 함께 외부 API(기상청·에어코리아) 호출량 상한·장애 격리를 위해 사용했습니다.",
      },
      {
        name: "도메인 이벤트 기반 알림",
        reason:
          "도메인 간 직접 호출을 없애고 AFTER_COMMIT + REQUIRES_NEW로 알림 유실을 방지하기 위해 채택했습니다.",
      },
    ],
  },

  "blog-platform": {
    diagramKey: "blog-platform",
    hook: "엔드포인트별 인증 요구와 한국어 검색이라는 두 난제를 미들웨어와 형태소 분석으로 푼 블로그 백엔드입니다.",
    description:
      "인증부터 게시글·댓글·좋아요·팔로우·쪽지·스토리까지 갖춘 블로그 플랫폼 백엔드 개인 프로젝트입니다.",
    role: "Express · MongoDB 백엔드 (개인)",
    goals: [
      "엔드포인트마다 다른 인증 요구 수준을 미들웨어 분리로 해결",
      "조사·어미가 붙는 한국어에서 의미 있는 유사글 추천을 형태소 분석으로 구현",
      "게시글·댓글·좋아요·팔로우·쪽지·스토리 등 8개 도메인 REST API 완성",
    ],
    features: [
      {
        emoji: "🔐",
        title: "엔드포인트별 인증 3종",
        desc: "필수·선택·refresh 미들웨어를 라우트별 요구 수준에 맞게 골라 붙입니다.",
      },
      {
        emoji: "🔤",
        title: "형태소 유사글 추천",
        desc: "mecab-ya로 명사를 뽑고 제목을 3배 가중해 text 인덱스 $text 유사도로 추천합니다.",
      },
      {
        emoji: "🔎",
        title: "검색 전략 분리",
        desc: "text 인덱스는 추천용으로 두고 일반 검색은 regex $or로 나눠 인덱스 충돌을 피합니다.",
      },
      {
        emoji: "📊",
        title: "인기순 정렬",
        desc: "조회수+좋아요+댓글을 합산해 aggregate로 인기순을 계산합니다.",
      },
      {
        emoji: "⏳",
        title: "24h TTL 스토리",
        desc: "TTL 인덱스로 스토리를 24시간 뒤 자동 삭제합니다.",
      },
      {
        emoji: "🖼️",
        title: "안전한 업로드·해싱",
        desc: "Multer로 MIME·5MB를 필터링하고 비밀번호는 bcrypt(cost 12)로 해싱합니다.",
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
        "클라이언트 요청이 오면 인증 미들웨어가 엔드포인트에 맞는 3종(필수·선택·refresh) 중 하나로 토큰을 검증합니다.",
        "이미지가 있으면 업로드 미들웨어(Multer)가 MIME·용량을 검사해 저장합니다.",
        "라우터/컨트롤러가 게시글·댓글·좋아요·팔로우·쪽지·스토리 등 8개 도메인 로직을 처리합니다.",
        "게시글 본문은 mecab-ya 형태소 분석으로 명사를 뽑아 검색·추천 키워드로 저장합니다.",
        "MongoDB에 저장하며, 추천은 형태소 text 인덱스로, 일반 검색은 regex로 나눠 인덱스 충돌을 피합니다.",
      ],
    },
    problemTitle: "문제",
    problems: [
      "‘비슷한 글 추천’을 위해 조사·어미가 붙는 한국어에서 의미 있는 유사도를 뽑아야 했는데, 단순 문자열 매칭으로는 유사도가 나오지 않았습니다.",
      "엔드포인트마다 인증 요구 수준이 달라(작성=필수, 상세 조회=비로그인 허용+로그인 시 좋아요 상태, 갱신=refresh만) 하나의 인증 로직으로는 처리할 수 없었습니다.",
    ],
    solutions: [
      "인증을 authenticateToken / optionalAuth / authenticateRefreshToken 3종으로 분리하고, 각 라우트가 요구 수준에 맞게 골라 붙였습니다.",
      "토큰 payload에 type(access/refresh)을 넣어 종류를 구분하고, 발급·검증 로직을 JWT 유틸로 모듈화했습니다.",
      "mecab-ya로 게시글에서 한국어 명사를 추출하고 제목 키워드를 3배 가중해 analyzed_keywords_text에 text 인덱스를 걸어, $text + textScore로 유사글을 추천했습니다.",
      "컬렉션당 text 인덱스는 1개뿐이라 그 자리를 추천용이 차지 → 일반 제목·본문 검색은 regex $or로 나눠 인덱스 충돌을 회피했습니다.",
      "비밀번호는 스키마 pre-save 훅에서 bcrypt(cost 12)로 해싱하고, 좋아요는 unique 복합 인덱스로 중복을 막으며 카운터를 $inc로 동기화했습니다.",
      "스토리는 TTL 인덱스로 24시간 뒤 자동 삭제되게 구성했습니다.",
    ],
    results: [
      "인증(3종)·게시글·댓글·좋아요·팔로우·쪽지·스토리 8개 도메인 REST API가 동작하는 백엔드를 완성했습니다.",
      "형태소 기반 유사글 추천과 조회수+좋아요+댓글 합산 인기순 정렬, 24시간 TTL 스토리 등 기본 CRUD를 넘는 기능을 인덱스·aggregate로 구현했습니다.",
    ],
    lessons:
      "한글에서 의미 단위(명사)를 뽑으려면 형태소 분석기가 필요하고, MongoDB text 인덱스 제약(컬렉션당 1개)과 부딪히면서 같은 데이터라도 목적에 따라 검색 전략(추천은 형태소+text, 검색은 regex)을 나눠야 한다는 것을 체감했습니다.",
    techChoices: [
      {
        name: "Express",
        reason:
          "8개 도메인을 Router로 나누고 미들웨어 체인(인증→업로드→핸들러)으로 요청을 조립하기 위한 경량 프레임워크로 선택했습니다.",
      },
      {
        name: "MongoDB · Mongoose",
        reason:
          "팔로워 배열·스키마 validation·TTL·text·unique 인덱스·aggregate를 스키마 레벨에서 다루기 위해 사용했습니다.",
      },
      {
        name: "jsonwebtoken",
        reason:
          "무상태 인증으로 access/refresh 토큰을 type 필드로 구분하고 만료를 분리 관리하기 위해 채택했습니다.",
      },
      {
        name: "mecab-ya",
        reason:
          "한국어 명사 추출(형태소 분석)로 유사글 추천용 키워드를 생성하기 위해 도입했습니다.",
      },
      {
        name: "multer · bcryptjs",
        reason:
          "이미지 업로드(파일명 충돌 방지·MIME·5MB 필터)와 비밀번호 해싱(cost 12)을 표준 라이브러리로 안전하게 처리했습니다.",
      },
      {
        name: "helmet",
        reason:
          "보안 HTTP 헤더를 적용하고, 업로드 이미지의 cross-origin 접근을 위해 crossOriginResourcePolicy를 조정했습니다.",
      },
    ],
  },

  zogakzip: {
    logo: "/logos/zogakzip.png",
    diagramKey: "zogakzip",
    hook: "추억을 그룹·게시글·이미지 계층으로 기록하는 서비스의 백엔드를 2인 팀으로 개발했습니다.",
    description:
      "추억을 그룹 > 게시글 > 댓글·이미지 계층으로 기록하는 서비스의 백엔드입니다. 저는 게시글 API, 이미지 업로드, 한국 시간대(KST) 일관 처리를 맡았고, 활동 기반 배지 시스템은 팀이 함께 갖췄습니다.",
    role: "게시글 API · 이미지 업로드 · KST 시간대 처리 (2인 팀)",
    award: "코드잇 데모데이 대상",
    goals: [
      "추억을 그룹 > 게시글 > 이미지 계층으로 기록하는 서비스 백엔드 구현",
      "2인 팀에서 게시글 API·이미지 업로드·KST 시간대 처리 도메인 담당",
      "참조 계층·카운터·시간대를 일관되게 유지하는 데이터 규칙 확립",
    ],
    features: [
      {
        emoji: "📝",
        title: "게시글 API",
        desc: "그룹>게시글>댓글 계층 CRUD를 정렬·페이지네이션과 함께 제공합니다.",
      },
      {
        emoji: "🖼️",
        title: "이미지 업로드",
        desc: "Multer diskStorage로 유니크 파일명·MIME 이중 검사 후 절대 URL로 서빙합니다.",
      },
      {
        emoji: "🕐",
        title: "KST 시간대 통일",
        desc: "moment-timezone으로 저장·응답 시각을 Asia/Seoul로 일관 처리합니다.",
      },
      {
        emoji: "🔢",
        title: "카운터 동기화",
        desc: "게시글·댓글 등록 시 상위 문서의 postCount·commentCount를 $inc로 맞춥니다.",
      },
      {
        emoji: "🏅",
        title: "활동 배지 (팀 기능)",
        desc: "활동 조건 충족 시 이벤트 훅과 24시간 배치로 배지를 자동 부여합니다.",
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
        "클라이언트 요청이 Express 서버로 오면 라우트가 ObjectId·필수 필드를 검증합니다.",
        "이미지는 Multer로 유니크 파일명·MIME 이중 검사 후 저장하고 절대 URL로 서빙합니다.",
        "게시글·댓글 등록 시 상위 문서의 카운터(postCount·commentCount)를 $inc로 동기화합니다.",
        "저장·응답 시각은 moment-timezone으로 KST로 통일해 시간대 오차를 제거합니다.",
        "활동 조건 충족 시 배지를 이벤트 훅(즉시)과 24시간 배치(시간 경과형)로 갱신합니다 — 팀이 함께 구현한 기능입니다.",
      ],
    },
    problemTitle: "문제",
    problems: [
      "그룹 > 게시글 > 이미지 계층을 참조로 구조화하고, 게시글 수 같은 카운터를 일관되게 동기화해야 했습니다.",
      "저장(UTC)과 응답(KST) 시각이 어긋나, 모든 도메인에서 저장·표시 시각을 일관되게 맞춰야 했습니다.",
    ],
    solutions: [
      "Group/Post/Comment/Image 스키마를 참조 필드로 계층화하고, 게시글 등록·댓글 시 상위 문서의 postCount·commentCount를 $inc로 동기화했습니다.",
      "이미지 업로드는 Multer diskStorage로 유니크 파일명을 만들고 MIME·확장자를 이중 검사한 뒤, 절대 URL로 저장해 express.static으로 서빙했습니다.",
      "moment-timezone으로 저장 시 Asia/Seoul로 변환하고 응답도 KST 포맷으로 통일해 시간대 오차를 제거했습니다.",
      "게시글 목록은 정렬·페이지네이션을 지원하고, 배지 개수 정렬 시에만 $addFields로 동적 aggregation을 구성했습니다.",
      "활동 조건(연속 게시·누적 공감 등) 충족 시 배지를 자동 부여하는 시스템을 팀이 함께 갖춰, 이벤트 훅과 24시간 배치로 갱신하게 했습니다.",
    ],
    results: [
      "그룹·게시글·댓글·이미지 CRUD와 공감·공개여부 조회 등 REST API가 동작하는 백엔드를 팀으로 완성했습니다.",
      "제가 맡은 게시글 API·이미지 업로드·KST 시간대 처리를 안정적으로 구현해 통합했습니다.",
    ],
    lessons:
      "팀 개발에서는 도메인 경계를 나누고 각자 맡은 API·데이터 규칙(참조 계층·카운터·시간대)을 일관되게 유지하는 것이 전체 통합 속도를 좌우한다는 것을 배웠습니다.",
    techChoices: [
      {
        name: "Express",
        reason:
          "가볍고 라우팅이 단순해 소규모 팀이 빠르게 CRUD API를 분담·구축하기 좋아 선택했습니다.",
      },
      {
        name: "MongoDB · Mongoose",
        reason:
          "그룹 > 게시글 > 댓글의 유연한 계층 문서 구조를 스키마 변경 부담 없이 다루기 위해 사용했습니다.",
      },
      {
        name: "moment-timezone",
        reason:
          "저장·응답 시각을 KST로 일관 변환해 시간대 오차를 제거하기 위해 도입했습니다.",
      },
      {
        name: "Multer",
        reason:
          "multipart 이미지 업로드와 디스크 저장·필터링을 표준적으로 처리하기 위해 사용했습니다.",
      },
    ],
  },

  "media-inference": {
    diagramKey: "intern-arch",
    hook: "백엔드 프로토타입부터 데이터 분석 자동화, QA까지 수행한 사내 실무입니다.",
    description:
      "엠트리센 인턴 중 수행한 사내 실무를 기술 중심으로 정리했습니다. 도메인·세부 기능·정량 성과는 대외비라, 사용 기술과 구조만 공개합니다.",
    role: "백엔드 · 데이터 분석 자동화 · QA (사내 프로토타입)",
    repoNote: "사내 · 비공개 저장소",
    works: [
      {
        title: "미디어 추론 백엔드",
        desc: "업로드된 미디어(오디오·영상)를 ffmpeg로 전처리하고 외부 AI 추론 서버와 연동해 결과를 저장·캐싱하는 파이프라인. 업로드·전처리·추론·저장을 서비스 레이어로 분리했습니다.",
        stack: ["Node.js", "Express", "fluent-ffmpeg", "MongoDB", "Redis", "Docker"],
      },
      {
        title: "데이터 분석·시각화 대시보드 ①",
        desc: "엑셀 데이터를 불러와 가공·통계 분석하고 차트로 시각화하는 Streamlit 대시보드. 수작업 분석을 대체하는 자동화 도구로 만들었습니다.",
        stack: ["Python", "Streamlit", "pandas", "numpy", "matplotlib", "scipy"],
      },
      {
        title: "데이터 분석·시각화 대시보드 ②",
        desc: "엑셀 데이터를 기간·조건별로 집계·분석하고 Altair 차트로 시각화하는 Streamlit 대시보드. 데이터 로드·가공·시각화를 유틸로 모듈화했습니다.",
        stack: ["Python", "Streamlit", "pandas", "numpy", "Altair"],
      },
    ],
    qa: "- 자체 프로젝트(백엔드·데이터 도구): 직접 테스트 케이스를 설계하고 실제 테스트를 수행해 동작을 검증했습니다. 백엔드는 Jest 단위·통합 테스트, 데이터 도구는 입력·경계(엣지) 케이스로 결과를 검증했습니다.\n- 타사 앱 QA: 사내에서 다른 회사 앱에 대한 테스트를 직접 수행하고, 결과를 테스트 보고서로 정리·보고하는 업무를 자주 맡았습니다.",
    problemTitle: "문제",
    problems: [],
    solutions: [],
    results: [],
    lessons: "",
    techChoices: [],
    architecture: { nodes: [], edges: [], steps: [] },
  },
};
