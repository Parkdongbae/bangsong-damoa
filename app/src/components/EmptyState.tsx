import type { ReactNode } from 'react'
import { FileTextIcon } from './icons'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <FileTextIcon className="h-6 w-6" />
      </span>
      <p className="font-semibold text-slate-700">{title}</p>
      {description && <p className="max-w-sm text-sm text-slate-500">{description}</p>}
      {action}
    </div>
  )
}
