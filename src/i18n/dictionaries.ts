import type { Project } from "@/types/project";
import type { Locale } from "./config";

type SkillGroup = {
  title: string;
  items: string[];
};

export type Dictionary = {
  profile: {
    name: string;
    role: string;
    email: string;
    summary: string;
    links: {
      github: string;
      blog: string;
    };
  };
  nav: {
    portfolio: string;
    overview: string;
    projects: string;
    openSource: string;
    skills: string;
    external: string;
    pagesLabel: string;
    collapsedLabel: string;
    expandSidebar: string;
    collapseSidebar: string;
  };
  home: {
    eyebrow: string;
    title: string;
    subtitle: string;
    slogan: {
      emphasis: string;
      body: string;
      action: string;
      closing: string;
      final: string;
    };
    proficiency: { text: string; projects: string[] }[];
    techFocus: {
      buildTitle: string;
      buildItems: string[];
      stackTitle: string;
      stacks: string[];
    };
    nodeTitles: {
      profile: string;
      links: string;
      techFocus: string;
    };
    canvas: {
      previousNode: string;
      nextNode: string;
      focusPreviousNode: string;
      focusNextNode: string;
      moveViewport: string;
      focusNode: string;
      zoomIn: string;
      zoomOut: string;
    };
    profileCard: {
      koreanName: string;
      englishName: string;
      experiences: Array<{
        icon: "school" | "company";
        title: string;
        detail: string;
        period: string;
      }>;
      skills: string[];
    };
    projectSectionTitle: string;
    projectLinks: {
      overview: string;
      overviewTooltip: string;
      details: string;
      detailsTooltip: string;
    };
    featuredProjects: Array<{
      slug: string;
      title: string;
      description: string;
      highlights: string[];
      stack: string[];
      iconSrc: string;
      iconAlt: string;
    }>;
    github: string;
    email: string;
    blog: string;
  };
  about: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
  };
  skills: {
    eyebrow: string;
    title: string;
    groups: SkillGroup[];
  };
  openSource: {
    eyebrow: string;
    title: string;
    description: string;
  };
  contact: {
    eyebrow: string;
    title: string;
    description: string;
    cta: string;
  };
  projectsPage: {
    eyebrow: string;
    title: string;
    description: string;
    note: string;
  };
  projects: Project[];
};

