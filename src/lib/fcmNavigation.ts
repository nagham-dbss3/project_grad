/** Payload `data` fields expected from the Backend with FCM messages. */
export interface FcmMessageData {
  type?: string
  route?: string
  fileNo?: string
  file_no?: string
  [key: string]: string | undefined
}

/**
 * Resolves an in-app path from FCM `data`.
 * Prefers explicit `route` from Backend; falls back to `type`.
 */
export function resolveFcmRoute(data?: FcmMessageData | Record<string, string>): string | null {
  if (!data) return null

  const rawRoute = data.route?.trim()
  if (rawRoute) {
    return rawRoute.startsWith('/') ? rawRoute : `/${rawRoute}`
  }

  const fileNo = data.fileNo ?? data.file_no
  const type = data.type?.trim().toLowerCase()

  switch (type) {
    case 'appointment':
    case 'appointments':
      return '/appointments'
    case 'queue':
    case 'token':
      return '/queue'
    case 'consult':
    case 'consultation':
    case 'consult_request':
      return '/patients?filter=consult'
    case 'patient':
      return fileNo ? `/patients/${fileNo}` : '/patients'
    case 'check_in':
    case 'checkin':
      return '/check-in'
    case 'emergency':
      return '/emergency'
    case 'notification':
    case 'notifications':
      return '/notifications'
    default:
      return null
  }
}
