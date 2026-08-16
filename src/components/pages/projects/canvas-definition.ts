import type { CanvasEdge, CanvasNode } from "@/components/canvas/workflow-canvas";
import type { Project } from "@/types/project";

type ProjectOverviewPage = {
  eyebrow: string;
  title: string;
  description: string;
  note: string;
};

type ProjectOverviewMeta = {
  subtitle: string;
  summary: string;
  highlights: string[];
  stack: string[];
  icon: {
    src: string;
    alt: string;
  };
};

type ProjectsCanvasDefinition = {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
};

const projectOverviewMeta: Record<string, ProjectOverviewMeta> = {
  "voice-kiosk": {
    subtitle: "AI Voice Kiosk Backend",
    summary:
      "자유발화 한 문장을 여러 개의 실행으로 나눠 처리하는 음성 주문 백엔드입니다.\n\nNLP 서버가 STT 텍스트를 LLM으로 의도(intents)로 해석해 API 서버를 오케스트레이션하고, 추천·멀티턴 주문·결제까지 하나의 발화 흐름으로 처리합니다.",
    highlights: ["자유발화 의도 분석", "멀티턴 주문", "명지대 캡스톤 금상"],
    stack: ["FastAPI", "Express", "MongoDB", "OpenAI"],
    icon: {
      src: "/logos/voice-kiosk.png",
      alt: "음성인식 키오스크",
    },
  },
  "live-chat": {
    subtitle: "sapari · Live Streaming & Commerce",
    summary:
      "대규모 라이브 스트리밍 + 커머스 플랫폼 sapari에서 진행 중인 실시간 채팅 서버입니다.\n\nSpring WebFlux 논블로킹 + WebSocket으로 연결하고 Redis Pub/Sub으로 Pod 간 메시지를 중계합니다. 채팅을 시작으로 다른 도메인도 맡아 지속 업데이트 예정입니다.",
    highlights: [
      "진행 중 · 업데이트 예정",
      "WebFlux · WebSocket",
      "Redis Pub/Sub fan-out",
    ],
    stack: ["Spring WebFlux", "Redis", "MongoDB", "WebSocket"],
    icon: {
      src: "/icons/tech/spring.svg",
      alt: "라이브 채팅 서버",
    },
  },
  haeyaji: {
    subtitle: "AI To-do Recommender",
    summary:
      "날씨·시간대·위치를 근거로 할 일을 실제 장소와 함께 추천하는 투두 앱입니다.\n\n작은 로컬 LLM(EXAONE)을 규칙과 RAG로 감싸 환각을 막고, 백엔드에서 날씨 중계·추천 게이트웨이·개인화 학습·알림 도메인을 맡았습니다.",
    highlights: ["RAG 환각 차단", "규칙 선-라우팅", "개인화 학습"],
    stack: ["FastAPI", "Spring Boot", "Ollama", "Redis"],
    icon: {
      src: "/logos/haeyaji.png",
      alt: "해야지",
    },
  },
  "blog-platform": {
    subtitle: "Blog Platform Backend",
    summary:
      "인증부터 게시글·댓글·좋아요·팔로우·쪽지·스토리까지 갖춘 블로그 플랫폼 백엔드 개인 프로젝트입니다.\n\n엔드포인트별 인증을 미들웨어 3종으로 분리하고, 한국어 형태소 분석(mecab-ya)으로 유사글을 추천합니다.",
    highlights: ["인증 미들웨어 3종", "형태소 유사글 추천", "8개 도메인 REST"],
    stack: ["Express", "MongoDB", "JWT", "mecab-ya"],
    icon: {
      src: "/icons/tech/nodejs.svg",
      alt: "Blog Platform",
    },
  },
  zogakzip: {
    subtitle: "Memory Archive Backend",
    summary:
      "추억을 그룹 > 게시글 > 댓글·이미지 계층으로 기록하는 서비스의 백엔드입니다.\n\n2인 팀에서 게시글 API·이미지 업로드·KST 시간대 처리를 맡았고, 활동 기반 배지 시스템은 팀이 함께 갖췄습니다.",
    highlights: ["게시글 API", "이미지 업로드", "코드잇 데모데이 대상"],
    stack: ["Express", "MongoDB", "Multer", "moment-timezone"],
    icon: {
      src: "/logos/zogakzip.png",
      alt: "조각집",
    },
  },
  "media-inference": {
    subtitle: "엠트리센 인턴 · 사내 실무",
    summary:
      "인턴 중 수행한 백엔드 프로토타입·데이터 분석 자동화·QA 실무입니다.\n\n미디어 추론 백엔드와 Streamlit 데이터 대시보드 2종을 개발하고, 자체 프로젝트 테스트와 타사 앱 QA·보고를 수행했습니다. (도메인·정량 성과는 대외비)",
    highlights: ["미디어 추론 백엔드", "데이터 분석 자동화", "QA · 테스트"],
    stack: ["Node.js", "Python", "Streamlit", "Docker"],
    icon: {
      src: "/icons/tech/nodejs.svg",
      alt: "엠트리센 인턴",
    },
  },
};

export function getProjectsCanvasDefinition({
  projects,
  projectsPage,
}: {
  projects: Project[];
  projectsPage: ProjectOverviewPage;
}): ProjectsCanvasDefinition {
  const featuredProjects = projects.filter((project) => project.featured).slice(0, 6);
  const projectNodes: CanvasNode[] = featuredProjects.map((project, index) => {
    const meta = projectOverviewMeta[project.slug] ?? {
      subtitle: project.type,
      summary: project.description,
      highlights: project.stack.slice(0, 3),
      stack: project.stack,
      icon: {
        src: "/file.svg",
        alt: `${project.title} icon`,
      },
    };

    return {
      id: `project-${project.slug}`,
      kind: "note",
      title: project.title,
      titleHref: `/projects/${project.slug}`,
      titleTooltip: `${project.title} 상세 페이지로 이동`,
      icon: meta.icon,
      order: 2 + index,
      x: index % 2 === 0 ? 13 : 50,
      y: 36 + Math.floor(index / 2) * 25,
      width: 34,
      markdown: [
        `**${meta.subtitle}**`,
        "",
        meta.summary.split("\n\n")[0],
        "",
        `- :company: ${project.type}`,
        `- :stack: ${meta.stack.map((item) => `\`${item}\``).join(" ")}`,
        ...(project.href ? ["", `- :github: [GitHub](${project.href})`] : []),
      ].join("\n"),
    };
  });

  return {
    edges: [],
    nodes: [
      {
        id: "projects-summary",
        kind: "note",
        appearance: "default",
        order: 1,
        x: 13,
        y: 7,
        width: 52,
        markdown: [
          `# ${projectsPage.eyebrow}`,
          "",
          projectsPage.title,
          "",
          projectsPage.description,
          "",
          projectsPage.note,
        ].join("\n"),
      },
      ...projectNodes,
    ],
  };
}
