import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/** Compute age in years from an ISO date-of-birth string. */
export function computeAge(dob: string, today: Date = new Date()): number {
  const birth = new Date(dob)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

/** Format an age into Arabic-friendly label (سنة / أشهر for infants). Empty when dob is missing. */
export function formatAge(dob: string | null | undefined): string {
  if (!dob?.trim()) return ''
  const today = new Date()
  const years = computeAge(dob, today)
  if (Number.isNaN(years)) return ''
  if (years >= 1) return `${years} سنة`
  const birth = new Date(dob)
  if (Number.isNaN(birth.getTime())) return ''
  const months =
    (today.getFullYear() - birth.getFullYear()) * 12 +
    (today.getMonth() - birth.getMonth())
  return `${Math.max(months, 0)} أشهر`
}

/** Local calendar date as YYYY-MM-DD (for API date filters). */
export function todayIsoDate(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Format an ISO time to HH:mm (24h). Returns em dash when invalid. */
export function formatTime(iso: string | null | undefined): string {
  if (!iso?.trim()) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

/** Format an ISO date to a readable Arabic date. Empty when value is missing. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso?.trim()) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('ar-SY', { year: 'numeric', month: 'long', day: 'numeric' })
}

/** Minutes elapsed between an arrival ISO time and now. */
export function waitMinutes(arrivalIso: string, now: Date = new Date()): number {
  return Math.max(0, Math.round((now.getTime() - new Date(arrivalIso).getTime()) / 60000))
}

/** Human wait duration in Arabic, e.g. "23 دقيقة" or "1 ساعة و15 دقيقة". */
export function formatWait(arrivalIso: string, now: Date = new Date()): string {
  const mins = waitMinutes(arrivalIso, now)
  if (mins < 1) return 'أقل من دقيقة'
  if (mins < 60) return `${mins} دقيقة`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (m === 0) return h === 1 ? 'ساعة واحدة' : `${h} ساعة`
  return `${h === 1 ? '1 ساعة' : `${h} ساعة`} و${m} دقيقة`
}

let idCounter = 1000
export function genId(prefix = 'id'): string {
  idCounter += 1
  return `${prefix}_${idCounter}`
}
