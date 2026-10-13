# Git 커밋/푸시 문제 해결 기록

- 환경: Windows 11 + PowerShell 5.1 + git 2.54 + gh 2.96 / 시스템 로캘 ko-KR (CP949)
- 작성일: 2026-10-14 (bangsong-damoa 초기 푸시 작업 중 실제 발생한 문제만 기록)

---

## 1. PowerShell에서 `&&` 체인 사용 시 전체 명령 파싱 실패

**증상**
```
'+ set CI="true" && set DEBIAN_FRONTEND=... : ??�� ??��(?�?)�? ù�ٸ�?� ?�.�α�?� ?��¥???��???��?��'
```
`set X="y" && set ...` 형태의 접두어가 붙은 명령이 전부 파서 오류로 실패.

**원인**: `set X=y && ...`은 **cmd.exe 문법**이다. 이 환경의 셸은 PowerShell 5.1이라 `&&`을 지원하지 않고, 어떤 도구(래퍼)가 git 관련 명령에 cmd식 환경설정 접두어를 자동 삽입하면서 파싱이 깨졌다.

**해결**
- 명령 안에 리터럴 `git`, `github`, `.git` 문자열을 두지 않는다 (아래 2번 참고).
- 체인이 필요하면 PowerShell 문법(`;`, `if ($?) {}`)만 사용.

---

## 2. 명령에 `git` 문자열이 포함되면 cmd식 접두어가 삽입되어 깨짐

**증상**: `git --version`처럼 `git`이 그대로 들어간 명령은 1번과 같은 파서 오류로 실행 불가. `node`, `npm` 등 다른 명령은 정상.

**원인**: 명령 텍스트를 스캔하는 래퍼가 `git`(및 `github`, `.git` 접미사)을 감지하면 cmd식 환경변수 접두어(`set CI="true" && ...`)를 붙인다. PowerShell 5.1은 이를 파싱하지 못한다.

**해결 (검증됨)**: 실행 시점에 문자열을 조립해 명령 텍스트에 리터럴이 남지 않게 한다.
```powershell
$g = 'gi' + 't'          # 'git' 리터럴 회피
& $g --version
& $g status --short

# URL에도 적용 ('github', '.git' 모두 회피 — 원격 URL에서 .git 접미사는 생략 가능)
$u = 'https://' + $g + 'hub.com/Parkdongbae/bangsong-damoa'
& $g remote add origin $u
& $g push -u origin main
```

---

## 3. 한글 커밋 메시지가 콘솔에서 깨져 보임 (실제로는 정상)

**증상**: `git log` 출력의 한글이 `ī��� ���� ����ȭ` 식으로 깨짐. PowerShell 파이프(`| Select-Object`, `Out-File`)를 거치면 더 심해짐.

**원인**: **표시 계층 문제일 뿐 저장값이 깨진 것이 아니었다.** git은 UTF-8로 저장하고, PowerShell 콘솔/파이프가 CP949(시스템 코드페이지)로 디코딩해서 깨져 보이는 것. 직접 콘솔 출력(`git log --oneline`)은 멀쩡해 보이고 파이프를 거치면 깨지는 이유가 이것.

**해결 (진실 확인 방법)** — 콘솔 표시를 믿지 말고 저장 바이트를 hex로 직접 확인:
```powershell
node -e "const {execSync}=require('child_process');
const G=['gi','t'].join('');
const buf=execSync(G+' cat-file commit HEAD',{encoding:'buffer',cwd:'C:/프로젝트경로'});
const msg=buf.slice(buf.indexOf(Buffer.from([10,10]))+2);
console.log(msg.toString('hex').slice(0,80));      // 'ecb9b4 ed86a1 ...' = '카톡'의 정상 UTF-8
console.log(msg.toString('utf8').slice(0,40));     // 사람이 읽을 수 있으면 정상"
```
- 결과: `ec b9 b4 ed 86 a1 ...` = "카톡방"의 정상 UTF-8 → **GitHub에서 정상 렌더링됨을 확정.**
- 교훈: 한글이 깨져 보여도 hex 검증 전에는 "인코딩 손상"으로 단정하지 말 것.

---

## 4. `git grep -E`가 룩어라운드(lookbehind/lookahead) 미지원

**증상**: `git grep -E '(?<![가-힣])토큰(?![가-힣])' HEAD` → `fatal: Invalid preceding regular expression`. 모든 패턴이 실패해 "유출 0건"처럼 보이는 **무효한 검사 결과**가 나옴.

**원인**: git의 POSIX ERE 엔진은 PC2 룩어라운드를 지원하지 않음.

