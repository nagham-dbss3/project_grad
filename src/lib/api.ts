import axios, { isAxiosError } from 'axios'
import type {
  Appointment,
  AppointmentStatus,
  AppointmentType,
  Caregiver,
  CaregiverEducation,
  CheckIn,
  CheckInMethod,
  ConsultationType,
  Department,
  Gender,
  LifeStatus,
  Nationality,
  ConsultRequest,
  Patient,
  Token,
  TokenStatus,
} from '@/mock/types'
import type { QueueRow } from '@/lib/selectors'
import { genId } from '@/lib/utils'
import { DEPT_FROM_API, DEPT_TO_API, deptCodeToDepartment } from '@/lib/masterData'

const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api'

const apiClient = axios.create({
  baseURL: baseUrl,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

export interface ApiUser {
  id: number
  first_name: string
  last_name: string
  full_name: string
  email: string
  role: string
  status: string
  permissions: string[]
  last_activity?: string
}

export interface LoginResponse {
  user: ApiUser
  token: string
}

export class ApiError extends Error {
  status: number
  fieldErrors?: Record<string, string[]>
  constructor(status: number, message: string, fieldErrors?: Record<string, string[]>) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

interface ErrorBody {
  message?: string
  errors?: Record<string, string[]>
}

function mergeRequestHeaders(token: string | null, init: RequestInit): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
  if (!init.headers) return headers

  const raw = init.headers
  if (raw instanceof Headers) {
    raw.forEach((value, key) => {
      headers[key] = value
    })
    return headers
  }
  if (Array.isArray(raw)) {
    for (const [key, value] of raw) headers[key] = value
    return headers
  }
  return { ...headers, ...raw }
}

function parseRequestBody(body: BodyInit | null | undefined): unknown {
  if (body == null || body === '') return undefined
  if (typeof body === 'string') return JSON.parse(body) as unknown
  return body
}

function apiErrorFromResponse(status: number, body: unknown): ApiError {
  let detail = `request_failed_${status}`
  let fieldErrors: Record<string, string[]> | undefined

  if (body && typeof body === 'object') {
    const payload = body as ErrorBody
    fieldErrors = payload.errors
    if (payload.errors) detail = Object.values(payload.errors).flat().join('\n')
    else if (payload.message) detail = payload.message
  }

  return new ApiError(status, detail, fieldErrors)
}

async function request<T>(path: string, token: string | null, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase()

  try {
    const response = await apiClient.request<T>({
      url: path,
      method,
      headers: mergeRequestHeaders(token, init),
      data: method === 'GET' || method === 'HEAD' ? undefined : parseRequestBody(init.body),
    })

    if (response.status === 204) return undefined as T
    return response.data
  } catch (err) {
    if (isAxiosError(err)) {
      if (!err.response) throw new ApiError(0, 'network')
      throw apiErrorFromResponse(err.response.status, err.response.data)
    }
    throw new ApiError(0, 'network')
  }
}

export function loginRequest(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', null, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function fetchMe(token: string): Promise<ApiUser> {
  return request<ApiUser>('/auth/me', token, { method: 'GET' })
}

export function logoutRequest(token: string): Promise<void> {
  return request<void>('/auth/logout', token, { method: 'POST' })
}

export interface PatientPayload {
  file_no_basma: string
  file_no_biruni: string
  electronic_file_date: string
  basma_file_open_date: string
  biruni_file_open_date: string
  national_id_patient: string
  national_id_father: string
  first_name: string
  family_name: string
  full_name: string
  father_name: string
  mother_name: string
  dob: string | null
  gender: string | null
  nationality: string
  family_registry: string[]
  residence: string[]
  caregiver: string
  caregiver_education: string
  phones: string[]
  referral: string[]
  general_treatment: string[]
  follow_up: string[]
  life_status: string
  registration_status: string
  registration_date: string
  diagnosis: string
  current_phase: string
  critical_flags: string[]
  consultation_needs: string[]
  department: string
}

/** API patient — tolerant of the partial list rows and the full detail object. */
export interface ApiPatient {
  id?: number
  file_no_basma: string
  file_no_biruni?: string | null
  electronic_file_date?: string | null
  basma_file_open_date?: string | null
  biruni_file_open_date?: string | null
  national_id_patient?: string | null
  national_id_father?: string | null
  first_name: string
  family_name: string
  full_name?: string | null
  father_name?: string | null
  mother_name?: string | null
  dob?: string | null
  gender?: string | null
  nationality?: string | null
  family_registry?: string[] | null
  residence?: string[] | null
  caregiver?: string | null
  caregiver_education?: string | null
  phones?: string[] | null
  referral?: string[] | null
  general_treatment?: string[] | null
  follow_up?: string[] | null
  life_status?: string | null
  registration_status?: string | null
  registration_date?: string | null
  diagnosis?: string | null
  current_phase?: string | null
  critical_flags?: string[] | null
  consultation_needs?: string[] | null
  department?: string | null
}

export interface PatientsListResponse {
  data: ApiPatient[]
  page: number
  perPage: number
  lastPage: number
  total: number
}

const lifeStatusFromApi: Record<string, LifeStatus> = {
  alive: 'alive',
  deceased: 'deceased',
  treatment_stopped: 'treatmentStopped',
  lost_to_followup: 'lostToFollowUp',
  unknown: 'unknown',
}

const caregiverFromApi: Record<string, Caregiver> = {
  both_parents: 'bothParents',
  father_only: 'fatherOnly',
  mother_only: 'motherOnly',
  grandparent: 'grandparent',
  relative: 'uncleAunt',
}

const CONSULT_NEED_VALUES: ConsultationType[] = [
  'cardiac',
  'neurological',
  'ophthalmic',
  'ent',
  'surgery',
  'other',
]

function parseConsultationNeeds(raw: unknown): ConsultationType[] {
  if (!Array.isArray(raw)) return []
  const out: ConsultationType[] = []
  for (const item of raw) {
    const value =
      typeof item === 'string'
        ? item
        : item && typeof item === 'object' && 'consultation_type' in item
          ? String((item as { consultation_type: unknown }).consultation_type)
          : item && typeof item === 'object' && 'type' in item
            ? String((item as { type: unknown }).type)
            : ''
    if (CONSULT_NEED_VALUES.includes(value as ConsultationType)) {
      out.push(value as ConsultationType)
    }
  }
  return [...new Set(out)]
}

export function apiToPatient(api: ApiPatient): Patient {
  const [regGov = '', regCity = ''] = api.family_registry ?? []
  const [resGov = '', resCity = ''] = api.residence ?? []
  return {
    fileNoBasma: api.file_no_basma,
    fileNoBiruni: api.file_no_biruni || '—',
    electronicFileDate: api.electronic_file_date || '',
    basmaFileOpenDate: api.basma_file_open_date || '',
    biruniFileOpenDate: api.biruni_file_open_date || '',
    nationalIdPatient: api.national_id_patient || '',
    nationalIdFather: api.national_id_father || '',
    firstName: api.first_name,
    familyName: api.family_name,
    fatherName: api.father_name || '',
    motherName: api.mother_name || '',
    dob: api.dob?.trim() ? api.dob.trim() : null,
    gender: api.gender === 'male' || api.gender === 'female' ? api.gender : null,
    nationality: (api.nationality || 'syrian') as Nationality,
    familyRegistry: { country: 'سورية', governorate: regGov, city: regCity },
    residence: { country: 'سورية', governorate: resGov, city: resCity },
    caregiver: caregiverFromApi[api.caregiver ?? ''] ?? 'bothParents',
    caregiverEducation: (api.caregiver_education || 'primary') as CaregiverEducation,
    phones: { father: api.phones?.[0], mother: api.phones?.[1] },
    referral: {},
    generalTreatment: { lastVitalStatus: lifeStatusFromApi[api.life_status ?? ''] ?? 'alive' },
    followUp: {},
    lifeStatus: lifeStatusFromApi[api.life_status ?? ''] ?? 'alive',
    consultationNeeds: parseConsultationNeeds(api.consultation_needs),
    registrationDate: api.registration_date || '',
    diagnosis: api.diagnosis || undefined,
    currentPhase: api.current_phase || undefined,
    criticalFlags: api.critical_flags ?? undefined,
    department: api.department ? deptCodeToDepartment(api.department) : undefined,
  }
}

export function createPatient(token: string, payload: PatientPayload): Promise<ApiPatient> {
  return request<ApiPatient>('/patients', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function fetchPatientsRequest(token: string, perPage = 15): Promise<PatientsListResponse> {
  return request<PatientsListResponse>(`/patients?perPage=${perPage}`, token, { method: 'GET' })
}

export function fetchPatientRequest(token: string, fileNo: string): Promise<ApiPatient> {
  return request<ApiPatient>(`/patients/${encodeURIComponent(fileNo)}`, token, { method: 'GET' })
}

export function updatePatientRequest(token: string, fileNo: string, patch: Partial<PatientPayload>): Promise<ApiPatient> {
  return request<ApiPatient>(`/patients/${encodeURIComponent(fileNo)}`, token, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export interface MasterDepartment {
  id: number
  code: string
  name: string
  active: boolean
}

export interface MasterReferralOption {
  id: number
  name: string
  active: boolean
}

export interface MasterDoctor {
  id: number
  name: string
  department?: string
  active: boolean
}

/** Accepts either a bare array or a `{ data: [...] }` wrapper and always returns an array. */
function toArray(res: unknown): unknown[] {
  if (Array.isArray(res)) return res
  if (res && typeof res === 'object' && Array.isArray((res as { data?: unknown }).data)) {
    return (res as { data: unknown[] }).data
  }
  return []
}

/** DepartmentModel.fromJson — keeps id, code, name, active. */
export function departmentFromJson(raw: unknown): MasterDepartment | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const code = String(o.code ?? '').trim()
  const name = String(o.name ?? '').trim()
  if (!code && !name) return null
  const activeRaw = o.active
  const active =
    activeRaw === false || activeRaw === 0 || activeRaw === '0' || activeRaw === 'false'
      ? false
      : true
  return {
    id: Number(o.id) || 0,
    code: code || name,
    name: name || code,
    active,
  }
}

/** ReferralOptionModel.fromJson — keeps id, name, active. */
export function referralOptionFromJson(raw: unknown): MasterReferralOption | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const name = String(o.name ?? '').trim()
  if (!name && o.id == null) return null
  const activeRaw = o.active
  const active =
    activeRaw === false || activeRaw === 0 || activeRaw === '0' || activeRaw === 'false'
      ? false
      : true
  return {
    id: Number(o.id) || 0,
    name: name || String(o.id),
    active,
  }
}

export async function fetchDepartmentsRequest(token: string): Promise<MasterDepartment[]> {
  const rows = toArray(await request<unknown>('/master/departments', token, { method: 'GET' }))
  return rows.map(departmentFromJson).filter((d): d is MasterDepartment => d != null)
}

export async function fetchReferralOptionsRequest(token: string): Promise<MasterReferralOption[]> {
  const rows = toArray(await request<unknown>('/master/referral-options', token, { method: 'GET' }))
  return rows.map(referralOptionFromJson).filter((r): r is MasterReferralOption => r != null)
}

export async function fetchDoctorsRequest(token: string, department?: Department): Promise<MasterDoctor[]> {
  const query = department ? `?department=${encodeURIComponent(DEPT_TO_API[department])}` : ''
  const rows = toArray(await request<unknown>(`/master/doctors${query}`, token, { method: 'GET' }))
  return rows
    .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
    .map((o) => ({
      id: Number(o.id) || 0,
      name: String(o.name ?? ''),
      department: o.department != null ? String(o.department) : undefined,
      active: o.active !== false,
    }))
    .filter((d) => d.name)
}

const DEPT_API: Record<Department, string> = DEPT_TO_API

/** Department slug sent in POST `/check-ins` bodies. */
const CHECKIN_DEPT_API: Record<Department, string> = DEPT_TO_API

function resolveDept(value?: string): Department {
  return deptCodeToDepartment(value)
}

export interface ApiQueueItem {
  id?: string | number
  number?: string
  patient_file_no?: string
  department?: string
  issue_time?: string
  status?: string
  is_emergency?: boolean
  visible_to_guardian?: boolean
  pending_data?: boolean
  patient?: ApiPatient | null
  patient_name?: string
  check_in?: {
    id?: string
    patient_file_no?: string
    arrival_time?: string
    department?: string
    visit_reason?: string
    method?: string
    is_emergency?: boolean
  } | null
}

function stubPatientFromQueueItem(item: ApiQueueItem): Patient | undefined {
  const fileNo = item.patient_file_no
  if (!fileNo) return undefined
  if (item.patient?.first_name) return apiToPatient({ ...item.patient, file_no_basma: fileNo })
  const label = item.patient_name?.trim()
  if (!label) return undefined
  const [first, ...rest] = label.split(/\s+/)
  return apiToPatient({
    file_no_basma: fileNo,
    first_name: first,
    family_name: rest.join(' ') || '—',
  })
}

export function apiToQueueRow(item: ApiQueueItem): QueueRow {
  const dept = resolveDept(item.department)
  const token: Token = {
    id: String(item.id ?? genId('tk')),
    number: item.number ?? '—',
    patientFileNo: item.patient_file_no ?? '',
    department: dept,
    issueTime: item.issue_time ?? new Date().toISOString(),
    status: (item.status ?? 'waiting') as TokenStatus,
    isEmergency: Boolean(item.is_emergency),
    visibleToGuardian: item.visible_to_guardian ?? true,
    pendingData: item.pending_data,
  }
  const patient = item.patient ? apiToPatient(item.patient) : stubPatientFromQueueItem(item)
  const ci = item.check_in
  const checkIn: CheckIn | undefined = ci
    ? {
        id: ci.id ?? genId('ci'),
        patientFileNo: ci.patient_file_no ?? token.patientFileNo,
        arrivalTime: ci.arrival_time ?? token.issueTime,
        department: resolveDept(ci.department) ?? dept,
        visitReason: ci.visit_reason ?? '',
        method: (ci.method ?? 'manual') as CheckInMethod,
        isEmergency: Boolean(ci.is_emergency),
        receptionStaffId: '',
      }
    : undefined
  return { token, patient, checkIn }
}

export function parseDepartmentQueues(res: unknown): QueueRow[] {
  return toArray<ApiQueueItem>(res).map(apiToQueueRow)
}

/** Token shape inside GET `/display/queues` → `{ departments: [{ department, tokens }] }` */
export interface ApiDisplayToken {
  id: number | string
  number: string
  status: string
  is_emergency?: boolean
  issue_time: string
  patient_file_no?: string
  visible_to_guardian?: boolean
  pending_data?: boolean
}

export interface ApiDisplayDepartmentBlock {
  department: string
  tokens: ApiDisplayToken[]
}

function unwrapPayload(res: unknown): unknown {
  if (res && typeof res === 'object' && 'data' in res) {
    return (res as { data: unknown }).data
  }
  return res
}

function displayTokenToQueueRow(item: ApiDisplayToken, departmentKey: string): QueueRow {
  const dept = resolveDept(departmentKey)
  const token: Token = {
    id: String(item.id),
    number: item.number,
    patientFileNo: item.patient_file_no ?? '',
    department: dept,
    issueTime: item.issue_time,
    status: item.status as TokenStatus,
    isEmergency: Boolean(item.is_emergency),
    visibleToGuardian: item.visible_to_guardian ?? true,
    pendingData: item.pending_data,
  }
  return { token }
}

export function parseDisplayQueues(res: unknown): Record<Department, QueueRow[]> {
  const result: Record<Department, QueueRow[]> = { clinic: [], dayCare: [], inpatient: [] }
  const root = unwrapPayload(res)

  // `{ departments: [{ department: "clinic", tokens: [...] }, ...] }`
  if (root && typeof root === 'object' && Array.isArray((root as { departments?: unknown }).departments)) {
    for (const block of (root as { departments: ApiDisplayDepartmentBlock[] }).departments) {
      const dept = DEPT_FROM_API[block.department]
      if (!dept || !Array.isArray(block.tokens)) continue
      result[dept] = block.tokens.map((t) => displayTokenToQueueRow(t, block.department))
    }
    return result
  }

  // `{ clinic: [...], day_care: [...] }` or similar flat map
  if (root && typeof root === 'object' && !Array.isArray(root)) {
    for (const [key, val] of Object.entries(root as Record<string, unknown>)) {
      const dept = DEPT_FROM_API[key]
      if (dept && Array.isArray(val)) result[dept] = val.map((i) => apiToQueueRow(i as ApiQueueItem))
    }
    if (result.clinic.length || result.dayCare.length || result.inpatient.length) return result
  }

  for (const row of parseDepartmentQueues(root)) {
    result[row.token.department].push(row)
  }
  return result
}

export async function fetchQueuesRequest(token: string, department: Department): Promise<QueueRow[]> {
  const slug = DEPT_API[department]
  const res = await request<unknown>(`/queues?department=${slug}`, token, { method: 'GET' })
  let rows = parseDepartmentQueues(res)
  if (department === 'dayCare' && rows.length === 0) {
    const fallback = await request<unknown>('/queues?department=day_care', token, { method: 'GET' })
    rows = parseDepartmentQueues(fallback)
  }
  return rows
}

export function fetchDisplayQueuesRequest(): Promise<Record<Department, QueueRow[]>> {
  return request<unknown>('/display/queues', null, { method: 'GET' }).then(parseDisplayQueues)
}

/** PATCH `/tokens/{id}/status` request body */
export interface TokenStatusPatchBody {
  status: TokenStatus
}

/** Token object returned by PATCH `/tokens/{id}/call` and `/tokens/{id}/status` */
export interface ApiTokenResponse {
  id: number | string
  number: string
  patient_file_no: string
  department: string
  issue_time: string
  status: string
  is_emergency?: boolean
  visible_to_guardian?: boolean
  pending_data?: boolean
}

function parseTokenResponse(res: unknown): ApiTokenResponse {
  if (res && typeof res === 'object') {
    const wrapped = res as { data?: ApiTokenResponse; token?: ApiTokenResponse }
    if (wrapped.data && typeof wrapped.data === 'object') return wrapped.data
    if (wrapped.token && typeof wrapped.token === 'object') return wrapped.token
  }
  return res as ApiTokenResponse
}

export function apiToToken(api: ApiTokenResponse): Token {
  return {
    id: String(api.id),
    number: api.number,
    patientFileNo: api.patient_file_no,
    department: resolveDept(api.department),
    issueTime: api.issue_time,
    status: api.status as TokenStatus,
    isEmergency: Boolean(api.is_emergency),
    visibleToGuardian: api.visible_to_guardian ?? true,
    pendingData: api.pending_data,
  }
}

export async function callTokenRequest(authToken: string, tokenId: string): Promise<Token> {
  const res = await request<unknown>(`/tokens/${encodeURIComponent(tokenId)}/call`, authToken, { method: 'PATCH' })
  return apiToToken(parseTokenResponse(res))
}

export async function updateTokenStatusRequest(
  authToken: string,
  tokenId: string,
  body: TokenStatusPatchBody,
): Promise<Token> {
  const res = await request<unknown>(`/tokens/${encodeURIComponent(tokenId)}/status`, authToken, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  return apiToToken(parseTokenResponse(res))
}

/** Parameters accepted by the store action — mapped to snake_case before POST. */
export interface CheckInInput {
  patientFileNo?: string
  department: Department
  visitReason: string
  method: CheckInMethod
  isEmergency?: boolean
  emergencyReason?: string
  quickCreate?: { fileNoBasma: string; firstName: string; familyName: string }
}

/** POST `/check-ins` — registered patient (normal or emergency with existing file). */
export interface NormalCheckInBody {
  patient_file_no: string
  department: string
  visit_reason: string
  method: string
  is_emergency?: boolean
}

/** POST `/check-ins` — emergency quick-create (no prior patient record). */
export interface EmergencyQuickCheckInBody {
  department: string
  method: string
  is_emergency: true
  visit_reason?: string
  quick_create: {
    file_no_basma: string
    first_name: string
    family_name: string
  }
}

export type CheckInRequestBody = NormalCheckInBody | EmergencyQuickCheckInBody

export function buildCheckInBody(input: CheckInInput): CheckInRequestBody {
  const department = CHECKIN_DEPT_API[input.department]
  if (input.quickCreate) {
    return {
      department,
      method: input.method,
      is_emergency: true,
      visit_reason: input.visitReason,
      quick_create: {
        file_no_basma: input.quickCreate.fileNoBasma,
        first_name: input.quickCreate.firstName,
        family_name: input.quickCreate.familyName,
      },
    }
  }
  const body: NormalCheckInBody = {
    patient_file_no: input.patientFileNo ?? '',
    department,
    visit_reason: input.visitReason,
    method: input.method,
  }
  if (input.isEmergency) body.is_emergency = true
  return body
}

export interface ApiCheckInRecord {
  id: string | number
  patient_file_no: string
  arrival_time: string
  department: string
  visit_reason: string
  method: string
  is_emergency?: boolean
  emergency_reason?: string
  reception_staff_id?: string | number
}

/** POST `/check-ins` response — token + check-in + patient. */
export interface ApiCheckInResponse {
  token: ApiTokenResponse
  check_in: ApiCheckInRecord
  patient: ApiPatient
}

function parseCheckInResponse(res: unknown): ApiCheckInResponse {
  if (res && typeof res === 'object' && 'data' in res) {
    return (res as { data: ApiCheckInResponse }).data
  }
  return res as ApiCheckInResponse
}

export function mapCheckInResponse(
  data: ApiCheckInResponse,
  requestDept?: Department,
): {
  token: Token
  checkIn: CheckIn
  patient: Patient
  row: QueueRow
} {
  const patient = apiToPatient(data.patient)
  const token = apiToToken(data.token)
  const ci = data.check_in
  const dept = requestDept ?? resolveDept(ci.department ?? data.token.department)
  token.department = dept
  const checkIn: CheckIn = {
    id: String(ci.id),
    patientFileNo: ci.patient_file_no,
    arrivalTime: ci.arrival_time,
    department: dept,
    visitReason: ci.visit_reason,
    method: ci.method as CheckInMethod,
    isEmergency: Boolean(ci.is_emergency),
    emergencyReason: ci.emergency_reason,
    receptionStaffId: String(ci.reception_staff_id ?? ''),
  }
  return { token, checkIn, patient, row: { token, patient, checkIn } }
}

export async function createCheckInRequest(authToken: string, input: CheckInInput): Promise<ApiCheckInResponse> {
  const res = await request<unknown>('/check-ins', authToken, {
    method: 'POST',
    body: JSON.stringify(buildCheckInBody(input)),
  })
  return parseCheckInResponse(res)
}

const CHECKIN_FIELD_MAP: Record<string, string> = {
  patient_file_no: 'fileNo',
  visit_reason: 'reason',
  department: 'department',
  'quick_create.file_no_basma': 'fileNoBasma',
  'quick_create.first_name': 'quickName',
  'quick_create.family_name': 'quickFamilyName',
}

// ——— Appointments ———

export interface ApiAppointment {
  id: number
  patient_file_no: string
  patient_name: string
  department: string
  doctor_id: number
  doctor_name: string
  scheduled_at: string
  type: string
  status: string
  notes: string | null
  created_by_reception_id: number
  cancelled_by?: number
  cancelled_at?: string
  created_at?: string
  updated_at?: string
}

export interface AppointmentsListResponse {
  data: ApiAppointment[]
  page: number
  perPage: number
  lastPage: number
  total: number
}

const APPT_TYPE_FROM_API: Record<string, AppointmentType> = {
  follow_up: 'followUp',
  initial_exam: 'initialExam',
}

const APPT_TYPE_TO_API: Record<AppointmentType, string> = {
  followUp: 'follow_up',
  initialExam: 'initial_exam',
}

export interface CreateAppointmentInput {
  patientFileNo: string
  department: Department
  doctorId: string
  scheduledAt: string
  type: AppointmentType
  notes?: string
}

export interface CreateAppointmentBody {
  patient_file_no: string
  department: string
  doctor_id: number
  scheduled_at: string
  type: string
  notes?: string | null
}

export function buildCreateAppointmentBody(input: CreateAppointmentInput): CreateAppointmentBody {
  const body: CreateAppointmentBody = {
    patient_file_no: input.patientFileNo,
    department: DEPT_TO_API[input.department],
    doctor_id: Number(input.doctorId),
    scheduled_at: input.scheduledAt,
    type: APPT_TYPE_TO_API[input.type],
  }
  if (input.notes?.trim()) body.notes = input.notes.trim()
  return body
}

function parseAppointmentResponse(res: unknown): ApiAppointment {
  if (res && typeof res === 'object' && 'data' in res) {
    return (res as { data: ApiAppointment }).data
  }
  return res as ApiAppointment
}

const APPT_STATUS_FROM_API: Record<string, AppointmentStatus> = {
  scheduled: 'scheduled',
  confirmed: 'confirmed',
  cancelled: 'cancelled',
  completed: 'completed',
}

export function apiToAppointment(api: ApiAppointment): Appointment {
  return {
    id: String(api.id),
    patientFileNo: api.patient_file_no,
    patientName: api.patient_name,
    department: resolveDept(api.department),
    doctorId: String(api.doctor_id),
    doctorName: api.doctor_name,
    dateTime: api.scheduled_at,
    type: APPT_TYPE_FROM_API[api.type] ?? 'followUp',
    status: APPT_STATUS_FROM_API[api.status] ?? 'scheduled',
    notes: api.notes ?? undefined,
    createdByReceptionId: String(api.created_by_reception_id),
  }
}

export function fetchAppointmentsRequest(
  token: string,
  date: string,
  perPage = 15,
): Promise<AppointmentsListResponse> {
  return request<AppointmentsListResponse>(
    `/appointments?perPage=${perPage}&date=${encodeURIComponent(date)}`,
    token,
    { method: 'GET' },
  )
}

export async function createAppointmentRequest(
  token: string,
  input: CreateAppointmentInput,
): Promise<ApiAppointment> {
  const res = await request<unknown>('/appointments', token, {
    method: 'POST',
    body: JSON.stringify(buildCreateAppointmentBody(input)),
  })
  return parseAppointmentResponse(res)
}

export async function cancelAppointmentRequest(token: string, appointmentId: string): Promise<ApiAppointment> {
  const res = await request<unknown>(`/appointments/${encodeURIComponent(appointmentId)}/cancel`, token, {
    method: 'PATCH',
  })
  return parseAppointmentResponse(res)
}

// ——— Consult requests ———

export interface ApiConsultRequest {
  id: number
  patient_file_no: string
  consultation_type: string
  status: string
  notes: string | null
  requested_by: number
  created_at: string
}

export interface ConsultRequestsListResponse {
  data: ApiConsultRequest[]
  page: number
  perPage: number
  lastPage: number
  total: number
}

export interface CreateConsultRequestInput {
  patientFileNo: string
  consultationType: ConsultationType
  notes?: string
}

const CONSULT_TYPE_VALUES: ConsultationType[] = [
  'cardiac',
  'neurological',
  'ophthalmic',
  'ent',
  'surgery',
  'other',
]

function parseConsultType(raw: string | null | undefined): ConsultationType {
  if (!raw) return 'other'
  return CONSULT_TYPE_VALUES.includes(raw as ConsultationType) ? (raw as ConsultationType) : 'other'
}

/** Normalize a single consult-request object from create/coordinate responses. */
function parseConsultResponse(res: unknown): ApiConsultRequest {
  if (!res || typeof res !== 'object') {
    throw new ApiError(0, 'invalid_consult_response')
  }
  const obj = res as Record<string, unknown>
  // Create/coordinate may return the entity directly, or wrapped in `{ data: entity }`.
  // List responses also have `data` as an array — never treat those as a single entity.
  if ('data' in obj && obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
    return normalizeApiConsult(obj.data as Record<string, unknown>)
  }
  return normalizeApiConsult(obj)
}

function normalizeApiConsult(raw: Record<string, unknown>): ApiConsultRequest {
  return {
    id: Number(raw.id),
    patient_file_no: String(raw.patient_file_no ?? ''),
    consultation_type: String(raw.consultation_type ?? 'other'),
    status: String(raw.status ?? 'pending'),
    notes: raw.notes == null || raw.notes === '' ? null : String(raw.notes),
    requested_by: Number(raw.requested_by ?? 0),
    created_at: String(raw.created_at ?? ''),
  }
}

/** Normalize list payload: always read rows from `response.data`. */
export function parseConsultListResponse(res: unknown): ConsultRequestsListResponse {
  if (Array.isArray(res)) {
    return {
      data: res.map((row) => normalizeApiConsult(row as Record<string, unknown>)),
      page: 1,
      perPage: res.length,
      lastPage: 1,
      total: res.length,
    }
  }
  if (!res || typeof res !== 'object') {
    return { data: [], page: 1, perPage: 15, lastPage: 1, total: 0 }
  }
  const obj = res as Record<string, unknown>
  const rows = Array.isArray(obj.data) ? obj.data : []
  return {
    data: rows.map((row) => normalizeApiConsult(row as Record<string, unknown>)),
    page: Number(obj.page) || 1,
    perPage: Number(obj.perPage) || 15,
    lastPage: Number(obj.lastPage) || 1,
    total: Number(obj.total) || rows.length,
  }
}

export function apiToConsultRequest(api: ApiConsultRequest): ConsultRequest {
  return {
    id: String(api.id),
    patientFileNo: api.patient_file_no,
    consultationType: parseConsultType(api.consultation_type),
    status: api.status,
    notes: api.notes,
    requestedBy: api.requested_by,
    createdAt: api.created_at,
  }
}

export async function fetchPendingConsultRequests(token: string): Promise<ConsultRequestsListResponse> {
  const res = await request<unknown>('/consult-requests?perPage=15&status=pending', token, {
    method: 'GET',
  })
  return parseConsultListResponse(res)
}

export async function createConsultRequestRequest(
  token: string,
  input: CreateConsultRequestInput,
): Promise<ApiConsultRequest> {
  const body: Record<string, string> = {
    patient_file_no: input.patientFileNo,
    consultation_type: input.consultationType,
  }
  if (input.notes?.trim()) body.notes = input.notes.trim()
  const res = await request<unknown>('/consult-requests', token, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return parseConsultResponse(res)
}

export async function coordinateConsultRequestRequest(
  token: string,
  id: string,
): Promise<ApiConsultRequest> {
  const res = await request<unknown>(`/consult-requests/${encodeURIComponent(id)}/coordinate`, token, {
    method: 'PATCH',
  })
  return parseConsultResponse(res)
}

/** Maps Laravel-style 422 field keys to local form field names (first message per field). */
export function mapCheckInFieldErrors(errors?: Record<string, string[]>): Record<string, string> {
  if (!errors) return {}
  const out: Record<string, string> = {}
  for (const [key, msgs] of Object.entries(errors)) {
    const uiKey = CHECKIN_FIELD_MAP[key] ?? key
    if (msgs[0]) out[uiKey] = msgs[0]
  }
  return out
}
