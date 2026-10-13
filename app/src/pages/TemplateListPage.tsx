import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { store } from '../lib/db'
import { TEMPLATE_TYPE_LABELS, SCHOOL_LEVEL_LABELS, CONTEXT_LABELS } from '../types'
import type { SchoolLevel, Template, TemplateType } from '../types'
import Badge, { type BadgeTone } from '../components/Badge'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import Spinner from '../components/Spinner'
import { FileTextIcon } from '../components/icons'

const TYPE_ENTRIES = Object.entries(TEMPLATE_TYPE_LABELS) as [TemplateType, string][]
const LEVEL_ENTRIES = Object.entries(SCHOOL_LEVEL_LABELS) as [SchoolLevel, string][]
const CONTEXT_ENTRIES = Object.entries(CONTEXT_LABELS) as [Template['context'], string][]

function typeTone(type: TemplateType): BadgeTone {
  return type === 'checklist' || type === 'scenario' ? 'warn' : type === 'howto' ? 'mint' : 'brand'
}

export default function TemplateListPage() {
  const { data: templates, isLoading, isError, refetch } = useQuery({
    queryKey: ['templates'],
    queryFn: () => store.listTemplates(),
  })
  const [type, setType] = useState<TemplateType | ''>('')
  const [schoolLevel, setSchoolLevel] = useState<SchoolLevel | ''>('')
  const [context, setContext] = useState<Template['context'] | ''>('')

  const filtered = useMemo(() => {
    if (!templates) return []
    return templates.filter(
      (t) => (!type || t.type === type) && (!schoolLevel || t.schoolLevel === schoolLevel || t.schoolLevel === 'all') && (!context || t.context === context),
    )
  }, [templates, type, schoolLevel, context])

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">운영 템플릿</h1>
        <p className="mt-1 text-sm text-slate-500">복사해서 바로 쓰는 운영계획서·시나리오·점검표입니다.</p>
      </div>

      <div className="card grid grid-cols-2 gap-3 p-4 lg:grid-cols-4">
        <label>
          <span className="label">종류</span>
          <select className="input" value={type} onChange={(e) => setType(e.target.value as TemplateType | '')}>
            <option value="">전체</option>
            {TYPE_ENTRIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">학교급</span>
          <select className="input" value={schoolLevel} onChange={(e) => setSchoolLevel(e.target.value as SchoolLevel | '')}>
            <option value="">전체</option>
            {LEVEL_ENTRIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="col-span-2">
          <span className="label">상황</span>
          <select className="input" value={context} onChange={(e) => setContext(e.target.value as Template['context'] | '')}>
            <option value="">전체</option>
            {CONTEXT_ENTRIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="조건에 맞는 템플릿이 없습니다."
          description="필터를 바꾸거나 초기화해 보세요."
          action={
            <button
              type="button"
              className="btn-secondary mt-2"
              onClick={() => {
                setType('')
                setSchoolLevel('')
                setContext('')
              }}
            >
              필터 초기화
            </button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((t) => (
            <Link
              key={t.id}
              to={`/templates/${t.id}`}
              className="card flex flex-col p-4 transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone={typeTone(t.type)}>{TEMPLATE_TYPE_LABELS[t.type]}</Badge>
                <Badge tone="slate">{SCHOOL_LEVEL_LABELS[t.schoolLevel]}</Badge>
                <Badge tone="slate">{CONTEXT_LABELS[t.context]}</Badge>
              </div>
              <h2 className="mt-2.5 flex items-start gap-2 font-bold text-slate-800">
                <FileTextIcon className="mt-1 h-4 w-4 shrink-0 text-brand-400" />
                {t.title}
              </h2>
              {t.description && <p className="mt-1.5 line-clamp-2 text-sm text-slate-500">{t.description}</p>}
              {t.tags.length > 0 && (
                <p className="mt-auto pt-3 text-xs text-slate-400">#{t.tags.join(' #')}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
