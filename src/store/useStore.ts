import { create } from 'zustand'
import type {
  Appointment,
  AppNotification,
  CheckIn,
  ConsultRequest,
  Department,
  Patient,
  ReceptionStaff,
  Token,
} from '@/mock/types'
import { genId } from '@/lib/utils'
import { clearAuthSession, saveAuthSession } from '@/lib/authStorage'
import { emptyQueues, enrichAllQueues, filterActiveQueues, mergePatients } from '@/lib/selectors'
import { hasActiveCheckInToday } from '@/lib/patientVisit'
import { apiDepartmentCode } from '@/lib/masterData'
import { ar } from '@/i18n/ar'
import type { QueueRow } from '@/lib/selectors'
import {
  apiToPatient,
  ApiError,
  fetchPatientsRequest,
  fetchPatientRequest,
  updatePatientRequest,
  fetchDepartmentsRequest,
  fetchReferralOptionsRequest,
  fetchDoctorsRequest,
  fetchQueuesRequest,
  fetchDisplayQueuesRequest,
  callTokenRequest,
  updateTokenStatusRequest,
  cancelTokenRequest,
  createCheckInRequest,
  mapCheckInResponse,
  mapCheckInFieldErrors,
  fetchPatientCheckInsRequest,
  fetchCheckInsRequest,
  fetchAppointmentsRequest,
  fetchNotificationsRequest,
  markNotificationReadRequest,
  markAllNotificationsReadRequest,
  cancelAppointmentRequest,
  confirmAppointmentRequest,
  completeAppointmentRequest,
  createAppointmentRequest,
  uniqueLatestCheckInsByPatient,
  resolveNotificationApiId,
  apiToAppointment,
  fetchPendingConsultRequests as fetchPendingConsultRequestsRequest,
  createConsultRequestRequest,
  apiToConsultRequest,
  coordinateConsultRequestRequest,
  type CheckInInput,
  type CreateAppointmentInput,
  type CreateConsultRequestInput,
  type ApiPatient,
  type ApiUser,
  type MasterDepartment,
  type MasterDoctor,
  type MasterReferralOption,
  type PatientPayload,
} from '@/lib/api'

export interface ToastMessage {
  id: string
  title: string
  description?: string
  variant: 'success' | 'error' | 'info' | 'warning'
  /** Optional in-app path (e.g. from FCM `data.route`) — toast becomes clickable. */
  route?: string
}

export type CheckInResult =
  | { ok: true; token: Token; checkIn: CheckIn; patient: Patient }
  | { ok: false; message: string; fieldErrors?: Record<string, string> }

interface StoreState {
  staff: ReceptionStaff | null
  token: string | null
  user: ApiUser | null
  permissions: string[]
  patients: Patient[]
  selectedPatient: Patient | null
  selectedPatientRaw: ApiPatient | null
  patientsLoading: boolean
  patientsError: boolean
  patientLoading: boolean
  departments: MasterDepartment[]
  doctors: MasterDoctor[]
  referralOptions: MasterReferralOption[]
  masterDataLoading: boolean
  masterDataError: boolean
  queues: Record<Department, QueueRow[]>
  displayQueues: Record<Department, QueueRow[]>
  queuesLoading: boolean
  queuesError: boolean
  displayQueuesLoading: boolean
  displayQueuesError: boolean
  checkIns: CheckIn[]
  /** Paginated GET `/check-ins` */
  checkInList: CheckIn[]
  checkInListPage: number
  checkInListLastPage: number
  checkInListTotal: number
  checkInListLoading: boolean
  checkInListError: boolean
  /** Per-patient visit history from GET /patients/{fileNo}/check-ins */
  patientCheckIns: CheckIn[]
  patientCheckInsLoading: boolean
  patientCheckInsError: boolean
  tokens: Token[]
  appointments: Appointment[]
  appointmentsLoading: boolean
  appointmentsError: boolean
  consultRequests: ConsultRequest[]
  consultRequestsTotal: number
  consultRequestsLoading: boolean
  consultRequestsError: boolean
  notifications: AppNotification[]
  notificationsLoading: boolean
  notificationsError: boolean
  unreadCount: number
  toasts: ToastMessage[]

  // auth
  login: (staff: ReceptionStaff) => void
  setSession: (payload: { token: string; user: ApiUser }) => void
  setUser: (user: ApiUser) => void
  logout: () => void

