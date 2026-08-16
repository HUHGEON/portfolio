# FaaS 확장 규칙

포트폴리오는 정적 사이트를 우선하지만, 이후 FaaS로 확장하기 쉬운 구조를 유지한다.

## 현재 규칙

- UI 컴포넌트는 데이터 조회 방식과 분리한다.
- 정적 포트폴리오 데이터와 다국어 문구는 현재 `src/i18n/`에 둔다.
- 정적 데이터로 충분하지 않을 때만 server action 또는 route handler를 추가한다.
- 현재 배포 대상은 GitHub Pages 정적 export이므로, FaaS 기능은 기본 배포 경로에 포함하지 않는다.
- FaaS가 필요해지면 GitHub Pages 정적 사이트와 별도 API 배포 대상을 분리한다.

## 향후 FaaS 후보

- Velog 글 동기화 엔드포인트
- GitHub 활동 캐시 갱신
- 연락 폼 전송
- 프로젝트 메타데이터 갱신

## API 형태

FaaS를 추가할 때는 작은 route handler를 우선한다.

```text
src/app/api/{domain}/route.ts
```

각 route는 입력을 검증하고, 외부 API 호출을 격리하며, UI가 소비할 최소 JSON만 반환해야 한다.

단, route handler는 GitHub Pages 정적 export에서 실행되지 않는다. 실제 적용 전 [배포 규칙](./deploy.md)을 함께 갱신한다.
