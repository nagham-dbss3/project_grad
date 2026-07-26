import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getMessaging, isSupported, type Messaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId)
}

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null
  return getApps().length > 0 ? getApps()[0]! : initializeApp(firebaseConfig)
}

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  const app = getFirebaseApp()
  if (!app) return null
  if (!(await isSupported())) return null
  return getMessaging(app)
}

export { firebaseConfig }
