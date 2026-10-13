import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { newId, store } from '../lib/db'
import { useAuth } from '../lib/auth'
import type { ProblemContext, SchoolLevel } from '../types'
import Spinner from '../components/Spinner'
import { CONTEXT_ENTRIES, LEVEL_ENTRIES } from '../lib/selectOptions'

export default function QaNewPage() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [equipment, setEquipment] = useState('')
  const [context, setContext] = useState<ProblemContext>('daily')
  const [schoolLevel, setSchoolLevel] = useState<SchoolLevel>('all')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('로그인이 필요합니다.')
      const nowIso = new Date().toISOString()
      const post = {
        id: newId('post'),
        title: title.trim(),
        content: content.trim(),
        equipment: equipment.trim(),
        context,
        schoolLevel,
        tags: [],
        authorId: user.uid,
        authorName: user.displayName,
        createdAt: nowIso,
        updatedAt: nowIso,
        answers: [],
        linkedProblemIds: [],
      }
      await store.savePost(post)
      return post
    },
    onSuccess: (post) => {
      void queryClient.invalidateQueries({ queryKey: ['posts'] })
      navigate(`/qa/${post.id}`)
    },
    onError: (err) => setError(err instanceof Error ? err.message : '저장에 실패했습니다. 다시 시도해 주세요.'),
  })

  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!title.trim() || !content.trim()) {
      setError('제목과 내용은 필수입니다.')
      return
    }
    mutation.mutate()
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">질문하기</h1>
        <p className="mt-1 text-sm text-slate-500">장비명과 상황을 적어 주면 더 정확한 답변을 받을 수 있습니다.</p>
      </div>

      <form onSubmit={handleSubmit} className="card flex flex-col gap-4 p-5">
        <label>
          <span className="label">제목</span>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 시험 중 앰프에서 잡음이 납니다"
            required
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label>
            <span className="label">장비</span>
            <input
              className="input"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              placeholder="예: 앰프"
            />
          </label>
          <label>
            <span className="label">상황</span>
            <select className="input" value={context} onChange={(e) => setContext(e.target.value as ProblemContext)}>
              {CONTEXT_ENTRIES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">학교급</span>
            <select className="input" value={schoolLevel} onChange={(e) => setSchoolLevel(e.target.value as SchoolLevel)}>
              {LEVEL_ENTRIES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          <span className="label">내용</span>
          <textarea
            className="input min-h-40 resize-y"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="증상과 시도해 본 방법을 적어 주세요."
            required
          />
        </label>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <Link to="/qa" className="btn-secondary">
            취소
          </Link>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? '저장 중…' : '질문 등록'}
          </button>
        </div>
      </form>
    </div>
  )
}
