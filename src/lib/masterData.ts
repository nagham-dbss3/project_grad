import type { MasterDepartment, MasterDoctor, MasterReferralOption } from '@/lib/api'
import { departmentLabel, type Option } from '@/i18n/enums'
import type { Department } from '@/mock/types'

export const DEPT_FROM_API: Record<string, Department> = {
  clinic: 'clinic',
  day_care: 'dayCare',
  daycare: 'dayCare',
  dayCare: 'dayCare',
  inpatient: 'inpatient',
}

export const DEPT_TO_API: Record<Department, string> = {
  clinic: 'clinic',
  dayCare: 'daycare',
  inpatient: 'inpatient',
}

export const FALLBACK_DEPARTMENTS: Department[] = ['clinic', 'dayCare', 'inpatient']

export function deptCodeToDepartment(code?: string | null): Department {
  if (!code) return 'clinic'
  return DEPT_FROM_API[code] ?? (code in DEPT_TO_API ? (code as Department) : 'clinic')
}

/** Active departments as UI options (value = internal Department key for filters / queues). */
export function activeDepartmentOptions(departments: MasterDepartment[]): Option<Department>[] {
  const active = (Array.isArray(departments) ? departments : []).filter((d) => d.active)
  if (active.length === 0) {
    return FALLBACK_DEPARTMENTS.map((value) => ({ value, label: departmentLabel[value] }))
  }
  return active.map((d) => ({ value: deptCodeToDepartment(d.code), label: d.name }))
}

/** Active departments as API `code` options (for registration / payloads). */
export function activeDepartmentCodeOptions(departments: MasterDepartment[]): Option<string>[] {
  const active = (Array.isArray(departments) ? departments : []).filter((d) => d.active)
  if (active.length === 0) {
    return FALLBACK_DEPARTMENTS.map((value) => ({
      value: DEPT_TO_API[value],
      label: departmentLabel[value],
    }))
  }
  return active.map((d) => ({ value: d.code, label: d.name }))
}

/** Ordered Department keys for queue / waiting lanes (from API when available). */
export function activeDepartmentKeys(departments: MasterDepartment[]): Department[] {
  const active = (Array.isArray(departments) ? departments : []).filter((d) => d.active)
  if (active.length === 0) return [...FALLBACK_DEPARTMENTS]
  const keys = active.map((d) => deptCodeToDepartment(d.code))
  return [...new Set(keys)]
}

export function doctorsForDepartment(doctors: MasterDoctor[], department: Department): MasterDoctor[] {
  return (Array.isArray(doctors) ? doctors : [])
    .filter((d) => d.active && (!d.department || deptCodeToDepartment(d.department) === department))
}

/**
 * Referral dropdown options.
 * Value is the option `id` (string) so payloads send a stable id to the API.
 */
export function activeReferralOptions(options: MasterReferralOption[]): Option<string>[] {
  return (Array.isArray(options) ? options : [])
    .filter((r) => r.active)
    .map((r) => ({ value: String(r.id), label: r.name }))
}

export function departmentLabelFromMaster(
  departments: MasterDepartment[],
  dept?: Department | string | null,
): string {
  if (dept == null || dept === '') return '—'
  const asDept = dept in DEPT_TO_API ? (dept as Department) : deptCodeToDepartment(String(dept))
  const apiCode = DEPT_TO_API[asDept]
  const match = (Array.isArray(departments) ? departments : []).find(
    (d) =>
      d.code === dept
      || d.code === apiCode
      || deptCodeToDepartment(d.code) === asDept
      || String(d.id) === String(dept),
  )
  return match?.name ?? departmentLabel[asDept] ?? String(dept)
}

/** Resolve referral display name from id (preferred) or legacy name string. */
export function referralLabelFromMaster(
  options: MasterReferralOption[],
  value?: string | number | null,
): string {
  if (value == null || value === '') return ''
  const key = String(value)
  const list = Array.isArray(options) ? options : []
  const byId = list.find((r) => String(r.id) === key)
  if (byId) return byId.name
  const byName = list.find((r) => r.name === key)
  if (byName) return byName.name
  return key
}

/** Normalize a stored referral value to the option id string for select controls. */
export function normalizeReferralOptionValue(
  value: string | number | null | undefined,
  options: MasterReferralOption[],
): string {
  if (value == null || value === '') return ''
  const key = String(value)
  const list = Array.isArray(options) ? options : []
  if (list.some((r) => String(r.id) === key)) return key
  const byName = list.find((r) => r.name === key)
  return byName ? String(byName.id) : key
}
