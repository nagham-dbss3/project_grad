import { useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Printer, ScanLine } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState, ListSkeleton } from '@/components/ui/states'
import { Logo } from '@/components/Logo'
import { PageHeader } from '@/components/PageHeader'
import { PatientQR } from '@/components/PatientQR'
import { useStore } from '@/store/useStore'
import { ar } from '@/i18n/ar'
import { formatAge, formatDate } from '@/lib/utils'

export function IdCardScreen() {
  const { fileNo: rawFileNo } = useParams()
  const fileNo = rawFileNo ? decodeURIComponent(rawFileNo) : undefined
  const navigate = useNavigate()
  const getPatient = useStore((s) => s.getPatient)
  const fetchPatientDetails = useStore((s) => s.fetchPatientDetails)
  const patientLoading = useStore((s) => s.patientLoading)
  const selectedPatient = useStore((s) => s.selectedPatient)
  const patient = useMemo(() => {
    if (!fileNo) return undefined
    return getPatient(fileNo) ?? (selectedPatient?.fileNoBasma === fileNo ? selectedPatient : undefined)
  }, [fileNo, getPatient, selectedPatient])

  // Always refresh details so gender / DOB print from the latest API payload
  useEffect(() => {
    if (fileNo) void fetchPatientDetails(fileNo)
  }, [fileNo, fetchPatientDetails])

  if (!fileNo) {
    return (
      <Card className="mt-6">
        <EmptyState
          title="لم يُعثر على المريض"
          action={<Button variant="outline" onClick={() => navigate('/patients')}>{ar.patients.title}</Button>}
        />
      </Card>
    )
  }

  if (!patient && patientLoading) {
    return <ListSkeleton rows={3} />
  }

  if (!patient) {
    return (
      <Card className="mt-6">
        <EmptyState
          title="لم يُعثر على المريض"
          action={<Button variant="outline" onClick={() => navigate('/patients')}>{ar.patients.title}</Button>}
        />
      </Card>
    )
  }

  const fullName = [patient.firstName, patient.fatherName, patient.familyName].filter(Boolean).join(' ').trim()
    || `${patient.firstName} ${patient.familyName}`.trim()
  const genderLabel =
    patient.gender === 'male' ? ar.common.male : patient.gender === 'female' ? ar.common.female : '—'
  const dobLabel = formatDate(patient.dob) || '—'
  const ageLabel = formatAge(patient.dob) || '—'

  return (
    <div className="max-w-xl mx-auto id-card-screen">
      <div className="no-print">
        <PageHeader
          title={ar.idCard.title}
          back
          action={
            <Button onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              {ar.idCard.printPreview}
            </Button>
          }
        />
      </div>

      <div className="id-card-print rounded-2xl overflow-hidden shadow-card border print:shadow-none print:border print:rounded-none">
        <div className="gradient-brand p-5 text-white print:bg-[#0b6bcb] print:[background-image:none]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-white px-2 py-1 shadow-sm">
                <Logo className="h-8" />
              </span>
              <p className="text-xs text-white/90">منصة أورام الأطفال</p>
            </div>
            <span className="text-xs bg-white/20 rounded-full px-3 py-1 font-bold">{ar.idCard.title}</span>
          </div>
        </div>

        <CardContent className="p-6 bg-card">
          <div className="flex items-center gap-5">
            <PatientQR value={patient.fileNoBasma} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">{ar.common.fileNo}</p>
              <p className="font-display text-3xl font-bold text-primary leading-none">{patient.fileNoBasma}</p>
              <p className="font-bold text-lg mt-3">{fullName}</p>
              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex gap-2">
                  <dt className="text-muted-foreground shrink-0">{ar.common.gender}:</dt>
                  <dd className="font-bold">{genderLabel}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted-foreground shrink-0">تاريخ الميلاد:</dt>
                  <dd className="font-bold">{dobLabel}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted-foreground shrink-0">{ar.common.age}:</dt>
                  <dd className="font-bold">{ageLabel}</dd>
                </div>
              </dl>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t flex items-center gap-2 text-xs text-muted-foreground">
            <ScanLine className="h-4 w-4 text-primary" />
            {ar.idCard.scanHint}
          </div>
        </CardContent>
      </div>
    </div>
  )
}
