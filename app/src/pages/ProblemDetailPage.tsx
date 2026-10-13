import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { store } from '../lib/db'
import { CATEGORY_LABELS } from '../types'
import Badge from '../components/Badge'
import ProblemBadges, { contextTone } from '../components/ProblemBadges'
import FavoriteButton from '../components/FavoriteButton'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import Spinner from '../components/Spinner'
import { CONTEXT_LABELS, SCHOOL_LEVEL_LABELS } from '../types'
import {
  AlertIcon,
  PrinterIcon,
  CheckIcon,
  ChevronRightIcon,
  LightbulbIcon,
  EyeIcon,
} from '../components/icons'

function useProblemProgress(problemId: string) {
  const [checked, setChecked] = useState<Set<number>>(() => new Set())

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`damoa_progress_${problemId}`)
      const arr = raw ? (JSON.parse(raw) as unknown) : []
      setChecked(new Set(Array.isArray(arr) ? arr.filter((n): n is number => typeof n === 'number') : []))
    } catch {
      setChecked(new Set())
    }
  }, [problemId])

  function persist(next: Set<number>) {
    localStorage.setItem(`damoa_progress_${problemId}`, JSON.stringify([...next]))
  }

  function toggle(order: number) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(order)) next.delete(order)
      else next.add(order)
      persist(next)
      return next
    })
  }

  function reset() {
    setChecked(() => {
      const next = new Set<number>()
      persist(next)
      return next
    })
  }

  return { checked, toggle, reset }
}

