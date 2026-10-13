import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { newId, store } from '../../lib/db'
import { useAuth } from '../../lib/auth'
import Badge from '../Badge'
import ConfirmDialog from '../ConfirmDialog'
import EmptyState from '../EmptyState'
import ErrorState from '../ErrorState'
import Spinner from '../Spinner'
import { CATEGORY_ENTRIES, CONTEXT_ENTRIES, LEVEL_ENTRIES } from '../../lib/selectOptions'
import { CATEGORY_LABELS } from '../../types'
import type { Problem, ProblemCategory, ProblemContext, SchoolLevel } from '../../types'
import { PencilIcon, PlusIcon, TrashIcon, EyeIcon } from '../icons'
import { formatViews } from '../../lib/format'

interface StepRow {
  title: string
  detail: string
  caution: string
}

function ProblemForm({ initial, onDone }: { initial: Problem | null; onDone: () => void }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: equipments } = useQuery({ queryKey: ['equipments'], queryFn: () => store.listEquipments() })

  const [title, setTitle] = useState(initial?.title ?? '')
  const [summary, setSummary] = useState(initial?.summary ?? '')
  const [equipment, setEquipment] = useState(initial?.equipment ?? '')
  const [category, setCategory] = useState<ProblemCategory>(initial?.category ?? 'operation')
  const [context, setContext] = useState<ProblemContext>(initial?.context ?? 'daily')
  const [schoolLevel, setSchoolLevel] = useState<SchoolLevel>(initial?.schoolLevel ?? 'all')
  const [steps, setSteps] = useState<StepRow[]>(
    initial?.steps.map((s) => ({ title: s.title, detail: s.detail, caution: s.caution ?? '' })) ?? [],
  )
  const [tags, setTags] = useState(initial?.tags.join(', ') ?? '')
  const [fieldTips, setFieldTips] = useState(initial?.fieldTips.join('\n') ?? '')
  const [sourceNote, setSourceNote] = useState(initial?.sourceNote ?? '')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      const nowIso = new Date().toISOString()
      const problem: Problem = {
        id: initial?.id ?? newId('prob'),
        title: title.trim(),
        summary: summary.trim(),
        equipment: equipment.trim(),
        category,
        context,
        schoolLevel,
        steps: steps
          .filter((s) => s.title.trim() || s.detail.trim())
          .map((s, i) => ({
            order: i + 1,
            title: s.title.trim(),
            detail: s.detail.trim(),
            caution: s.caution.trim() || undefined,
          })),
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        fieldTips: fieldTips.split('\n').map((t) => t.trim()).filter(Boolean),
        relatedProblemIds: initial?.relatedProblemIds ?? [],
        sourceNote: sourceNote.trim() || undefined,
        views: initial?.views ?? 0,
        createdAt: initial?.createdAt ?? nowIso,
        updatedAt: nowIso,
        createdBy: initial?.createdBy ?? user?.uid,
      }
      await store.saveProblem(problem)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['problems'] })
      onDone()
    },
    onError: () => setError('저장에 실패했습니다. 다시 시도해 주세요.'),
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!title.trim()) {
      setError('제목은 필수입니다.')
      return
    }
    mutation.mutate()
  }

  function updateStep(i: number, patch: Partial<StepRow>) {
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))
  }

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-4 p-5">
      <h3 className="font-bold text-slate-800">{initial ? '문제 수정' : '새 문제'}</h3>
      <label>
        <span className="label">제목</span>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label>
        <span className="label">요약</span>
        <input className="input" value={summary} onChange={(e) => setSummary(e.target.value)} />
      </label>
      <div className="grid gap-4 sm:grid-cols-4">
        <label className="sm:col-span-2">
          <span className="label">대상 장비</span>
          <input
            className="input"
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
            list="equipment-names"
            placeholder="예: 앰프"
          />
          <datalist id="equipment-names">
            {(equipments ?? []).map((eq) => (
              <option key={eq.id} value={eq.name} />
            ))}
          </datalist>
        </label>
        <label>
          <span className="label">카테고리</span>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value as ProblemCategory)}>
            {CATEGORY_ENTRIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
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
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
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
        <label className="sm:col-span-3">
          <span className="label">태그 (쉼표로 구분)</span>
          <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="앰프, 잡음, 시험" />
        </label>
      </div>

      <div>
        <span className="label">해결 단계</span>
        <div className="flex flex-col gap-3">
          {steps.map((s, i) => (
            <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-2">
                <Badge tone="slate">{i + 1}</Badge>
                <input
                  className="input"
                  value={s.title}
                  onChange={(e) => updateStep(i, { title: e.target.value })}
                  placeholder="단계 제목"
                />
                <button
                  type="button"
                  className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-red-500"
                  onClick={() => setSteps((prev) => prev.filter((_, idx) => idx !== i))}
                  aria-label={`${i + 1}단계 삭제`}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
              <input
                className="input mt-2"
                value={s.detail}
                onChange={(e) => updateStep(i, { detail: e.target.value })}
                placeholder="상세 설명"
              />
              <input
                className="input mt-2"
                value={s.caution}
                onChange={(e) => updateStep(i, { caution: e.target.value })}
                placeholder="주의 사항 (선택)"
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          className="btn-secondary mt-2 w-full sm:w-auto"
          onClick={() => setSteps((prev) => [...prev, { title: '', detail: '', caution: '' }])}
        >
          <PlusIcon className="h-4 w-4" />
          단계 추가
        </button>
      </div>

      <label>
        <span className="label">현장 팁 (한 줄에 하나씩)</span>
        <textarea
          className="input min-h-24 resize-y"
          value={fieldTips}
          onChange={(e) => setFieldTips(e.target.value)}
          placeholder={'예: 예비 마이크를 항상 서랍에 보관\n예: 방송 전 전원 확인'}
        />
      </label>
      <label>
        <span className="label">출처 (선택)</span>
        <input className="input" value={sourceNote} onChange={(e) => setSourceNote(e.target.value)} />
      </label>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <div className="flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onDone}>
          취소
        </button>
        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
          {mutation.isPending ? '저장 중…' : '저장'}
        </button>
      </div>
    </form>
  )
}

export default function ProblemAdminPanel() {
  const queryClient = useQueryClient()
  const { data: problems, isLoading, isError, refetch } = useQuery({
    queryKey: ['problems'],
    queryFn: () => store.listProblems(),
  })
  const [editing, setEditing] = useState<Problem | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Problem | null>(null)

  const deleteMutation = useMutation({
    mutationFn: (id: string) => store.deleteProblem(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['problems'] })
      setDeleting(null)
    },
  })

  if (isLoading) return <Spinner />
  if (isError) return <ErrorState onRetry={() => void refetch()} />

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button type="button" className="btn-primary" onClick={() => setEditing('new')}>
          <PlusIcon className="h-4 w-4" />
          새 문제 추가
        </button>
      </div>

      {editing && <ProblemForm key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />}

      {!problems || problems.length === 0 ? (
        <EmptyState title="등록된 문제가 없습니다." description="'새 문제 추가' 또는 시드 가져오기로 시작하세요." />
      ) : (
        <ul className="flex flex-col gap-2">
          {problems.map((p) => (
            <li key={p.id} className="card flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone="brand">{CATEGORY_LABELS[p.category]}</Badge>
                  <span className="text-xs text-slate-400">{p.steps.length}단계</span>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                    <EyeIcon className="h-3 w-3" />
                    {formatViews(p.views)}
                  </span>
                </div>
                <p className="mt-1 truncate font-semibold text-slate-800">{p.title}</p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button type="button" className="btn-secondary !px-3 !py-2" onClick={() => setEditing(p)} aria-label={`${p.title} 수정`}>
                  <PencilIcon className="h-4 w-4" />
                  수정
                </button>
                <button
                  type="button"
                  className="btn-secondary !px-3 !py-2 !text-red-600"
                  onClick={() => setDeleting(p)}
                  aria-label={`${p.title} 삭제`}
                >
                  <TrashIcon className="h-4 w-4" />
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {deleting && (
        <ConfirmDialog
          title="문제를 삭제할까요?"
          message={`'${deleting.title}' 문제를 삭제합니다. 되돌릴 수 없습니다.`}
          onConfirm={() => deleteMutation.mutate(deleting.id)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
