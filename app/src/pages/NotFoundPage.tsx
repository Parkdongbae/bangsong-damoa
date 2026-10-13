import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-20">
      <p className="text-4xl font-bold text-brand-800">404</p>
      <p className="text-slate-500">페이지를 찾을 수 없습니다.</p>
      <Link to="/" className="btn-primary">
        홈으로
      </Link>
    </div>
  )
}
