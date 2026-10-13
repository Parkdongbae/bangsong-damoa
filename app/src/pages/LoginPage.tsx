import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import type { SchoolLevel, UserRole } from '../types'
import Spinner from '../components/Spinner'
import { LEVEL_ENTRIES } from '../lib/selectOptions'
import { GoogleIcon } from '../components/icons'

export default function LoginPage() {
  const { mode, user, loading, signIn, signInWithGoogle, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState<UserRole>('teacher')
  const [schoolLevel, setSchoolLevel] = useState<SchoolLevel>('all')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const state = location.state as { from?: string | { pathname?: string } } | null
  const from = typeof state?.from === 'string' ? state.from : (state?.from?.pathname ?? '/')

  if (loading) return <Spinner />
  if (user) return <Navigate to={from} replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (isSignUp) {
        if (!displayName.trim()) {
          setError('이름을 입력해 주세요.')
          return
        }
        await signUp({ email, password, displayName: displayName.trim(), role, schoolLevel })
      } else {
        await signIn(email, password)
      }
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다. 다시 시도해 주세요.')
    } finally {
      setBusy(false)
    }
  }

  async function handleGoogle() {
    setError('')
    setBusy(true)
    try {
      await signInWithGoogle()
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '구글 로그인에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  function fillDemoAccount() {
    setEmail('admin@damoa.local')
    setPassword('admin1234')
    setError('')
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-5 py-6">
      <div className="text-center">
        <h1 className="text-xl font-bold text-slate-800">{isSignUp ? '회원가입' : '로그인'}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {isSignUp ? '즐겨찾기와 Q&A 참여를 위해 가입해 주세요.' : '즐겨찾기와 Q&A는 로그인 후 이용할 수 있습니다.'}
        </p>
      </div>

      {mode === 'local' && !isSignUp && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">데모 계정</p>
          <p className="mt-1">
            관리자: <code className="rounded bg-white/70 px-1 py-0.5">admin@damoa.local</code> /{' '}
            <code className="rounded bg-white/70 px-1 py-0.5">admin1234</code>
          </p>
          <button type="button" className="mt-2 font-semibold text-amber-900 underline underline-offset-2" onClick={fillDemoAccount}>
            관리자 계정 채우기
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card flex flex-col gap-4 p-5">
        {isSignUp && (
          <label>
            <span className="label">이름</span>
            <input
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="홍길동"
              required
            />
          </label>
        )}
        <label>
          <span className="label">이메일</span>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@school.kr"
            required
            autoComplete="email"
          />
        </label>
        <label>
          <span className="label">비밀번호</span>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="6자 이상"
            required
            minLength={6}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
          />
        </label>
        {isSignUp && (
          <div className="grid grid-cols-2 gap-4">
            <label>
              <span className="label">역할</span>
              <select className="input" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
                <option value="teacher">교사</option>
                <option value="staff">교직원</option>
              </select>
            </label>
            <label>
              <span className="label">학교급</span>
              <select className="input" value={schoolLevel} onChange={(e) => setSchoolLevel(e.target.value as SchoolLevel)}>
                {LEVEL_ENTRIES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? '처리 중…' : isSignUp ? '가입하기' : '로그인'}
        </button>

        {mode === 'firebase' && (
          <>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              또는
              <span className="h-px flex-1 bg-slate-200" />
            </div>
            <button type="button" className="btn-secondary w-full" onClick={handleGoogle} disabled={busy}>
              <GoogleIcon className="h-4 w-4" />
              구글로 로그인
            </button>
          </>
        )}
      </form>

      <p className="text-center text-sm text-slate-500">
        {isSignUp ? '이미 계정이 있나요? ' : '계정이 없나요? '}
        <button
          type="button"
          className="font-semibold text-brand-700 underline underline-offset-2"
          onClick={() => {
            setIsSignUp((v) => !v)
            setError('')
          }}
        >
          {isSignUp ? '로그인' : '회원가입'}
        </button>
      </p>
    </div>
  )
}
