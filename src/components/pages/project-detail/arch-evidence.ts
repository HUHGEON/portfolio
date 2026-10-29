// One-line notes shown when a diagram item is clicked, only where the sublabel is
// not enough. Every note was read off the project's code (2026-09-27).
// Keys are `${zoneId}/${itemIndex}` inside ARCH_SPECS[diagramKey].

export type ArchEvidence = { note?: string };

export const ARCH_EVIDENCE: Record<string, Record<string, ArchEvidence>> = {
  nova: {
    "waitingroom/0": {
      note: "순서 값을 Lua 안에서 Redis 시계로 매겨 앱 서버 시계가 틀려도 뒤에 온 사람이 앞지르지 못한다",
    },
    "waitingroom/1": {
      note: "리더 하나가 임기 번호와 회차 번호를 걸고 커서를 올려, 옛 리더의 늦은 쓰기는 반영되지 않는다",
    },
    "waitingroom/2": {
      note: "상품과 회원에 묶인 120초 토큰. 한번 발급하면 무를 수 없다",
    },
    "preorder/1": {
      note: "회차 행을 FOR UPDATE 로 잡고 번호를 올려 빈틈이 없다. 모델 단위라 다른 모델과 안 기다린다",
    },
    "preorder/2": {
      note: "예약 · 등록 작업 · 이벤트가 한 트랜잭션. 응답 뒤 서버가 죽어도 릴레이가 보낸다",
    },
    "mysql/0": {
      note: "취소가 아닐 때만 값이 생기는 생성 칼럼으로 1인 1매를 걸어, 취소한 사람만 재신청된다",
    },
    "sqs/0": {
      note: "한 상품 몰림이 같은 큐의 다른 상품을 뒤로 밀지 않게 상품별 묶음으로 보낸다",
    },
    "worker/0": {
      note: "5xx 와 타임아웃은 미등록의 증거가 아니다. 응답을 모른 다음 차례는 등록이 아니라 조회부터 한다",
    },
    "worker/1": {
      note: "시도 횟수를 메시지 속성에 싣고 다녀 worker 에 DB 가 필요 없다",
    },
    "batch/0": {
      note: "be 는 외부 결과를 받은 뒤에만 바뀌므로, 외부 쪽 최근 2분 변경은 판정을 미뤄 정상 건을 어긋남으로 잡지 않는다",
    },
    "deploy/1": {
      note: "최대 대수 × 풀 × 2 + 50 이 RDS max_connections 를 넘으면 plan 이 멈춘다",
    },
    "obs/0": {
      note: "샘플링 전에 요청 수와 오류율을 먼저 집계해 버려진 트레이스까지 센다",
    },
    "obs/2": {
      note: "대기열이 느릴 때 Valkey 를 두 번 의심했지만 원인은 앱 CPU 의 55% 를 쓰던 JIT 였다",
    },
  },
  "coupon-yaho": {
    "gateway/0": {
      note: "판정 규칙 11줄을 위에서부터 차례로 적용",
    },
    "gateway/2": {
      note: "평활·하한·서킷 반영 후 공정 배분, 리더 상실 시 중단",
    },
    "coupon/0": {
      note: "IN_PROGRESS 선점 없이 발급과 DONE 기록을 한 번에 INSERT",
    },
    "redis/1": {
      note: "대기열은 ZSET, 순번은 ZCOUNT로 매번 계산",
    },
    "batch/2": {
      note: "잡 실패 외에 검증 판정 실패(VerificationVerdictFailed)도 따로 알림",
    },
    "prometheus/0": {
      note: "batch·api·queue-gateway 세 잡을 스크레이프",
    },
  },
  "live-chat": {
    "server/0": {
      note: "flatMap이면 동시 256건이 들어와 레이트리밋 창이 무력화됨",
    },
    "server/1": {
      note: "iss·aud·room·exp 존재까지 검증",
    },
    "server/3": {
      note: "저장 후 발행, 발행 실패는 흡수하고 ack 반환",
    },
    "redis/0": {
      note: "상시 hot 스트림, 채널명으로 roomId 먼저 필터",
    },
    "redis/1": {
      note: "세션 HASH·강퇴 SET·레이트리밋(3초 TTL) 키",
    },
    "pod/0": {
      note: "권한별 원문/마스킹본을 세션마다 골라 전송",
    },
    "mongo/1": {
      note: "TTL(730일) 인덱스는 ChatMongoConfig에서 생성",
    },
  },
  "voice-kiosk": {
    "client/0": {
      note: "카테고리 탭 터치로 메뉴·장바구니·옵션 화면 전환",
    },
    "client/1": {
      note: "녹음을 STT 서버(Google Cloud Speech)로 보내 텍스트로 변환",
    },
    "nlp/0": {
      note: "한 발화를 intents 배열로 추출(단일 요청도 배열)",
    },
    "nlp/1": {
      note: "intents를 query.sequence로 묶어 /api/handle로 전송",
    },
    "api/0": {
      note: "intent마다 도메인 컨트롤러를 차례로 호출해 results에 모음",
    },
    "api/1": {
      note: "필수 옵션(온도·크기)이 빠지면 pending 등록",
    },
    "api/2": {
      note: "세션별 cart·pendingOrders를 인메모리 객체에 보관",
    },
    "openai/0": {
      note: "temperature 0.3 호출, 응답을 json.loads로 파싱",
    },
  },
  haeyaji: {
    "client/0": {
      note: "알림 push 수신 시 목록·뱃지 재조회",
    },
    "backend/0": {
      note: "POST /message, 로그인 없이도 호출 가능",
    },
    "backend/1": {
      note: "@Transactional 없이 커넥션 반납 후 nlp 호출",
    },
    "backend/3": {
      note: "매일 07시, 비·눈 오는 날 외부 일정 알림 배치",
    },
    "backend/4": {
      note: "회원별 Redis 채널 구독, 내 연결일 때만 해제",
    },
    "ai/0": {
      note: "LLM 전 규칙으로 인젝션·도메인 밖 차단",
    },
    "ai/1": {
      note: "검색 후보를 주입하고 그중에서 고르는 RAG",
    },
    "data/0": {
      note: "가중치를 UPSERT로 원자 누적, 주1회 x0.9",
    },
    "data/1": {
      note: "Redis 장애는 캐시 미스로 흡수",
    },
    "external/0": {
      note: "@Async 발송, 실패해도 본 흐름에 영향 없음",
    },
    "external/1": {
      note: "예보가 비면 이전 발표시각으로 폴백",
    },
  },
  "blog-platform": {
    "server/1": {
      note: "5MB 제한 · diskStorage 고유 파일명",
    },
    "server/3": {
      note: "한국어 명사 + 영어 단어를 합쳐 키워드화",
    },
    "mongo/0": {
      note: "제목 키워드 3배 가중 후 textScore 정렬",
    },
  },
  zogakzip: {
    "badge/0": {
      note: "게시글·공감 라우트가 checkAndAwardBadges 호출",
    },
  },
};
