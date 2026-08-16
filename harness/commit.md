# 커밋 규칙

이 프로젝트는 Conventional Commits를 따른다.

## 형식

```text
type(scope): subject
```

`scope`는 선택값이다.
`type`과 `scope`는 영문 토큰을 사용하고, `subject`는 한국어로 작성한다.

## 허용 타입

- `feat`: 사용자에게 보이는 기능 추가
- `fix`: 버그 수정
- `docs`: 문서만 변경
- `style`: 포맷팅 또는 시각 스타일만 변경
- `refactor`: 동작 변경 없는 코드 구조 개선
- `perf`: 성능 개선
- `test`: 테스트 추가 또는 수정
- `build`: 빌드 시스템 또는 의존성 변경
- `ci`: CI 설정 변경
- `chore`: 유지보수 작업
- `revert`: 이전 커밋 되돌리기

## 예시

```text
feat(projects): HippoBox 프로젝트 카드를 추가
docs(harness): 프론트엔드 규칙을 문서화
build: commitlint 설정을 추가
```

## 강제 방식

- `commitlint`로 커밋 메시지를 검증한다.
- `.githooks/commit-msg`를 버전 관리되는 Git hook으로 사용한다.
- `core.hooksPath`는 `.githooks`를 가리켜야 한다.