const heogeon: Dictionary = {
  profile: {
    name: "Heo Geon",
    role: "Backend Developer",
    email: "rjs2337@naver.com",
    summary:
      "Node.js·Spring 기반 백엔드 개발을 중심으로 API 설계, ERD·DB 모델링, 실시간 서버, 데이터 파이프라인을 만듭니다. 엠트리센에서 백엔드 인턴으로 API·DB 설계와 데이터 수집·가공 자동화를 담당했고, 안정적인 서버와 좋은 데이터 설계로 서비스의 뒷단을 탄탄하게 만드는 데 집중합니다.",
    links: {
      github: "https://github.com/HUHGEON",
      blog: "https://huhgeon.github.io",
    },
  },
  nav: {
    portfolio: "Portfolio",
    overview: "Overview",
    projects: "Projects",
    openSource: "Open Source",
    skills: "Skills",
    external: "External",
    pagesLabel: "Portfolio pages",
    collapsedLabel: "Collapsed portfolio navigation",
    expandSidebar: "사이드바 열기",
    collapseSidebar: "사이드바 닫기",
  },
  home: {
    eyebrow: "Backend · API · Database · Realtime",
    title: "데이터와 서버의 뒷단을 설계하는 개발자",
    subtitle: "저는 화면 뒤에서 데이터가 흐르는 구조를 설계하는 백엔드 개발자입니다.",
    slogan: {
      emphasis: "서비스의 가치는 결국 안정적인 서버와 좋은 데이터 설계에서 나옵니다.",
      body: "저는 화면 뒤에서 **데이터가 흐르는 구조**를 설계하는 일에 집중합니다.",
      action:
        "**API 설계와 ERD·DB 모델링**부터 캐싱·인덱스까지, 서버의 뒷단을 탄탄하게 만드는 것.",
      closing: "복잡한 요구사항을 **명확한 데이터 모델과 안정적인 API**로 풀어내는 것.",
      final: "그것이 제가 백엔드 개발자로서 추구하는 방향입니다.",
    },
    proficiency: [
      {
        text: "동시 요청이 몰리는 발급에서 조건부 원자 UPDATE·Redis Lua 선점으로 재고 정합성을 지키고 부하 측정으로 개선 효과를 수치 검증할 수 있습니다.",
        projects: ["coupon-yaho"],
      },
      {
        text: "Spring Batch로 대용량 이력을 재생·대조하는 검증 배치를 만들고 오류를 심은 데이터로 검증기 자체를 검증할 수 있습니다.",
        projects: ["coupon-yaho"],
      },
      {
        text: "Spring WebFlux와 Redis Pub/Sub으로 인스턴스를 수평 확장해도 모든 사용자에게 메시지가 닿는 실시간 서버를 구현할 수 있습니다.",
        projects: ["live-chat"],
      },
      {
        text: "LLM 출력을 규칙 라우팅 · RAG · 스키마 강제로 감싸 환각·장애에도 결정론적인 의도 해석 · 추천 서버를 설계할 수 있습니다.",
        projects: ["haeyaji", "voice-kiosk"],
      },
      {
        text: "느린 외부 호출의 커넥션 풀 고갈을 막도록 트랜잭션 경계를 나누고 장애 시 fail-open · 폴백 정책을 설계할 수 있습니다.",
        projects: ["haeyaji", "live-chat"],
      },
      {
        text: "MongoDB text · TTL · unique 복합 인덱스와 aggregation으로 검색 · 추천 · 중복 방지 요구사항을 데이터 모델로 풀 수 있습니다.",
        projects: ["blog-platform", "voice-kiosk"],
      },
    ],
    techFocus: {
      buildTitle: "What I Build",
      buildItems: [
        "Backend API",
        "ERD · DB 설계",
        "실시간 채팅 서버",
        "데이터 파이프라인",
      ],
      stackTitle: "Primary Stack",
      stacks: ["Node.js", "Spring", "MySQL", "MongoDB", "Redis"],
    },
    nodeTitles: {
      profile: "Profile",
      links: "Links",
      techFocus: "Expertise",
    },
    canvas: {
      previousNode: "이전 노드",
      nextNode: "다음 노드",
      focusPreviousNode: "이전 노드로 이동",
      focusNextNode: "다음 노드로 이동",
      moveViewport: "캔버스 보기 영역 이동",
      focusNode: "{node} 노드로 이동",
      zoomIn: "캔버스 확대",
      zoomOut: "캔버스 축소",
    },
    profileCard: {
      koreanName: "허건",
      englishName: "HEO GEON",
      experiences: [
        {
          icon: "school",
          title: "명지대학교",
          detail: "컴퓨터공학과",
          period: "2020 ~ 2026",
        },
        {
          icon: "company",
          title: "엠트리센",
          detail: "백엔드 개발 인턴",
          period: "2025 ~ 2026",
        },
      ],
      skills: ["Node.js", "Spring", "MySQL"],
    },
    projectSectionTitle: "Projects",
    projectLinks: {
      overview: "↗",
      overviewTooltip: "프로젝트 메인 페이지로 이동",
      details: "Project details",
      detailsTooltip: "{project} 상세 페이지로 이동",
    },
    featuredProjects: [
      {
        slug: "coupon-yaho",
        title: "선착순 쿠폰 발급 시스템",
        description:
          "통신사 브랜드데이 선착순 쿠폰 발급 시스템입니다. 병목을 측정하며 MySQL 락에서 조건부 원자 UPDATE, Redis Lua 선점, 적응형 대기열 순으로 구조를 발전시켰고, 발급 결과는 이력 재생 배치로 검증합니다.",
        highlights: [
          "재고 잠금을 조건부 원자 UPDATE로 바꿔 500 req/s 성공 응답 p99 2,240ms → 802ms 단축",
          "이력 534만 행 재생 검증 배치로, 오류 700건을 심은 데이터의 기대 검출 800행을 누락 0 · 오탐 0으로 탐지",
        ],
        stack: ["Java 21", "Spring Boot", "Spring Batch", "MySQL", "Redis", "Kafka"],
        iconSrc: "",
        iconAlt: "선착순 쿠폰 발급 시스템 아이콘",
      },
      {
        slug: "voice-kiosk",
        title: "음성인식 키오스크",
        description:
          "음성·터치 메뉴 주문·추천 키오스크 서비스입니다. NLP 서버가 STT 텍스트를 gpt-4o-mini로 의도(intents) 해석하고, 오케스트레이터로 API 서버를 호출해 주문 로직에 연결합니다.",
        highlights: [
          "NLP 서버를 LLM으로 intents 추출 후 API 서버를 호출하는 오케스트레이터로 설계",
          "옵션 누락 시 pending 상태로 세션에 보관, 후속 발화로 완성하는 멀티턴 구현",
        ],
        stack: ["FastAPI", "gpt-4o-mini", "Express", "MongoDB", "Swagger"],
        iconSrc: "/logos/voice-kiosk.png",
        iconAlt: "음성인식 키오스크 로고",
      },
      {
        slug: "live-chat",
        title: "라이브 커머스 채팅 서버",
        description:
          "라이브 커머스 방송 실시간 채팅 서버입니다. Spring WebFlux 논블로킹 + WebSocket으로 메시지를 주고받고, Pod를 늘려도 모든 시청자에게 닿도록 Redis Pub/Sub으로 중계합니다.",
        highlights: [
          "Redis Pub/Sub 방별 채널로 Pod 간 메시지 중계, 수평 확장 시에도 전체 전파 보장",
          "권한·레이트리밋·욕설 마스킹·저장·발행을 하나의 전송 파이프라인으로 분리",
        ],
        stack: ["Spring", "WebFlux", "WebSocket", "Redis", "MongoDB"],
        iconSrc: "",
        iconAlt: "라이브 커머스 채팅 서버 아이콘",
      },
      {
        slug: "haeyaji",
        title: "해야지 (haeyaji)",
        description:
          "날씨·시간대·위치 기반으로 ‘오늘 뭐 하면 좋을지’를 실제 장소와 함께 추천하는 투두 앱입니다. 추천 두뇌(NLP 서버)를 단독 개발하고 백엔드 날씨·추천·개인화·알림 도메인을 맡았습니다.",
        highlights: [
          "로컬 LLM(EXAONE)의 오분류·환각을 규칙 라우팅·RAG·스키마 강제로 감싸 결정론적 추천 품질 확보",
          "느린 LLM 호출의 커넥션풀 고갈을 막는 추천 게이트웨이 트랜잭션 분리, 맥락별 개인화 가중치 학습",
        ],
        stack: ["FastAPI", "Ollama · EXAONE", "Spring Boot", "MySQL", "Redis"],
        iconSrc: "/logos/haeyaji.png",
        iconAlt: "해야지 로고",
      },
      {
        slug: "blog-platform",
        title: "Blog Platform 백엔드",
        description:
          "인증·게시글·댓글·좋아요·팔로우·쪽지·스토리를 갖춘 블로그 플랫폼 백엔드 개인 프로젝트입니다.",
        highlights: [
          "JWT 인증·Multer 업로드를 미들웨어로 분리해 라우터 전반에서 재사용",
          "게시글 본문에서 한국어 형태소 분석으로 명사 추출, 검색·태그 키워드로 활용",
        ],
        stack: ["Express", "MongoDB", "JWT"],
        iconSrc: "",
        iconAlt: "Blog Platform 백엔드 아이콘",
      },
      {
        slug: "media-inference",
        title: "엠트리센 인턴 · 사내 실무",
        description:
          "엠트리센 인턴 사내 실무 3건(백엔드 프로토타입 · 데이터 분석 자동화 · QA)의 기술 중심 정리입니다. (도메인·세부는 대외비)",
        highlights: [
          "요청 전처리 → 외부 처리 서버 연동 → 저장·캐싱 백엔드 파이프라인, Streamlit 데이터 분석·시각화 대시보드 2종 개발",
          "자체 프로젝트 테스트 검증, 사내 타사 앱 QA·테스트 보고 업무도 자주 수행",
        ],
        stack: ["Node.js", "Express", "Python", "Streamlit", "pandas", "Jest"],
        iconSrc: "",
        iconAlt: "엠트리센 인턴 아이콘",
      },
    ],
    github: "GitHub",
    email: "Email",
    blog: "Tech Blog",
  },
  about: {
    eyebrow: "About",
    title: "안정적인 서버와 좋은 데이터 설계로 뒷단을 만드는 백엔드 개발자입니다.",
    paragraphs: [
      "Node.js·Spring 백엔드를 중심으로 API 설계, ERD·DB 모델링, 실시간 서버, 데이터 파이프라인을 만듭니다.",
      "엠트리센 백엔드 인턴으로 API·DB 구조 설계와 데이터 수집·가공 자동화를 맡았고, 팀·개인 프로젝트에서는 서비스 뒷단을 실제 동작하는 구조로 만드는 데 집중했습니다.",
      "포트폴리오는 화려한 효과보다 프로젝트별 문제 정의·역할·기술 선택·결과를 빠르게 파악하는 구성을 우선합니다.",
    ],
  },
  skills: {
    eyebrow: "Skills",
    title: "주요 기술 스택",
    groups: [
      {
        title: "Backend",
        items: ["Node.js", "Express", "Spring", "FastAPI"],
      },
      {
        title: "Database",
        items: ["MySQL", "MongoDB", "Redis"],
      },
      {
        title: "Language",
        items: ["Java", "JavaScript", "Python"],
      },
      {
        title: "Tools",
        items: ["Docker", "Git", "Swagger"],
      },
    ],
  },
  openSource: {
    eyebrow: "Open Source",
    title: "팀·개인 프로젝트로 백엔드 구조를 직접 설계합니다.",
    description:
      "음성인식 키오스크, 라이브 커머스 채팅 서버, 사내 ERP처럼 도메인이 다른 백엔드를 설계·구현하며, API·데이터 모델·실시간 처리 구조를 직접 다뤄 왔습니다.",
  },
  contact: {
    eyebrow: "Contact",
    title: "백엔드·데이터 설계 중심의 협업에 관심이 있습니다.",
    description:
      "안정적인 서버와 좋은 데이터 설계로 서비스의 뒷단을 만드는 일에 관심이 있습니다. 프로젝트, 협업, 채용 관련 연락은 이메일 또는 GitHub로 확인할 수 있습니다.",
    cta: "이메일 보내기",
  },
  projectsPage: {
    eyebrow: "Projects",
    title:
      "저는 **안정적인 서버**와 **좋은 데이터 설계**로 서비스의 뒷단을 만드는 데 관심이 있습니다.",
    description:
      "**Node.js·Spring 기반의 백엔드**를 중심으로 **API 설계**, **ERD·DB 모델링**, **실시간 처리**, **데이터 자동화**를 구현하며,\n요구사항을 명확한 데이터 모델과 API로 풀어내는 개발을 지향합니다.",
    note: "이 페이지에서는 이러한 관심사를 바탕으로 진행한 주요 프로젝트들을 소개합니다.\n자세한 개발 과정과 내용은 프로젝트별 상세 페이지에서 확인할 수 있습니다.",
  },
  projects: [
    {
      slug: "coupon-yaho",
      title: "선착순 쿠폰 발급 시스템",
      type: "Team Project",
      description:
        "통신사 브랜드데이 선착순 쿠폰 발급 시스템(쿠폰 야호~)입니다. 재고 잠금을 FOR UPDATE에서 조건부 원자 UPDATE로 바꿔 500 req/s 성공 응답 p99를 2,240ms → 802ms로 줄였고, 이력 534만 행 재생 검증 배치로 발급 결과를 검증합니다.",
      href: "https://github.com/coupon-yaho",
      stack: ["Java 21", "Spring Boot", "Spring Batch", "MySQL", "Redis", "Kafka", "k6"],
      featured: true,
    },
    {
      slug: "voice-kiosk",
      title: "음성인식 키오스크",
      type: "Team Project",
      description:
        "음성·터치 메뉴 주문·추천 키오스크 서비스입니다. NLP 서버가 STT 텍스트를 gpt-4o-mini로 의도(intents)·필터로 해석하고 오케스트레이터로 API 서버를 호출해 응답을 클라이언트에 돌려주는 2단 백엔드입니다. NLP 서버 설계를 주도했습니다.",
      href: "https://github.com/Say-It-It-s-OK",
      stack: ["FastAPI", "gpt-4o-mini", "Express", "MongoDB", "Swagger"],
      featured: true,
    },
    {
      slug: "live-chat",
      title: "라이브 커머스 채팅 서버",
      type: "Team Project",
      description:
        "라이브 커머스 방송 실시간 채팅 서버입니다. Spring WebFlux 논블로킹 + WebSocket으로 메시지를 주고받고, Pod를 늘려도 모든 시청자에게 닿도록 Redis Pub/Sub으로 중계하며, 권한·레이트리밋·욕설 마스킹·저장·발행을 하나의 전송 파이프라인으로 분리했습니다.",
      href: "https://github.com/sago-panda/sapari-be",
      stack: ["Java 21", "Spring WebFlux", "WebSocket", "Redis", "MongoDB"],
      featured: true,
    },
    {
      slug: "haeyaji",
      title: "해야지 (haeyaji)",
      type: "Team Project",
      description:
        "날씨·시간대·위치 기반으로 ‘오늘 뭐 하면 좋을지’를 실제 장소와 함께 추천하는 투두 앱입니다. 추천 두뇌(NLP)를 단독 개발하고 백엔드의 날씨 중계·추천 게이트웨이·개인화 학습·알림 도메인을 맡았습니다.",
      href: "https://github.com/haeyaji",
      stack: [
        "FastAPI",
        "Ollama · EXAONE",
        "Spring Boot",
        "MySQL",
        "Redis",
        "QueryDSL",
      ],
      featured: true,
    },
    {
      slug: "blog-platform",
      title: "Blog Platform 백엔드",
      type: "Personal Project",
      description:
        "인증·게시글·댓글·좋아요·팔로우·쪽지·스토리를 갖춘 블로그 플랫폼 백엔드 개인 프로젝트입니다. 인증을 3종 미들웨어로 분리하고 mecab-ya 형태소 분석으로 유사글 추천 키워드를 추출했습니다.",
      href: "https://github.com/HUHGEON/Blog-Platform",
      stack: ["Express", "MongoDB", "JWT", "mecab-ya", "Multer"],
      featured: true,
    },
    {
      slug: "zogakzip",
      title: "조각집 (ZOGAKZIP)",
      type: "Team Project",
      description:
        "그룹 > 게시글 > 이미지 계층의 추억 기록 서비스 백엔드를 2인 팀으로 개발했습니다. 게시글 API·이미지 업로드·한국 시간대(KST) 처리를 맡았고, 활동 기반 배지 시스템은 팀이 함께 갖췄습니다.",
      href: "https://github.com/HUHGEON/CODEIT-ZOGAKZIP",
      stack: ["Node.js", "Express", "MongoDB", "Multer", "moment-timezone"],
      featured: false,
    },
    {
      slug: "media-inference",
      title: "엠트리센 인턴 · 사내 실무",
      type: "엠트리센 인턴 · 2025.08\u00A0~\u00A02026.01",
      description:
        "엠트리센 인턴 사내 실무 3건(백엔드 프로토타입 · 데이터 분석 자동화 · QA)의 기술 중심 정리입니다. 요청 전처리 → 외부 처리 서버 연동 → 결과 저장·캐싱 백엔드 파이프라인과 데이터 분석·시각화 대시보드 2종(Python·Streamlit·pandas)을 개발하고 자체 프로젝트를 테스트로 검증했습니다. 사내에서 타사 앱을 직접 테스트하고 테스트 보고서로 정리·보고하는 QA 업무도 자주 수행했습니다. (도메인·세부 기능·정량 성과는 대외비)",
      href: "",
      stack: [
        "Node.js",
        "Express",
        "Python",
        "Streamlit",
        "pandas",
        "MongoDB",
        "Redis",
        "Jest",
      ],
      featured: true,
    },
  ],
};

export const dictionaries: Record<Locale, Dictionary> = {
  ko: heogeon,
  en: heogeon,
};

export function getDictionary(locale: Locale = "ko") {
  return dictionaries[locale];
}
