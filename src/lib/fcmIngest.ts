import type { MessagePayload } from '@/lib/fcm'
import type { AppNotification, NotificationType } from '@/mock/types'
import type { FcmMessageData } from '@/lib/fcmNavigation'

export type FcmInbound = {
  notification?: { title?: string; body?: string }
  data?: Record<string, string>
}

function asData(raw?: Record<string, string>): FcmMessageData {
  return (raw ?? {}) as FcmMessageData
}

function notificationTypeFromData(data: FcmMessageData): NotificationType {
  const raw = (data.notification_type ?? data.type ?? '').toLowerCase()
  if (raw === 'alert' || raw === 'emergency') return 'alert'
  if (raw === 'reminder' || raw === 'appointment') return 'reminder'
  return 'info'
}

export function fcmTitle(payload: FcmInbound): string {
  const data = asData(payload.data)
  return (
    payload.notification?.title?.trim()
    || data.title?.trim()
    || data.notification_title?.trim()
    || ''
  )
}

export function fcmBody(payload: FcmInbound): string {
  const data = asData(payload.data)
  return (
    payload.notification?.body?.trim()
    || data.body?.trim()
    || data.message?.trim()
    || ''
  )
}

export function logFcmArrival(source: 'foreground' | 'background', payload: FcmInbound | MessagePayload): void {
  const title = fcmTitle(payload)
  const body = fcmBody(payload)
  console.log(
    `%c[FCM] إشعار Firebase وصل (${source})`,
    'background:#1d4ed8;color:#fff;padding:2px 8px;border-radius:4px',
    {
      title: title || '(بدون عنوان)',
      body: body || '(بدون نص)',
      data: payload.data ?? {},
      payload,
    },
  )
}

export function fcmToPushFields(
  payload: FcmInbound | MessagePayload,
): Omit<AppNotification, 'isRead' | 'userId'> & { id?: string } {
  const data = asData(payload.data)
  const title = fcmTitle(payload)
  const body = fcmBody(payload)
  const message = [title, body].filter(Boolean).join(' — ') || 'إشعار جديد'
  const fileNo = data.related_patient_file_no ?? data.fileNo ?? data.file_no
  const requestId = data.related_request_id ?? data.request_id
  const rawId = data.notification_id ?? data.notificationId ?? data.id

  return {
    id: rawId,
    type: notificationTypeFromData(data),
    kind: data.kind,
    message,
    relatedPatientFileNo: fileNo || undefined,
    relatedRequestId: requestId || undefined,
    timestamp: new Date().toISOString(),
  }
}
