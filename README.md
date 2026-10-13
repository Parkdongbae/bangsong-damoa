# 방송실 문제 다모아 🎙️

**방송 담당 교사를 위한 장비·프로그램·운영 문제 해결 가이드 웹앱**

카카오톡 방송방에서 1년 반 동안 쌓인 현장 Q&A를 개인정보를 완전히 제거한 뒤
구조화된 지식(문제 해결 카드·템플릿·장비 정보)으로 재구성한 지식 베이스 + 라이트 커뮤니티입니다.

> 시험 당일, 방송실에서 당황하지 않는 방법 — 증상을 검색하면 단계별 체크리스트가 나옵니다.

## 📚 시드 데이터 (카톡방 지식 구조화)

| 구분 | 건수 | 내용 |
|---|---|---|
| 문제 해결 카드 | **183건** | 증상 → 단계별 체크리스트 → 현장 팁 (시보기·앰프·UPS·수능 방송·행정 등) |
| 템플릿·양식 | **10건** | 듣기평가 당일 운영 체크리스트, 수능 준비 일정, 배선 견적 확인, 폐기 절차 등 |
| 장비 정보 | **124건** | 시보프로그램(IMP/PW/TBS/ACB/L&B), 앰프, UPS, CDP, 무선마이크, 서비스 등 |

모든 카드는 2025-03 ~ 2026-10 카톡 대화를 재구성한 것이며, 출처(`sourceNote`)에 대화 날짜가 기록되어 있습니다.

## 🔒 익명화 정책

원본 대화에서 **화자 닉네임·실명·학교명·지역명을 완전히 제거**하고 내용만 재구성했습니다.
남는 것: 장비명·증상·해결 절차·현장 팁·학교급(초/중/고) 일반 정보.
푸시 전 추적 파일 전체를 닉네임·학교명 토큰으로 자동 스캔해 유출 0건을 확인했습니다
(검증 스크립트: [`app/scripts/merge-seed.mjs`](app/scripts/merge-seed.mjs)).

## ✨ 주요 기능

- **홈** — 통합 검색, 조회수 상위 문제, 초보 담당 교사 시작 가이드
- **문제 해결** — 장비·상황·학교급 필터, 단계별 체크리스트(진행률 저장), 현장 팁, 연관 문제, 인쇄
- **시험당일 인쇄용 체크리스트** — 수능/모의고사 관련 문제를 한 장으로 묶어 출력 (날짜·학교 빈칸 포함)
- **템플릿** — 마크다운 렌더링, 즐겨찾기
- **Q&A** — 로그인 사용자 질문·답변
- **즐겨찾기** — 문제·템플릿 개인 저장
- **관리자** — 웹에서 문제/템플릿/장비 편집, JSON 시드 가져오기
- **PWA** — 스마트폰 홈화면 설치, 오프라인에서 열어본 문제 열람

## 🛠 기술 스택

Vite · React 18 · TypeScript · Tailwind CSS · TanStack Query · react-markdown · PWA (vite-plugin-pwa)
Firebase (Auth · Firestore · Storage · Hosting) — **Firebase 설정 전에는 데모 모드(localStorage)로 전체 기능 동작**

## 🚀 빠른 시작

```bash
cd app
npm install
npm run dev     # http://localhost:5173
```

데모 관리자 계정: `admin@damoa.local` / `admin1234`
(데모 모드는 브라우저 localStorage에 저장되며, Firebase 연결 시 자동으로 실서버 모드로 전환됩니다)

## ☁️ Firebase 연결 & 배포

상세 절차는 [`app/README.md`](app/README.md) 참고. 요약:

1. Firebase 콘솔에서 프로젝트 생성 (Auth·Firestore·Storage 사용 설정)
2. `app/.env.example` → `.env` 복사 후 웹앱 config 값 입력
3. 규칙 배포: `firebase deploy --only firestore:rules,storage:rules`
4. 관리자 지정 후 **관리 페이지 → 시드 가져오기**로 콘텐츠 업로드
5. `npm run build` 후 `firebase deploy --only hosting`

보안 규칙: 읽기 공개 / problems·templates·equipments 쓰기는 관리자만 / posts·users는 로그인 사용자 본인 (`firestore.rules`)

## 📄 문서

| 문서 | 내용 |
|---|---|
| [`SKILL.MD`](SKILL.MD) | 서비스 기획 명세 (사용자 시나리오·데이터 모델·요구사항) |
| [`app/README.md`](app/README.md) | 개발·Firebase 연결·배포 상세 가이드 |
| [`GIT.MD`](GIT.MD) | Windows/PowerShell 환경의 커밋·푸시 문제 해결 기록 |
| [`firestore.rules`](app/firestore.rules) | Firestore 보안 규칙 |

---

카톡 방송방에서 공유해 주신 모든 선생님들의 노하우로 만들어졌습니다. 🙏
