// 시드 파트 병합 + 익명화 검증 스크립트
// 사용: node scripts/merge-seed.mjs
// 1) seed/parts/part1..3.json 읽기  2) ID 중복 제거  3) talk.txt 화자태그/학교명 유출 스캔  4) app/src/data/seed.json 생성
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const partsDir = path.resolve(root, '..', 'seed', 'parts')
const outFile = path.join(root, 'src', 'data', 'seed.json')
const talkFile = path.resolve(root, '..', 'talk.txt')

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))

const partFiles = fs.existsSync(partsDir)
  ? fs.readdirSync(partsDir).filter((f) => f.endsWith('.json')).sort()
  : []
const merged = { problems: [], templates: [], equipments: [] }
const seenIds = new Set()
const seenTitles = new Map()
const seenEquipmentNames = new Set()

for (const f of partFiles) {
  const p = path.join(partsDir, f)
  if (!fs.existsSync(p)) {
    console.warn(`[SKIP] ${f} 없음`)
    continue
  }
  const data = readJson(p)
  for (const kind of ['problems', 'templates', 'equipments']) {
    for (const item of data[kind] ?? []) {
      if (!item.id || !item.title && !item.name) {
        console.warn(`[WARN] ${f} ${kind}: id/title(name) 누락 → ${JSON.stringify(item).slice(0, 80)}`)
        continue
      }
      if (seenIds.has(item.id)) {
        console.warn(`[DUP-ID] ${item.id} (${f}) 건너뜀`)
        continue
      }
      seenIds.add(item.id)
      if (kind === 'equipments') {
        const nameKey = (item.name ?? '').replace(/\s+/g, '').toLowerCase()
        if (nameKey && seenEquipmentNames.has(nameKey)) {
          console.warn(`[DUP-EQUIP] ${item.id} "${item.name}" (${f}) 이름 중복 건너뜀`)
          continue
        }
        if (nameKey) seenEquipmentNames.add(nameKey)
      }
      merged[kind].push(item)
      const titleKey = kind[0] + (item.title ?? item.name ?? '').replace(/\s+/g, '').slice(0, 24)
      seenTitles.set(titleKey, (seenTitles.get(titleKey) ?? 0) + 1)
    }
  }
}

// 유사 제목(병합 구간 겹침) 리포트 — 자동 삭제는 하지 않고 사람이 판단
for (const [key, count] of seenTitles) {
  if (count > 1) console.warn(`[DUP-TITLE?] ${key} x${count}`)
}

// ---------- 익명화 스캔 ----------
// talk.txt에서 화자 태그([닉네임])와 학교명 접미사 토큰을 수집해 시드 내용 유출 검사.
// 한글 경계 매칭으로 부분 문자열 오탐(예: 도구로↔구로)을 제거하고, 일반 도메인 단어는 제외한다.
const talk = fs.readFileSync(talkFile, 'utf8')
const forbidden = new Set()

// 화자 태그: 줄 시작의 [ ... ] (시간 태그 [오전 9:41] 제외)
for (const m of talk.matchAll(/^\[(.+?)\]/gm)) {
  const tag = m[1].trim()
  if (/^(오전|오후)\s/.test(tag)) continue
  for (const token of tag.split(/[/(),\s]+/)) {
    if (token.length >= 2) forbidden.add(token)
  }
}
// 학교명 전체 표기
for (const m of talk.matchAll(/[가-힣A-Za-z0-9]{2,20}(?:고등학교|중학교|초등학교)/g)) {
  forbidden.add(m[0])
}

// 도메인 공통어·학교급 등 검사 대상에서 제외
const STOPWORDS = new Set([
  '방송', '방송실', '방송반', '방송부', '학교', '고등', '중등', '초등',
  '고등학교', '중학교', '초등학교', '담당', '선생', '선생님', '교사',
  '운영', '업무', '장비', '초보', '행정', '퇴근', '방송업무',
  '소리', '보는', '들어간', '수용', '인정',
])
for (const sw of STOPWORDS) forbidden.delete(sw)

const blob = JSON.stringify(merged)
const reportLines = []
let leaks = 0
for (const token of [...forbidden].sort()) {
  const re = new RegExp(`(?<![가-힣A-Za-z0-9])${token}(?![가-힣A-Za-z0-9])`, 'g')
  const matches = blob.match(re)
  if (matches) {
    const at = blob.search(re)
    reportLines.push(`${token}\t${matches.length}\t...${blob.slice(Math.max(0, at - 30), at + 30)}...`)
    console.error(`[LEAK?] 시드에 금지 토큰 발견: "${token}" x${matches.length}`)
    leaks++
  }
}
fs.writeFileSync(path.join(root, 'leak-report.txt'), reportLines.join('\n'), 'utf8')

fs.mkdirSync(path.dirname(outFile), { recursive: true })
fs.writeFileSync(outFile, JSON.stringify(merged, null, 2), 'utf8')

console.log('--- 병합 완료 ---')
console.log(`problems: ${merged.problems.length}`)
console.log(`templates: ${merged.templates.length}`)
console.log(`equipments: ${merged.equipments.length}`)
console.log(`유출 후보 토큰: ${leaks}건${leaks > 0 ? ' (반드시 수동 확인/수정 후 재실행)' : ' (통과)'}`)
console.log(`출력: ${outFile}`)