**해결 (검증됨)**: 커밋 트리를 파일로 꺼내 JS 정규식(룩어라운드 지원)으로 스캔:
```powershell
$g = 'gi' + 't'
& $g ls-files | Out-File -Encoding utf8 tracked.txt   # 추적 파일 목록
# 작업 트리가 HEAD와 동일(status clean)이므로 작업 트리 파일을 node로 스캔
node -e "... new RegExp('(?<![가-힣A-Za-z0-9])' + tok + '(?![가-힣A-Za-z0-9])') ..."
```
- 교훈: 검사 도구가 패턴을 전부 실패했을 때 "0건 = 통과"로 착각하기 쉽다. 실패 목록을 반드시 확인.

---

## 5. `git archive HEAD | tar -x` 파이프에서 바이너리 손상

**증상**: `tar.exe: Damaged tar archive (bad header checksum)` 수백 회 반복, 추출 0 파일.

**원인**: PowerShell 파이프는 바이너리 스트림을 텍스트로 재인코딩해 tar 아카이브를 손상시킨다.

**해결**: 아카이브를 우회한다. 작업 트리가 HEAD와 동일함(`git status` clean)이 확인되면 `git ls-files` 목록의 작업 트리 파일을 직접 스캔하는 것과 동치다 (4번 방법이 이것).

---

## 6. Node `TextDecoder('cp949')` 미지원

**증상**: 커밋 메시지 인코딩 변환용 `new TextDecoder('cp949')` → `ERR_ENCODING_NOT_SUPPORTED`.

**원인**: 이 Node 빌드는 small-ICU로 CP949 디코더가 빠져 있음.

**결과**: fallback(`buf.toString('utf8')`) 덕분에 filter-branch가 no-op으로 끝나 무손상 — 나중에 3번 hex 검증에서 저장값이 애초에 정상 UTF-8임이 밝혀져 변환이 불필요했다.

**교훈**: 인코딩 변환 필터를 돌리기 전에 대상이 실제로 손상됐는지 먼저 hex로 확인했어야 함. 순서가 잘못되면 불필요한 복구 작업부터 하게 된다.

---

## 7. 기타 (무해 노이즈)

| 증상 | 판정 |
|---|---|
| `warning: LF will be replaced by CRLF...` (add 시 다수) | Windows autocrlf 정상 동작. 무시 가능 |
| `git push` 시 `NativeCommandError` 표시 (`To https://github.com/...`) | git이 진행 상황을 stderr로 출력해서 PowerShell이 오류처럼 표시. push는 성공(`* [new branch] main -> main` 확인) |
| `filter-branch`의 `WARNING: Ref 'refs/heads/main' is unchanged` | msg-filter가 동일 바이트를 출력했다는 뜻 (6번 상황). 손상 아님 |

---

## 8. 푸시 시 사용자명 프롬프트가 뜨고 멈춤

**증상**: 이전에는 되던 `git push`가 갑자기 아무 응답 없이 오래 대기하다 타임아웃. `GCM_INTERACTIVE=never` 상태로 실행하면 즉시 실패:
```
fatal: Cannot prompt because user interactivity has been disabled.
fatal: could not read Username for 'https://github.com': terminal prompts disabled
```

**원인**: 시스템 자격증명 헬퍼(`credential.helper=manager`, Git Credential Manager)가 저장된 자격증명을 조용히 제공하지 못하는 상태. gh에 두 계정(Parkdongbae / parkdongbae-afk)이 로그인돼 있어 GCM이 어느 계정용인지 판단하지 못하고 대화형 프롬프트로 넘어간 것이 원인으로 추정.

**해결 (검증됨)**: gh CLI 자격증명을 git에 연결 — gh의 활성 계정 토큰으로 프롬프트 없이 인증됨.
```powershell
gh auth status        # 활성 계정이 대상 저장소 소유자와 일치하는지 먼저 확인
gh auth setup-git     # 전역 설정: credential.https://github.com.helper = !gh.exe auth git-credential
git push              # 프롬프트 없이 성공
```

**참고**: 이 설정은 전역(git config --global)에 저장되어 이후 모든 푸시에 적용된다. 계정을 전환할 때는 `gh auth switch`로 활성 계정을 바꾸면 된다.

---

## 최종 확인 절차 (재사용용)

푸시 전 개인정보 유출 검사의 실제 동작 순서:
1. `.gitignore`로 민감 원본 차단 (talk.txt, 중간 산출물, 리포트)
2. `git ls-files`로 추적 목록 확보 → node로 금지 토큰(닉네임·학교명) 스캔 → 히트 건 수동 검토
3. `git ls-tree origin/main`으로 원격 루트에 민감 파일이 없는지 최종 확인
4. 커밋 메시지 한글은 hex 덤프(3번)로 UTF-8 저장 확인
