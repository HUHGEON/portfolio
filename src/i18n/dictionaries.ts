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
      lead?: { headline: string; detail: string; role: string }; // 대표 카드용 핵심 성과
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
      "Spring Boot · Node.js 기반 백엔드 개발을 중심으로 API 설계, ERD · DB 모델링, 대규모 트래픽 처리, 비동기 · 재시도 구조를 만듭니다. 엠트리센에서 백엔드 인턴으로 API · DB 설계와 데이터 수집 · 가공 자동화를 담당했고, 구현 결과를 부하 시험과 데이터 대조로 검증해 믿을 수 있게 만드는 데 집중합니다.",
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
    eyebrow: "Backend · API · Database · Async · Realtime",
    title: "백엔드를 만들고, 데이터로 결과를 검증합니다.",
    subtitle: "저는 화면 뒤에서 데이터가 흐르는 구조를 설계하는 백엔드 개발자입니다.",
    slogan: {
      emphasis: "서비스의 가치는 결국 안정적인 서버와 좋은 데이터 설계에서 나옵니다.",
      body: "저는 화면 뒤에서 **데이터가 흐르는 구조**를 설계하는 일에 집중합니다.",
      action:
        "**API 설계와 ERD·DB 모델링**부터 캐싱 · 비동기 처리 · 장애 복구까지, 서버의 뒷단을 탄탄하게 만드는 것.",
      closing: "복잡한 요구사항을 **명확한 데이터 모델과 안정적인 API**로 풀어내는 것.",
      final: "그것이 제가 백엔드 개발자로서 추구하는 방향입니다.",
    },
    proficiency: [
      {
        text: "사용자에게 응답을 돌려주는 순간과 외부 시스템에 등록이 서는 순간을 떼어 놓고, Transactional Outbox · SQS · 세대 재시도로 외부가 느리거나 실패해도 예약을 최종 상태까지 보낼 수 있습니다.",
        projects: ["nova"],
      },
      {
        text: "1인 1매 · 빈틈없는 순번 · 멱등 재전송처럼 경합에서 깨지기 쉬운 규칙을 앱 검사가 아니라 생성 칼럼 UNIQUE 와 회차 행 잠금으로 DB 가 지키게 설계할 수 있습니다.",
        projects: ["nova", "coupon-yaho"],
      },
      {
        text: "잠금 위에서 한쪽을 멈춰 세우는 결정적 재현 시험으로 교착 · 경합 결함을 운영 전에 잡고, 돌연변이 시험으로 그 시험이 결함을 실제로 잡아내는지까지 확인할 수 있습니다.",
        projects: ["nova"],
      },
      {
        text: "수치가 이상할 때 시스템보다 재는 쪽을 먼저 의심해, 잘린 지표 라벨이나 컨테이너가 잘못 보고한 CPU 같은 계기 오류를 걸러낼 수 있습니다.",
        projects: ["nova"],
      },
      {
        text: "요청이 동시에 몰리는 발급 처리에서 조건부 원자 UPDATE·Redis Lua 선점으로 재고 정합성을 지키고 개선 효과를 부하 측정 수치로 검증할 수 있습니다.",
        projects: ["coupon-yaho"],
      },
      {
        text: "Spring Batch로 대용량 이력을 재생·대조하는 검증 배치를 만들고 오류를 주입한 데이터로 검증기 자체도 검증할 수 있습니다.",
        projects: ["coupon-yaho"],
      },
      {
        text: "Spring WebFlux와 Redis Pub/Sub으로 여러 인스턴스에 나뉘어 연결된 사용자끼리 메시지를 중계하는 실시간 서버를 구현할 수 있습니다.",
        projects: ["live-chat"],
      },
      {
        text: "LLM 출력을 규칙 라우팅 · RAG · 스키마 강제로 제어하고 없는 장소 추천·깨진 출력·LLM 장애 시 규칙 폴백으로 대응하는 의도 해석 · 추천 서버를 설계할 수 있습니다.",
        projects: ["haeyaji", "voice-kiosk"],
      },
      {
        text: "느린 외부 호출이 커넥션 풀을 고갈시키지 않도록 트랜잭션 경계를 나누고 장애 시 fail-open · 폴백 정책을 설계할 수 있습니다.",
        projects: ["nova", "haeyaji", "live-chat"],
      },
      {
        text: "MongoDB text · TTL · unique 복합 인덱스와 aggregation으로 검색 · 추천 · 중복 방지 요구사항을 데이터 모델 수준에서 해결할 수 있습니다.",
        projects: ["blog-platform", "voice-kiosk"],
      },
    ],
    techFocus: {
      buildTitle: "What I Build",
      buildItems: [
        "대규모 트래픽 백엔드",
        "비동기 처리와 재시도",
        "ERD · DB 설계",
        "실시간 채팅 서버",
      ],
      stackTitle: "Primary Stack",
      stacks: ["Spring Boot", "MySQL", "Redis", "AWS SQS", "ECS Fargate"],
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
      skills: ["Spring Boot", "MySQL", "AWS"],
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
        slug: "nova",
        title: "스마트폰 사전예약 (NOVA)",
        description:
          "오픈 10초에 5,000명이 몰리는 스마트폰 사전예약 서비스입니다. 예약을 확정하는 외부 예약 시스템이 평균 0.5초 걸리고 20건에 1건 실패해서, 접수 완료와 외부 등록 완료를 떼어 놓고 그 사이를 Outbox · SQS · 재시도로 책임지게 했습니다.",
        lead: {
          headline: "10초에 5,000명이 들어와도 서버 오류 0건",
          detail:
            "10분 동안 요청 12만 8천 건 · 0.5초를 넘긴 요청 0.0102% · 접수 응답 113ms(7건 중앙값)",
          role: "담당: 회원 인증 · 상품 · 리뷰 · 장바구니 · 럭키드로우 · 공통 모듈(JWT 검증 · 읽기 캐시)",
        },
        highlights: [
          "백엔드 저장소 커밋 677/1,420 으로 최다 기여, 동시성 결함 4종을 재현 시험으로 운영 전에 잡아 수정",
          "부하 시험에서 catalog 네 대 중 한 대만 막히는 것을 태스크별 지표로 확인해 ALB 분배를 처리 중 요청이 적은 쪽으로 변경, 대기열 입장 속도 가정이 틀려 끊기던 시험 판정을 실제 설정값 기반 계산으로 수정",
        ],
        stack: [
          "Java 25",
          "Spring Boot 4.1",
          "MySQL 8.4",
          "Valkey",
          "AWS SQS",
          "ECS Fargate",
        ],
        iconSrc: "",
        iconAlt: "스마트폰 사전예약 NOVA 아이콘",
      },
      {
        slug: "coupon-yaho",
        title: "선착순 쿠폰 발급 시스템",
        description:
          "통신사 브랜드데이 선착순 쿠폰 발급 시스템입니다. 병목을 측정하면서 MySQL 락 → 조건부 원자 UPDATE → Redis Lua 선점 → 적응형 대기열 순으로 구조를 개선했고 발급 결과는 이력 재생 배치로 검증합니다.",
        lead: {
          headline: "534만 행 이력 검증 배치",
          detail:
            "오류 700건을 주입한 데이터에서 기대 검출 800행 확인 · 누락 0 · 오탐 0",
          role: "담당: 검증 배치 · 시드 생성기 · 부하 테스트 결과 DB 대조",
        },
        highlights: [
          "이력 534만 행을 재생하는 검증 배치 설계·구현, 오류 700건을 주입한 데이터에서 기대 검출 800행을 누락 0 · 오탐 0으로 확인",
          "팀의 잠금 방식 개선 과정에서 부하 테스트 결과를 DB와 대조해 500 req/s 성공 응답 중앙값 1초 이상 회차 4/7 → 0/7 검증",
        ],
        stack: ["Java 21", "Spring Boot", "Spring Batch", "MySQL", "Redis", "Kafka"],
        iconSrc: "",
        iconAlt: "선착순 쿠폰 발급 시스템 아이콘",
      },
      {
        slug: "voice-kiosk",
        title: "음성인식 키오스크",
        description:
          "음성·터치로 메뉴를 주문하고 추천받는 키오스크 서비스입니다. NLP 서버가 STT 텍스트의 의도(intents)를 gpt-4o-mini로 해석하고 오케스트레이터로 API 서버를 호출해 주문 로직과 연결합니다.",
        highlights: [
          "LLM으로 intents를 추출하고 API 서버를 호출하는 오케스트레이터 구조로 NLP 서버 설계",
          "LLM 출력을 intents 9종·filters 스키마로 정형화해 한 문장에 담긴 여러 요청을 순차 실행으로 변환",
        ],
        stack: ["FastAPI", "gpt-4o-mini", "Express", "MongoDB", "Swagger"],
        iconSrc: "/logos/voice-kiosk.png",
        iconAlt: "음성인식 키오스크 로고",
      },
      {
        slug: "live-chat",
        title: "라이브 커머스 채팅 서버",
        description:
          "라이브 커머스 방송 실시간 채팅 서버입니다. Spring WebFlux 논블로킹 + WebSocket으로 메시지를 주고받습니다. Pod를 늘려도 다른 Pod의 시청자에게 메시지가 전달되도록 Redis Pub/Sub으로 중계합니다.",
        highlights: [
          "서로 다른 서버에 연결된 시청자 간 채팅을 Redis Pub/Sub 전달 파이프라인으로 중계",
          "권한·레이트리밋·욕설 마스킹·저장·발행을 하나의 전송 파이프라인 안에서 단계별로 분리",
        ],
        stack: ["Spring", "WebFlux", "WebSocket", "Redis", "MongoDB"],
        iconSrc: "",
        iconAlt: "라이브 커머스 채팅 서버 아이콘",
      },
      {
        slug: "haeyaji",
        title: "해야지 (haeyaji)",
        description:
          "날씨·시간대·위치를 바탕으로 ‘오늘 뭐 하면 좋을지’를 실제 장소와 함께 추천하는 투두 앱입니다. 추천 엔진인 NLP 서버를 단독 개발하고 백엔드의 날씨·추천·개인화·알림 도메인을 맡았습니다.",
        highlights: [
          "로컬 LLM(EXAONE)의 오분류·없는 장소 추천을 규칙 라우팅·RAG·스키마 강제로 줄이고 시나리오 채점 59/80으로 남은 한계까지 확인",
          "느린 LLM 호출로 커넥션 풀이 고갈되지 않도록 추천 게이트웨이 트랜잭션 분리, 맥락별 개인화 가중치 학습",
        ],
        stack: ["FastAPI", "Ollama · EXAONE", "Spring Boot", "MySQL", "Redis"],
        iconSrc: "/logos/haeyaji.png",
        iconAlt: "해야지 로고",
      },
      {
        slug: "media-inference",
        title: "엠트리센 인턴 · 사내 실무",
        description:
          "엠트리센 인턴 기간의 사내 실무 3건(백엔드 프로토타입 · 데이터 분석 자동화 · QA)을 기술 위주로 정리했습니다. (도메인·세부는 대외비)",
        highlights: [
          "원본 데이터 전처리 → 외부 서버 2곳 병렬 연동 → 저장·캐싱 백엔드 파이프라인과 Streamlit 데이터 분석·시각화 대시보드 2종 개발",
          "백엔드 테스트 케이스 194개 작성, 사내 타사 앱 QA·테스트 보고 업무도 자주 수행",
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
    title: "안정적인 서버와 잘 설계된 데이터 구조를 만드는 백엔드 개발자입니다.",
    paragraphs: [
      "Spring Boot · Node.js 백엔드를 중심으로 API 설계, ERD · DB 모델링, 대규모 트래픽 처리, 비동기 · 재시도 구조를 만듭니다.",
      "엠트리센에서 백엔드 인턴으로 API·DB 구조 설계와 데이터 수집·가공 자동화를 맡았습니다. 팀·개인 프로젝트에서는 실제로 동작하는 서버 구조를 만드는 데 집중했습니다.",
      "구현 결과를 부하 테스트와 데이터 대조로 검증해 믿을 수 있게 만드는 개발을 지향합니다.",
    ],
  },
  skills: {
    eyebrow: "Skills",
    title: "주요 기술 스택",
    groups: [
      {
        title: "Language",
        items: ["Java", "JavaScript", "Python"],
      },
      {
        title: "Backend",
        items: [
          "Spring Boot",
          "Spring WebFlux",
          "Spring Batch",
          "Node.js",
          "Express",
          "FastAPI",
        ],
      },
      {
        title: "Data",
        items: ["MySQL", "MongoDB", "Redis", "Valkey", "QueryDSL"],
      },
      {
        title: "Async",
        items: ["AWS SQS", "Kafka"],
      },
      {
        title: "Infra",
        items: ["ECS Fargate", "Terraform", "Atlantis", "Docker", "GitHub Actions"],
      },
      {
        title: "Monitor",
        items: ["Grafana", "OpenTelemetry", "Prometheus"],
      },
      {
        title: "Testing",
        items: ["k6", "Testcontainers", "JUnit", "Jest"],
      },
    ],
  },
  openSource: {
    eyebrow: "Open Source",
    title: "팀·개인 프로젝트로 백엔드 구조를 직접 설계합니다.",
    description:
      "스마트폰 사전예약, 선착순 쿠폰 발급, 라이브 커머스 채팅처럼 도메인이 다른 백엔드를 설계 · 구현하며 API · 데이터 모델 · 동시성 · 비동기 처리 구조를 직접 다뤄 왔습니다.",
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
      "**Spring Boot · Node.js 기반의 백엔드**를 중심으로 **API 설계**, **ERD·DB 모델링**, **동시성 제어**, **비동기 처리와 재시도**를 구현하며,\n요구사항을 명확한 데이터 모델과 API로 풀어내는 개발을 지향합니다.",
    note: "이 페이지에서는 이러한 관심사를 바탕으로 진행한 주요 프로젝트들을 소개합니다.\n자세한 개발 과정과 내용은 프로젝트별 상세 페이지에서 확인할 수 있습니다.",
  },
  projects: [
    {
      slug: "nova",
      title: "스마트폰 사전예약 (NOVA)",
      type: "팀 프로젝트",
      description:
        "오픈 10초에 5,000명이 몰리는 스마트폰 사전예약 서비스입니다. 예약을 확정하는 외부 예약 시스템이 평균 0.5초 걸리고 20건에 1건 실패하기 때문에, 접수 완료와 외부 등록 완료를 분리하고 Transactional Outbox · SQS · 세대 재시도로 그 사이를 책임지게 했습니다. 서비스 8개와 배치 2개를 ECS Fargate에 올리고 Terraform · Atlantis로 운영했습니다.",
      href: "https://github.com/Nova-Grandis",
      stack: [
        "Java 25",
        "Spring Boot 4.1",
        "MySQL 8.4",
        "Valkey",
        "AWS SQS",
        "ECS Fargate",
        "Terraform",
        "k6",
      ],
      featured: true,
    },
    {
      slug: "coupon-yaho",
      title: "선착순 쿠폰 발급 시스템",
      type: "팀 프로젝트",
      description:
        "통신사 브랜드데이 선착순 쿠폰 발급 시스템(쿠폰 야호~)입니다. 재고 잠금을 FOR UPDATE에서 조건부 원자 UPDATE로 바꿔 500 req/s 성공 응답 p99를 2,240ms → 802ms로 줄였습니다. 발급 결과는 이력 534만 행을 재생하는 검증 배치로 검증합니다.",
      href: "https://github.com/coupon-yaho",
      stack: [
        "Java 21",
        "Spring Boot",
        "Spring Batch",
        "MySQL",
        "Redis",
        "Kafka",
        "k6",
      ],
      featured: true,
    },
    {
      slug: "voice-kiosk",
      title: "음성인식 키오스크",
      type: "팀 프로젝트",
      description:
        "음성·터치로 메뉴를 주문하고 추천받는 키오스크 서비스입니다. NLP 서버가 gpt-4o-mini로 STT 텍스트를 의도(intents)·필터로 해석한 뒤 오케스트레이터로 API 서버를 호출하고 응답을 클라이언트에 돌려주는 2단 구조의 백엔드입니다. NLP 서버 설계를 주도했습니다.",
      href: "https://github.com/Say-It-It-s-OK",
      stack: ["FastAPI", "gpt-4o-mini", "Express", "MongoDB", "Swagger"],
      featured: true,
    },
    {
      slug: "live-chat",
      title: "라이브 커머스 채팅 서버",
      type: "팀 프로젝트",
      description:
        "라이브 커머스 방송 실시간 채팅 서버입니다. Spring WebFlux 논블로킹 + WebSocket으로 메시지를 주고받습니다. Pod를 늘려도 다른 Pod의 시청자에게 메시지가 전달되도록 Redis Pub/Sub으로 중계하고(best-effort) 권한·레이트리밋·욕설 마스킹·저장·발행은 하나의 전송 파이프라인 안에서 단계별로 분리했습니다.",
      href: "https://github.com/sago-panda/sapari-be/tree/feature/SPR-16",
      stack: ["Java 21", "Spring WebFlux", "WebSocket", "Redis", "MongoDB"],
      featured: true,
    },
    {
      slug: "haeyaji",
      title: "해야지 (haeyaji)",
      type: "팀 프로젝트",
      description:
        "날씨·시간대·위치를 바탕으로 ‘오늘 뭐 하면 좋을지’를 실제 장소와 함께 추천하는 투두 앱입니다. 추천 엔진(NLP)을 단독 개발하고 백엔드의 날씨 중계·추천 게이트웨이·개인화 학습·알림 도메인을 맡았습니다.",
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
      type: "개인 프로젝트",
      description:
        "인증·게시글·댓글·좋아요·팔로우·쪽지·스토리를 갖춘 블로그 플랫폼 백엔드 개인 프로젝트입니다. 인증을 3종 미들웨어로 분리하고 mecab-ya 형태소 분석으로 유사글 추천 키워드를 추출했습니다.",
      href: "https://github.com/HUHGEON/Blog-Platform",
      stack: ["Express", "MongoDB", "JWT", "mecab-ya", "Multer"],
      featured: false,
    },
    {
      slug: "zogakzip",
      title: "조각집 (ZOGAKZIP)",
      type: "팀 프로젝트",
      description:
        "그룹 > 게시글 > 이미지 계층의 추억 기록 서비스 백엔드를 2인 팀으로 개발했습니다. 게시글 API·이미지 업로드·한국 시간대(KST) 처리를 맡았고 활동 기반 배지 시스템은 팀이 함께 만들었습니다.",
      href: "https://github.com/HUHGEON/CODEIT-ZOGAKZIP",
      stack: ["Node.js", "Express", "MongoDB", "Multer", "moment-timezone"],
      featured: false,
    },
    {
      slug: "media-inference",
      title: "엠트리센 인턴 · 사내 실무",
      type: "엠트리센 인턴 · 2025.08\u00A0~\u00A02026.01",
      description:
        "엠트리센 인턴 기간의 사내 실무 3건(백엔드 프로토타입 · 데이터 분석 자동화 · QA)을 기술 위주로 정리했습니다. 원본 데이터 전처리 → 외부 서버 2곳 병렬 연동 → 결과 저장·캐싱 백엔드 파이프라인과 데이터 분석·시각화 대시보드 2종(Python·Streamlit·pandas)을 개발하고 백엔드는 테스트 케이스 194개로 검증했습니다. 사내에서 타사 앱을 직접 테스트하고 테스트 보고서로 정리·보고하는 QA 업무도 자주 맡았습니다. (도메인·세부 기능·정량 성과는 대외비)",
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
