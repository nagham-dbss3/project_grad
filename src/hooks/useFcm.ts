import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { syncFcmTokenWithBackend } from '@/lib/fcmTokenService'
import { subscribeToForegroundMessages, type MessagePayload } from '@/lib/fcm'
import { resolveFcmRoute, type FcmMessageData } from '@/lib/fcmNavigation'
import { ar } from '@/i18n/ar'

function payloadData(payload: MessagePayload): FcmMessageData {
  return (payload.data ?? {}) as FcmMessageData
}

/**
 * After authentication: sync FCM token with Backend, listen for foreground messages,
 * and handle navigation when the user opens a notification (SW postMessage / toast click).
 */
export function useFcm(): void {
  const authToken = useStore((s) => s.token)
  const pushToast = useStore((s) => s.pushToast)
  const navigate = useNavigate()
  const syncedForToken = useRef<string | null>(null)

  useEffect(() => {
    if (!authToken) {
      syncedForToken.current = null
      return
    }

    let cancelled = false
    let unsubscribe: (() => void) | null = null

    const run = async () => {
      if (syncedForToken.current !== authToken) {
        try {
          const { fcmToken } = await syncFcmTokenWithBackend(authToken)
          // Mark attempted even if Backend is not ready yet (404), so we don't spam retries.
          if (!cancelled && fcmToken) syncedForToken.current = authToken
        } catch (err) {
          console.warn('[FCM] Token sync with backend failed', err)
        }
      }

      if (cancelled) return

      unsubscribe = await subscribeToForegroundMessages((payload) => {
        const data = payloadData(payload)
        const title = payload.notification?.title?.trim() || ar.notif.pushTitle
        const description = payload.notification?.body?.trim() || undefined
        const route = resolveFcmRoute(data) ?? undefined

        pushToast({
          variant: 'info',
          title,
          description,
          route,
        })
      })
    }

    void run()

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [authToken, pushToast])

  // Background / SW: navigate when user clicks a system notification
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; route?: string } | null
      if (!data || data.type !== 'FCM_NAVIGATE' || !data.route) return
      navigate(data.route)
    }

    navigator.serviceWorker.addEventListener('message', onMessage)
    return () => navigator.serviceWorker.removeEventListener('message', onMessage)
  }, [navigate])
}
