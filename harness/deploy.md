# 배포 규칙

이 프로젝트는 GitHub Pages 정적 배포를 기준으로 유지한다.

## 기준 문서

배포 세부 절차는 루트 [DEPLOY.md](../DEPLOY.md)에 둔다. 하네스에서는 개발 중 지켜야 하는 규칙만 정의한다.

## 원칙

- 기본 배포 대상은 GitHub Pages이다.
- `main` 브랜치 push 시 GitHub Actions로 배포한다.
- 빌드 산출물은 `out/`이며 저장소에 커밋하지 않는다.
- 로컬 개발과 GitHub Pages 배포는 base path가 다르므로 구분해서 검증한다.
- 배포 관련 설정을 바꾸면 `DEPLOY.md`와 이 문서를 함께 갱신한다.

## 명령어

일반 로컬 개발:

```bash
npm run dev
```

GitHub Pages와 동일한 정적 빌드:

```bash
GITHUB_PAGES=true npm run build
```

정적 산출물 로컬 확인:

```bash
GITHUB_PAGES=true npm run build
npx serve out
```

## basePath 규칙

- 로컬 개발에서는 base path를 사용하지 않는다.
- GitHub Pages 빌드에서는 `GITHUB_PAGES=true`를 설정한다.
- `GITHUB_PAGES=true`일 때 `basePath`와 `assetPrefix`는 `/portfolio`가 된다.
- public asset을 직접 렌더링하는 코드는 `/portfolio` 경로 보정 여부를 확인한다.

## 정적 export 호환성

새 기능을 추가할 때 다음 기능은 피한다.

- 요청 시점의 `cookies()`, `headers()`, `draftMode()`
- 서버 액션
- 요청 객체에 의존하는 Route Handler
- `generateStaticParams()` 없는 동적 라우트
- 정적 export와 호환되지 않는 image optimization 설정

동적 라우트가 필요하면 정적 생성 가능한 slug 목록을 제공한다.

## 검증 기준

배포 설정 또는 public asset 경로를 변경하면 최소한 아래를 실행한다.

```bash
npm run typecheck
GITHUB_PAGES=true npm run build
```

UI와 구조 변경까지 포함되면 기본 하네스를 실행한다.

```bash
npm run harness
```
