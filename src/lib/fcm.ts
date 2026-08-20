import { getToken, onMessage, type MessagePayload, type Unsubscribe } from 'firebase/messaging'
import { getFirebaseMessaging, isFirebaseConfigured } from '@/lib/firebase'

const SW_PATH = '/firebase-messaging-sw.js'

/** Explicit VAPID key for web push (getToken). Env override allowed when set. */
const DEFAULT_VAPID_KEY =
  'BA-lcEPw9AuKHBo5BcTerHLFvMpLeVCIUofEQ0rOg57ND8w2AJK2i1oBwdAMJbyWZ9fyqi0Je5zO_KZNi78A0IQ'

function waitForWorkerActivation(worker: ServiceWorker): Promise<void> {
  if (worker.state === 'activated') return Promise.resolve()

  return new Promise((resolve, reject) => {
    const onStateChange = () => {
      if (worker.state === 'activated') {
        worker.removeEventListener('statechange', onStateChange)
        resolve()
      } else if (worker.state === 'redundant') {
        worker.removeEventListener('statechange', onStateChange)
        reject(new Error('Service worker became redundant before activation'))
      }
    }
    worker.addEventListener('statechange', onStateChange)
  })
}

/**
 * Registers `/firebase-messaging-sw.js` and waits until an active worker is available.
 * PushManager.subscribe requires an active Service Worker (not merely registered).
 */
export async function registerMessagingServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null

  try {
    const registration = await navigator.serviceWorker.register(SW_PATH, {
      scope: '/',
    })

    const pending = registration.installing ?? registration.waiting
    if (pending) {
      await waitForWorkerActivation(pending)
    }

    // Resolves once there is an active worker for this origin/scope.
    const readyRegistration = await navigator.serviceWorker.ready

    if (!readyRegistration.active) {
      console.warn('[FCM] Service worker registered but not active yet')
      return null
    }

    return readyRegistration
  } catch (err) {
    console.warn('[FCM] Service worker registration failed', err)
    return null
  }
}

/**
 * Requests notification permission (if needed) and returns the FCM device token.
 * Returns null when Firebase is not configured, unsupported, or permission denied.
 */
export async function getFcmToken(): Promise<string | null> {
  if (!isFirebaseConfigured()) {
    console.warn('[FCM] Firebase غير مُعدّ — تأكد من متغيرات VITE_FIREBASE_*')
    return null
  }
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('[FCM] المتصفح لا يدعم Notification API')
    return null
  }

  const messaging = await getFirebaseMessaging()
  if (!messaging) {
    console.warn('[FCM] تعذّر تهيئة Firebase Messaging')
    return null
  }

  console.log('[FCM] إذن الإشعارات الحالي:', Notification.permission)

  const permission =
    Notification.permission === 'granted'
      ? 'granted'
      : Notification.permission === 'denied'
        ? 'denied'
        : await Notification.requestPermission()

  console.log('[FCM] إذن الإشعارات بعد الطلب:', permission)

  if (permission !== 'granted') {
    console.warn('[FCM] الإذن مرفوض — لن يتم توليد توكن الجهاز')
    return null
  }

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY?.trim() || DEFAULT_VAPID_KEY
  if (!vapidKey) {
    console.warn('[FCM] VAPID key is missing')
    return null
  }

  console.log(
    '[FCM] استخدام VAPID key:',
    import.meta.env.VITE_FIREBASE_VAPID_KEY?.trim() ? 'من .env' : 'المفتاح الافتراضي في الكود',
    `(${vapidKey.slice(0, 12)}…)`,
  )

  // Explicit register + wait for active SW, then pass registration into getToken.
  const serviceWorkerRegistration = await registerMessagingServiceWorker()
  if (!serviceWorkerRegistration) {
    console.warn('[FCM] فشل تسجيل Service Worker')
    return null
  }
  console.log('[FCM] Service Worker جاهز')

  try {
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration,
    })
    if (token) {
      console.log('[FCM] تم توليد Device Token:', token)
    } else {
      console.warn('[FCM] getToken أعاد قيمة فارغة')
    }
    return token || null
  } catch (err) {
    console.warn('[FCM] getToken failed', err)
    return null
  }
}

/** Subscribe to foreground FCM messages (app is open / focused). */
export async function subscribeToForegroundMessages(
  handler: (payload: MessagePayload) => void,
): Promise<Unsubscribe | null> {
  const messaging = await getFirebaseMessaging()
  if (!messaging) return null
  return onMessage(messaging, handler)
}

export type { MessagePayload }
