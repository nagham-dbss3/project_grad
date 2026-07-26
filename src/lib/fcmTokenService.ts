import { ApiError, registerFcmTokenRequest } from '@/lib/api'
import { getFcmToken } from '@/lib/fcm'

export type FcmSyncResult = {
  fcmToken: string | null
  /** true when Backend accepted the token; false when endpoint is missing/unavailable */
  registered: boolean
}

/**
 * Independent service: obtain an FCM token after login and register it with the Backend.
 * Backend endpoint: POST /fcm-tokens (to be implemented server-side).
 *
 * A 404 from the API is treated as "endpoint not ready yet" — the local FCM token is still valid.
 */
export async function syncFcmTokenWithBackend(authToken: string): Promise<FcmSyncResult> {
  const fcmToken = await getFcmToken()
  if (!fcmToken) return { fcmToken: null, registered: false }

  if (import.meta.env.DEV) {
    console.info('[FCM] Device token ready:', fcmToken)
  }

  try {
    await registerFcmTokenRequest(authToken, fcmToken)
    return { fcmToken, registered: true }
  } catch (err) {
    // Backend route not implemented yet — expected until server ships POST /fcm-tokens
    if (err instanceof ApiError && err.status === 404) {
      if (import.meta.env.DEV) {
        console.info(
          '[FCM] Backend POST /fcm-tokens is not available yet (404). Token was generated locally and will sync when the API is ready.',
        )
      }
      return { fcmToken, registered: false }
    }
    throw err
  }
}
