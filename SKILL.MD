0. 개요
제품명: 방송실 문제 다모아
형태: 웹앱 (지식 베이스 + 라이트 커뮤니티)
백엔드/DB 기본 방향:
Firebase (Firestore + Auth + Storage 중심)
필요 시 Cloud Functions로 일부 서버 로직 구현
목표
방송 담당 교사들이 겪는 장비·프로그램·운영·행정·학생지도 문제를
빠르게 검색·이해·해결할 수 있도록 돕는 웹 서비스.
카카오톡 방송방에서 오가는 현장 노하우를 구조화된 지식으로 재구성해 제공.
1. 사용자와 주요 시나리오
1.1. 주요 사용자
방송 담당 교사 (초·중·고, 특히 초보 담당자)
방송 지원 행정실무사 / 기술 지원 담당자
방송반 운영·지도에 관심 있는 다른 교사
1.2. 대표 사용 시나리오
1. 장비/프로그램 오류 해결
시보 프로그램(IMP 6000, IMP MS 6800, TBS9000, ACB800, L&B DS-1000 등)에서:
특정 교시 타종이 안 울림
TTS 앞부분이 잘림
출력 그룹만 독립적으로 켜지지 않음
시보기 초기화 이후 재설정 문제
교사가 증상을 검색 →
장비·프로그램·상황에 맞는 체크리스트형 해결 절차를 Firestore에서 조회.
2. 영상·음향 송출 문제 해결
예:
교실 TV에 영상만 안 나오는 문제 (케이블·증폭기·셋톱박스 점검 순서)
캠코더로 PPT 송출 시 초점이 계속 변하는 문제
운동장 체육대회 음악 송출(파티박스 등 이동형 스피커 활용 여부)
3. 시험·모의고사·수능·학평 방송 운영
수능/모의고사/학평에서:
교육청에서 내려온 음원/시나리오 적용
4·5교시 혼합 타종, 전학년·3학년 분리 타종 등 복잡한 타종 구성
고사 유의사항 TTS 음원 제작 및 시보기 예비령·본령 사이 삽입
“수능 방송 점검 체크리스트”, “모의고사 방송 시나리오 예시” 등을 템플릿으로 Firestore에 저장·조회.
4. 예산·견적·리모델링·업체 대응
방송실 리모델링(억대 예산 포함) 절차, 견적 비교, 필수 장비 체크리스트.
수능·방송부·정기예산 사용 사례(UPS, 무전기, 카메라, 마이크, 모니터 교체 등).
유지보수·시보기 업체 대응, 대여비·서비스 품질 관련 사례를 Q&A/Problem로 정리.
5. 운영 규칙·출입 관리·학생 지도
방송실·체육관 방송실 출입 통제:
관계자 외 출입금지, 열쇠·비밀번호 관리,
학생·타교과 교사의 장비 사용 기준과 책임 범위.
방송반 학생들과의 관계, 생기부 기재, 담당 교사의 심리적 부담 해소를 위한 공감/가이드.
6. 문서·양식·템플릿 활용
방송실 운영계획서 기본 틀.
방송부 운영계획서, 자유학기제 성취기준 예시.
시험·모의고사·수능 방송 시나리오 및 점검 계획서.
훈련(화재·민방위) 방송 음원, 안내 멘트 문안 등.
2. 기술 스택
2.1. 프론트엔드
Framework: React / Vue / Next.js 중 하나 (zai coding plan 선택)
UI 라이브러리:
예: MUI, Tailwind CSS, 또는 커스텀 디자인 시스템
상태 관리:
React Query / Vue Query / Redux Toolkit 등 선택
2.2. 백엔드 / BaaS (Firebase)
Firebase Authentication
이메일/비밀번호 또는 구글 계정 기반 로그인 (선택)
방송 담당 교사·실무사 등 역할을 User 문서와 매핑
Firebase Firestore (DB)
주요 컬렉션:
problems (문제 카드)
templates (템플릿/양식)
equipments (장비/프로그램 정보)
users (사용자 프로필 + 즐겨찾기 등)
posts (Q&A 게시글)
Firebase Storage
필요 시:
템플릿 예시 파일(hwp/pdf/docx),
참고 이미지(시보 설정 스크린샷, 배선 사진 등),
기타 첨부 자료 저장.
Firebase Cloud Functions (선택)
텍스트 검색 인덱스 관리(예: Algolia 등 연동 시),
집계(조회수/좋아요 수 등) 업데이트,
관리용 배치 작업(문서 구조 마이그레이션 등).
3. 데이터 모델 (FireStore 기준)
3.1. problems 컬렉션
각 방송 관련 문제/이슈를 한 문서로 저장.

jsonc

