import { ApiError, registerFcmTokenRequest } from '@/lib/api'
import { getFcmToken } from '@/lib/fcm'

export type FcmSyncResult = {
  fcmToken: string | null
  /** true when Backend accepted the token */
  registered: boolean
}

/**
 * Obtain an FCM token after login (browser permission) and register it with the Backend.
 * Backend endpoint: POST /device-tokens `{ token, platform: "web" }`.
 */
export async function syncFcmTokenWithBackend(authToken: string): Promise<FcmSyncResult> {
  console.log('[FCM] بدء مزامنة توكن الجهاز مع الخادم (POST /device-tokens)…')
  const fcmToken = await getFcmToken()
  if (!fcmToken) {
    console.warn('[FCM] لا يوجد توكن جهاز — تخطّي التسجيل في الـ API')
    return { fcmToken: null, registered: false }
  }

  try {
    const res = await registerFcmTokenRequest(authToken, fcmToken)
    console.log('[FCM] نجح تسجيل التوكن في /device-tokens:', res)
    return { fcmToken, registered: Boolean(res?.registered ?? true) }
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      console.warn(
        '[FCM] POST /device-tokens أعاد 404 — التوكن محلي فقط:',
        fcmToken,
      )
      return { fcmToken, registered: false }
    }
    console.error('[FCM] فشل POST /device-tokens:', err)
    throw err
  }
}
