import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Stethoscope, Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Field } from '@/components/ui/misc'
import { PageHeader } from '@/components/PageHeader'
import { ConsultLegend } from '@/components/ConsultIcons'
import { useStore } from '@/store/useStore'
import { ar } from '@/i18n/ar'
import { consultTypes } from '@/i18n/enums'
import type { ConsultationType } from '@/mock/types'

export function RegisterConsultScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const patients = useStore((s) => s.patients)
  const fetchPatients = useStore((s) => s.fetchPatients)
  const fetchPatientDetails = useStore((s) => s.fetchPatientDetails)
  const getPatient = useStore((s) => s.getPatient)
  const createConsultRequest = useStore((s) => s.createConsultRequest)
  const pushToast = useStore((s) => s.pushToast)

  const patientFileFromUrl = params.get('patient_file_no')?.trim() ?? ''

  const [fileNo, setFileNo] = useState(patientFileFromUrl)
  const [consultationType, setConsultationType] = useState<ConsultationType>('cardiac')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    void fetchPatients()
  }, [fetchPatients])

  useEffect(() => {
    setFileNo(patientFileFromUrl)
    if (patientFileFromUrl && !getPatient(patientFileFromUrl)) {
      void fetchPatientDetails(patientFileFromUrl)
    }
  }, [patientFileFromUrl, getPatient, fetchPatientDetails])

  const patient =
    patients.find((p) => p.fileNoBasma === fileNo.trim())
    ?? (patientFileFromUrl && fileNo.trim() === patientFileFromUrl ? getPatient(patientFileFromUrl) : undefined)

  const canSubmit = Boolean(patient && !submitting)

  const submit = async () => {
    if (!patient) return
    setSubmitting(true)
    const req = await createConsultRequest({
      patientFileNo: patient.fileNoBasma,
      consultationType,
      notes: notes || undefined,
    })
    setSubmitting(false)
    if (!req) return
    pushToast({ variant: 'success', title: ar.registerConsult.saved })
    navigate('/patients?filter=consult')
  }

  return (
    <div>
      <PageHeader
        title={ar.registerConsult.title}
        description={ar.consult.legend}
        action={
          <Button variant="outline" onClick={() => navigate('/patients')}>
            {ar.common.back}
          </Button>
        }
      />

      <Card className="max-w-xl">
        <CardContent className="p-5 space-y-4">
          <h3 className="font-bold flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-primary" />
            {ar.registerConsult.title}
          </h3>

          <Field label={ar.common.fileNo} required>
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={fileNo}
                onChange={(e) => setFileNo(e.target.value)}
                className="ps-9"
                placeholder={ar.common.searchByFile}
              />
            </div>
            {fileNo && (patient ? (
              <p className="text-xs text-secondary mt-1 font-bold">✓ {patient.firstName} {patient.familyName}</p>
            ) : (
              <p className="text-xs text-destructive mt-1 font-bold">{ar.registerConsult.patientRequired}</p>
            ))}
          </Field>

          <Field label={ar.registerConsult.type} required>
            <Select
              value={consultationType}
              onChange={(e) => setConsultationType(e.target.value as ConsultationType)}
            >
              {consultTypes.map((c) => (
                <option key={c} value={c}>{ar.consult[c]}</option>
              ))}
            </Select>
          </Field>

          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground mb-2 font-bold">{ar.consult.legend}:</p>
            <ConsultLegend types={[consultationType]} />
          </div>

          <Field label={ar.registerConsult.notes}>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder={ar.registerConsult.notes}
            />
          </Field>

          <div className="flex gap-2 pt-1">
            <Button onClick={() => void submit()} disabled={!canSubmit}>
              <Stethoscope className="h-4 w-4" />
              {ar.common.confirm}
            </Button>
            <Button variant="outline" onClick={() => navigate('/patients')}>
              {ar.common.cancel}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
