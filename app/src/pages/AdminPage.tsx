import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import Spinner from '../components/Spinner'
import ProblemAdminPanel from '../components/admin/ProblemAdminPanel'
import TemplateAdminPanel from '../components/admin/TemplateAdminPanel'
import EquipmentAdminPanel from '../components/admin/EquipmentAdminPanel'
import SeedImportPanel from '../components/admin/SeedImportPanel'

const TABS = [
  { key: 'problems', label: '문제 관리' },
  { key: 'templates', label: '템플릿 관리' },
  { key: 'equipments', label: '장비 관리' },
  { key: 'seed', label: '시드 가져오기' },
] as const

type TabKey = (typeof TABS)[number]['key']

export default function AdminPage() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const [tab, setTab] = useState<TabKey>('problems')

  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <p className="font-bold text-slate-700">권한이 없습니다</p>
        <p className="text-sm text-slate-500">이 페이지는 관리자만 사용할 수 있습니다.</p>
        <Link to="/" className="btn-secondary mt-2">
          홈으로
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">관리</h1>
        <p className="mt-1 text-sm text-slate-500">문제·템플릿·장비 데이터를 관리하고 시드를 가져옵니다.</p>
      </div>

      <div role="tablist" aria-label="관리 메뉴" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
              tab === t.key ? 'bg-brand-800 text-white' : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === 'problems' && <ProblemAdminPanel />}
        {tab === 'templates' && <TemplateAdminPanel />}
        {tab === 'equipments' && <EquipmentAdminPanel />}
        {tab === 'seed' && <SeedImportPanel />}
      </div>
    </div>
  )
}