// Collection: problems
{
  "id": "auto_by_firestore",       // 문서 ID
  "title": "IMP 6000: 시험기간 시보 스케줄링 설정 방법",
  "summary": "시험 기간에만 다른 타종·멘트를 쓰기 위한 IMP 6000 스케줄링 설정 절차를 정리합니다.",
  "equipment": "IMP 6000",
  "category": "program",           // "equipment", "program", "operation", "policy" 등
  "context": "exam",               // "exam", "su-neung", "体育대회", "drill", "daily" 등
  "schoolLevel": "high",           // "elem", "middle", "high"
  "steps": [
    {
      "order": 1,
      "title": "기본 타종 스케줄 백업",
      "detail": "기존 평상시 타종 스케줄을 사진이나 메모로 기록해 둡니다.",
      "caution": "시험 이후 원래 스케줄로 되돌릴 수 있도록 백업은 필수입니다."
    },
    {
      "order": 2,
      "title": "스케줄링 탭에서 시험용 타종 추가",
      "detail": "두 번째 탭 [스케줄링]을 열고 시험일자에 맞는 타종과 음원을 설정합니다.",
      "caution": "듣기평가 시간에는 다른 타종이 겹치지 않도록 주의합니다."
    }
  ],
  "tags": ["IMP6000", "시보기", "타종", "시험운영"],
  "relatedProblemIds": ["..."],    // 연관 문제 ID 목록
  "fieldTips": [
    "시험 시보 멘트 음원은 뒤에 3초 무음을 붙이면 잘리는 문제를 줄일 수 있습니다.",
    "타이머 기반 예약을 사용하면 PC 종료와 상관없이 안정적입니다."
  ],
  "sourceNote": "카톡 방송방 2026-09-22 대화 참고 (개인정보 제거 후 요약)",
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp",
  "createdBy": "userId_optional"
}
3.2. templates 컬렉션
jsonc

// Collection: templates
{
  "id": "auto_by_firestore",
  "title": "방송실 운영 계획서 기본 틀 (중등)",
  "type": "operation-plan",        // "operation-plan", "scenario", "budget", "achievement" 등
  "schoolLevel": "middle",
  "context": "annual",             // 연간/학기/시험/훈련 등
  "contentMd": "# 방송실 운영 계획서 (중등)\n\n## 1. 목표...\n...",
  "description": "중학교 방송실 운영 계획서 기본 구조와 항목 예시를 제공하는 템플릿입니다.",
  "sampleFileUrl": "firebase_storage_url_optional",
  "tags": ["운영계획서", "방송실", "중등"],
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp",
  "createdBy": "userId_optional"
}
3.3. equipments 컬렉션
jsonc

// Collection: equipments
{
  "id": "auto_by_firestore",
  "name": "IMP 6000",
  "category": "clock-program",     // "clock-program", "amp", "camera", "speaker", "UPS", "settop", etc.
  "vendorNote": "IMP 6000은 시험기간 스케줄링 기능이 있으며, 예약 설정 시 타이머 모드를 사용하는 것을 권장.",
  "commonIssueIds": ["problemId1", "problemId2"],
  "tags": ["시보기", "IMP", "타종프로그램"]
}
3.4. users 컬렉션
jsonc

