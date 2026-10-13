import type { ReactNode } from 'react'

const TONE_CLASSES = {
  brand: 'badge-brand',
  mint: 'badge-mint',
  warn: 'badge-warn',
  slate: 'badge bg-slate-100 text-slate-600',
} as const

export type BadgeTone = keyof typeof TONE_CLASSES

export default function Badge({ tone = 'slate', children }: { tone?: BadgeTone; children: ReactNode }) {
  return <span className={TONE_CLASSES[tone]}>{children}</span>
}
