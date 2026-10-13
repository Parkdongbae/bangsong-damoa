interface ErrorStateProps {
  onRetry?: () => void
}

export default function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-14 text-center">
      <p className="font-semibold text-slate-700">일시적인 오류입니다.</p>
      <p className="text-sm text-slate-500">네트워크를 확인해 주세요.</p>
      {onRetry && (
        <button type="button" className="btn-secondary mt-2" onClick={onRetry}>
          다시 시도
        </button>
      )}
    </div>
  )
}
