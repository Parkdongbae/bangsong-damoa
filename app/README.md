# 방송실 문제 다모아

방송 담당 교사를 위한 장비·프로그램·운영 문제 해결 가이드 웹앱.
카카오톡 방송방 대화를 개인정보 제거 후 구조화한 지식베이스 + 라이트 커뮤니티(Q&A).

## 현재 동작 방식 (듀얼 모드)

| 모드 | 조건 | 동작 |
|---|---|---|
| **데모 모드** | `.env` 미설정 | 브라우저 localStorage에 저장. 시드 데이터(talk.txt에서 추출) 포함. 데모 관리자: `admin@damoa.local` / `admin1234` |
| **Firebase 모드** | `.env` 채움 | Firestore + Auth + Storage 실서버 연동 |

## 개발 실행

```bash
cd app
npm install
npm run dev      # http://localhost:5173
npm run build    # 타입체크 + 프로덕션 빌드 (dist/)
```

## Firebase 연결 방법 (나중에)

1. https://console.firebase.google.com 에서 프로젝트 생성
2. **Authentication** 시작하기 → 이메일/비밀번호 + Google 사용 설정
3. **Firestore Database** 생성 (프로덕션 모드)
4. **Storage** 생성
5. 프로젝트 설정 > 일반 > 내 앱 > 웹앱 추가 → config 값 복사
6. `app/.env.example`을 `.env`로 복사하고 값 채우기
7. 규칙 배포:
   ```bash
   npm i -g firebase-tools
   firebase login
   firebase use --add   # 프로젝트 선택
   firebase deploy --only firestore:rules,storage:rules
   ```
8. 관리자 지정: Firestore 콘솔에서 `users/{본인uid}` 문서의 `role`을 `admin`으로 수정
9. 콘텐츠 올리기: 관리자 계정으로 로그인 → 관리 페이지 → "시드 데이터 가져오기"
10. 배포: `npm run build` 후 `firebase deploy --only hosting`

## 데이터 구조 (Firestore)

- `problems` 문제 카드 (제목/요약/장비/단계별 체크리스트/현장팁/태그)
- `templates` 템플릿·양식 (마크다운 본문)
- `equipments` 장비·프로그램 정보
- `users` 프로필 + 즐겨찾기 (본인만 수정)
- `posts` Q&A (로그인 사용자 작성, answers 배열)

보안 규칙: `firestore.rules` / `storage.rules` — 읽기 공개, problems·templates·equipments 쓰기는 관리자만.

## 익명화 정책

시드 데이터는 카톡 대화에서 다음을 **완전 제거** 후 재구성:
화자 닉네임·실명·학교명·지역명. 남는 것: 장비명·증상·해결 절차·현장 팁·학교급(초/중/고) 일반 정보.

## PWA

`vite-plugin-pwa` 적용. 빌드 후 서비스 워커가 앱 셸을 캐시해 오프라인에서도
열어본 문제(로컬 캐시) 열람 가능. 스마트폰 브라우저 "홈 화면에 추가"로 앱처럼 사용.
