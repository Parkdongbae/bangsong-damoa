import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { store } from '../lib/db'
import { matchesProblemFilter, CATEGORY_LABELS, CONTEXT_LABELS, SCHOOL_LEVEL_LABELS } from '../types'
import type { ProblemCategory, ProblemContext, SchoolLevel } from '../types'
import ProblemCard from '../components/ProblemCard'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import Spinner from '../components/Spinner'
import { SearchIcon, XIcon } from '../components/icons'

const CATEGORY_ENTRIES = Object.entries(CATEGORY_LABELS) as [ProblemCategory, string][]
const CONTEXT_ENTRIES = Object.entries(CONTEXT_LABELS).filter(([k]) => k !== 'annual') as [ProblemContext, string][]
const LEVEL_ENTRIES = Object.entries(SCHOOL_LEVEL_LABELS) as [SchoolLevel, string][]

export default function ProblemListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: problems, isLoading, isError, refetch } = useQuery({
    queryKey: ['problems'],
    queryFn: () => store.listProblems(),
  })

  const keyword = searchParams.get('keyword') ?? ''
  const category = (searchParams.get('category') ?? '') as ProblemCategory | ''
  const context = (searchParams.get('context') ?? '') as ProblemContext | ''
  const schoolLevel = (searchParams.get('schoolLevel') ?? '') as SchoolLevel | ''

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next, { replace: true })
  }

  const filtered = useMemo(() => {
    if (!problems) return []
    return problems.filter((p) => matchesProblemFilter(p, { keyword, category, context, schoolLevel }))
  }, [problems, keyword, category, context, schoolLevel])

  const hasFilter = Boolean(keyword || category || context || schoolLevel)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">문제 해결</h1>
        <p className="mt-1 text-sm text-slate-500">장비·상황별로 해결 절차를 찾아 보세요.</p>
      </div>

      <div className="card grid grid-cols-2 gap-3 p-4 lg:grid-cols-4">
        <label className="col-span-2 lg:col-span-1">
          <span className="label">검색</span>
          <span className="relative block">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={keyword}
              onChange={(e) => setParam('keyword', e.target.value)}
              placeholder="키워드"
              className="input !pl-9"
            />
          </span>
        </label>
        <label>
          <span className="label">카테고리</span>
          <select className="input" value={category} onChange={(e) => setParam('category', e.target.value)}>
            <option value="">전체</option>
            {CATEGORY_ENTRIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">상황</span>
          <select className="input" value={context} onChange={(e) => setParam('context', e.target.value)}>
            <option value="">전체</option>
            {CONTEXT_ENTRIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">학교급</span>
          <select className="input" value={schoolLevel} onChange={(e) => setParam('schoolLevel', e.target.value)}>
            <option value="">전체</option>
            {LEVEL_ENTRIES.map(([value, label]) => (
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
          title={hasFilter ? '검색 결과가 없습니다.' : '아직 등록된 문제가 없습니다.'}
          description={
            hasFilter
              ? '검색어를 줄이거나 필터를 초기화하고 다시 시도해 보세요.'
              : '관리자가 시드 데이터를 가져오면 이곳에 표시됩니다.'
          }
          action={
            hasFilter ? (
              <button type="button" className="btn-secondary mt-2" onClick={() => setSearchParams({}, { replace: true })}>
                <XIcon className="h-4 w-4" />
                필터 초기화
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          <p className="text-sm text-slate-500">
            총 <span className="font-semibold text-slate-700">{filtered.length}</span>건
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((p) => (
              <ProblemCard key={p.id} problem={p} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
