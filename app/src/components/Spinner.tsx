export default function Spinner({ label = '불러오는 중…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16" role="status" aria-live="polite">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
      <span className="text-sm text-slate-500">{label}</span>
    </div>
  )
}
