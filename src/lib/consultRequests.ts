import type { ConsultationType, ConsultRequest, Patient } from '@/mock/types'

export function patientConsultNeeds(
  patient: Patient,
  requests: ConsultRequest[],
): ConsultationType[] {
  const fromRequests = requests
    .filter((r) => r.patientFileNo === patient.fileNoBasma && r.status === 'pending')
    .map((r) => r.consultationType)
  return [...new Set([...patient.consultationNeeds, ...fromRequests])]
}

export function pendingConsultFileNos(requests: ConsultRequest[]): Set<string> {
  return new Set(
    requests.filter((r) => r.status === 'pending').map((r) => r.patientFileNo),
  )
}

export function consultRequestsForPatient(
  requests: ConsultRequest[],
  fileNo: string,
): ConsultRequest[] {
  return requests.filter((r) => r.patientFileNo === fileNo && r.status === 'pending')
}
