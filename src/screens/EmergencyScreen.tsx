import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Siren, UserPlus, ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Field, Segmented } from '@/components/ui/misc'
import { PageHeader } from '@/components/PageHeader'
import { ScanPad } from '@/components/ScanPad'
import { ConsultIcons } from '@/components/ConsultIcons'
import { useStore } from '@/store/useStore'
import { ar } from '@/i18n/ar'
import { departmentOptions } from '@/i18n/enums'
import { formatAge, genId, NOW } from '@/lib/utils'
import type { Department, Patient, Token } from '@/mock/types'

type Step = 'identify' | 'details' | 'done'

export function EmergencyScreen() {
  const navigate = useNavigate()
  const getPatient = useStore((s) => s.getPatient)
  const addPatient = useStore((s) => s.addPatient)
  const issueToken = useStore((s) => s.issueToken)
  const pushToast = useStore((s) => s.pushToast)
  const pushNotification = useStore((s) => s.pushNotification)

  const [step, setStep] = useState<Step>('identify')
  const [fileNo, setFileNo] = useState<string | null>(null)
  const [quickName, setQuickName] = useState('')
  const [quickId, setQuickId] = useState('')
  const [isQuickCreate, setIsQuickCreate] = useState(false)
  const [department, setDepartment] = useState<Department | null>(null)
  const [reason, setReason] = useState('')
  const [issued, setIssued] = useState<Token | null>(null)
  const [showQuick, setShowQuick] = useState(false)

  const patient = fileNo ? getPatient(fileNo) : undefined

  const proceedToDetails = (resolvedFile: string) => {
    setFileNo(resolvedFile)
    setIsQuickCreate(false)
    setStep('details')
  }

  const quickCreate = () => {
    if (!quickName.trim()) return
    const newFileNo = genId('EMG').replace('EMG_', 'E')
    const [first, ...rest] = quickName.trim().split(' ')
    const p: Patient = {
      fileNoBasma: newFileNo,
      fileNoBiruni: '—',
      electronicFileDate: NOW.toISOString().slice(0, 10),
      basmaFileOpenDate: '',
      biruniFileOpenDate: '',
      nationalIdPatient: quickId,
      nationalIdFather: '',
      firstName: first,
      familyName: rest.join(' ') || '—',
      fatherName: '',
      motherName: '',
      dob: '2020-01-01',
      gender: 'male',
      nationality: 'syrian',
      familyRegistry: { country: 'سورية', governorate: '', city: '' },
      residence: { country: 'سورية', governorate: '', city: '' },
      caregiver: 'other',
      caregiverEducation: 'illiterate',
      phones: {},
      referral: {},
      generalTreatment: {},
      followUp: {},
      lifeStatus: 'unknown',
      consultationNeeds: [],
      registrationDate: NOW.toISOString().slice(0, 10),
      unregistered: true,
    }
    addPatient(p)
    setFileNo(newFileNo)
    setIsQuickCreate(true)
    setStep('details')
  }

  const issue = () => {
    if (!fileNo || !department) return
    const token = issueToken({
      patientFileNo: fileNo,
      department,
      visitReason: reason || 'حالة إسعافية',
      method: 'manual',
      isEmergency: true,
      emergencyReason: reason,
      pendingData: isQuickCreate,
    })
    pushNotification({
      type: 'alert',
      message: `حالة إسعافية في ${departmentOptions.find((d) => d.value === department)?.label} — رمز ${token.number}`,
      relatedPatientFileNo: fileNo,
      timestamp: NOW.toISOString(),
    })
    pushToast({ variant: 'warning', title: ar.emergency.pinned, description: ar.emergency.notified })
    setIssued(token)
    setStep('done')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title={ar.emergency.title} description={ar.emergency.subtitle} back />

      <Card className="border-warning/40">
        <div className="h-1.5 bg-warning/60 rounded-t-xl" />
        <CardContent className="p-5 sm:p-6">
          {step === 'identify' && (
            <div>
              <div className="flex items-center gap-2 rounded-lg bg-warning/15 text-warning-foreground p-3 mb-4 text-sm font-bold">
                <Siren className="h-4 w-4" />
                {ar.emergency.subtitle}
              </div>

              {!showQuick ? (
                <>
                  <ScanPad onResolved={(f) => proceedToDetails(f)} onUnknown={() => setShowQuick(true)} />
                  <div className="text-center mt-4">
                    <button onClick={() => setShowQuick(true)} className="text-sm font-bold text-accent hover:underline">
                      <UserPlus className="inline h-4 w-4 me-1" />
                      {ar.emergency.quickCreate}
                    </button>
                  </div>
                </>
              ) : (
                <div className="max-w-sm mx-auto space-y-3">
                  <p className="text-sm text-muted-foreground">{ar.emergency.quickCreateHint}</p>
                  <Field label={ar.emergency.minName} required>
                    <Input value={quickName} onChange={(e) => setQuickName(e.target.value)} autoFocus placeholder="الاسم الكامل" />
                  </Field>
                  <Field label={`${ar.common.fileNo} / الرقم الوطني (${ar.common.optional})`}>
                    <Input value={quickId} onChange={(e) => setQuickId(e.target.value)} inputMode="numeric" />
                  </Field>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowQuick(false)}>{ar.common.back}</Button>
                    <Button className="flex-1" disabled={!quickName.trim()} onClick={quickCreate}>
                      {ar.common.next}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'details' && patient && (
            <div className="space-y-4">
              <div className="rounded-xl border p-4 flex items-center gap-3">
                <div className="flex flex-col items-center justify-center rounded-lg bg-warning/25 text-warning-foreground px-3 py-2">
                  <Siren className="h-4 w-4" />
                  <span className="font-bold text-xs mt-0.5">{patient.fileNoBasma}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-lg">{patient.firstName} {patient.familyName}</p>
                    <ConsultIcons needs={patient.consultationNeeds} patient={patient} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {patient.dob !== '2020-01-01' ? formatAge(patient.dob) : 'العمر غير محدد'}
                    {isQuickCreate && ` · ${ar.emergency.pendingFlag}`}
                  </p>
                </div>
              </div>

              <Field label={ar.checkin.assignDept} required>
                <Segmented options={departmentOptions} value={department} onChange={setDepartment} />
              </Field>
              <Field label={`${ar.emergency.reason} (${ar.common.optional})`}>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={ar.emergency.reasonPh} />
              </Field>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setStep('identify'); setFileNo(null); setShowQuick(false) }}>
                  {ar.common.back}
                </Button>
                <Button variant="warning" className="flex-1" disabled={!department} onClick={issue}>
                  <Siren className="h-5 w-5" />
                  {ar.emergency.issuePriority}
                </Button>
              </div>
            </div>
          )}

          {step === 'done' && issued && patient && (
            <div className="text-center py-4">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-warning/25 text-warning-foreground mb-3">
                <Siren className="h-9 w-9" />
              </div>
              <h2 className="text-xl font-bold">{ar.emergency.pinned}</h2>
              <p className="text-sm text-muted-foreground mb-4">{ar.emergency.notified}</p>
              <div className="mx-auto max-w-xs rounded-2xl border-2 border-warning/40 bg-warning/10 p-5">
                <p className="text-xs text-warning-foreground font-bold">{ar.common.emergencyTag}</p>
                <p className="font-display text-5xl font-bold text-warning-foreground my-1">{issued.number}</p>
                <p className="text-sm font-bold">{departmentOptions.find((d) => d.value === issued.department)?.label}</p>
                {issued.pendingData && <p className="text-xs text-warning-foreground mt-2">{ar.emergency.pendingFlag}</p>}
              </div>
              <div className="flex gap-2 mt-5 justify-center">
                <Button onClick={() => navigate('/queue')}>{ar.nav.queue}</Button>
                <Button variant="outline" onClick={() => navigate('/')}>
                  <ArrowLeft className="h-4 w-4" />
                  {ar.nav.dashboard}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