  // patients
  addPatient: (p: Patient) => void
  getPatient: (fileNo: string) => Patient | undefined
  fetchPatients: (perPage?: number) => Promise<void>
  fetchPatientDetails: (fileNo: string) => Promise<void>
  updatePatient: (fileNo: string, patch: Partial<PatientPayload>) => Promise<void>
  fetchDepartments: () => Promise<void>
  fetchDoctors: (department?: Department) => Promise<void>
  fetchReferralOptions: () => Promise<void>
  fetchMasterData: () => Promise<void>
  fetchQueues: () => Promise<void>
  fetchDisplayQueues: () => Promise<void>
  fetchPatientCheckIns: (fileNo: string, perPage?: number) => Promise<CheckIn[]>
  fetchCheckIns: (page?: number, perPage?: number) => Promise<CheckIn[]>

  // check-in / tokens
  issueToken: (input: CheckInInput) => Promise<CheckInResult>
  callToken: (tokenId: string) => Promise<boolean>
  setTokenStatus: (tokenId: string, status: Token['status']) => Promise<boolean>
  /** PATCH `/tokens/{id}/status` with cancelled — updates live queues on success. */
  cancelQueueToken: (tokenId: string) => Promise<boolean>

  // appointments
  fetchAppointments: (date: string) => Promise<Appointment[]>
  createAppointment: (input: CreateAppointmentInput) => Promise<Appointment | null>
  cancelAppointment: (id: string) => Promise<Appointment | null>
  confirmAppointment: (id: string) => Promise<Appointment | null>
  completeAppointment: (id: string) => Promise<Appointment | null>

  // consult requests
  fetchPendingConsultRequests: () => Promise<ConsultRequest[]>
  createConsultRequest: (input: CreateConsultRequestInput) => Promise<ConsultRequest | null>
  coordinateConsultRequest: (id: string) => Promise<ConsultRequest | null>

  // notifications
  fetchNotifications: (perPage?: number) => Promise<AppNotification[]>
  markNotificationRead: (id: string) => Promise<void>
  markAllNotificationsRead: () => Promise<void>
  pushNotification: (n: Omit<AppNotification, 'id' | 'isRead' | 'userId'> & { id?: string }) => void

  // toasts
  pushToast: (t: Omit<ToastMessage, 'id'>) => void
  dismissToast: (id: string) => void
}

const toStaff = (user: ApiUser): ReceptionStaff => ({
  id: String(user.id),
  firstName: user.first_name,
  lastName: user.last_name,
  contactEmail: user.email,
})

const ALL_DEPTS: Department[] = ['clinic', 'dayCare', 'inpatient']

let checkInsInflight: Promise<CheckIn[]> | null = null
let checkInsInflightKey = ''

function checkInActionError(err: ApiError): string {
  if (err.status === 401) return 'انتهت الجلسة. يرجى تسجيل الدخول مجدداً.'
  if (err.status === 403) return 'ليس لديك صلاحية لتنفيذ هذا الإجراء.'
  if (err.status === 422) return err.message || 'يرجى تصحيح الحقول المحددة.'
  if (err.message === 'network') return 'تعذّر الاتصال بالخادم.'
  return err.message
}

function syncQueueData(rows: QueueRow[]) {
  const tokens = rows.map((r) => r.token)
  const checkIns = rows.filter((r) => r.checkIn).map((r) => r.checkIn!)
  return { tokens, checkIns }
}

function patchQueueRowToken(queues: Record<Department, QueueRow[]>, tokenId: string, token: Token) {
  const patch = (rows: QueueRow[]) => rows.map((r) => (r.token.id === tokenId ? { ...r, token } : r))
  return { clinic: patch(queues.clinic), dayCare: patch(queues.dayCare), inpatient: patch(queues.inpatient) }
}

function removeTokenFromQueues(queues: Record<Department, QueueRow[]>, tokenId: string) {
  const drop = (rows: QueueRow[]) => rows.filter((r) => r.token.id !== tokenId)
  return { clinic: drop(queues.clinic), dayCare: drop(queues.dayCare), inpatient: drop(queues.inpatient) }
}

function dropCheckInsForVisit(rows: CheckIn[] | undefined, token: Token): CheckIn[] {
  const fileNo = String(token.patientFileNo ?? '').trim()
  return (rows ?? []).filter((c) => {
    if (!c) return false
    if (String(c.id) === String(token.id)) return false
    if (fileNo && String(c.patientFileNo ?? '').trim() === fileNo) return false
    return true
  })
}

