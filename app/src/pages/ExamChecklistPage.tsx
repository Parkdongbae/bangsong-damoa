import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { store } from '../lib/db'
import { CONTEXT_LABELS } from '../types'
import Badge from '../components/Badge'
import ErrorState from '../components/ErrorState'
import Spinner from '../components/Spinner'
import { AlertIcon, PrinterIcon } from '../components/icons'

export default function ExamChecklistPage() {
  const { data: problems, isLoading, isError, refetch } = useQuery({
    queryKey: ['problems'],
    queryFn: () => store.listProblems(),
  })

  const groups = useMemo(() => {
    const examProblems = (problems ?? []).filter((p) => p.context === 'exam' || p.context === 'su-neung')
    const map = new Map<string, typeof examProblems>()
    for (const p of examProblems) {
      const key = p.equipment || ''
      const list = map.get(key)
      if (list) list.push(p)
      else map.set(key, [p])
    }
    return [...map.entries()].sort(([a], [b]) => {
      if (!a) return 1
      if (!b) return -1
      return a.localeCompare(b, 'ko')
    })
  }, [problems])

  const totalCount = groups.reduce((sum, [, list]) => sum + list.length, 0)

  return (
    <div className="flex flex-col gap-5">
      <header className="no-print flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">시험 당일 방송 점검 체크리스트</h1>
          <p className="mt-1 text-sm text-slate-500">
            시험·수능 관련 문제 {totalCount}건을 장비별로 모았습니다. 인쇄해서 순서대로 확인하세요.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => window.print()}>
          <PrinterIcon className="h-4 w-4" />
          인쇄하기
        </button>
      </header>

      <header className="print-only exam-print mb-4">
        <h1 className="text-center font-bold">시험 당일 방송 점검 체크리스트</h1>
        <p className="mt-2 flex flex-wrap gap-x-8 text-sm">
          <span>날짜: ________년 ________월 ________일</span>
          <span>학교: ______________________</span>
          <span>점검자: ______________________</span>
        </p>
      </header>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : totalCount === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
          시험·수능 관련 문제가 아직 없습니다. 관리자 메뉴에서 시드 데이터를 가져와 주세요.
        </p>
      ) : (
        <div className="exam-print flex flex-col gap-5">
          {groups.map(([equipment, list]) => (
            <section key={equipment || 'none'}>
              <h2 className="font-bold text-slate-700">{equipment || '공통·기타'}</h2>
              <div className="mt-2 flex flex-col gap-3">
                {list.map((p) => (
                  <div key={p.id} className="card print-break-avoid p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={p.context === 'su-neung' ? 'warn' : 'brand'}>{CONTEXT_LABELS[p.context]}</Badge>
                      <h3 className="font-bold text-slate-800">{p.title}</h3>
                      <Link
                        to={`/problems/${p.id}`}
                        className="no-print ml-auto text-xs font-medium text-brand-600 hover:underline"
                      >
                        자세히
                      </Link>
                    </div>
                    <ol className="mt-2.5 space-y-1.5 text-sm">
                      {p.steps.map((s) => (
                        <li key={s.order} className="flex items-start gap-2">
                          <span className="mt-0.5 inline-block h-3.5 w-3.5 shrink-0 border border-slate-400" aria-hidden="true" />
                          <span>
                            {s.title}
                            {s.caution && (
                              <span className="ml-1.5 inline-flex items-center gap-0.5 font-medium text-amber-700">
                                <AlertIcon className="h-3 w-3" />
                                {s.caution}
                              </span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
