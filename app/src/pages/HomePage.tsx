import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { store } from '../lib/db'
import { CATEGORY_LABELS } from '../types'
import type { ProblemCategory } from '../types'
import ProblemCard from '../components/ProblemCard'
import ErrorState from '../components/ErrorState'
import Spinner from '../components/Spinner'
import { SearchIcon, ChevronRightIcon, CheckIcon, MessageCircleIcon, FileTextIcon } from '../components/icons'

const GUIDE_CARDS = [
  {
    to: '/problems',
    title: '문제 해결 검색',
    description: '증상·장비별로 정리된 해결 절차를 단계별로 따라 해 보세요.',
    icon: SearchIcon,
    accent: 'bg-brand-50 text-brand-700',
  },
  {
    to: '/templates',
    title: '운영 템플릿',
    description: '운영계획서·방송 시나리오를 복사해 바로 쓸 수 있습니다.',
    icon: FileTextIcon,
    accent: 'bg-accent-50 text-accent-700',
  },
  {
    to: '/checklist/exam',
    title: '시험 당일 체크리스트',
    description: '시험·수능 당일, 인쇄해서 이것만 순서대로 확인하세요.',
    icon: CheckIcon,
    accent: 'bg-amber-50 text-amber-700',
  },
  {
    to: '/qa',
    title: 'Q&A 질문하기',
    description: '해결되지 않는 문제는 현장 선생님들에게 물어보세요.',
    icon: MessageCircleIcon,
    accent: 'bg-brand-50 text-brand-700',
  },
]

const CATEGORY_ENTRIES = Object.entries(CATEGORY_LABELS) as [ProblemCategory, string][]

export default function HomePage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const { data: problems, isLoading, isError, refetch } = useQuery({
    queryKey: ['problems'],
    queryFn: () => store.listProblems(),
  })

  function handleSearch(e: FormEvent) {
    e.preventDefault()
    const kw = keyword.trim()
    navigate(kw ? `/problems?keyword=${encodeURIComponent(kw)}` : '/problems')
  }

  const topProblems = problems ? [...problems].sort((a, b) => b.views - a.views).slice(0, 5) : []

  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-2xl bg-gradient-to-br from-brand-800 to-brand-950 px-5 py-10 text-white sm:px-10 sm:py-14">
        <p className="text-sm font-semibold text-accent-300">방송 초보 교사를 위한 해결 가이드</p>
        <h1 className="mt-2 text-2xl font-bold leading-snug sm:text-3xl">
          시험 당일, 방송실에서
          <br className="sm:hidden" /> 당황하지 않는 방법
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-brand-100 sm:text-base">
          카톡 방송방에 쌓인 현장 노하우를 선생님이 바로 쓸 수 있는 해결 절차로 정리했습니다.
        </p>
        <form onSubmit={handleSearch} className="mt-6 flex max-w-xl flex-col gap-2 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">문제 검색</span>
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="증상이나 장비를 검색해 보세요. 예: 앰프 소리 안 남"
              className="w-full rounded-lg border-0 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-400"
            />
          </label>
          <button type="submit" className="btn bg-accent-500 py-3 text-white hover:bg-accent-600">
            <SearchIcon className="h-4 w-4" />
            검색
          </button>
        </form>
      </section>

      <section>
        <div className="flex items-end justify-between">
          <h2 className="text-lg font-bold text-slate-800">요즘 많이 찾는 문제</h2>
          <Link to="/problems" className="flex items-center gap-0.5 text-sm font-medium text-brand-700 hover:underline">
            전체 보기
            <ChevronRightIcon className="h-4 w-4" />
          </Link>
        </div>
        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : topProblems.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
            아직 등록된 문제가 없습니다. 관리자 메뉴에서 시드 데이터를 가져올 수 있습니다.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topProblems.map((p) => (
              <ProblemCard key={p.id} problem={p} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold text-slate-800">초보 방송 담당 교사 시작 가이드</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {GUIDE_CARDS.map(({ to, title, description, icon: Icon, accent }) => (
            <Link
              key={to}
              to={to}
              className="card flex items-start gap-4 p-4 transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-bold text-slate-800">{title}</span>
                <span className="mt-1 block text-sm text-slate-500">{description}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-slate-800">카테고리로 찾기</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {CATEGORY_ENTRIES.map(([value, label]) => (
            <Link
              key={value}
              to={`/problems?category=${value}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-800"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
