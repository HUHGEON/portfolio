# 페이지와 프로젝트 상세 구성 규칙

포트폴리오의 페이지와 프로젝트 상세 화면은 기존 페이지 정의를 기준으로 일관되게 확장한다.

## 기준 구조

새 프로젝트 상세 페이지를 만들 때는 아래 파일들을 먼저 확인한다.

- `src/components/pages/project-detail/definitions/hippobox.ts`
- `src/components/pages/project-detail/definitions/blueprint4agent.ts`
- `src/components/pages/project-detail/definitions/today-in-tech.ts`
- `src/components/pages/project-detail/definitions/say-it-ok.ts`

특히 다음 구조를 기준 패턴으로 삼는다.

```text
Project Icon + Overview
Info
Project Goals
Goals
System Architecture
Features
Results
Lessons Learned
```

프로젝트 성격상 일부 섹션이 필요 없을 수 있지만, 생략 사유가 명확하지 않으면 위 순서를 유지한다.

## 프로젝트 상세 파일 추가 절차

1. `src/i18n/dictionaries.ts`의 `projects`에 프로젝트 메타데이터를 추가한다.
2. `src/components/pages/projects/canvas-definition.ts`에 프로젝트 메인 카드 배치를 추가한다.
3. `src/components/pages/project-detail/definitions/{slug}.ts`를 추가한다.
4. `src/components/pages/project-detail/definitions/index.ts`에서 slug와 상세 정의를 연결한다.
5. 프로젝트 아이콘과 이미지 자산은 `public/` 하위에 둔다.
6. `npm run typecheck` 또는 `npm run harness`로 정적 생성 가능 여부를 확인한다.

## 노드 순서 규칙

- 사용자에게 보여줄 주요 흐름은 `order` 값을 명시한다.
- 장식, 섹션 배경, 보조 설명처럼 이동 대상이 아닌 노드는 `excludeFromSequence: true`를 사용한다.
- `order` 값은 중복되지 않게 유지한다.
- 이미지와 설명이 한 세트일 때는 일반적으로 이미지 노드를 먼저, 설명 노드를 다음 순서로 둔다.
- `Projects`, `System Architecture`, `Features`, `Results`, `Lessons Learned` 같은 주요 타이틀은 `appearance: "transparent"`를 사용한다.

## 아키텍처 섹션 규칙

아키텍처는 Mermaid가 아니라 캔버스 노드와 엣지로 표현한다.

- `architectureOrigin`, `featuresOrigin`, `outcomeOrigin`처럼 섹션 단위 origin 변수를 둔다.
- 관련 노드들은 origin 함수(`architectureX`, `architectureY`)로 배치한다.
- 섹션 전체를 옮겨야 할 때 origin 값만 변경하면 되도록 구성한다.
- 섹션 배경은 `appearance: "section"`을 사용한다.
- 기술 요소는 `appearance: "technology"`를 사용한다.
- 설명 문구는 섹션 내부에 억지로 넣지 말고 필요하면 투명 노드로 주변 빈 공간에 배치한다.
- 엣지는 가능한 한 좌→우 또는 상→하 흐름으로 유지한다.
- 긴 대각선, 중복 교차, 섹션 밖으로 나가는 엣지는 피한다.
- API, Backend, Deploy, Observability 같은 복합 구조는 `HippoBox`와 `Blueprint4Agent`의 아키텍처 구성을 먼저 참고한다.

## Features 섹션 규칙

- 이미지가 있으면 2열 구조로 배치한다.
- 이미지 노드는 테두리가 이미지에 맞게 보이도록 `frame: "outline"`과 `fit: "contain"`을 우선 사용한다.
- 이미지가 없으면 기능 설명 노드를 2x2 또는 2열 구조로 배치한다.
- 기능 제목은 `## Feature Name` 형태를 사용한다.
- 기능 설명은 단순 나열보다 사용자가 이해할 수 있는 목표와 동작 중심으로 작성한다.

## Results / Lessons Learned 규칙

- `Features` 마지막 노드와 `Results` 시작 노드 사이 간격은 기존 프로젝트 상세 페이지와 유사하게 유지한다.
- `Results`는 프로젝트 목표가 어떤 결과로 충족되었는지 설명한다.
- `Lessons Learned`는 해당 프로젝트를 통해 배운 기술적 판단, 구조적 교훈, 다음 프로젝트로 이어진 맥락을 설명한다.
- 두 노드는 보통 나란히 배치한다.

## 공개 콘텐츠 규칙

- 프로젝트 설명은 공개 저장소, 공개 배포 URL, 공개 가능한 구현 범위에 기반한다.
- private 저장소의 내부 구현, 토큰, 환경 변수, 비공개 운영 정보는 작성하지 않는다.
- 확실하지 않은 내용은 포트폴리오 문구에 넣지 않는다.

## 페이지 추가 규칙

프로젝트 페이지 외 다른 페이지를 추가할 때도 기존 구조를 먼저 참고한다.

- 라우트는 `src/app/{route}/page.tsx`에 둔다.
- 페이지 전용 캔버스는 `src/components/pages/{page}/` 하위에 둔다.
- 공용 UI는 `src/components/ui/`, 공용 shell은 `src/components/shell/`을 사용한다.
- 사이드바에 노출할 페이지는 i18n 사전과 shell navigation 구조를 함께 갱신한다.
- 페이지가 정적 export 가능한지 확인한다.
