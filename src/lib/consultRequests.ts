import type { ConsultationType, ConsultRequest, Patient } from '@/mock/types'

function sameFileNo(a: string, b: string): boolean {
  return a.trim() === b.trim()
}

function isPendingStatus(status: string): boolean {
  return status.trim().toLowerCase() === 'pending'
}

/**
 * Icon types for a patient: ONLY pending consult requests for this file number.
 * Never uses patient.consultationNeeds (historical / non-pending).
 */
export function patientConsultNeeds(
  patient: Patient,
  requests: ConsultRequest[],
): ConsultationType[] {
  return pendingConsultTypesForFile(patient.fileNoBasma, requests)
}

/** Pending consult types for `patient_file_no` / `file_no_basma`. */
export function pendingConsultTypesForFile(
  fileNo: string,
  requests: ConsultRequest[] | null | undefined,
): ConsultationType[] {
  if (!fileNo?.trim() || !Array.isArray(requests)) return []
  const types = requests
    .filter((r) => r && sameFileNo(r.patientFileNo, fileNo) && isPendingStatus(r.status))
    .map((r) => r.consultationType)
  return [...new Set(types)]
}

export function pendingConsultFileNos(requests: ConsultRequest[]): Set<string> {
  return new Set(
    requests.filter((r) => isPendingStatus(r.status)).map((r) => r.patientFileNo.trim()),
  )
}

export function consultRequestsForPatient(
  requests: ConsultRequest[],
  fileNo: string,
): ConsultRequest[] {
  if (!fileNo?.trim()) return []
  return requests.filter((r) => sameFileNo(r.patientFileNo, fileNo) && isPendingStatus(r.status))
}
