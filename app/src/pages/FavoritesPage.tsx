import { Link, Navigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { store } from '../lib/db'
import { useAuth } from '../lib/auth'
import { TEMPLATE_TYPE_LABELS } from '../types'
import Badge from '../components/Badge'
import ProblemCard from '../components/ProblemCard'
import EmptyState from '../components/EmptyState'
import Spinner from '../components/Spinner'
import { StarIcon, TrashIcon } from '../components/icons'
import { useState } from 'react'

export default function FavoritesPage() {
  const { user, loading, toggleFavorite } = useAuth()
  const location = useLocation()
  const [busyId, setBusyId] = useState<string | null>(null)

  const { data: problems, isLoading: problemsLoading } = useQuery({
    queryKey: ['problems'],
    queryFn: () => store.listProblems(),
  })
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => store.listTemplates(),
  })

  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />

  const favProblems = (problems ?? []).filter((p) => user.favoritesProblems.includes(p.id))
  const favTemplates = (templates ?? []).filter((t) => user.favoritesTemplates.includes(t.id))
  const isLoadingAny = problemsLoading || templatesLoading

  async function handleRemove(kind: 'problem' | 'template', id: string) {
    setBusyId(id)
    try {
      await toggleFavorite(kind, id)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-bold text-slate-800">즐겨찾기</h1>
        <p className="mt-1 text-sm text-slate-500">시험 전에 미리 저장해 둔 문제와 템플릿입니다.</p>
      </div>

      {isLoadingAny ? (
        <Spinner />
      ) : (
        <>
          <section>
            <h2 className="flex items-center gap-1.5 text-lg font-bold text-slate-800">
              <StarIcon className="h-4 w-4 text-accent-500" filled />
              즐겨찾은 문제
            </h2>
            {favProblems.length === 0 ? (
              <div className="mt-3">
                <EmptyState
                  title="즐겨찾은 문제가 없습니다."
                  description="문제 상세에서 즐겨찾기를 누르면 여기에 모입니다."
                  action={
                    <Link to="/problems" className="btn-primary mt-2">
                      문제 둘러보기
                    </Link>
                  }
                />
              </div>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {favProblems.map((p) => (
                  <div key={p.id} className="relative">
                    <ProblemCard problem={p} />
                    <button
                      type="button"
                      className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-slate-100 hover:text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                      onClick={() => void handleRemove('problem', p.id)}
                      disabled={busyId === p.id}
                      aria-label={`${p.title} 즐겨찾기 해제`}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="flex items-center gap-1.5 text-lg font-bold text-slate-800">
              <StarIcon className="h-4 w-4 text-accent-500" filled />
              즐겨찾은 템플릿
            </h2>
            {favTemplates.length === 0 ? (
              <div className="mt-3">
                <EmptyState
                  title="즐겨찾은 템플릿이 없습니다."
                  description="템플릿 상세에서 즐겨찾기를 누르면 여기에 모입니다."
                  action={
                    <Link to="/templates" className="btn-primary mt-2">
                      템플릿 둘러보기
                    </Link>
                  }
                />
              </div>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                {favTemplates.map((t) => (
                  <div key={t.id} className="card flex items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <Badge tone="brand">{TEMPLATE_TYPE_LABELS[t.type]}</Badge>
                      <Link
                        to={`/templates/${t.id}`}
                        className="mt-1.5 block truncate font-bold text-slate-800 hover:text-brand-700"
                      >
                        {t.title}
                      </Link>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 rounded-lg p-2 text-slate-300 transition-colors hover:bg-slate-100 hover:text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                      onClick={() => void handleRemove('template', t.id)}
                      disabled={busyId === t.id}
                      aria-label={`${t.title} 즐겨찾기 해제`}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
