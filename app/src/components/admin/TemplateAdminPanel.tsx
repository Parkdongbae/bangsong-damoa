import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { newId, store } from '../../lib/db'
import { useAuth } from '../../lib/auth'
import Badge from '../Badge'
import ConfirmDialog from '../ConfirmDialog'
import EmptyState from '../EmptyState'
import ErrorState from '../ErrorState'
import Spinner from '../Spinner'
import { TEMPLATE_TYPE_ENTRIES, ALL_CONTEXT_ENTRIES, LEVEL_ENTRIES } from '../../lib/selectOptions'
import { TEMPLATE_TYPE_LABELS } from '../../types'
import type { SchoolLevel, Template, TemplateType } from '../../types'
import { PencilIcon, PlusIcon, TrashIcon } from '../icons'

function TemplateForm({ initial, onDone }: { initial: Template | null; onDone: () => void }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState(initial?.title ?? '')
  const [type, setType] = useState<TemplateType>(initial?.type ?? 'howto')
  const [schoolLevel, setSchoolLevel] = useState<SchoolLevel>(initial?.schoolLevel ?? 'all')
  const [context, setContext] = useState<Template['context']>(initial?.context ?? 'daily')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [tags, setTags] = useState(initial?.tags.join(', ') ?? '')
  const [contentMd, setContentMd] = useState(initial?.contentMd ?? '')
  const [sourceNote, setSourceNote] = useState(initial?.sourceNote ?? '')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      const nowIso = new Date().toISOString()
      const template: Template = {
        id: initial?.id ?? newId('tpl'),
        title: title.trim(),
        type,
        schoolLevel,
        context,
        contentMd,
        description: description.trim(),
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        sourceNote: sourceNote.trim() || undefined,
        createdAt: initial?.createdAt ?? nowIso,
        updatedAt: nowIso,
        createdBy: initial?.createdBy ?? user?.uid,
      }
      await store.saveTemplate(template)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['templates'] })
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

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-4 p-5">
      <h3 className="font-bold text-slate-800">{initial ? '템플릿 수정' : '새 템플릿'}</h3>
      <label>
        <span className="label">제목</span>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label>
          <span className="label">종류</span>
          <select className="input" value={type} onChange={(e) => setType(e.target.value as TemplateType)}>
            {TEMPLATE_TYPE_ENTRIES.map(([value, label]) => (
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
        <label>
          <span className="label">상황</span>
          <select
            className="input"
            value={context}
            onChange={(e) => setContext(e.target.value as Template['context'])}
          >
            {ALL_CONTEXT_ENTRIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        <span className="label">설명</span>
        <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <label>
        <span className="label">태그 (쉼표로 구분)</span>
        <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} />
      </label>
      <label>
        <span className="label">내용 (마크다운)</span>
        <textarea
          className="input min-h-72 resize-y font-mono text-[13px] leading-relaxed"
          value={contentMd}
          onChange={(e) => setContentMd(e.target.value)}
          placeholder={'# 제목\n\n## 1. 준비\n- 항목'}
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

export default function TemplateAdminPanel() {
  const queryClient = useQueryClient()
  const { data: templates, isLoading, isError, refetch } = useQuery({
    queryKey: ['templates'],
    queryFn: () => store.listTemplates(),
  })
  const [editing, setEditing] = useState<Template | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Template | null>(null)

  const deleteMutation = useMutation({
    mutationFn: (id: string) => store.deleteTemplate(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['templates'] })
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
          새 템플릿 추가
        </button>
      </div>

      {editing && (
        <TemplateForm key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />
      )}

      {!templates || templates.length === 0 ? (
        <EmptyState title="등록된 템플릿이 없습니다." description="'새 템플릿 추가' 또는 시드 가져오기로 시작하세요." />
      ) : (
        <ul className="flex flex-col gap-2">
          {templates.map((t) => (
            <li key={t.id} className="card flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <Badge tone="brand">{TEMPLATE_TYPE_LABELS[t.type]}</Badge>
                <p className="mt-1 truncate font-semibold text-slate-800">{t.title}</p>
                {t.description && <p className="truncate text-xs text-slate-400">{t.description}</p>}
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button type="button" className="btn-secondary !px-3 !py-2" onClick={() => setEditing(t)} aria-label={`${t.title} 수정`}>
                  <PencilIcon className="h-4 w-4" />
                  수정
                </button>
                <button
                  type="button"
                  className="btn-secondary !px-3 !py-2 !text-red-600"
                  onClick={() => setDeleting(t)}
                  aria-label={`${t.title} 삭제`}
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
          title="템플릿을 삭제할까요?"
          message={`'${deleting.title}' 템플릿을 삭제합니다. 되돌릴 수 없습니다.`}
          onConfirm={() => deleteMutation.mutate(deleting.id)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
