import type { CheckIn, Department, Patient, Token } from '@/mock/types'

export interface QueueRow {
  token: Token
  patient?: Patient
  checkIn?: CheckIn
}

const departments: Department[] = ['clinic', 'dayCare', 'inpatient']

/** Build an ordered queue per department: emergencies pinned on top, then by issue time. */
export function buildQueues(
  tokens: Token[],
  patients: Patient[],
  checkIns: CheckIn[],
): Record<Department, QueueRow[]> {
  const byFile = new Map(patients.map((p) => [p.fileNoBasma, p]))
  const checkInByFile = new Map(checkIns.map((c) => [c.patientFileNo, c]))

  const result = {
    clinic: [] as QueueRow[],
    dayCare: [] as QueueRow[],
    inpatient: [] as QueueRow[],
  }

  for (const dept of departments) {
    const rows = tokens
      .filter((t) => t.department === dept && t.status !== 'served' && t.status !== 'cancelled')
      .map<QueueRow>((token) => ({
        token,
        patient: byFile.get(token.patientFileNo),
        checkIn: checkInByFile.get(token.patientFileNo),
      }))
      .sort((a, b) => {
        if (a.token.isEmergency !== b.token.isEmergency) return a.token.isEmergency ? -1 : 1
        return new Date(a.token.issueTime).getTime() - new Date(b.token.issueTime).getTime()
      })
    result[dept] = rows
  }
  return result
}

export interface DashboardStats {
  arrived: number
  waiting: number
  served: number
  newToRegister: number
  todaysAppointments: number
  activeEmergencies: number
  consultsToCoordinate: number
}

export function dashboardStats(
  tokens: Token[],
  patients: Patient[],
  todaysAppointmentCount: number,
): DashboardStats {
  const active = tokens.filter((t) => t.status !== 'served' && t.status !== 'cancelled')
  const waitingTokens = active.filter((t) => t.status === 'waiting')
  const activePatientFiles = new Set(active.map((t) => t.patientFileNo))
  return {
    arrived: tokens.length,
    waiting: waitingTokens.length,
    served: tokens.filter((t) => t.status === 'served').length,
    newToRegister: patients.filter((p) => p.unregistered).length,
    todaysAppointments: todaysAppointmentCount,
    activeEmergencies: active.filter((t) => t.isEmergency).length,
    // patients currently in a queue who have an unmet consult need to coordinate
    consultsToCoordinate: patients.filter(
      (p) => activePatientFiles.has(p.fileNoBasma) && p.consultationNeeds.length > 0,
    ).length,
  }
}
