import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/** Compute age in years from an ISO date-of-birth string (relative to mock "today"). */
export function computeAge(dob: string, today: Date = MOCK_TODAY): number {
  const birth = new Date(dob)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

/** Format an age into Arabic-friendly label (سنة / أشهر for infants). */
export function formatAge(dob: string): string {
  const years = computeAge(dob)
  if (years >= 1) return `${years} سنة`
  const birth = new Date(dob)
  const months =
    (MOCK_TODAY.getFullYear() - birth.getFullYear()) * 12 +
    (MOCK_TODAY.getMonth() - birth.getMonth())
  return `${Math.max(months, 0)} أشهر`
}

/** Fixed "today" so the mock app is deterministic. Matches seed data. */
export const MOCK_TODAY = new Date('2026-06-05T08:00:00')

/** Format an ISO time to HH:MM (24h). */
export function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit', hour12: false })
}

/** Format an ISO date to a readable Arabic date. */
export function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('ar-SY', { year: 'numeric', month: 'long', day: 'numeric' })
}

/** Minutes elapsed between an arrival ISO time and "now" (mock). */
export function waitMinutes(arrivalIso: string, now: Date = NOW): number {
  return Math.max(0, Math.round((now.getTime() - new Date(arrivalIso).getTime()) / 60000))
}

/** Human wait duration in Arabic, e.g. "12 دقيقة" or "ساعة و5 دقائق". */
export function formatWait(arrivalIso: string): string {
  const mins = waitMinutes(arrivalIso)
  if (mins < 60) return `${mins} دقيقة`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h} ساعة و${m} دقيقة` : `${h} ساعة`
}

/** Simulated "now" — a bit after MOCK_TODAY morning so queues show real waits. */
export const NOW = new Date('2026-06-05T10:25:00')

/** Simulate network latency for realistic loading states. */
export function delay<T>(value: T, ms = 600): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

let idCounter = 1000
export function genId(prefix = 'id'): string {
  idCounter += 1
  return `${prefix}_${idCounter}`
}
