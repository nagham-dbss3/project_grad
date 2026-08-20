import type { CheckIn, Department, Token } from '@/mock/types'
import type { QueueRow } from '@/lib/selectors'

function isToday(iso: string): boolean {
  return new Date(iso).toDateString() === new Date().toDateString()
}

/** Latest token + check-in for a patient today (store + queue rows). */
export function patientTodayVisit(
  fileNo: string,
  tokens: Token[],
  checkIns: CheckIn[],
  queues: Record<Department, QueueRow[]>,
): { todayToken?: Token; todayCheckIn?: CheckIn } {
  const queueRows = Object.values(queues ?? {}).flat().filter((r) => r?.token?.patientFileNo === fileNo)

  const tokenMap = new Map<string, Token>()
  for (const t of (tokens ?? []).filter((t) => t?.patientFileNo === fileNo)) tokenMap.set(t.id, t)
  for (const r of queueRows) tokenMap.set(r.token.id, r.token)

  const todayToken = Array.from(tokenMap.values())
    .filter((t) => isToday(t.issueTime) && t.status !== 'cancelled')
    .sort((a, b) => new Date(b.issueTime).getTime() - new Date(a.issueTime).getTime())[0]

  const checkInMap = new Map<string, CheckIn>()
  for (const c of (checkIns ?? []).filter((c) => c?.patientFileNo === fileNo)) checkInMap.set(c.id, c)
  for (const r of queueRows) {
    if (r.checkIn) checkInMap.set(r.checkIn.id, r.checkIn)
  }

  let todayCheckIn = Array.from(checkInMap.values())
    .filter((c) => isToday(c.arrivalTime))
    .sort((a, b) => new Date(b.arrivalTime).getTime() - new Date(a.arrivalTime).getTime())[0]

  if (!todayCheckIn && todayToken) {
    todayCheckIn = {
      id: `derived-${todayToken.id}`,
      patientFileNo: fileNo,
      arrivalTime: todayToken.issueTime,
      department: todayToken.department,
      visitReason: '',
      method: 'manual',
      isEmergency: todayToken.isEmergency,
      receptionStaffId: '',
    }
  }

  return { todayToken, todayCheckIn }
}

/** Patient has an open visit today (waiting or called — not yet served). */
export function hasActiveCheckInToday(
  fileNo: string,
  tokens: Token[],
  checkIns: CheckIn[],
  queues: Record<Department, QueueRow[]>,
): boolean {
  const inQueue = Object.values(queues ?? {}).flat().some(
    (r) =>
      r?.token?.patientFileNo === fileNo
      && (r.token.status === 'waiting' || r.token.status === 'called'),
  )
  if (inQueue) return true
  const { todayToken } = patientTodayVisit(fileNo, tokens, checkIns, queues)
  return Boolean(todayToken && todayToken.status !== 'served' && todayToken.status !== 'cancelled')
}
