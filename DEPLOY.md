# Deployment

이 포트폴리오는 GitHub Pages 정적 배포를 기준으로 구성한다.

## 배포 대상

- Platform: GitHub Pages
- Source: GitHub Actions
- Branch: `main`
- Repository: `HUHGEON/portfolio`
- URL: `https://huhgeon.github.io/portfolio/`

GitHub Pages는 저장소명이 URL path로 붙기 때문에 배포 빌드에서는 `basePath`가 `/portfolio`로 설정된다. 기술 블로그(`huhgeon.github.io` 루트)와 겹치지 않도록 포트폴리오는 별도의 프로젝트 저장소(`portfolio`)로 배포한다.

## Next.js 설정

배포 설정은 [next.config.ts](./next.config.ts)에 둔다.

```ts
const githubPagesBasePath = process.env.GITHUB_PAGES === "true" ? "/portfolio" : "";
```

GitHub Pages 빌드에서는 `GITHUB_PAGES=true`를 사용한다.

- `output: "export"`: 정적 HTML export
- `trailingSlash: true`: 정적 호스팅에서 직접 URL 접근 지원
- `basePath: "/portfolio"`: GitHub Pages 저장소 경로 대응
- `assetPrefix: "/portfolio"`: 정적 chunk 경로 대응
- `NEXT_PUBLIC_BASE_PATH`: 클라이언트에서 public asset 경로 보정
- `images.unoptimized: true`: static export에서 `next/image` 사용 가능하게 설정

## GitHub Actions

배포 워크플로우는 [.github/workflows/deploy.yml](./.github/workflows/deploy.yml)에 둔다.

흐름:

1. `main` 브랜치 push 또는 수동 실행
2. Node.js 설치
3. `npm ci`
4. `GITHUB_PAGES=true npm run build`
5. `out/` 디렉터리를 GitHub Pages artifact로 업로드
6. GitHub Pages 배포

## GitHub Pages 설정

GitHub 저장소에서 아래 설정이 필요하다.

1. Settings → Pages
2. Source를 `GitHub Actions`로 설정
3. `main` 브랜치에 push
4. `Deploy portfolio` 워크플로우 완료 확인

## 로컬에서 배포 산출물 확인

GitHub Pages와 동일한 base path로 정적 빌드를 확인한다.

```bash
GITHUB_PAGES=true npm run build
npx serve out
```

접속 경로:

```text
http://localhost:3000/portfolio/
```

일반 로컬 개발은 base path 없이 실행한다.

```bash
npm run dev
```

접속 경로:

```text
http://localhost:3000
```

## Public Asset 경로 규칙

GitHub Pages 환경에서는 `/icons/...`, `/images/...` 같은 루트 절대 경로가 깨질 수 있다. 캔버스 노드의 `icon.src`, `image.src`는 `WorkflowCanvas`에서 `NEXT_PUBLIC_BASE_PATH`를 기준으로 보정한다.

새 public asset 렌더링 경로를 추가할 때는 다음 규칙을 따른다.

- `next/image`에 직접 public path를 넘기는 경우 base path 보정 여부를 확인한다.
- 캔버스 노드 이미지는 `WorkflowCanvas`의 기존 보정 로직을 사용한다.
- 외부 URL, `https://...`, protocol-relative URL은 보정하지 않는다.
- GitHub Pages 검증은 `GITHUB_PAGES=true npm run build`로 수행한다.

## 주의 사항

- 서버 기능이 필요한 Next.js 기능은 정적 export에서 사용할 수 없다.
- 동적 라우트는 `generateStaticParams()`와 `dynamicParams = false`를 유지한다.
- 프로젝트 상세 페이지를 추가하면 해당 slug가 정적 생성 목록에 포함되는지 확인한다.
- `out/`은 빌드 산출물이므로 커밋하지 않는다.
