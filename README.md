# 허건 · Backend Developer Portfolio

Node.js·Spring 기반 백엔드 개발을 중심으로 API 설계, ERD·DB 모델링, 실시간 서버, 데이터 파이프라인을 만드는 백엔드 개발자 허건의 포트폴리오입니다.

단순한 카드형 포트폴리오가 아니라, 각 프로젝트의 목표와 구조를 **캔버스 기반 노드 그래프**로 보여주는 형태로 구성했습니다. 프로젝트마다 Overview · 프로젝트 목표 · 아키텍처 · 주요 기능 · 문제/해결 · 결과 · 기술 선택 흐름으로 정리해, 기술 흐름과 구현 경험을 한 화면에서 탐색할 수 있습니다.

## What I Build

- Backend API
- ERD · DB 설계
- 실시간 채팅 서버
- 데이터 파이프라인

## Primary Stack

`Node.js` · `Express` · `Spring` · `FastAPI` · `MySQL` · `MongoDB` · `Redis`

## Tech

- Next.js (App Router, static export)
- Tailwind CSS v4
- 라이트/다크 테마, 캔버스형 워크플로우 노드 UI

## 개발

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 정적 빌드 (GITHUB_PAGES=true 시 basePath /portfolio)
```

## 배포

`main` 브랜치에 push하면 GitHub Actions가 정적 빌드 후 GitHub Pages로 배포합니다. 자세한 내용은 [`DEPLOY.md`](./DEPLOY.md) 참고.
