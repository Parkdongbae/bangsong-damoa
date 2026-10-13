import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { store } from '../lib/db'
import { useAuth } from '../lib/auth'
import { CONTEXT_LABELS, SCHOOL_LEVEL_LABELS } from '../types'
import Badge from '../components/Badge'
import { contextTone } from '../components/ProblemBadges'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import Spinner from '../components/Spinner'
import { MessageCircleIcon } from '../components/icons'
import { formatRelative } from '../lib/format'

export default function QaListPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: posts, isLoading, isError, refetch } = useQuery({
    queryKey: ['posts'],
    queryFn: () => store.listPosts(),
  })

  function handleAskClick() {
    navigate(user ? '/qa/new' : '/login', { state: { from: user ? undefined : { pathname: '/qa/new' } } })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Q&amp;A</h1>
          <p className="mt-1 text-sm text-slate-500">해결되지 않는 문제를 물어보고, 알고 있는 것을 답해 주세요.</p>
        </div>
        <button type="button" className="btn-primary" onClick={handleAskClick}>
          <MessageCircleIcon className="h-4 w-4" />
          질문하기
        </button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : !posts || posts.length === 0 ? (
        <EmptyState
          title="아직 질문이 없습니다."
          description="방송실에서 막힌 일이 있다면 첫 번째 질문이 되어 주세요."
          action={
            <button type="button" className="btn-primary mt-2" onClick={handleAskClick}>
              질문하기
            </button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              to={`/qa/${post.id}`}
              className="card block p-4 transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone={contextTone(post.context)}>{CONTEXT_LABELS[post.context]}</Badge>
                <Badge tone="slate">{SCHOOL_LEVEL_LABELS[post.schoolLevel]}</Badge>
                {post.equipment && <Badge tone="slate">{post.equipment}</Badge>}
              </div>
              <h2 className="mt-2 text-base font-bold text-slate-800">{post.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">{post.content}</p>
              <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-2.5 text-xs text-slate-400">
                <span className="font-medium text-slate-600">{post.authorName}</span>
                <span>{formatRelative(post.createdAt)}</span>
                <span className="ml-auto">
                  {post.answers.length > 0 ? (
                    <Badge tone="mint">답변 {post.answers.length}</Badge>
                  ) : (
                    <span>답변 대기 중</span>
                  )}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
