# 개발 도구 규칙

이 프로젝트는 ESLint, Prettier, TypeScript 타입 체크를 기본 품질 검증 도구로 사용한다.

## 명령어

```bash
npm run format
npm run format:check
npm run lint
npm run lint:fix
npm run typecheck
npm run check
npm run harness
GITHUB_PAGES=true npm run build
```

## 명령어 역할

- `npm run format`: Prettier로 전체 파일을 포맷한다.
- `npm run format:check`: Prettier 포맷 위반 여부만 확인한다.
- `npm run lint`: ESLint 규칙을 검사한다.
- `npm run lint:fix`: ESLint가 자동 수정 가능한 항목을 수정한다.
- `npm run typecheck`: `tsc --noEmit`으로 타입 오류를 확인한다.
- `npm run check`: 포맷, 린트, 타입 체크를 함께 실행한다.
- `npm run harness`: `check` 후 production build까지 실행한다.
- `GITHUB_PAGES=true npm run build`: GitHub Pages와 동일한 base path로 정적 export를 검증한다.

## 적용 규칙

- 포맷은 `.prettierrc.json`을 기준으로 한다.
- 포맷 제외 대상은 `.prettierignore`에 둔다.
- 린트는 `eslint.config.mjs`를 기준으로 한다.
- Prettier와 충돌하는 ESLint 규칙은 `eslint-config-prettier`로 비활성화한다.
- 타입 체크는 `tsconfig.json`과 Next.js 타입 설정을 기준으로 한다.
- UI 또는 코드 변경 후 기본 검증은 `npm run harness`이다.
- 배포 설정, public asset 경로, GitHub Pages 관련 변경은 `GITHUB_PAGES=true npm run build`를 추가로 실행한다.

## VS Code 규칙

VS Code는 `.vscode/settings.json`을 통해 프로젝트 설정을 따른다.

- 저장 시 Prettier 포맷을 실행한다.
- 저장 시 ESLint 자동 수정을 실행한다.
- 프로젝트 내부 TypeScript SDK를 사용한다.
- Prettier 설정 파일이 있을 때만 포맷을 수행한다.
- VS Code 작업 목록에서 `npm: check`, `npm: harness`, `npm: typecheck`를 실행할 수 있다.

권장 확장은 `.vscode/extensions.json`에 명시한다.
