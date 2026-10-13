import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  writeBatch,
} from 'firebase/firestore'
import { getFirebase, isFirebaseConfigured } from './firebase'
import seedJson from '../data/seed.json'
import type {
  Answer,
  Equipment,
  Post,
  Problem,
  ProblemCategory,
  ProblemContext,
  ProblemStep,
  SchoolLevel,
  Template,
  TemplateType,
  UserProfile,
} from '../types'

// ---------- normalize helpers (외부/시드 데이터 방어적 변환) ----------

function toStr(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function toNum(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

function toStrArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
}

function toRecord(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

export function normalizeProblem(raw: Record<string, unknown>): Problem {
  const nowIso = new Date().toISOString()
  const stepsRaw = Array.isArray(raw.steps) ? raw.steps : []
  const steps = stepsRaw
    .map((s, i): ProblemStep => {
      const r = toRecord(s) ?? {}
      const order = toNum(r.order, i + 1)
      const caution = toStr(r.caution)
      return {
        order,
        title: toStr(r.title, `단계 ${order}`),
        detail: toStr(r.detail),
        caution: caution || undefined,
      }
    })
    .sort((a, b) => a.order - b.order)
  return {
    id: toStr(raw.id),
    title: toStr(raw.title, '제목 없음'),
    summary: toStr(raw.summary),
    equipment: toStr(raw.equipment),
    category: (toStr(raw.category) || 'operation') as ProblemCategory,
    context: (toStr(raw.context) || 'daily') as ProblemContext,
    schoolLevel: (toStr(raw.schoolLevel) || 'all') as SchoolLevel,
    steps,
    tags: toStrArr(raw.tags),
    fieldTips: toStrArr(raw.fieldTips),
    relatedProblemIds: toStrArr(raw.relatedProblemIds),
    sourceNote: toStr(raw.sourceNote) || undefined,
    views: toNum(raw.views, 0),
    createdAt: toStr(raw.createdAt, nowIso),
    updatedAt: toStr(raw.updatedAt, nowIso),
    createdBy: toStr(raw.createdBy) || undefined,
  }
}

export function normalizeTemplate(raw: Record<string, unknown>): Template {
  const nowIso = new Date().toISOString()
  return {
    id: toStr(raw.id),
    title: toStr(raw.title, '제목 없음'),
    type: (toStr(raw.type) || 'howto') as TemplateType,
    schoolLevel: (toStr(raw.schoolLevel) || 'all') as SchoolLevel,
    context: (toStr(raw.context) || 'daily') as Template['context'],
    contentMd: toStr(raw.contentMd),
    description: toStr(raw.description),
    tags: toStrArr(raw.tags),
    sourceNote: toStr(raw.sourceNote) || undefined,
    createdAt: toStr(raw.createdAt, nowIso),
    updatedAt: toStr(raw.updatedAt, nowIso),
    createdBy: toStr(raw.createdBy) || undefined,
  }
}

export function normalizeEquipment(raw: Record<string, unknown>): Equipment {
  return {
    id: toStr(raw.id),
    name: toStr(raw.name, '이름 없음'),
    category: toStr(raw.category, 'other'),
    vendorNote: toStr(raw.vendorNote),
    tags: toStrArr(raw.tags),
  }
}

function normalizePost(raw: Record<string, unknown>): Post {
  const nowIso = new Date().toISOString()
  const answersRaw = Array.isArray(raw.answers) ? raw.answers : []
  const answers = answersRaw.map((a, i): Answer => {
    const r = toRecord(a) ?? {}
    return {
      id: toStr(r.id, `a-${i}`),
      authorId: toStr(r.authorId),
      authorName: toStr(r.authorName, '익명'),
      content: toStr(r.content),
      createdAt: toStr(r.createdAt, nowIso),
    }
  })
  return {
    id: toStr(raw.id),
    title: toStr(raw.title, '제목 없음'),
    content: toStr(raw.content),
    equipment: toStr(raw.equipment),
    context: (toStr(raw.context) || 'daily') as ProblemContext,
    schoolLevel: (toStr(raw.schoolLevel) || 'all') as SchoolLevel,
    tags: toStrArr(raw.tags),
    authorId: toStr(raw.authorId),
    authorName: toStr(raw.authorName, '익명'),
    createdAt: toStr(raw.createdAt, nowIso),
    updatedAt: toStr(raw.updatedAt, nowIso),
    answers,
    linkedProblemIds: toStrArr(raw.linkedProblemIds),
  }
}

function normalizeProfile(raw: Record<string, unknown>): UserProfile {
  const nowIso = new Date().toISOString()
  return {
    uid: toStr(raw.uid),
    email: toStr(raw.email),
    displayName: toStr(raw.displayName, '사용자'),
    role: (toStr(raw.role) || 'teacher') as UserProfile['role'],
    schoolLevel: (toStr(raw.schoolLevel) || 'all') as SchoolLevel,
    favoritesProblems: toStrArr(raw.favoritesProblems),
    favoritesTemplates: toStrArr(raw.favoritesTemplates),
    createdAt: toStr(raw.createdAt, nowIso),
    updatedAt: toStr(raw.updatedAt, nowIso),
  }
}

// ---------- 데이터 스토어 인터페이스 ----------

export type FavoriteKind = 'problem' | 'template'

export interface DataStore {
  readonly mode: 'local' | 'firebase'
  listProblems(): Promise<Problem[]>
  getProblem(id: string): Promise<Problem | null>
  saveProblem(p: Problem): Promise<void>
  deleteProblem(id: string): Promise<void>
  incrementProblemViews(id: string): Promise<void>
  listTemplates(): Promise<Template[]>
  getTemplate(id: string): Promise<Template | null>
  saveTemplate(t: Template): Promise<void>
  deleteTemplate(id: string): Promise<void>
  listEquipments(): Promise<Equipment[]>
  saveEquipment(e: Equipment): Promise<void>
  deleteEquipment(id: string): Promise<void>
  listPosts(): Promise<Post[]>
  getPost(id: string): Promise<Post | null>
  savePost(p: Post): Promise<void>
  deletePost(id: string): Promise<void>
  getUserProfile(uid: string): Promise<UserProfile | null>
  saveUserProfile(p: UserProfile): Promise<void>
  toggleFavorite(uid: string, kind: FavoriteKind, id: string): Promise<void>
  importSeed(problems: Problem[], templates: Template[], equipments: Equipment[]): Promise<void>
}

function newId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${prefix}-${Date.now().toString(36)}-${rand}`
}

export { newId }

// ---------- 로컬(데모) 스토어: localStorage + 시드 데이터 ----------

interface LocalDB {
  problems: Problem[]
  templates: Template[]
  equipments: Equipment[]
  posts: Post[]
  users: Record<string, UserProfile>
}

const LS_DB_KEY = 'damoa_local_db_v1'

function emptyLocalDb(): LocalDB {
  return {
    problems: (seedJson.problems as unknown[]).map((p) => normalizeProblem(p as Record<string, unknown>)),
    templates: (seedJson.templates as unknown[]).map((t) => normalizeTemplate(t as Record<string, unknown>)),
    equipments: (seedJson.equipments as unknown[]).map((e) => normalizeEquipment(e as Record<string, unknown>)),
    posts: [],
    users: {},
  }
}

function loadLocalDb(): LocalDB {
  const raw = localStorage.getItem(LS_DB_KEY)
  if (raw) {
    try {
      return JSON.parse(raw) as LocalDB
    } catch {
      // 손상된 로컬 데이터는 폐기하고 시드로 재초기화한다.
    }
  }
  const fresh = emptyLocalDb()
  saveLocalDb(fresh)
  return fresh
}

function saveLocalDb(db: LocalDB): void {
  localStorage.setItem(LS_DB_KEY, JSON.stringify(db))
}

function sortByDateDesc<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

const localStore: DataStore = {
  mode: 'local',

  async listProblems() {
    return sortByDateDesc(loadLocalDb().problems)
  },
  async getProblem(id) {
    return loadLocalDb().problems.find((p) => p.id === id) ?? null
  },
  async saveProblem(p) {
    const db = loadLocalDb()
    const i = db.problems.findIndex((x) => x.id === p.id)
    if (i >= 0) db.problems[i] = p
    else db.problems.push(p)
    saveLocalDb(db)
  },
  async deleteProblem(id) {
    const db = loadLocalDb()
    db.problems = db.problems.filter((p) => p.id !== id)
    saveLocalDb(db)
  },
  async incrementProblemViews(id) {
    const db = loadLocalDb()
    const p = db.problems.find((x) => x.id === id)
    if (p) {
      p.views += 1
      saveLocalDb(db)
    }
  },
  async listTemplates() {
    return sortByDateDesc(loadLocalDb().templates)
  },
  async getTemplate(id) {
    return loadLocalDb().templates.find((t) => t.id === id) ?? null
  },
  async saveTemplate(t) {
    const db = loadLocalDb()
    const i = db.templates.findIndex((x) => x.id === t.id)
    if (i >= 0) db.templates[i] = t
    else db.templates.push(t)
    saveLocalDb(db)
  },
  async deleteTemplate(id) {
    const db = loadLocalDb()
    db.templates = db.templates.filter((t) => t.id !== id)
    saveLocalDb(db)
  },
  async listEquipments() {
    return [...loadLocalDb().equipments].sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  },
  async saveEquipment(e) {
    const db = loadLocalDb()
    const i = db.equipments.findIndex((x) => x.id === e.id)
    if (i >= 0) db.equipments[i] = e
    else db.equipments.push(e)
    saveLocalDb(db)
  },
  async deleteEquipment(id) {
    const db = loadLocalDb()
    db.equipments = db.equipments.filter((e) => e.id !== id)
    saveLocalDb(db)
  },
  async listPosts() {
    return sortByDateDesc(loadLocalDb().posts)
  },
  async getPost(id) {
    return loadLocalDb().posts.find((p) => p.id === id) ?? null
  },
  async savePost(p) {
    const db = loadLocalDb()
    const i = db.posts.findIndex((x) => x.id === p.id)
    if (i >= 0) db.posts[i] = p
    else db.posts.push(p)
    saveLocalDb(db)
  },
  async deletePost(id) {
    const db = loadLocalDb()
    db.posts = db.posts.filter((p) => p.id !== id)
    saveLocalDb(db)
  },
  async getUserProfile(uid) {
    return loadLocalDb().users[uid] ?? null
  },
  async saveUserProfile(p) {
    const db = loadLocalDb()
    db.users[p.uid] = p
    saveLocalDb(db)
  },
  async toggleFavorite(uid, kind, id) {
    const db = loadLocalDb()
    const u = db.users[uid]
    if (!u) return
    if (kind === 'problem') {
      u.favoritesProblems = u.favoritesProblems.includes(id)
        ? u.favoritesProblems.filter((x) => x !== id)
        : [...u.favoritesProblems, id]
    } else {
      u.favoritesTemplates = u.favoritesTemplates.includes(id)
        ? u.favoritesTemplates.filter((x) => x !== id)
        : [...u.favoritesTemplates, id]
    }
    u.updatedAt = new Date().toISOString()
    saveLocalDb(db)
  },
  async importSeed(problems, templates, equipments) {
    const db = loadLocalDb()
    const byId = <T extends { id: string }>(list: T[]): Map<string, T> => new Map(list.map((x) => [x.id, x]))
    const pm = byId(db.problems)
    for (const p of problems) pm.set(p.id, p)
    const tm = byId(db.templates)
    for (const t of templates) tm.set(t.id, t)
    const em = byId(db.equipments)
    for (const e of equipments) em.set(e.id, e)
    db.problems = [...pm.values()]
    db.templates = [...tm.values()]
    db.equipments = [...em.values()]
    saveLocalDb(db)
  },
}

// ---------- Firestore 스토어 (오프라인 read-through 캐시 포함) ----------

const CACHE_PREFIX = 'damoa_cache_'

async function cached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  try {
    const value = await fetcher()
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value))
    } catch {
      // 저장 공간 부족 등 캐시 기록 실패는 서비스 동작에 영향을 주지 않는다.
    }
    return value
  } catch (err) {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    if (raw) {
      try {
        return JSON.parse(raw) as T
      } catch {
        // 캐시가 손상된 경우 원래 오류를 그대로 전달한다.
      }
    }
    throw err
  }
}

const firestoreStore: DataStore = {
  mode: 'firebase',

  listProblems() {
    return cached('problems', async () => {
      const { db } = getFirebase()
      const snap = await getDocs(collection(db, 'problems'))
      return snap.docs.map((d) => normalizeProblem({ id: d.id, ...d.data() }))
    }).then(sortByDateDesc)
  },
  async getProblem(id) {
    const { db } = getFirebase()
    const snap = await getDoc(doc(db, 'problems', id))
    return snap.exists() ? normalizeProblem({ id: snap.id, ...snap.data() }) : null
  },
  async saveProblem(p) {
    const { db } = getFirebase()
    await setDoc(doc(db, 'problems', p.id), { ...p })
  },
  async deleteProblem(id) {
    const { db } = getFirebase()
    await deleteDoc(doc(db, 'problems', id))
  },
  async incrementProblemViews(id) {
    const { db } = getFirebase()
    try {
      await updateDoc(doc(db, 'problems', id), { views: increment(1) })
    } catch {
      // 문서가 방금 삭제된 경우 등 조회수 증가 실패는 본문 열람을 막지 않는다.
    }
  },
  listTemplates() {
    return cached('templates', async () => {
      const { db } = getFirebase()
      const snap = await getDocs(collection(db, 'templates'))
      return snap.docs.map((d) => normalizeTemplate({ id: d.id, ...d.data() }))
    }).then(sortByDateDesc)
  },
  async getTemplate(id) {
    const { db } = getFirebase()
    const snap = await getDoc(doc(db, 'templates', id))
    return snap.exists() ? normalizeTemplate({ id: snap.id, ...snap.data() }) : null
  },
  async saveTemplate(t) {
    const { db } = getFirebase()
    await setDoc(doc(db, 'templates', t.id), { ...t })
  },
  async deleteTemplate(id) {
    const { db } = getFirebase()
    await deleteDoc(doc(db, 'templates', id))
  },
  listEquipments() {
    return cached('equipments', async () => {
      const { db } = getFirebase()
      const snap = await getDocs(collection(db, 'equipments'))
      return snap.docs.map((d) => normalizeEquipment({ id: d.id, ...d.data() }))
    }).then((list) => [...list].sort((a, b) => a.name.localeCompare(b.name, 'ko')))
  },
  async saveEquipment(e) {
    const { db } = getFirebase()
    await setDoc(doc(db, 'equipments', e.id), { ...e })
  },
  async deleteEquipment(id) {
    const { db } = getFirebase()
    await deleteDoc(doc(db, 'equipments', id))
  },
  listPosts() {
    return cached('posts', async () => {
      const { db } = getFirebase()
      const snap = await getDocs(collection(db, 'posts'))
      return snap.docs.map((d) => normalizePost({ id: d.id, ...d.data() }))
    }).then(sortByDateDesc)
  },
  async getPost(id) {
    const { db } = getFirebase()
    const snap = await getDoc(doc(db, 'posts', id))
    return snap.exists() ? normalizePost({ id: snap.id, ...snap.data() }) : null
  },
  async savePost(p) {
    const { db } = getFirebase()
    await setDoc(doc(db, 'posts', p.id), { ...p })
  },
  async deletePost(id) {
    const { db } = getFirebase()
    await deleteDoc(doc(db, 'posts', id))
  },
  async getUserProfile(uid) {
    const { db } = getFirebase()
    const snap = await getDoc(doc(db, 'users', uid))
    return snap.exists() ? normalizeProfile({ uid: snap.id, ...snap.data() }) : null
  },
  async saveUserProfile(p) {
    const { db } = getFirebase()
    await setDoc(doc(db, 'users', p.uid), { ...p })
  },
  async toggleFavorite(uid, kind, id) {
    const { db } = getFirebase()
    const current = await this.getUserProfile(uid)
    if (!current) return
    const favs = kind === 'problem' ? current.favoritesProblems : current.favoritesTemplates
    const field = kind === 'problem' ? 'favoritesProblems' : 'favoritesTemplates'
    await updateDoc(doc(db, 'users', uid), {
      [field]: favs.includes(id) ? arrayRemove(id) : arrayUnion(id),
      updatedAt: new Date().toISOString(),
    })
  },
  async importSeed(problems, templates, equipments) {
    const { db } = getFirebase()
    const CHUNK = 400
    for (let i = 0; i < problems.length; i += CHUNK) {
      const batch = writeBatch(db)
      for (const p of problems.slice(i, i + CHUNK)) batch.set(doc(db, 'problems', p.id), { ...p }, { merge: true })
      await batch.commit()
    }
    for (let i = 0; i < templates.length; i += CHUNK) {
      const batch = writeBatch(db)
      for (const t of templates.slice(i, i + CHUNK)) batch.set(doc(db, 'templates', t.id), { ...t }, { merge: true })
      await batch.commit()
    }
    for (let i = 0; i < equipments.length; i += CHUNK) {
      const batch = writeBatch(db)
      for (const e of equipments.slice(i, i + CHUNK))
        batch.set(doc(db, 'equipments', e.id), { ...e }, { merge: true })
      await batch.commit()
    }
  },
}

// ---------- 스토어 선택 ----------

export const store: DataStore = isFirebaseConfigured ? firestoreStore : localStore
