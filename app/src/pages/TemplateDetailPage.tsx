import ReactMarkdown from 'react-markdown'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { store } from '../lib/db'
import { TEMPLATE_TYPE_LABELS, SCHOOL_LEVEL_LABELS, CONTEXT_LABELS } from '../types'
import Badge from '../components/Badge'
import FavoriteButton from '../components/FavoriteButton'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import Spinner from '../components/Spinner'
import { PrinterIcon } from '../components/icons'

// react-markdown에 GFM 플러그인이 없어 파이프 테이블만 직접 변환한다.
type MdSegment = { type: 'md' | 'table'; content: string }

function isTableLine(line: string): boolean {
  return /^\s*\|.*\|\s*$/.test(line)
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function renderTable(lines: string[]): string {
  const rows = lines
    .map((l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim()))
    .filter((cells, i) => !(i === 1 && cells.every((c) => /^:?-{3,}:?$/.test(c))))
  if (rows.length === 0) return ''
  const [head, ...body] = rows
  return [
    '<table><thead><tr>',
    head.map((c) => `<th>${escapeHtml(c)}</th>`).join(''),
    '</tr></thead><tbody>',
    ...body.map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`),
    '</tbody></table>',
  ].join('')
}

function splitMarkdownTables(md: string): MdSegment[] {
  const segments: MdSegment[] = []
  let mdBuf: string[] = []
  let tableBuf: string[] | null = null
  const flushMd = () => {
    if (mdBuf.length > 0) {
      segments.push({ type: 'md', content: mdBuf.join('\n') })
      mdBuf = []
    }
  }
  for (const line of md.split('\n')) {
    if (isTableLine(line)) {
      if (!tableBuf) {
        flushMd()
        tableBuf = []
      }
      tableBuf.push(line)
    } else {
      if (tableBuf) {
        segments.push({ type: 'table', content: renderTable(tableBuf) })
        tableBuf = null
      }
      mdBuf.push(line)
    }
  }
  if (tableBuf) segments.push({ type: 'table', content: renderTable(tableBuf) })
  flushMd()
  return segments
}

export default function TemplateDetailPage() {
  const { id = '' } = useParams()
  const { data: template, isLoading, isError, refetch } = useQuery({
    queryKey: ['template', id],
    queryFn: () => store.getTemplate(id),
  })

  if (isLoading) return <Spinner />
  if (isError) return <ErrorState onRetry={() => void refetch()} />
  if (!template) {
    return (
      <EmptyState
        title="템플릿을 찾을 수 없습니다."
        description="삭제되었거나 잘못된 주소입니다."
        action={
          <Link to="/templates" className="btn-secondary mt-2">
            목록으로
          </Link>
        }
      />
    )
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div className="no-print">
        <Link to="/templates" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-brand-700">
          템플릿 목록
        </Link>
      </div>

      <header className="card p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="brand">{TEMPLATE_TYPE_LABELS[template.type]}</Badge>
          <Badge tone="slate">{SCHOOL_LEVEL_LABELS[template.schoolLevel]}</Badge>
          <Badge tone="slate">{CONTEXT_LABELS[template.context]}</Badge>
        </div>
        <h1 className="mt-3 text-xl font-bold leading-snug text-slate-800 sm:text-2xl">{template.title}</h1>
        {template.description && <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{template.description}</p>}
        {template.tags.length > 0 && <p className="mt-3 text-xs text-slate-400">#{template.tags.join(' #')}</p>}
        <div className="no-print mt-4 flex gap-2 border-t border-slate-100 pt-4">
          <FavoriteButton kind="template" id={template.id} />
          <button type="button" className="btn-secondary" onClick={() => window.print()}>
            <PrinterIcon className="h-4 w-4" />
            인쇄하기
          </button>
        </div>
      </header>

      {template.contentMd ? (
        <article className="card p-5 sm:p-6">
          <div className="markdown-body">
            {splitMarkdownTables(template.contentMd).map((seg, i) =>
              seg.type === 'md' ? (
                <ReactMarkdown key={i}>{seg.content}</ReactMarkdown>
              ) : (
                <div key={i} dangerouslySetInnerHTML={{ __html: seg.content }} />
              ),
            )}
          </div>
        </article>
      ) : (
        <EmptyState title="내용이 아직 작성되지 않았습니다." />
      )}

      {template.sourceNote && <p className="text-xs text-slate-400">출처: {template.sourceNote}</p>}
    </div>
  )
}
