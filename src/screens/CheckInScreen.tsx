import { useCallback, useEffect, useState } from 'react'

import { useNavigate, useSearchParams } from 'react-router-dom'

import { CheckCircle2, Clock, UserCheck, UserPlus, ArrowLeft, Printer } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'

import { Button } from '@/components/ui/button'

import { Input } from '@/components/ui/input'

import { Field, Segmented } from '@/components/ui/misc'

import { PageHeader } from '@/components/PageHeader'

import { ScanPad } from '@/components/ScanPad'

import { ConsultIcons } from '@/components/ConsultIcons'

import { Stepper } from '@/components/Stepper'

import { useStore } from '@/store/useStore'

import { hasActiveCheckInToday } from '@/lib/patientVisit'

import { ar } from '@/i18n/ar'

import { useMasterData } from '@/lib/useMasterData'

import { formatAge, formatTime, cn } from '@/lib/utils'

import type { Department, Token } from '@/mock/types'



type Step = 'scan' | 'confirm' | 'assign' | 'done'



export function CheckInScreen() {

  const navigate = useNavigate()

  const [params] = useSearchParams()

  const getPatient = useStore((s) => s.getPatient)

  const fetchPatientDetails = useStore((s) => s.fetchPatientDetails)

  const fetchPatients = useStore((s) => s.fetchPatients)

  const tokens = useStore((s) => s.tokens)

  const checkIns = useStore((s) => s.checkIns)

  const queues = useStore((s) => s.queues)

  const issueToken = useStore((s) => s.issueToken)

  const pushToast = useStore((s) => s.pushToast)

  const pushNotification = useStore((s) => s.pushNotification)

  const { departmentOptions, getDepartmentLabel } = useMasterData()



  const [step, setStep] = useState<Step>('scan')

  const [fileNo, setFileNo] = useState<string | null>(null)

  const [method, setMethod] = useState<'scan' | 'manual'>('scan')

  const [arrivalTime] = useState(() => new Date().toISOString())

  const [department, setDepartment] = useState<Department | null>(null)

  const [reason, setReason] = useState('')

  const [issued, setIssued] = useState<Token | null>(null)

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [submitting, setSubmitting] = useState(false)



  const patient = fileNo ? getPatient(fileNo) : undefined



  useEffect(() => {

    fetchPatients()

  }, [fetchPatients])



  const rejectUnknown = useCallback(

    (unknown: string) => {

      pushToast({

        variant: 'error',

        title: ar.checkin.notFound,

        description: unknown ? `${ar.checkin.notFoundBody} (${unknown})` : ar.checkin.notFoundBody,

      })

      navigate('/patients')

    },

    [navigate, pushToast],

  )



  const rejectAlreadyCheckedIn = useCallback(

    (resolved: string) => {

      pushToast({ variant: 'warning', title: ar.checkin.title, description: ar.checkin.alreadyCheckedIn })

      navigate(`/patients/${encodeURIComponent(resolved)}`)

    },

    [navigate, pushToast],

  )



  const beginCheckIn = useCallback(

    async (resolved: string, m: 'scan' | 'manual') => {

      if (!getPatient(resolved)) await fetchPatientDetails(resolved)

      if (!getPatient(resolved)) {

        rejectUnknown(resolved)

        return

      }

      if (hasActiveCheckInToday(resolved, tokens, checkIns, queues)) {

        rejectAlreadyCheckedIn(resolved)

        return

      }

      setFileNo(resolved)

      setMethod(m)

      setStep('confirm')

    },

    [getPatient, fetchPatientDetails, rejectUnknown, rejectAlreadyCheckedIn, tokens, checkIns, queues],

  )



  useEffect(() => {
    const prefill = params.get('fileNo')?.trim()
    if (!prefill) return
    void beginCheckIn(prefill, 'manual')
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per URL fileNo
  }, [params.get('fileNo')])



  const steps = [

    { key: 'scan', label: ar.checkin.step1 },

    { key: 'confirm', label: ar.checkin.step2 },

    { key: 'assign', label: ar.checkin.step3 },

    { key: 'done', label: ar.checkin.step4 },

  ]

  const stepIndex = steps.findIndex((s) => s.key === step)



  const issue = async () => {

    if (!fileNo || !department || submitting) return

    if (hasActiveCheckInToday(fileNo, tokens, checkIns, queues)) {

      rejectAlreadyCheckedIn(fileNo)

      return

    }

    setSubmitting(true)

    const result = await issueToken({

      patientFileNo: fileNo,

      department,

      visitReason: reason || 'زيارة',

      method,

    })

    setSubmitting(false)

    if (!result.ok) {

      setFieldErrors(result.fieldErrors ?? {})

      if (result.fieldErrors && Object.keys(result.fieldErrors).length > 0) {

        pushToast({ variant: 'error', title: ar.checkin.title, description: result.message })

      }

      return

    }

    setFieldErrors({})

    pushNotification({

      type: 'info',

      message: `تم تسجيل وصول ${result.patient.firstName} ${result.patient.familyName} — رمز ${result.token.number}`,

      relatedPatientFileNo: fileNo,

      timestamp: new Date().toISOString(),

    })

    pushToast({ variant: 'success', title: ar.checkin.issued, description: ar.checkin.tokenIssuedToast })

    setIssued(result.token)

    setStep('done')

  }



  return (

    <div className="max-w-2xl mx-auto">

      <PageHeader title={ar.checkin.title} description={ar.checkin.scanPrompt} back />

      <Stepper steps={steps.map((s) => s.label)} current={stepIndex} className="mb-5" />



      <Card>

        <CardContent className="p-5 sm:p-6">

          {step === 'scan' && (

            <ScanPad

              startManual={params.get('manual') === '1'}

              onResolved={beginCheckIn}

              onUnknown={rejectUnknown}

            />

          )}



          {step === 'confirm' && patient && (

            <div>

              <div className="flex items-center gap-2 rounded-lg bg-secondary-soft text-secondary-foreground p-3 mb-4 text-sm font-bold">

                <Clock className="h-4 w-4" />

                {ar.checkin.captured} — {formatTime(arrivalTime)}

              </div>

              <p className="font-bold mb-3">{ar.checkin.isThisPatient}</p>

              <div className="rounded-xl border p-4 flex items-center gap-3">

                <div className="flex flex-col items-center justify-center rounded-lg bg-primary-soft text-primary px-3 py-2">

                  <span className="text-[10px]">{ar.common.fileNo}</span>

                  <span className="font-bold">{patient.fileNoBasma}</span>

                </div>

                <div className="flex-1">

                  <div className="flex items-center gap-2">

                    <p className="font-bold text-lg">{patient.firstName} {patient.familyName}</p>

                    <ConsultIcons needs={patient.consultationNeeds} patient={patient} />

                  </div>

                  <p className="text-sm text-muted-foreground">
                    {[
                      formatAge(patient.dob),
                      patient.gender === 'male' ? ar.common.male : patient.gender === 'female' ? ar.common.female : '',
                      patient.fatherName,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>

                </div>

              </div>

              <div className="flex gap-2 mt-5">

                <Button variant="outline" onClick={() => { setStep('scan'); setFileNo(null) }}>

                  {ar.common.back}

                </Button>

                <Button className="flex-1" onClick={() => setStep('assign')}>

                  <UserCheck className="h-5 w-5" />

                  {ar.checkin.confirmIdentity}

                </Button>

              </div>

            </div>

          )}



          {step === 'assign' && patient && (

            <div className="space-y-4">

              <Field label={ar.checkin.assignDept} required error={fieldErrors.department}>

                <Segmented options={departmentOptions} value={department} onChange={setDepartment} />

              </Field>

              <Field label={`${ar.checkin.visitReason} (${ar.common.optional})`} htmlFor="reason" error={fieldErrors.reason}>

                <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={ar.checkin.visitReasonPh} />

              </Field>

              <div className="flex gap-2 pt-1">

                <Button variant="outline" onClick={() => setStep('confirm')}>{ar.common.back}</Button>

                <Button className="flex-1" disabled={!department || submitting} onClick={issue}>

                  <CheckCircle2 className="h-5 w-5" />

                  {ar.checkin.issueToken}

                </Button>

              </div>

            </div>

          )}



          {step === 'done' && issued && patient && (

            <div className="text-center py-4">

              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-secondary-soft text-secondary mb-3">

                <CheckCircle2 className="h-9 w-9" />

              </div>

              <h2 className="text-xl font-bold">{ar.checkin.issued}</h2>

              <p className="text-sm text-muted-foreground mb-4">{patient.firstName} {patient.familyName}</p>



              <div className={cn('mx-auto max-w-xs rounded-2xl border-2 border-primary/30 bg-primary-soft/40 p-5')}>

                <p className="text-xs text-muted-foreground">{ar.checkin.yourToken}</p>

                <p className="font-display text-5xl font-bold text-primary my-1">{issued.number}</p>

                <p className="text-sm font-bold">{getDepartmentLabel(issued.department)}</p>

                <p className="text-xs text-muted-foreground mt-1">{ar.common.arrivalTime}: {formatTime(issued.issueTime)}</p>

              </div>



              <div className="flex flex-col sm:flex-row gap-2 mt-5 justify-center">

                <Button onClick={() => navigate('/')}>

                  <ArrowLeft className="h-4 w-4" />

                  {ar.nav.dashboard}

                </Button>

                <Button variant="outline" onClick={() => navigate(`/patients/${patient.fileNoBasma}/id-card`)}>

                  <Printer className="h-4 w-4" />

                  {ar.patients.printId}

                </Button>

                <Button

                  variant="ghost"

                  onClick={() => {

                    setStep('scan'); setFileNo(null); setDepartment(null); setReason(''); setIssued(null); setFieldErrors({})

                  }}

                >

                  <UserPlus className="h-4 w-4" />

                  تسجيل وصول آخر

                </Button>

              </div>

            </div>

          )}

        </CardContent>

      </Card>

    </div>

  )

}


