import { CATEGORY_LABELS, CONTEXT_LABELS, SCHOOL_LEVEL_LABELS, TEMPLATE_TYPE_LABELS } from '../types'
import type { ProblemCategory, ProblemContext, SchoolLevel, Template, TemplateType } from '../types'

export const CATEGORY_ENTRIES = Object.entries(CATEGORY_LABELS) as [ProblemCategory, string][]

export const CONTEXT_ENTRIES = Object.entries(CONTEXT_LABELS).filter(
  ([key]) => key !== 'annual',
) as [ProblemContext, string][]

export const ALL_CONTEXT_ENTRIES = Object.entries(CONTEXT_LABELS) as [Template['context'], string][]

export const LEVEL_ENTRIES = Object.entries(SCHOOL_LEVEL_LABELS) as [SchoolLevel, string][]

export const TEMPLATE_TYPE_ENTRIES = Object.entries(TEMPLATE_TYPE_LABELS) as [TemplateType, string][]

export const EQUIPMENT_CATEGORY_ENTRIES = [
  ['clock-program', '방송 프로그램(시계 등)'],
  ['amp', '앰프'],
  ['speaker', '스피커'],
  ['mic', '마이크'],
  ['camera', '카메라'],
  ['settop', '셋톱박스'],
  ['ups', 'UPS'],
  ['cable', '케이블·배선'],
  ['software', '소프트웨어'],
  ['service', '서비스·지원'],
  ['other', '기타'],
] as const