export default function ProblemDetailPage() {
  const { id = '' } = useParams()
  const { data: problem, isLoading, isError, refetch } = useQuery({
    queryKey: ['problem', id],
    queryFn: () => store.getProblem(id),
  })
  const { data: allProblems } = useQuery({
    queryKey: ['problems'],
    queryFn: () => store.listProblems(),
    enabled: Boolean(problem?.relatedProblemIds.length),
  })

  const incrementedIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (!id || incrementedIdRef.current === id) return
    incrementedIdRef.current = id
    void store.incrementProblemViews(id)
  }, [id])

  const { checked, toggle, reset } = useProblemProgress(id)
  const doneCount = problem ? problem.steps.filter((s) => checked.has(s.order)).length : 0
  const allDone = problem ? problem.steps.length > 0 && doneCount === problem.steps.length : false

  const summarySteps = useMemo(() => (problem ? problem.steps.slice(0, 3) : []), [problem])

  const relatedProblems = useMemo(() => {
    if (!problem || !allProblems) return []
    const byId = new Map(allProblems.map((p) => [p.id, p]))
    return problem.relatedProblemIds
      .map((rid) => byId.get(rid))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
  }, [problem, allProblems])

  if (isLoading) return <Spinner />
  if (isError) return <ErrorState onRetry={() => void refetch()} />
  if (!problem) {
    return (
      <EmptyState
        title="문제를 찾을 수 없습니다."
        description="삭제되었거나 잘못된 주소입니다."
        action={
          <Link to="/problems" className="btn-secondary mt-2">
            목록으로
          </Link>
        }
      />
    )
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div className="no-print">
        <Link to="/problems" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-brand-700">
          문제 해결 목록
        </Link>
      </div>

      <header className="card p-5">
        <ProblemBadges problem={problem} />
        <h1 className="mt-3 text-xl font-bold leading-snug text-slate-800 sm:text-2xl">{problem.title}</h1>
        {problem.summary && <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{problem.summary}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
          {problem.equipment && (
            <span>
              대상 장비: <span className="font-semibold text-slate-700">{problem.equipment}</span>
            </span>
          )}
          <span className="ml-auto inline-flex items-center gap-1">
            <EyeIcon className="h-3.5 w-3.5" />
            조회 {problem.views}
          </span>
        </div>
        <div className="no-print mt-4 flex gap-2">
          <FavoriteButton kind="problem" id={problem.id} />
          <button type="button" className="btn-secondary" onClick={() => window.print()}>
            <PrinterIcon className="h-4 w-4" />
            인쇄하기
          </button>
        </div>
      </header>

      {summarySteps.length > 0 && (
        <section className="rounded-xl border border-accent-200 bg-accent-50 p-5">
          <h2 className="font-bold text-accent-700">3줄 요약</h2>
          <ol className="mt-2 space-y-1.5 text-[15px] text-slate-700">
            {summarySteps.map((s, i) => (
              <li key={s.order} className="flex gap-2">
                <span className="font-bold text-accent-600">{i + 1}.</span>
                <span>{s.title}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-800">해결 절차</h2>
          <div className="no-print flex items-center gap-2">
            <span className={`text-sm font-semibold ${allDone ? 'text-accent-600' : 'text-slate-500'}`}>
              {doneCount}/{problem.steps.length} 완료
            </span>
            {doneCount > 0 && (
              <button type="button" onClick={reset} className="text-xs font-medium text-slate-400 hover:text-slate-600">
                초기화
              </button>
            )}
          </div>
        </div>
        <div className="no-print mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all ${allDone ? 'bg-accent-500' : 'bg-brand-500'}`}
            style={{ width: `${problem.steps.length ? (doneCount / problem.steps.length) * 100 : 0}%` }}
          />
        </div>
        {allDone && (
          <p className="no-print mt-2 flex items-center gap-1.5 text-sm font-semibold text-accent-600">
            <CheckIcon className="h-4 w-4" />
            모든 단계를 완료했습니다.
          </p>
        )}
        <div className="mt-4 flex flex-col gap-3">
          {problem.steps.map((step) => {
            const isChecked = checked.has(step.order)
            return (
              <div
                key={step.order}
                className={`card p-4 transition-colors ${isChecked ? 'border-accent-200 bg-accent-50/50' : ''}`}
              >
                <button
                  type="button"
                  className="flex w-full items-start gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
                  onClick={() => toggle(step.order)}
                  aria-pressed={isChecked}
                >
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 ${
                      isChecked ? 'border-accent-500 bg-accent-500 text-white' : 'border-slate-300 bg-white text-transparent'
                    }`}
                  >
                    <CheckIcon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <Badge tone="slate">{step.order}</Badge>
                      <span className={`font-bold text-slate-800 ${isChecked ? 'line-through opacity-60' : ''}`}>
                        {step.title}
                      </span>
                    </span>
                    {step.detail && (
                      <span className="mt-1.5 block whitespace-pre-line text-sm leading-relaxed text-slate-600">
                        {step.detail}
                      </span>
                    )}
                  </span>
                </button>
                {step.caution && (
                  <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <span>
                      <strong className="font-semibold">주의:</strong> {step.caution}
                    </span>
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {problem.fieldTips.length > 0 && (
        <section className="rounded-xl border border-accent-200 bg-accent-50 p-5">
          <h2 className="flex items-center gap-1.5 font-bold text-accent-700">
            <LightbulbIcon className="h-4 w-4" />
            현장 팁
          </h2>
          <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-slate-700">
            {problem.fieldTips.map((tip, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-accent-500">·</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {problem.sourceNote && (
        <p className="text-xs text-slate-400">출처: {problem.sourceNote}</p>
      )}

      {relatedProblems.length > 0 && (
        <section className="no-print">
          <h2 className="text-lg font-bold text-slate-800">함께 보면 좋은 문제</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {relatedProblems.map((p) => (
              <Link
                key={p.id}
                to={`/problems/${p.id}`}
                className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-800"
              >
                <Badge tone={contextTone(p.context)}>{CONTEXT_LABELS[p.context]}</Badge>
                {p.title}
                <ChevronRightIcon className="h-3.5 w-3.5 text-slate-300" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="print-only">
        <p className="text-sm">
          {CATEGORY_LABELS[problem.category]} · {CONTEXT_LABELS[problem.context]} ·{' '}
          {SCHOOL_LEVEL_LABELS[problem.schoolLevel]}
        </p>
        {problem.fieldTips.length > 0 && (
          <p className="mt-2 text-sm">현장 팁: {problem.fieldTips.join(' / ')}</p>
        )}
      </div>
    </div>
  )
}