function applyTokenUpdate(tokenId: string, token: Token) {
  if (token.status === 'served' || token.status === 'cancelled') {
    return (s: StoreState) => {
      const checkIns = dropCheckInsForVisit(s.checkIns, token)
      const checkInList = dropCheckInsForVisit(s.checkInList, token)
      return {
        tokens: s.tokens.map((t) => (t.id === tokenId ? token : t)),
        queues: removeTokenFromQueues(s.queues, tokenId),
        displayQueues: removeTokenFromQueues(s.displayQueues, tokenId),
        checkIns,
        checkInList,
        checkInListTotal: checkInList.length,
      }
    }
  }
  return (s: StoreState) => ({
    tokens: s.tokens.map((t) => (t.id === tokenId ? token : t)),
    queues: patchQueueRowToken(s.queues, tokenId, token),
    displayQueues: patchQueueRowToken(s.displayQueues, tokenId, token),
  })
}

function tokenActionError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return 'انتهت الجلسة. يرجى تسجيل الدخول مجدداً.'
    if (err.status === 403) return 'ليس لديك صلاحية لتنفيذ هذا الإجراء.'
    if (err.message === 'network') return 'تعذّر الاتصال بالخادم.'
    return err.message
  }
  return 'تعذّر تنفيذ العملية.'
}

function countUnread(notifications: AppNotification[]): number {
  return notifications.filter((n) => !n.isRead).length
}

