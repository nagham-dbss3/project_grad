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

export function deptCodeToDepartment(code?: string | null): Department {
  if (!code) return 'clinic'
  return DEPT_FROM_API[code] ?? 'clinic'
}

export function activeDepartmentOptions(departments: MasterDepartment[]): Option<Department>[] {
  return (Array.isArray(departments) ? departments : [])
    .filter((d) => d.active)
    .map((d) => ({ value: deptCodeToDepartment(d.code), label: d.name }))
}

/** For forms that submit the API `code` string (e.g. patient registration). */
export function activeDepartmentCodeOptions(departments: MasterDepartment[]): Option<string>[] {
  return (Array.isArray(departments) ? departments : [])
    .filter((d) => d.active)
    .map((d) => ({ value: d.code, label: d.name }))
}

export function doctorsForDepartment(doctors: MasterDoctor[], department: Department): MasterDoctor[] {
  return (Array.isArray(doctors) ? doctors : [])
    .filter((d) => d.active && (!d.department || deptCodeToDepartment(d.department) === department))
}

export function activeReferralOptions(options: MasterReferralOption[]): Option<string>[] {
  return (Array.isArray(options) ? options : [])
    .filter((r) => r.active)
    .map((r) => ({ value: r.name, label: r.name }))
}

export function departmentLabelFromMaster(
  departments: MasterDepartment[],
  dept?: Department | string | null,
): string {
  if (!dept) return '—'
  const asDept = dept in DEPT_TO_API ? (dept as Department) : deptCodeToDepartment(dept)
  const apiCode = DEPT_TO_API[asDept]
  const match = departments.find(
    (d) => deptCodeToDepartment(d.code) === asDept || d.code === apiCode || d.code === dept,
  )
  return match?.name ?? departmentLabel[asDept] ?? String(dept)
}
