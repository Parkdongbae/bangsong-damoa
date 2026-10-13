import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { initializeFirestore, type Firestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
}

/** .env에 Firebase 설정이 채워져 있으면 true. 아니면 로컬 데모 모드로 동작. */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
)

let app: FirebaseApp | null = null
let authInstance: Auth | null = null
let dbInstance: Firestore | null = null
let storageInstance: FirebaseStorage | null = null

export function getFirebase(): { app: FirebaseApp; auth: Auth; db: Firestore; storage: FirebaseStorage } {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase 설정이 없습니다. .env 파일에 VITE_FIREBASE_* 값을 채워주세요.')
  }
  if (!app) {
    app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig)
    // 문서 필드의 undefined 값을 허용(자동 삭제)하여 이중 모드에서 직렬화 문제를 피함.
    dbInstance = initializeFirestore(app, { ignoreUndefinedProperties: true })
    authInstance = getAuth(app)
    storageInstance = getStorage(app)
  }
  return { app, auth: authInstance!, db: dbInstance!, storage: storageInstance! }
}