export const useStore = create<StoreState>((set, get) => ({
  staff: null,
  token: null,
  user: null,
  permissions: [],
  patients: [],
  selectedPatient: null,
  selectedPatientRaw: null,
  patientsLoading: false,
  patientsError: false,
  patientLoading: false,
  departments: [],
  doctors: [],
  referralOptions: [],
  masterDataLoading: false,
  masterDataError: false,
  queues: emptyQueues(),
  displayQueues: emptyQueues(),
  queuesLoading: false,
  queuesError: false,
  displayQueuesLoading: false,
  displayQueuesError: false,
  checkIns: [],
  checkInList: [],
  checkInListPage: 1,
  checkInListLastPage: 1,
  checkInListTotal: 0,
  checkInListLoading: false,
  checkInListError: false,
  patientCheckIns: [],
  patientCheckInsLoading: false,
  patientCheckInsError: false,
  tokens: [],
  appointments: [],
  appointmentsLoading: false,
  appointmentsError: false,
  consultRequests: [],
  consultRequestsTotal: 0,
  consultRequestsLoading: false,
  consultRequestsError: false,
  notifications: [],
  notificationsLoading: false,
  notificationsError: false,
  unreadCount: 0,
  toasts: [],

  login: (staff) => set({ staff }),
  setSession: ({ token, user }) => {
    saveAuthSession(token, user)
    set({ token, user, permissions: user.permissions ?? [], staff: toStaff(user) })
  },
  setUser: (user) => {
    const authToken = get().token
    if (authToken) saveAuthSession(authToken, user)
    set({ user, permissions: user.permissions ?? [], staff: toStaff(user) })
  },
  logout: () => {
    clearAuthSession()
    set({
      staff: null,
      token: null,
      user: null,
      permissions: [],
      patients: [],
      selectedPatient: null,
      selectedPatientRaw: null,
      patientsLoading: false,
      patientsError: false,
      patientLoading: false,
      departments: [],
      doctors: [],
      referralOptions: [],
      masterDataLoading: false,
      masterDataError: false,
      queues: emptyQueues(),
      displayQueues: emptyQueues(),
      queuesLoading: false,
      queuesError: false,
      displayQueuesLoading: false,
      displayQueuesError: false,
      checkIns: [],
      checkInList: [],
      checkInListPage: 1,
      checkInListLastPage: 1,
      checkInListTotal: 0,
      checkInListLoading: false,
      checkInListError: false,
      patientCheckIns: [],
      patientCheckInsLoading: false,
      patientCheckInsError: false,
      tokens: [],
      appointments: [],
      appointmentsLoading: false,
      appointmentsError: false,
      consultRequests: [],
      consultRequestsTotal: 0,
      consultRequestsLoading: false,
      consultRequestsError: false,
      notifications: [],
      notificationsLoading: false,
      notificationsError: false,
      unreadCount: 0,
      toasts: [],
    })
  },

  addPatient: (p) => set((s) => ({ patients: [p, ...s.patients] })),
  getPatient: (fileNo) => {
    const s = get()
    return (
      s.patients.find((p) => p.fileNoBasma === fileNo)
      ?? (s.selectedPatient?.fileNoBasma === fileNo ? s.selectedPatient : undefined)
    )
  },

  fetchPatients: async (perPage = 15) => {
    const token = get().token
    if (!token) return
    set({ patientsLoading: true, patientsError: false })
    try {
      const res = await fetchPatientsRequest(token, perPage)
      set({ patients: res.data.map(apiToPatient), patientsLoading: false })
    } catch (err) {
      set({ patientsLoading: false, patientsError: true })
      get().pushToast({ variant: 'error', title: 'المرضى', description: err instanceof ApiError ? err.message : 'تعذّر الاتصال بالخادم.' })
    }
  },

  fetchPatientDetails: async (fileNo) => {
    const token = get().token
    if (!token) return
    set({ selectedPatient: null, selectedPatientRaw: null, patientLoading: true })
    try {
      const api = await fetchPatientRequest(token, fileNo)
      const mapped = apiToPatient(api)
      set((s) => ({
        selectedPatient: mapped,
        selectedPatientRaw: api,
        patientLoading: false,
        patients: s.patients.some((p) => p.fileNoBasma === fileNo)
          ? s.patients.map((p) => (p.fileNoBasma === fileNo ? mapped : p))
          : [mapped, ...s.patients],
      }))
    } catch (err) {
      set({ patientLoading: false })
      get().pushToast({ variant: 'error', title: 'المرضى', description: err instanceof ApiError ? err.message : 'تعذّر الاتصال بالخادم.' })
    }
  },

  updatePatient: async (fileNo, patch) => {
    const token = get().token
    if (!token) return
    try {
      const api = await updatePatientRequest(token, fileNo, patch)
      const mapped = apiToPatient(api)
      set((s) => ({
        patients: s.patients.map((p) => (p.fileNoBasma === fileNo ? mapped : p)),
        selectedPatient: s.selectedPatient?.fileNoBasma === fileNo ? mapped : s.selectedPatient,
        selectedPatientRaw: s.selectedPatientRaw?.file_no_basma === fileNo ? api : s.selectedPatientRaw,
      }))
      get().pushToast({ variant: 'success', title: 'تم الحفظ', description: 'تم تحديث بيانات المريض.' })
    } catch (err) {
      get().pushToast({ variant: 'error', title: 'المرضى', description: err instanceof ApiError ? err.message : 'تعذّر الاتصال بالخادم.' })
    }
  },

  fetchDepartments: async () => {
    const token = get().token
    if (!token) return
    try {
      set({ departments: await fetchDepartmentsRequest(token) })
    } catch {
      set({ masterDataError: true })
    }
  },

  fetchDoctors: async (department) => {
    const token = get().token
    if (!token) return
    try {
      set({ doctors: await fetchDoctorsRequest(token, department) })
    } catch (err) {
      get().pushToast({
        variant: 'error',
        title: ar.appt.doctor,
        description: err instanceof ApiError
          ? (err.message === 'network' ? 'تعذّر الاتصال بالخادم.' : err.message)
          : 'تعذّر جلب قائمة الأطباء.',
      })
    }
  },

  fetchReferralOptions: async () => {
    const token = get().token
    if (!token) return
    try {
      set({ referralOptions: await fetchReferralOptionsRequest(token) })
    } catch {
      set({ masterDataError: true })
    }
  },

  fetchMasterData: async () => {
    const token = get().token
    if (!token) return
    set({ masterDataLoading: true, masterDataError: false })
    const [deptRes, refRes] = await Promise.allSettled([
      fetchDepartmentsRequest(token),
      fetchReferralOptionsRequest(token),
    ])
    const patch: Partial<StoreState> = { masterDataLoading: false }
    let anyOk = false
    if (deptRes.status === 'fulfilled') {
      patch.departments = deptRes.value
      anyOk = true
    }
    if (refRes.status === 'fulfilled') {
      patch.referralOptions = refRes.value
      anyOk = true
    }
    patch.masterDataError = !anyOk
    set(patch)
    if (!anyOk) {
      get().pushToast({
        variant: 'error',
        title: 'البيانات المرجعية',
        description: 'تعذّر تحميل الأقسام وخيارات الإحالة.',
      })
    }
  },

  fetchQueues: async () => {
    const token = get().token
    if (!token) return
    set({ queuesLoading: true, queuesError: false })
    try {
      const results = await Promise.all(
        ALL_DEPTS.map((d) => fetchQueuesRequest(token, d, apiDepartmentCode(d, get().departments))),
      )
      const rawQueues = { clinic: results[0], dayCare: results[1], inpatient: results[2] }
      const rows = Object.values(rawQueues).flat()
      const fromRows = rows.map((r) => r.patient).filter((p): p is Patient => Boolean(p))
      const patients = mergePatients(get().patients, fromRows)
      const queues = filterActiveQueues(enrichAllQueues(rawQueues, patients))
      const { tokens, checkIns } = syncQueueData(Object.values(queues).flat())
      set({ queues, tokens, checkIns, patients, queuesLoading: false })
    } catch (err) {
      set({ queuesLoading: false, queuesError: true })
      get().pushToast({ variant: 'error', title: 'الطوابير', description: err instanceof ApiError ? err.message : 'تعذّر الاتصال بالخادم.' })
    }
  },

  fetchDisplayQueues: async () => {
    set({ displayQueuesLoading: true, displayQueuesError: false })
    try {
      const raw = await fetchDisplayQueuesRequest()
      const rows = Object.values(raw).flat()
      const fromRows = rows.map((r) => r.patient).filter((p): p is Patient => Boolean(p))
      const patients = mergePatients(get().patients, fromRows)
      const displayQueues = filterActiveQueues(enrichAllQueues(raw, patients))
      set({ displayQueues, displayQueuesLoading: false })
    } catch {
      set({ displayQueuesLoading: false, displayQueuesError: true })
    }
  },

  issueToken: async (input) => {
    const authToken = get().token
    if (!authToken) return { ok: false, message: 'غير مصرّح.' }
    if (input.patientFileNo) {
      const s = get()
      if (hasActiveCheckInToday(input.patientFileNo, s.tokens, s.checkIns, s.queues)) {
        const message = 'المريض مسجّل وصوله اليوم بالفعل.'
        get().pushToast({ variant: 'warning', title: 'تسجيل الوصول', description: message })
        return { ok: false, message }
      }
    }
    try {
      const api = await createCheckInRequest(authToken, {
        ...input,
        departmentApiCode: apiDepartmentCode(input.department, get().departments),
      })
      const { token, checkIn, patient, row } = mapCheckInResponse(api, input.department)
      set((s) => {
        const dept = token.department
        const hasPatient = s.patients.some((p) => p.fileNoBasma === patient.fileNoBasma)
        const isSelected = s.selectedPatient?.fileNoBasma === patient.fileNoBasma
        const lane = s.queues[dept] ?? []
        const displayLane = s.displayQueues[dept] ?? []
        return {
          patients: hasPatient
            ? s.patients.map((p) => (p.fileNoBasma === patient.fileNoBasma ? patient : p))
            : [patient, ...s.patients],
          tokens: [...s.tokens, token],
          checkIns: uniqueLatestCheckInsByPatient([...(s.checkIns ?? []), checkIn]),
          queues: { ...s.queues, [dept]: [...lane, row] },
          displayQueues: { ...s.displayQueues, [dept]: [...displayLane, row] },
          selectedPatient: isSelected ? patient : s.selectedPatient,
          selectedPatientRaw: isSelected ? api.patient : s.selectedPatientRaw,
        }
      })
      void get().fetchQueues()
      void get().fetchDisplayQueues()
      void get().fetchCheckIns(1)
      return { ok: true, token, checkIn, patient }
    } catch (err) {
      if (err instanceof ApiError) {
        const fieldErrors = err.status === 422 ? mapCheckInFieldErrors(err.fieldErrors) : undefined
        const message = checkInActionError(err)
        if (!fieldErrors || Object.keys(fieldErrors).length === 0) {
          get().pushToast({ variant: 'error', title: 'تسجيل الوصول', description: message })
        }
        return { ok: false, message, fieldErrors }
      }
      const message = 'تعذّر الاتصال بالخادم.'
      get().pushToast({ variant: 'error', title: 'تسجيل الوصول', description: message })
      return { ok: false, message }
    }
  },

  callToken: async (tokenId) => {
    const authToken = get().token
    if (!authToken) return false
    const state = get()
    const target =
      state.tokens.find((t) => t.id === tokenId)
      ?? Object.values(state.queues).flat().find((r) => r.token.id === tokenId)?.token
    if (!target) return false
    if (state.queues[target.department].some((r) => r.token.status === 'called' && r.token.id !== tokenId)) {
      get().pushToast({ variant: 'warning', title: 'الطوابير', description: 'يجب إنهاء خدمة المريض المستدعى أولاً.' })
      return false
    }
    try {
      const updated = await callTokenRequest(authToken, tokenId)
      set(applyTokenUpdate(tokenId, updated))
      return true
    } catch (err) {
      get().pushToast({ variant: 'error', title: 'الطوابير', description: tokenActionError(err) })
      return false
    }
  },

  setTokenStatus: async (tokenId, status) => {
    const authToken = get().token
    if (!authToken) return false
    try {
      const updated = await updateTokenStatusRequest(authToken, tokenId, { status })
      set(applyTokenUpdate(tokenId, updated))
      return true
    } catch (err) {
      get().pushToast({ variant: 'error', title: 'الطوابير', description: tokenActionError(err) })
      return false
    }
  },

  cancelQueueToken: async (tokenId) => {
    const authToken = get().token
    if (!authToken) return false
    const state = get()
    const existing =
      state.tokens.find((t) => t.id === tokenId)
      ?? Object.values(state.queues).flat().find((r) => r.token.id === tokenId)?.token
      ?? Object.values(state.displayQueues).flat().find((r) => r.token.id === tokenId)?.token
    if (!existing || existing.status === 'cancelled' || existing.status === 'served') return false
    try {
      const updated = await cancelTokenRequest(authToken, tokenId)
      set(applyTokenUpdate(tokenId, updated))
      get().pushToast({
        variant: 'info',
        title: ar.queue.cancelToken,
        description: updated.number,
      })
      return true
    } catch (err) {
      get().pushToast({ variant: 'error', title: ar.queue.cancelAction, description: tokenActionError(err) })
      return false
    }
  },

  fetchCheckIns: async (page = 1, perPage = 15) => {
    const authToken = get().token
    if (!authToken) return []
    const key = `${page}:${perPage}`
    const existing = checkInsInflight
    if (existing && checkInsInflightKey === key) return existing

    set({ checkInListLoading: true, checkInListError: false })
    checkInsInflightKey = key
    const run = (async () => {
      try {
        const res = await fetchCheckInsRequest(authToken, perPage, page)
        const unique = uniqueLatestCheckInsByPatient(res.data)
        set((s) => {
          const byId = new Map(
            (s.checkIns ?? []).filter((c) => c?.id != null).map((c) => [c.id, c]),
          )
          for (const c of unique) byId.set(c.id, c)
          return {
            checkInList: unique,
            checkInListPage: res.page,
            checkInListLastPage: res.lastPage,
            checkInListTotal: unique.length,
            checkInListLoading: false,
            checkInListError: false,
            checkIns: uniqueLatestCheckInsByPatient([...byId.values()]),
          }
        })
        return unique
      } catch (err) {
        set({ checkInListLoading: false, checkInListError: true })
        get().pushToast({
          variant: 'error',
          title: ar.checkin.listTitle,
          description: err instanceof ApiError
            ? (err.message === 'network' ? 'تعذّر الاتصال بالخادم.' : err.message)
            : ar.common.retry,
        })
        return []
      } finally {
        if (checkInsInflightKey === key) {
          checkInsInflight = null
          checkInsInflightKey = ''
        }
      }
    })()
    checkInsInflight = run
    return run
  },

  fetchPatientCheckIns: async (fileNo, perPage = 15) => {
    const authToken = get().token
    if (!authToken || !fileNo) return []
    set({ patientCheckInsLoading: true, patientCheckInsError: false })
    try {
      const res = await fetchPatientCheckInsRequest(authToken, fileNo, perPage)
      const sorted = [...res.data].sort((a, b) => b.arrivalTime.localeCompare(a.arrivalTime))
      set({ patientCheckIns: sorted, patientCheckInsLoading: false })
      return sorted
    } catch (err) {
      set({ patientCheckIns: [], patientCheckInsLoading: false, patientCheckInsError: true })
      get().pushToast({
        variant: 'error',
        title: ar.record.history,
        description: err instanceof ApiError
          ? (err.message === 'network' ? 'تعذّر الاتصال بالخادم.' : err.message)
          : 'تعذّر جلب سجل الزيارات.',
      })
      return []
    }
  },

  fetchAppointments: async (date) => {
    const authToken = get().token
    if (!authToken) return []
    set({ appointmentsLoading: true, appointmentsError: false })
    try {
      const res = await fetchAppointmentsRequest(authToken, date)
      const appointments = res.data.map(apiToAppointment).filter((a) => a.status !== 'cancelled')
      set({ appointments, appointmentsLoading: false })
      return appointments
    } catch {
      set({ appointmentsLoading: false, appointmentsError: true })
      get().pushToast({ variant: 'error', title: ar.appt.title, description: ar.common.retry })
      return []
    }
  },

  createAppointment: async (input) => {
    const authToken = get().token
    if (!authToken) return null
    try {
      const api = await createAppointmentRequest(authToken, input)
      const appointment = apiToAppointment(api)
      set((s) => ({ appointments: [...s.appointments, appointment] }))
      return appointment
    } catch (err) {
      if (err instanceof ApiError) {
        const doctorMsg = err.fieldErrors?.doctor_id?.[0]
        const message = doctorMsg ?? (err.message !== 'network' ? err.message : ar.common.retry)
        get().pushToast({ variant: 'error', title: ar.appt.new, description: message })
      } else {
        get().pushToast({ variant: 'error', title: ar.appt.new, description: ar.common.retry })
      }
      return null
    }
  },

  confirmAppointment: async (id) => {
    const authToken = get().token
    if (!authToken) return null
    try {
      const api = await confirmAppointmentRequest(authToken, id)
      const updated = apiToAppointment(api)
      set((s) => ({
        appointments: s.appointments.map((a) => (a.id === id ? updated : a)),
      }))
      return updated
    } catch (err) {
      if (err instanceof ApiError) {
        const message = err.message !== 'network' ? err.message : ar.common.retry
        get().pushToast({ variant: 'error', title: ar.appt.confirmAppointment, description: message })
      } else {
        get().pushToast({ variant: 'error', title: ar.appt.confirmAppointment, description: ar.common.retry })
      }
      return null
    }
  },

  completeAppointment: async (id) => {
    const authToken = get().token
    if (!authToken) return null
    try {
      const api = await completeAppointmentRequest(authToken, id)
      const updated = apiToAppointment(api)
      set((s) => ({
        appointments: s.appointments.map((a) => (a.id === id ? updated : a)),
      }))
      return updated
    } catch (err) {
      if (err instanceof ApiError) {
        const message = err.message !== 'network' ? err.message : ar.common.retry
        get().pushToast({ variant: 'error', title: ar.appt.completeAppointment, description: message })
      } else {
        get().pushToast({ variant: 'error', title: ar.appt.completeAppointment, description: ar.common.retry })
      }
      return null
    }
  },

  cancelAppointment: async (id) => {
    const authToken = get().token
    if (!authToken) return null
    try {
      const api = await cancelAppointmentRequest(authToken, id)
      const updated = apiToAppointment(api)
      set((s) => ({
        appointments: s.appointments.filter((a) => a.id !== id),
      }))
      return updated
    } catch (err) {
      if (err instanceof ApiError) {
        const message = err.message !== 'network' ? err.message : ar.common.retry
        get().pushToast({ variant: 'error', title: ar.appt.cancel, description: message })
      } else {
        get().pushToast({ variant: 'error', title: ar.appt.cancel, description: ar.common.retry })
      }
      return null
    }
  },

  fetchPendingConsultRequests: async () => {
    const authToken = get().token
    if (!authToken) return []
    set({ consultRequestsLoading: true, consultRequestsError: false })
    try {
      const res = await fetchPendingConsultRequestsRequest(authToken)
      const consultRequests = (res.data ?? []).map(apiToConsultRequest)
      // Keep consultRequests as the source of pending icons — do not mutate patients.consultationNeeds
      set({
        consultRequests,
        consultRequestsTotal: res.total ?? consultRequests.length,
        consultRequestsLoading: false,
        consultRequestsError: false,
      })
      return consultRequests
    } catch (err) {
      // Keep previously loaded requests so icons do not disappear on a transient failure.
      set({ consultRequestsLoading: false, consultRequestsError: true })
      const description =
        err instanceof ApiError && err.message !== 'network' ? err.message : ar.common.retry
      get().pushToast({ variant: 'error', title: ar.consult.title, description })
      return get().consultRequests
    }
  },

  createConsultRequest: async (input) => {
    const authToken = get().token
    if (!authToken) return null
    try {
      const api = await createConsultRequestRequest(authToken, input)
      const req = apiToConsultRequest(api)
      // Icons come from consultRequests + API consultation_needs — do not invent on the patient object
      set((s) => ({
        consultRequests: [...s.consultRequests.filter((r) => r.id !== req.id), req],
        consultRequestsTotal:
          req.status === 'pending' && !s.consultRequests.some((r) => r.id === req.id)
            ? s.consultRequestsTotal + 1
            : s.consultRequestsTotal,
      }))
      return req
    } catch (err) {
      if (err instanceof ApiError) {
        const message = err.message !== 'network' ? err.message : ar.common.retry
        get().pushToast({ variant: 'error', title: ar.registerConsult.title, description: message })
      } else {
        get().pushToast({ variant: 'error', title: ar.registerConsult.title, description: ar.common.retry })
      }
      return null
    }
  },

  coordinateConsultRequest: async (id) => {
    const authToken = get().token
    if (!authToken) return null
    try {
      const api = await coordinateConsultRequestRequest(authToken, id)
      const req = apiToConsultRequest(api)
      set((s) => ({
        consultRequests: s.consultRequests.filter((r) => r.id !== id),
        consultRequestsTotal: Math.max(0, s.consultRequestsTotal - 1),
      }))
      get().pushToast({ variant: 'success', title: ar.consult.reviewed })
      return req
    } catch (err) {
      if (err instanceof ApiError) {
        const message = err.message !== 'network' ? err.message : ar.common.retry
        get().pushToast({ variant: 'error', title: ar.consult.update, description: message })
      } else {
        get().pushToast({ variant: 'error', title: ar.consult.update, description: ar.common.retry })
      }
      return null
    }
  },

  markNotificationRead: async (id) => {
    const authToken = get().token
    const current = get().notifications.find((n) => n.id === id)
    if (!current || current.isRead) return

    const apiId = resolveNotificationApiId(id)
    const snapshot = get().notifications
    set((s) => {
      const notifications = s.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      return { notifications, unreadCount: countUnread(notifications) }
    })
    if (!authToken || !apiId) return
    try {
      await markNotificationReadRequest(authToken, apiId)
    } catch (err) {
      set({ notifications: snapshot, unreadCount: countUnread(snapshot) })
      get().pushToast({
        variant: 'error',
        title: ar.notif.markRead,
        description: err instanceof ApiError && err.message !== 'network' ? err.message : ar.common.retry,
      })
    }
  },
  markAllNotificationsRead: async () => {
    const authToken = get().token
    if (!get().unreadCount) return

    const snapshot = get().notifications
    set((s) => {
      const notifications = s.notifications.map((n) => ({ ...n, isRead: true }))
      return { notifications, unreadCount: 0 }
    })
    if (!authToken) return
    try {
      await markAllNotificationsReadRequest(authToken)
    } catch (err) {
      set({ notifications: snapshot, unreadCount: countUnread(snapshot) })
      get().pushToast({
        variant: 'error',
        title: ar.notif.markAll,
        description: err instanceof ApiError && err.message !== 'network' ? err.message : ar.common.retry,
      })
    }
  },
  pushNotification: (n) =>
    set((s) => {
      const incomingId = String(n.id ?? '').trim()
      const id = incomingId && incomingId !== 'undefined' && incomingId !== 'null'
        ? incomingId
        : genId('fcm')
      if (s.notifications.some((x) => x.id === id || x.message === n.message)) {
        return s
      }
      const { id: _omit, ...rest } = n
      const notifications: AppNotification[] = [
        { ...rest, id, isRead: false, userId: get().staff?.id ?? '' },
        ...s.notifications,
      ]
      return { notifications, unreadCount: countUnread(notifications) }
    }),

  fetchNotifications: async (perPage = 20) => {
    const authToken = get().token
    if (!authToken) return []
    const hadItems = get().notifications.length > 0
    set({ notificationsLoading: !hadItems, notificationsError: false })
    try {
      console.log('[Notifications] جلب الإشعارات من GET /notifications?perPage=', perPage)
      const res = await fetchNotificationsRequest(authToken, perPage)
      const server = res.data
      const localOnly = get().notifications.filter(
        (n) =>
          (n.id.startsWith('fcm_') || n.id.startsWith('nt_'))
          && !n.isRead
          && !server.some((s) => s.id === n.id || s.message === n.message),
      )
      const notifications = [...localOnly, ...server]
      const unread = countUnread(notifications)
      console.log('[Notifications] الاستجابة:', {
        total: res.total,
        page: res.page,
        count: notifications.length,
        unreadCount: unread,
        items: notifications,
      })
      set({
        notifications,
        unreadCount: unread,
        notificationsLoading: false,
        notificationsError: false,
      })
      return notifications
    } catch (err) {
      console.error('[Notifications] فشل الجلب:', err)
      set({ notificationsLoading: false, notificationsError: true })
      get().pushToast({
        variant: 'error',
        title: ar.notif.title,
        description: err instanceof ApiError
          ? (err.message === 'network' ? 'تعذّر الاتصال بالخادم.' : err.message)
          : ar.common.retry,
      })
      return []
    }
  },

  pushToast: (t) => {
    const id = genId('toast')
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }))
    setTimeout(() => get().dismissToast(id), 4500)
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