// Collection: users
{
  "id": "firebase_auth_uid",
  "email": "teacher@example.com",
  "role": "teacher",               // "teacher", "staff", "admin"
  "schoolLevel": "high",
  "favoritesProblems": ["problemId1", "problemId3"],
  "favoritesTemplates": ["templateId1"],
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
3.5. posts 컬렉션 (Q&A)
jsonc

// Collection: posts
{
  "id": "auto_by_firestore",
  "title": "IMP MS 6800에서 TTS 앞부분이 잘리는 문제",
  "content": "시험 안내 멘트 TTS 음원을 넣었는데 시작 부분이 계속 잘립니다...",
  "equipment": "IMP MS 6800",
  "context": "exam",
  "schoolLevel": "high",
  "tags": ["TTS", "IMP MS 6800", "타종"],
  "authorId": "userId",
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp",
  "answers": [
    {
      "authorId": "userId2",
      "content": "타이머 예약으로 설정하시거나 음원 뒤에 3초 무음을 붙여 보세요.",
      "createdAt": "Timestamp"
    }
  ],
  "linkedProblemIds": ["problemIdLinked"]
}
4. 기능 요구사항 (Firebase 연계 포함)
4.1. 검색 및 필터링
Firestore 기반 검색:
기본 필터:
equipment, context, schoolLevel, category 필드를 이용한 쿼리.
단순 키워드 검색:
title, summary, tags에 대해 클라이언트 필터 또는
필요 시 Cloud Functions + 외부 검색 서비스(Algolia 등) 연동.
UI:
상단 검색바:
사용자가 키워드를 입력하면,
우선 TAG/제목 기반 간단 필터 수행.
추가로, 파이어베이스에 정의된 인덱스를 활용해 필터링.
4.2. 문제 카드(Problem Card)
Firestore에서 problems 문서를 읽어 UI에 표시.
Step-by-step 체크리스트:
각 step에 체크박스를 두고,
(선택) 사용자별 진행 상태를 로컬 또는 Firestore(사용자별 progress)로 저장.
연관 문제:
relatedProblemIds를 통해 다른 문제 카드로 링크.
4.3. 템플릿 & 자료실
Firestore templates 컬렉션에서 목록 조회.
템플릿 상세:
contentMd를 Markdown으로 렌더링.
sampleFileUrl가 있을 경우, Firebase Storage의 파일 다운로드 링크 제공.
4.4. Q&A / 커뮤니티 라이트
질문 등록:
로그인 사용자의 uid를 authorId로 저장.
posts 컬렉션에 새 문서 생성.
답변:
answers 배열에 새 답변 push (Firestore array field).
또는 answers를 별도 서브컬렉션으로 설계해도 됨.
관리 기능(추후):
관리자 계정(role: admin)이 유용한 Q&A를 Problem으로 승격:
Cloud Functions or 관리자용 UI에서 Q&A 내용을 기반으로 problems 문서 생성.
4.5. 즐겨찾기 / 개인화
즐겨찾기:
users 문서의 favoritesProblems, favoritesTemplates 필드에 해당 ID를 추가/삭제.
홈 화면:
로그인 시 사용자 schoolLevel 기준 추천 문제·템플릿을 우선 노출.
5. UI/UX 설계
5.1. 전체 톤 & 컨셉
컨셉:
“​방송 초보 교사도 시험 당일 바로 쓸 수 있는 차분한 해결 가이드”
톤:
긴장된 상황에서도 안정감을 주는 문장과 디자인.
색:
메인: 블루/네이비 (신뢰·안정)
서브: 그린/민트(해결·성장), 옐로우/주황(주의 강조)
5.2. 주요 화면
1. 홈 (문제 해결)
상단: 로고 + 검색바 + 사용자 메뉴.
중단:
“요즘 많이 찾는 문제” (조회수 상위, Firestore에서 집계 가능)
“초보 방송 담당 교사용 시작 가이드”
2. 문제 상세
제목·요약·3줄 요약 박스.
Step-by-step 체크리스트:
직관적인 번호와 간단 설명 + 상세 설명.
하단:
“현장 팁” 섹션.
“관련 템플릿” 버튼.
3. 템플릿 목록/상세
좌측 필터: 템플릿 종류, 학교급, 상황.
우측 목록: 카드형 템플릿.
상세:
설명 + Markdown 렌더링 + (선택) Storage 파일 다운로드 링크.
4. Q&A
목록: 제목 + 장비/상황 태그 + 답변 수.
질문 작성:
상황/장비/학교급 선택 + 본문 작성.
상세:
질문 + 답변 리스트.
5. 즐겨찾기
사용자가 저장한 문제 카드·템플릿 목록을 Firestore users에서 읽어 표시.
5.3. 반응형/접근성
모바일 대응 필수:
시험 당일 방송실 PC가 아닌 스마트폰을 통한 검색도 예상.
버튼·텍스트 큼직하게:
실수 최소화.
색상 뿐 아니라 아이콘·텍스트로도 상태 표현.
6. 비기능 요구사항
성능:
Firestore 쿼리 최소화, 적절한 인덱스 정의.
인기 문제/템플릿은 캐싱 또는 프리패치 고려.
보안:
Firebase Rules:
일반 사용자 읽기: 대부분 공개(problems, templates, equipments).
쓰기:
users: 자기 문서만 수정 가능.
posts: 로그인 사용자만 작성/수정.
problems, templates: 관리자(role: admin)만 쓰기/수정.
개인/학교 식별 정보는 문제 카드에 직접 노출하지 않도록 주의.
안정성:
Firestore/Storage 오류 시 사용자 친화적인 메시지 제공.
7. MVP(초기 버전) 범위
1. Firebase 프로젝트 생성 및 기본 설정 (Auth, Firestore, Storage).
2. problems, templates, equipments 기본 컬렉션 구조 구현.
3. 홈 + 문제 상세 + 템플릿 목록/상세 화면 구현.
4. 간단한 Q&A 게시판(posts) 구현.
5. 로그인 및 즐겨찾기(사용자별 favorites) 구현.
6. Firebase Security Rules 기본 설정:
읽기 공개, 쓰기 권한 분리(일반 사용자 vs 관리자).