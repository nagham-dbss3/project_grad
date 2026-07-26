import { getToken, onMessage, type MessagePayload, type Unsubscribe } from 'firebase/messaging'
import { getFirebaseMessaging, isFirebaseConfigured } from '@/lib/firebase'

const SW_PATH = '/firebase-messaging-sw.js'

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
  if (!isFirebaseConfigured()) return null
  if (typeof window === 'undefined' || !('Notification' in window)) return null

  const messaging = await getFirebaseMessaging()
  if (!messaging) return null

  const permission =
    Notification.permission === 'granted'
      ? 'granted'
      : Notification.permission === 'denied'
        ? 'denied'
        : await Notification.requestPermission()

  if (permission !== 'granted') return null

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY?.trim()
  if (!vapidKey) {
    console.warn('[FCM] VITE_FIREBASE_VAPID_KEY is missing')
    return null
  }

  // Explicit register + wait for active SW, then pass registration into getToken.
  const serviceWorkerRegistration = await registerMessagingServiceWorker()
  if (!serviceWorkerRegistration) return null

  try {
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration,
    })
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
