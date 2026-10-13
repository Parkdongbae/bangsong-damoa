import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const NAV_ITEMS = [
  { to: '/', label: '홈', end: true },
  { to: '/problems', label: '문제 해결' },
  { to: '/templates', label: '템플릿' },
  { to: '/qa', label: 'Q&A' },
  { to: '/favorites', label: '즐겨찾기' },
]

export default function Layout() {
  const { mode, user, loading, signOutUser } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOutUser()
    navigate('/')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="no-print sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-brand-800">
            <img src="/icon.svg" alt="" className="h-7 w-7" />
            <span className="text-base">방송실 문제 다모아</span>
          </Link>
          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive ? 'bg-brand-50 text-brand-800' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            {user?.role === 'admin' && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive ? 'bg-brand-50 text-brand-800' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                관리
              </NavLink>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {loading ? (
              <span className="text-sm text-slate-400">…</span>
            ) : user ? (
              <>
                <span className="hidden text-sm text-slate-600 sm:inline">
                  {user.displayName}
                  {user.role === 'admin' && (
                    <span className="badge-warn ml-1.5 align-middle">관리자</span>
                  )}
                </span>
                <button type="button" className="btn-secondary !px-3 !py-1.5" onClick={handleSignOut}>
                  로그아웃
                </button>
              </>
            ) : (
              <Link to="/login" className="btn-primary !px-3 !py-1.5">
                로그인
              </Link>
            )}
          </div>
        </div>
      </header>

      {mode === 'local' && (
        <div className="no-print bg-amber-50 px-4 py-1.5 text-center text-xs text-amber-800">
          데모 모드(로컬 저장)로 동작 중입니다. Firebase 연결 후 실제 서버에 저장됩니다.
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="no-print border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        방송실 문제 다모아 — 카톡 방송방의 현장 노하우를 구조화된 지식으로. (개인정보 비포함 요약본)
      </footer>

      <nav className="no-print fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white md:hidden">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                isActive ? 'text-brand-800' : 'text-slate-500'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="h-14 md:hidden" />
    </div>
  )
}
