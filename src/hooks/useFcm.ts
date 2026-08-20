import { useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { syncFcmTokenWithBackend } from '@/lib/fcmTokenService'
import { subscribeToForegroundMessages, type MessagePayload } from '@/lib/fcm'
import { fcmBody, fcmTitle, fcmToPushFields, logFcmArrival, type FcmInbound } from '@/lib/fcmIngest'

/**
 * After authentication: sync FCM token with Backend, listen for foreground messages,
 * and handle navigation when the user opens a notification (SW postMessage / toast click).
 */
export function useFcm(): void {
  const authToken = useStore((s) => s.token)
  const fetchNotifications = useStore((s) => s.fetchNotifications)
  const pushNotification = useStore((s) => s.pushNotification)
  const navigate = useNavigate()
  const syncedForToken = useRef<string | null>(null)
  const lastFcmKey = useRef('')
  const lastFcmAt = useRef(0)

  const applyIncomingFcm = useCallback((source: 'foreground' | 'background', payload: MessagePayload | FcmInbound) => {
    logFcmArrival(source, payload)
    const title = fcmTitle(payload)
    const description = fcmBody(payload)
    const dedupeKey = `${title}|${description ?? ''}`
    const now = Date.now()
    if (dedupeKey === lastFcmKey.current && now - lastFcmAt.current < 2500) {
      console.log('[FCM] تجاهل تكرار نفس الإشعار')
      return
    }
    lastFcmKey.current = dedupeKey
    lastFcmAt.current = now
    pushNotification(fcmToPushFields(payload))
    window.setTimeout(() => {
      void fetchNotifications()
    }, 800)
  }, [fetchNotifications, pushNotification])

  useEffect(() => {
    if (!authToken) {
      syncedForToken.current = null
      return
    }

    let cancelled = false
    let unsubscribe: (() => void) | null = null

    const run = async () => {
      // After login: request browser permission + register device token on POST /device-tokens
      if (syncedForToken.current !== authToken) {
        try {
          console.log('[FCM] useFcm: تسجيل دخول مكتمل — بدء مزامنة التوكن')
          const { fcmToken, registered } = await syncFcmTokenWithBackend(authToken)
          console.log('[FCM] useFcm: نتيجة المزامنة', { hasToken: Boolean(fcmToken), registered })
          if (!cancelled && fcmToken) syncedForToken.current = authToken
        } catch (err) {
          console.warn('[FCM] Token sync with backend failed', err)
        }
      }

      if (cancelled) return

      unsubscribe = await subscribeToForegroundMessages((payload) => {
        applyIncomingFcm('foreground', payload)
      })
    }

    void run()

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [authToken, applyIncomingFcm])

  // Background / SW: ingest push + navigate when user clicks a system notification
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const onMessage = (event: MessageEvent) => {
      const data = event.data as {
        type?: string
        route?: string
        payload?: FcmInbound
      } | null
      if (!data?.type) return
      if (data.type === 'FCM_RECEIVED' && data.payload) {
        applyIncomingFcm('background', data.payload)
        return
      }
      if (data.type === 'FCM_NAVIGATE' && data.route) {
        navigate(data.route)
      }
    }

    navigator.serviceWorker.addEventListener('message', onMessage)
    return () => navigator.serviceWorker.removeEventListener('message', onMessage)
  }, [navigate, applyIncomingFcm])
}
