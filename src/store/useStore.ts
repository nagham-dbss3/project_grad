import { create } from 'zustand'
import {
  appointments as seedAppointments,
  checkIns as seedCheckIns,
  currentStaff,
  notifications as seedNotifications,
  patients as seedPatients,
  tokens as seedTokens,
} from '@/mock/data'
import type {
  Appointment,
  AppNotification,
  CheckIn,
  Department,
  Patient,
  ReceptionStaff,
  Token,
} from '@/mock/types'
import { genId, NOW } from '@/lib/utils'

export interface ToastMessage {
  id: string
  title: string
  description?: string
  variant: 'success' | 'error' | 'info' | 'warning'
}

interface IssueTokenInput {
  patientFileNo: string
  department: Department
  visitReason: string
  method: 'scan' | 'manual'
  isEmergency?: boolean
  emergencyReason?: string
  pendingData?: boolean
}

interface StoreState {
  staff: ReceptionStaff | null
  patients: Patient[]
  checkIns: CheckIn[]
  tokens: Token[]
  appointments: Appointment[]
  notifications: AppNotification[]
  toasts: ToastMessage[]

  // auth
  login: (staff: ReceptionStaff) => void
  logout: () => void

  // patients
  addPatient: (p: Patient) => void
  getPatient: (fileNo: string) => Patient | undefined

  // check-in / tokens
  issueToken: (input: IssueTokenInput) => Token
  callToken: (tokenId: string) => void
  setTokenStatus: (tokenId: string, status: Token['status']) => void

  // appointments
  addAppointment: (a: Appointment) => void
  cancelAppointment: (id: string) => void

  // notifications
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  pushNotification: (n: Omit<AppNotification, 'id' | 'isRead' | 'userId'>) => void

  // toasts
  pushToast: (t: Omit<ToastMessage, 'id'>) => void
  dismissToast: (id: string) => void
}

const deptPrefix: Record<Department, string> = { clinic: 'C', dayCare: 'D', inpatient: 'I' }

export const useStore = create<StoreState>((set, get) => ({
  staff: null,
  patients: seedPatients,
  checkIns: seedCheckIns,
  tokens: seedTokens,
  appointments: seedAppointments,
  notifications: seedNotifications,
  toasts: [],

  login: (staff) => set({ staff }),
  logout: () => set({ staff: null }),

  addPatient: (p) => set((s) => ({ patients: [p, ...s.patients] })),
  getPatient: (fileNo) => get().patients.find((p) => p.fileNoBasma === fileNo),

  issueToken: (input) => {
    const state = get()
    const deptTokens = state.tokens.filter((t) => t.department === input.department)
    const nextNum = deptTokens.length + 1
    const number = input.isEmergency
      ? `${deptPrefix[input.department]}-E${deptTokens.filter((t) => t.isEmergency).length + 1}`
      : `${deptPrefix[input.department]}-${String(nextNum + 11).padStart(2, '0')}`
    const issueTime = NOW.toISOString()

    const checkIn: CheckIn = {
      id: genId('ci'),
      patientFileNo: input.patientFileNo,
      arrivalTime: issueTime,
      department: input.department,
      visitReason: input.visitReason,
      method: input.method,
      isEmergency: Boolean(input.isEmergency),
      emergencyReason: input.emergencyReason,
      receptionStaffId: state.staff?.id ?? currentStaff.id,
    }
    const token: Token = {
      id: genId('tk'),
      number,
      patientFileNo: input.patientFileNo,
      department: input.department,
      issueTime,
      status: 'waiting',
      isEmergency: Boolean(input.isEmergency),
      visibleToGuardian: true,
      pendingData: input.pendingData,
    }
    set((s) => ({ checkIns: [...s.checkIns, checkIn], tokens: [...s.tokens, token] }))
    return token
  },

  callToken: (tokenId) =>
    set((s) => ({
      tokens: s.tokens.map((t) => (t.id === tokenId ? { ...t, status: 'called' } : t)),
    })),

  setTokenStatus: (tokenId, status) =>
    set((s) => ({
      tokens: s.tokens.map((t) => (t.id === tokenId ? { ...t, status } : t)),
    })),

  addAppointment: (a) => set((s) => ({ appointments: [...s.appointments, a] })),
  cancelAppointment: (id) =>
    set((s) => ({
      appointments: s.appointments.map((a) => (a.id === id ? { ...a, status: 'cancelled' } : a)),
    })),

  markNotificationRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    })),
  markAllNotificationsRead: () =>
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, isRead: true })) })),
  pushNotification: (n) =>
    set((s) => ({
      notifications: [
        { ...n, id: genId('nt'), isRead: false, userId: get().staff?.id ?? currentStaff.id },
        ...s.notifications,
      ],
    })),

  pushToast: (t) => {
    const id = genId('toast')
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }))
    setTimeout(() => get().dismissToast(id), 4500)
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
