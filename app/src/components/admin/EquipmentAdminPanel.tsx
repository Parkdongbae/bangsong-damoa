import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { newId, store } from '../../lib/db'
import Badge from '../Badge'
import ConfirmDialog from '../ConfirmDialog'
import EmptyState from '../EmptyState'
import ErrorState from '../ErrorState'
import Spinner from '../Spinner'
import { EQUIPMENT_CATEGORY_ENTRIES } from '../../lib/selectOptions'
import { PencilIcon, PlusIcon, TrashIcon } from '../icons'
import type { Equipment } from '../../types'

function EquipmentForm({ initial, onDone }: { initial: Equipment | null; onDone: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(initial?.name ?? '')
  const [category, setCategory] = useState(initial?.category || 'other')
  const [vendorNote, setVendorNote] = useState(initial?.vendorNote ?? '')
  const [tags, setTags] = useState(initial?.tags.join(', ') ?? '')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      const equipment: Equipment = {
        id: initial?.id ?? newId('eq'),
        name: name.trim(),
        category,
        vendorNote: vendorNote.trim(),
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      }
      await store.saveEquipment(equipment)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['equipments'] })
      onDone()
    },
    onError: () => setError('저장에 실패했습니다. 다시 시도해 주세요.'),
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) {
      setError('장비 이름은 필수입니다.')
      return
    }
    mutation.mutate()
  }

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-4 p-5">
      <h3 className="font-bold text-slate-800">{initial ? '장비 수정' : '새 장비'}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="label">장비 이름</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          <span className="label">분류</span>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {EQUIPMENT_CATEGORY_ENTRIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        <span className="label">구매·지원 정보 (선택)</span>
        <input
          className="input"
          value={vendorNote}
          onChange={(e) => setVendorNote(e.target.value)}
          placeholder="예: 2024년 교육청 지원, AS는 교육청"
        />
      </label>
      <label>
        <span className="label">태그 (쉼표로 구분)</span>
        <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} />
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

export default function EquipmentAdminPanel() {
  const queryClient = useQueryClient()
  const { data: equipments, isLoading, isError, refetch } = useQuery({
    queryKey: ['equipments'],
    queryFn: () => store.listEquipments(),
  })
  const [editing, setEditing] = useState<Equipment | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Equipment | null>(null)

  const deleteMutation = useMutation({
    mutationFn: (id: string) => store.deleteEquipment(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['equipments'] })
      setDeleting(null)
    },
  })

  if (isLoading) return <Spinner />
  if (isError) return <ErrorState onRetry={() => void refetch()} />

  const categoryLabel = (value: string) => {
    const entry = EQUIPMENT_CATEGORY_ENTRIES.find(([v]) => v === value)
    return entry ? entry[1] : value
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button type="button" className="btn-primary" onClick={() => setEditing('new')}>
          <PlusIcon className="h-4 w-4" />
          새 장비 추가
        </button>
      </div>

      {editing && (
        <EquipmentForm key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />
      )}

      {!equipments || equipments.length === 0 ? (
        <EmptyState title="등록된 장비가 없습니다." description="'새 장비 추가' 또는 시드 가져오기로 시작하세요." />
      ) : (
        <ul className="flex flex-col gap-2">
          {equipments.map((eq) => (
            <li key={eq.id} className="card flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <Badge tone="mint">{categoryLabel(eq.category)}</Badge>
                <p className="mt-1 truncate font-semibold text-slate-800">{eq.name}</p>
                {eq.vendorNote && <p className="truncate text-xs text-slate-400">{eq.vendorNote}</p>}
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button type="button" className="btn-secondary !px-3 !py-2" onClick={() => setEditing(eq)} aria-label={`${eq.name} 수정`}>
                  <PencilIcon className="h-4 w-4" />
                  수정
                </button>
                <button
                  type="button"
                  className="btn-secondary !px-3 !py-2 !text-red-600"
                  onClick={() => setDeleting(eq)}
                  aria-label={`${eq.name} 삭제`}
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
          title="장비를 삭제할까요?"
          message={`'${deleting.name}' 장비를 삭제합니다. 되돌릴 수 없습니다.`}
          onConfirm={() => deleteMutation.mutate(deleting.id)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
