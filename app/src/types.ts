export type SchoolLevel = 'elem' | 'middle' | 'high' | 'all'
export type ProblemCategory = 'equipment' | 'program' | 'av' | 'operation' | 'policy' | 'budget'
export type ProblemContext = 'exam' | 'su-neung' | 'event' | 'drill' | 'daily' | 'budget'
export type TemplateType = 'operation-plan' | 'scenario' | 'budget' | 'checklist' | 'howto'
export type UserRole = 'teacher' | 'staff' | 'admin'

export interface ProblemStep {
  order: number
  title: string
  detail: string
  caution?: string
}

export interface Problem {
  id: string
  title: string
  summary: string
  equipment: string
  category: ProblemCategory
  context: ProblemContext
  schoolLevel: SchoolLevel
  steps: ProblemStep[]
  tags: string[]
  fieldTips: string[]
  relatedProblemIds: string[]
  sourceNote?: string
  views: number
  createdAt: string
  updatedAt: string
  createdBy?: string
}

export interface Template {
  id: string
  title: string
  type: TemplateType
  schoolLevel: SchoolLevel
  context: ProblemContext | 'annual'
  contentMd: string
  description: string
  tags: string[]
  sourceNote?: string
  createdAt: string
  updatedAt: string
  createdBy?: string
}

export interface Equipment {
  id: string
  name: string
  category: string
  vendorNote: string
  tags: string[]
}

export interface Answer {
  id: string
  authorId: string
  authorName: string
  content: string
  createdAt: string
}

export interface Post {
  id: string
  title: string
  content: string
  equipment: string
  context: ProblemContext
  schoolLevel: SchoolLevel
  tags: string[]
  authorId: string
  authorName: string
  createdAt: string
  updatedAt: string
  answers: Answer[]
  linkedProblemIds: string[]
}

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  role: UserRole
  schoolLevel: SchoolLevel
  favoritesProblems: string[]
  favoritesTemplates: string[]
  createdAt: string
  updatedAt: string
}

export interface ProblemFilter {
  keyword?: string
  category?: ProblemCategory | ''
  context?: ProblemContext | ''
  schoolLevel?: SchoolLevel | ''
  equipment?: string
}

export const SCHOOL_LEVEL_LABELS: Record<SchoolLevel, string> = {
  elem: '초등',
  middle: '중등',
  high: '고등',
  all: '공통',
}

export const CATEGORY_LABELS: Record<ProblemCategory, string> = {
  equipment: '장비',
  program: '프로그램',
  av: '영상·음향',
  operation: '운영',
  policy: '행정·정책',
  budget: '예산·견적',
}

export const CONTEXT_LABELS: Record<string, string> = {
  exam: '시험·모의고사',
  'su-neung': '수능',
  event: '행사·체육대회',
  drill: '훈련·민방위',
  daily: '일상 운영',
  budget: '예산·구매',
  annual: '연간',
}

export const TEMPLATE_TYPE_LABELS: Record<TemplateType, string> = {
  'operation-plan': '운영계획서',
  scenario: '방송 시나리오',
  budget: '예산·품의',
  checklist: '점검 체크리스트',
  howto: '절차 가이드',
}

export function matchesProblemFilter(p: Problem, f: ProblemFilter): boolean {
  if (f.category && p.category !== f.category) return false
  if (f.context && p.context !== f.context) return false
  if (f.schoolLevel && p.schoolLevel !== 'all' && p.schoolLevel !== f.schoolLevel) return false
  if (f.equipment && !p.equipment.includes(f.equipment)) return false
  if (f.keyword) {
    const kw = f.keyword.trim().toLowerCase()
    if (!kw) return true
    const haystack = [p.title, p.summary, p.equipment, p.tags.join(' ')].join(' ').toLowerCase()
    if (!haystack.includes(kw)) return false
  }
  return true
}
