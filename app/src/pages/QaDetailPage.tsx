import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { newId, store } from '../lib/db'
import { useAuth } from '../lib/auth'
import { CONTEXT_LABELS, SCHOOL_LEVEL_LABELS } from '../types'
import Badge from '../components/Badge'
import { contextTone } from '../components/ProblemBadges'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import Spinner from '../components/Spinner'
import { TrashIcon } from '../components/icons'
import { formatDate, formatRelative } from '../lib/format'

export default function QaDetailPage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: post, isLoading, isError, refetch } = useQuery({
    queryKey: ['post', id],
    queryFn: () => store.getPost(id),
  })

  const [answerText, setAnswerText] = useState('')
  const [error, setError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const answerMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('로그인이 필요합니다.')
      if (!post) throw new Error('질문을 찾을 수 없습니다.')
      const answer = {
        id: newId('ans'),
        authorId: user.uid,
        authorName: user.displayName,
        content: answerText.trim(),
        createdAt: new Date().toISOString(),
      }
      await store.savePost({ ...post, answers: [...post.answers, answer], updatedAt: new Date().toISOString() })
    },
    onSuccess: () => {
      setAnswerText('')
      void queryClient.invalidateQueries({ queryKey: ['post', id] })
      void queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
    onError: (err) => setError(err instanceof Error ? err.message : '답변 등록에 실패했습니다.'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => store.deletePost(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['posts'] })
      navigate('/qa')
    },
    onError: () => setError('삭제에 실패했습니다. 다시 시도해 주세요.'),
  })

  if (isLoading) return <Spinner />
  if (isError) return <ErrorState onRetry={() => void refetch()} />
  if (!post) {
    return (
      <EmptyState
        title="질문을 찾을 수 없습니다."
        description="삭제되었거나 잘못된 주소입니다."
        action={
          <Link to="/qa" className="btn-secondary mt-2">
            Q&A 목록으로
          </Link>
        }
      />
    )
  }

  const canDelete = user && (user.uid === post.authorId || user.role === 'admin')

  function handleAnswerSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!answerText.trim()) {
      setError('답변 내용을 입력해 주세요.')
      return
    }
    answerMutation.mutate()
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div className="no-print">
        <Link to="/qa" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-brand-700">
          Q&amp;A 목록
        </Link>
      </div>

      <article className="card p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={contextTone(post.context)}>{CONTEXT_LABELS[post.context]}</Badge>
          <Badge tone="slate">{SCHOOL_LEVEL_LABELS[post.schoolLevel]}</Badge>
          {post.equipment && <Badge tone="slate">{post.equipment}</Badge>}
        </div>
        <h1 className="mt-3 text-xl font-bold leading-snug text-slate-800">{post.title}</h1>
        <p className="mt-1.5 text-xs text-slate-400">
          {post.authorName} · {formatDate(post.createdAt)}
        </p>
        <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-slate-700">{post.content}</p>
        {canDelete && (
          <div className="no-print mt-4 flex justify-end border-t border-slate-100 pt-3">
            <button type="button" className="btn-secondary !text-red-600" onClick={() => setConfirmOpen(true)}>
              <TrashIcon className="h-4 w-4" />
              삭제
            </button>
          </div>
        )}
      </article>

      <section>
        <h2 className="text-lg font-bold text-slate-800">
          답변 <span className="text-accent-600">{post.answers.length}</span>
        </h2>
        {post.answers.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
            아직 답변이 없습니다. 첫 번째 답변이 되어 주세요.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {post.answers.map((a) => (
              <li key={a.id} className="card p-4">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-semibold text-slate-600">{a.authorName}</span>
                  <span>{formatRelative(a.createdAt)}</span>
                  {user?.role === 'admin' && user.uid !== a.authorId && <Badge tone="warn">관리자</Badge>}
                </div>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">{a.content}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-5">
        <h2 className="font-bold text-slate-800">답변 달기</h2>
        {user ? (
          <form onSubmit={handleAnswerSubmit} className="mt-3">
            <textarea
              className="input min-h-28 resize-y"
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="현장에서 쓸 수 있는 방법을 알려 주세요."
            />
            {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
            <div className="mt-3 flex justify-end">
              <button type="submit" className="btn-primary" disabled={answerMutation.isPending}>
                {answerMutation.isPending ? '등록 중…' : '답변 등록'}
              </button>
            </div>
          </form>
        ) : (
          <p className="mt-3 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">
            답변하려면{' '}
            <Link to="/login" state={{ from: location.pathname }} className="font-semibold text-brand-700 underline">
              로그인
            </Link>
            이 필요합니다.
          </p>
        )}
      </section>

      {confirmOpen && (
        <ConfirmDialog
          title="질문을 삭제할까요?"
          message="삭제한 질문과 답변은 되돌릴 수 없습니다."
          onConfirm={() => {
            setConfirmOpen(false)
            deleteMutation.mutate()
          }}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  )
}
