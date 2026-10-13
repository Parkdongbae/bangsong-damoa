import { Link } from 'react-router-dom'
import Badge from './Badge'
import ProblemBadges from './ProblemBadges'
import { EyeIcon, ChevronRightIcon } from './icons'
import { formatViews } from '../lib/format'
import type { Problem } from '../types'

export default function ProblemCard({ problem }: { problem: Problem }) {
  return (
    <Link
      to={`/problems/${problem.id}`}
      className="card block p-4 transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
    >
      <ProblemBadges problem={problem} />
      <h3 className="mt-2.5 text-base font-bold text-slate-800">{problem.title}</h3>
      {problem.summary && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{problem.summary}</p>}
      <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-2.5 text-xs text-slate-500">
        {problem.equipment && (
          <span className="truncate">
            대상 장비: <span className="font-medium text-slate-600">{problem.equipment}</span>
          </span>
        )}
        <span className="ml-auto flex shrink-0 items-center gap-1">
          <EyeIcon className="h-3.5 w-3.5" />
          {formatViews(problem.views)}
        </span>
        <Badge tone="slate">{problem.steps.length}단계</Badge>
        <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-300" />
      </div>
    </Link>
  )
}
