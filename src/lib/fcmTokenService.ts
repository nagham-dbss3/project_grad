import { ApiError, deleteFcmTokenRequest, registerFcmTokenRequest } from '@/lib/api'
import { getFcmToken } from '@/lib/fcm'

const FCM_DEVICE_TOKEN_KEY = 'basma_fcm_device_token'

export type FcmSyncResult = {
  fcmToken: string | null
  /** true when Backend accepted the token */
  registered: boolean
}

function saveFcmDeviceToken(token: string): void {
  localStorage.setItem(FCM_DEVICE_TOKEN_KEY, token)
}

function loadFcmDeviceToken(): string | null {
  return localStorage.getItem(FCM_DEVICE_TOKEN_KEY)
}

function clearFcmDeviceToken(): void {
  localStorage.removeItem(FCM_DEVICE_TOKEN_KEY)
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

  saveFcmDeviceToken(fcmToken)

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

/**
 * Unregister this browser's FCM token on logout / unsubscribe.
 * Backend: DELETE /device-tokens `{ token }`.
 */
export async function unregisterFcmTokenFromBackend(authToken: string): Promise<void> {
  const fcmToken = loadFcmDeviceToken() ?? (await getFcmToken())
  if (!fcmToken) {
    clearFcmDeviceToken()
    return
  }
  try {
    const res = await deleteFcmTokenRequest(authToken, fcmToken)
    console.log('[FCM] حُذف توكن الجهاز من /device-tokens:', res)
  } catch (err) {
    console.warn('[FCM] فشل DELETE /device-tokens:', err)
  } finally {
    clearFcmDeviceToken()
  }
}
