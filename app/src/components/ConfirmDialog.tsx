import { AlertIcon } from './icons'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = '삭제',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onCancel}
    >
      <div className="card w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-slate-800">{title}</p>
            <p className="mt-1 text-sm text-slate-500">{message}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            취소
          </button>
          <button type="button" className="btn-danger" onClick={onConfirm} autoFocus>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
