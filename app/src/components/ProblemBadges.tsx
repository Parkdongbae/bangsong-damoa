import Badge, { type BadgeTone } from './Badge'
import { CATEGORY_LABELS, CONTEXT_LABELS, SCHOOL_LEVEL_LABELS } from '../types'
import type { Problem, ProblemContext } from '../types'

export function contextTone(context: ProblemContext | 'annual'): BadgeTone {
  return context === 'exam' || context === 'su-neung' ? 'warn' : 'mint'
}

export default function ProblemBadges({ problem }: { problem: Problem }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge tone="brand">{CATEGORY_LABELS[problem.category]}</Badge>
      <Badge tone={contextTone(problem.context)}>{CONTEXT_LABELS[problem.context]}</Badge>
      <Badge tone="slate">{SCHOOL_LEVEL_LABELS[problem.schoolLevel]}</Badge>
    </div>
  )
}
