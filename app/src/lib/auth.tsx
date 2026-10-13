import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as fbSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  type User,
} from 'firebase/auth'
import { getFirebase, isFirebaseConfigured } from './firebase'
import { newId, store } from './db'
import type { SchoolLevel, UserRole, UserProfile } from '../types'

interface SignUpInput {
  email: string
  password: string
  displayName: string
  role: UserRole
  schoolLevel: SchoolLevel
}

interface AuthContextValue {
  mode: 'local' | 'firebase'
  user: UserProfile | null
  loading: boolean
  signIn(email: string, password: string): Promise<void>
  signInWithGoogle(): Promise<void>
  signUp(input: SignUpInput): Promise<void>
  signOutUser(): Promise<void>
  toggleFavorite(kind: 'problem' | 'template', id: string): Promise<void>
  isFavorite(kind: 'problem' | 'template', id: string): boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ---------- 로컬(데모) 인증 ----------

interface LocalCredential {
  uid: string
  password: string
}

const LS_AUTH_KEY = 'damoa_local_auth_v1'
const LS_SESSION_KEY = 'damoa_local_session'
const DEMO_ADMIN_EMAIL = 'admin@damoa.local'
const DEMO_ADMIN_PASSWORD = 'admin1234'

function saveSession(uid: string): void {
  localStorage.setItem(LS_SESSION_KEY, uid)
}

function clearSession(): void {
  localStorage.removeItem(LS_SESSION_KEY)
}

function loadCredentials(): Record<string, LocalCredential> {
  const raw = localStorage.getItem(LS_AUTH_KEY)
  if (raw) {
    try {
      return JSON.parse(raw) as Record<string, LocalCredential>
    } catch {
      // 손상 시 재초기화
    }
  }
  return {}
}

function saveCredentials(creds: Record<string, LocalCredential>): void {
  localStorage.setItem(LS_AUTH_KEY, JSON.stringify(creds))
}

function makeDemoAdminProfile(): UserProfile {
  const nowIso = new Date().toISOString()
  return {
    uid: 'local-demo-admin',
    email: DEMO_ADMIN_EMAIL,
    displayName: '관리자(데모)',
    role: 'admin',
    schoolLevel: 'all',
    favoritesProblems: [],
    favoritesTemplates: [],
    createdAt: nowIso,
    updatedAt: nowIso,
  }
}

async function ensureDemoAdmin(): Promise<void> {
  const creds = loadCredentials()
  if (!creds[DEMO_ADMIN_EMAIL]) {
    creds[DEMO_ADMIN_EMAIL] = { uid: 'local-demo-admin', password: DEMO_ADMIN_PASSWORD }
    saveCredentials(creds)
  }
  const existing = await store.getUserProfile('local-demo-admin')
  if (!existing) await store.saveUserProfile(makeDemoAdminProfile())
}

function localSignIn(email: string, password: string): UserProfile {
  const creds = loadCredentials()
  const cred = creds[email.trim().toLowerCase()]
  if (!cred || cred.password !== password) {
    throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.')
  }
  return {
    uid: cred.uid,
    email,
    displayName: '사용자',
    role: 'teacher',
    schoolLevel: 'all',
    favoritesProblems: [],
    favoritesTemplates: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

// ---------- 컨텍스트 ----------

export function AuthProvider({ children }: { children: ReactNode }) {
  const mode: 'local' | 'firebase' = isFirebaseConfigured ? 'firebase' : 'local'
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function init() {
      if (mode === 'local') {
        await ensureDemoAdmin()
        if (cancelled) return
        const savedUid = localStorage.getItem(LS_SESSION_KEY)
        const savedProfile = savedUid ? await store.getUserProfile(savedUid) : null
        if (!cancelled) {
          setUser(savedProfile)
          setLoading(false)
        }
        return
      }
      const { auth } = getFirebase()
      const unsubscribe = onAuthStateChanged(auth, async (fbUser: User | null) => {
        if (cancelled) return
        if (!fbUser) {
          setUser(null)
          setLoading(false)
          return
        }
        let profile = await store.getUserProfile(fbUser.uid)
        if (!profile) {
          const nowIso = new Date().toISOString()
          profile = {
            uid: fbUser.uid,
            email: fbUser.email ?? '',
            displayName: fbUser.displayName ?? (fbUser.email ?? '사용자').split('@')[0],
            role: 'teacher',
            schoolLevel: 'all',
            favoritesProblems: [],
            favoritesTemplates: [],
            createdAt: nowIso,
            updatedAt: nowIso,
          }
          await store.saveUserProfile(profile)
        }
        setUser(profile)
        setLoading(false)
      })
      return unsubscribe
    }
    const cleanup = init()
    return () => {
      cancelled = true
      cleanup
        ?.then((unsub) => unsub?.())
        .catch(() => {
          // 초기화 취소 중 오류는 언마운트 경합 상황이므로 무시한다.
        })
    }
  }, [mode])

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (mode === 'local') {
        const profile = localSignIn(email, password)
        const stored = await store.getUserProfile(profile.uid)
        saveSession(profile.uid)
        setUser(stored ?? profile)
        return
      }
      const { auth } = getFirebase()
      await signInWithEmailAndPassword(auth, email, password)
    },
    [mode],
  )

  const signInWithGoogle = useCallback(async () => {
    if (mode === 'local') {
      throw new Error('데모 모드에서는 구글 로그인을 사용할 수 없습니다. 이메일 로그인을 이용해 주세요.')
    }
    const { auth } = getFirebase()
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
  }, [mode])

  const signUp = useCallback(
    async (input: SignUpInput) => {
      const nowIso = new Date().toISOString()
      if (mode === 'local') {
        const email = input.email.trim().toLowerCase()
        const creds = loadCredentials()
        if (creds[email]) throw new Error('이미 가입된 이메일입니다.')
        const uid = newId('local')
        creds[email] = { uid, password: input.password }
        saveCredentials(creds)
        const profile: UserProfile = {
          uid,
          email,
          displayName: input.displayName,
          role: input.role,
          schoolLevel: input.schoolLevel,
          favoritesProblems: [],
          favoritesTemplates: [],
          createdAt: nowIso,
          updatedAt: nowIso,
        }
        await store.saveUserProfile(profile)
        saveSession(uid)
        setUser(profile)
        return
      }
      const { auth } = getFirebase()
      const cred = await createUserWithEmailAndPassword(auth, input.email, input.password)
      await updateProfile(cred.user, { displayName: input.displayName })
      const profile: UserProfile = {
        uid: cred.user.uid,
        email: input.email,
        displayName: input.displayName,
        role: input.role,
        schoolLevel: input.schoolLevel,
        favoritesProblems: [],
        favoritesTemplates: [],
        createdAt: nowIso,
        updatedAt: nowIso,
      }
      await store.saveUserProfile(profile)
      setUser(profile)
    },
    [mode],
  )

  const signOutUser = useCallback(async () => {
    if (mode === 'local') {
      clearSession()
      setUser(null)
      return
    }
    const { auth } = getFirebase()
    await fbSignOut(auth)
  }, [mode])

  const toggleFavorite = useCallback(
    async (kind: 'problem' | 'template', id: string) => {
      if (!user) throw new Error('로그인이 필요합니다.')
      await store.toggleFavorite(user.uid, kind, id)
      const refreshed = await store.getUserProfile(user.uid)
      setUser(refreshed)
    },
    [user],
  )

  const isFavorite = useCallback(
    (kind: 'problem' | 'template', id: string) => {
      if (!user) return false
      return kind === 'problem'
        ? user.favoritesProblems.includes(id)
        : user.favoritesTemplates.includes(id)
    },
    [user],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      mode,
      user,
      loading,
      signIn,
      signInWithGoogle,
      signUp,
      signOutUser,
      toggleFavorite,
      isFavorite,
    }),
    [mode, user, loading, signIn, signInWithGoogle, signUp, signOutUser, toggleFavorite, isFavorite],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.')
  return ctx
}
