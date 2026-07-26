import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ScanLine, Ticket, CalendarPlus, IdCard, Pencil, Clock, Stethoscope, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState, ListSkeleton } from '@/components/ui/states'
import { PatientContextBar } from '@/components/PatientContextBar'
import { ConsultLegend } from '@/components/ConsultIcons'
import { consultRequestsForPatient, patientConsultNeeds } from '@/lib/consultRequests'
import { consultLabel } from '@/i18n/enums'
import { TokenStatusBadge } from '@/components/StatusBadges'
import { AppointmentRow } from '@/components/AppointmentRow'
import { useStore } from '@/store/useStore'
import { patientTodayVisit, hasActiveCheckInToday } from '@/lib/patientVisit'
import { useMasterData } from '@/lib/useMasterData'
import { ar } from '@/i18n/ar'
import {
  caregiverEducationOptions,
  caregiverOptions,
  lifeStatusLabel,
  nationalityOptions,
} from '@/i18n/enums'
import { formatDate, formatTime } from '@/lib/utils'

export function PatientRecordScreen() {
  const { fileNo } = useParams()
  const navigate = useNavigate()
  const patient = useStore((s) => s.selectedPatient)
  const raw = useStore((s) => s.selectedPatientRaw)
  const patientLoading = useStore((s) => s.patientLoading)
  const fetchPatientDetails = useStore((s) => s.fetchPatientDetails)
  const fetchQueues = useStore((s) => s.fetchQueues)
  const updatePatient = useStore((s) => s.updatePatient)
  const tokens = useStore((s) => s.tokens)
  const checkIns = useStore((s) => s.checkIns)
  const queues = useStore((s) => s.queues)
  const appointments = useStore((s) => s.appointments)
  const consultRequests = useStore((s) => s.consultRequests)
  const fetchPendingConsultRequests = useStore((s) => s.fetchPendingConsultRequests)
  const pushToast = useStore((s) => s.pushToast)
  const { getDepartmentLabel, getReferralLabel } = useMasterData()
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    if (fileNo) {
      fetchPatientDetails(fileNo)
      fetchQueues()
      void fetchPendingConsultRequests()
    }
  }, [fileNo, fetchPatientDetails, fetchQueues, fetchPendingConsultRequests])

  if (patientLoading) {
    return <ListSkeleton rows={6} />
  }

  if (!patient) {
    return (
      <Card className="mt-6"><EmptyState title="لم يُعثر على المريض" description={`رقم الإضبارة ${fileNo}`} action={<Button variant="outline" onClick={() => navigate('/patients')}>{ar.patients.title}</Button>} /></Card>
    )
  }

  const { todayToken, todayCheckIn } = patientTodayVisit(patient.fileNoBasma, tokens, checkIns, queues)
  const alreadyCheckedIn = hasActiveCheckInToday(patient.fileNoBasma, tokens, checkIns, queues)
  const patientAppointments = appointments.filter((a) => a.patientFileNo === patient.fileNoBasma)
  const upcoming = patientAppointments.filter((a) => a.status !== 'cancelled' && a.status !== 'completed').sort((a, b) => a.dateTime.localeCompare(b.dateTime))
  const history = checkIns.filter((c) => c.patientFileNo === patient.fileNoBasma)

  // Faithful display: show what was saved, leave anything missing blank.
  const enumLabel = <T extends string>(arr: { value: T; label: string }[], present: unknown, mapped?: T) =>
    present ? arr.find((o) => o.value === mapped)?.label ?? '' : ''
  const listTxt = (v?: string[] | null) => (v && v.length ? v.filter(Boolean).join(' — ') : '')
  const referralTxt = (v?: string[] | null) =>
    v && v.length ? v.map((item) => getReferralLabel(item)).filter(Boolean).join(' — ') : ''
  const dateTxt = (v?: string | null) => (v ? formatDate(v) : '')
  const genderTxt = raw?.gender ? (raw.gender === 'male' ? ar.common.male : ar.common.female) : ''

  return (
    <div>
      <PatientContextBar patient={patient} />

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 my-4">
        <Button
          disabled={alreadyCheckedIn}
          onClick={() => {
            if (alreadyCheckedIn) {
              pushToast({ variant: 'warning', title: ar.checkin.title, description: ar.checkin.alreadyCheckedIn })
              return
            }
            navigate(`/check-in?fileNo=${encodeURIComponent(patient.fileNoBasma)}`)
          }}
        >
          <ScanLine className="h-4 w-4" />{ar.checkin.title}
        </Button>
        <Button
          variant="outline"
          disabled={alreadyCheckedIn}
          onClick={() => {
            if (alreadyCheckedIn) {
              pushToast({ variant: 'warning', title: ar.checkin.title, description: ar.checkin.alreadyCheckedIn })
              return
            }
            navigate(`/check-in?fileNo=${encodeURIComponent(patient.fileNoBasma)}`)
          }}
        >
          <Ticket className="h-4 w-4" />{ar.record.issueToken}
        </Button>
        <Button variant="outline" onClick={() => navigate(`/appointments?patient_file_no=${encodeURIComponent(patient.fileNoBasma)}`)}><CalendarPlus className="h-4 w-4" />{ar.appt.new}</Button>
        <Button variant="outline" onClick={() => navigate(`/patients/${patient.fileNoBasma}/id-card`)}><IdCard className="h-4 w-4" />{ar.idCard.title}</Button>
        <Button variant="ghost" onClick={() => navigate(`/patients/new?edit=${patient.fileNoBasma}`)}><Pencil className="h-4 w-4" />{ar.record.editAdmin}</Button>
        {raw?.registration_status !== 'complete' && (
          <Button variant="secondary" onClick={() => updatePatient(patient.fileNoBasma, { registration_status: 'complete' })}>
            <CheckCircle2 className="h-4 w-4" />
            تعليم كمكتمل
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">{ar.record.overview}</TabsTrigger>
          <TabsTrigger value="admin">{ar.record.admin}</TabsTrigger>
          <TabsTrigger value="appointments">{ar.record.appointments}</TabsTrigger>
          <TabsTrigger value="history">{ar.record.history}</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5">
                <h3 className="font-bold mb-3 flex items-center gap-2"><Clock className="h-4 w-4 text-primary" />{ar.record.todayCheckIn}</h3>
                {todayCheckIn ? (
                  <dl className="space-y-2 text-sm">
                    <Row label={ar.common.arrivalTime} value={formatTime(todayCheckIn.arrivalTime)} />
                    <Row label={ar.common.department} value={getDepartmentLabel(todayCheckIn.department)} />
                    <Row label="الرمز" value={todayToken ? todayToken.number : '—'} />
                    <Row label={ar.common.status} value={todayToken ? <TokenStatusBadge status={todayToken.status} emergency={todayToken.isEmergency} /> : '—'} />
                    <Row label={ar.checkin.visitReason} value={todayCheckIn.visitReason} />
                  </dl>
                ) : (
                  <p className="text-sm text-muted-foreground">{ar.record.noVisitToday}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h3 className="font-bold mb-3 flex items-center gap-2"><CalendarPlus className="h-4 w-4 text-primary" />{ar.record.nextAppointment}</h3>
                {upcoming[0] ? (
                  <AppointmentRow appointment={upcoming[0]} />
                ) : (
                  <p className="text-sm text-muted-foreground">{ar.record.noNextAppt}</p>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardContent className="p-5">
                <h3 className="font-bold mb-3 flex items-center gap-2"><Stethoscope className="h-4 w-4 text-accent" />الحالة السريرية</h3>
                <dl className="space-y-2 text-sm">
                  <Row label="التشخيص" value={raw?.diagnosis ?? ''} />
                  <Row label="المرحلة الحالية" value={raw?.current_phase ?? ''} />
                  <Row label="القسم" value={raw?.department ? getDepartmentLabel(patient.department ?? raw.department) : ''} />
                  <Row
                    label="مؤشّرات حرجة"
                    value={raw?.critical_flags?.length ? (
                      <div className="flex flex-wrap gap-1 justify-end">{raw.critical_flags.map((f) => <Badge key={f} variant="warning">{f}</Badge>)}</div>
                    ) : ''}
                  />
                </dl>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardContent className="p-5">
                <h3 className="font-bold mb-3 flex items-center gap-2"><Stethoscope className="h-4 w-4 text-accent" />{ar.consult.title}</h3>
                {(() => {
                  const needs = patientConsultNeeds(patient, consultRequests)
                  const requests = consultRequestsForPatient(consultRequests, patient.fileNoBasma)
                  if (!needs.length && !requests.length) {
                    return <p className="text-sm text-muted-foreground">{ar.common.none}</p>
                  }
                  return (
                    <div className="space-y-4">
                      {needs.length > 0 && <ConsultLegend types={needs} />}
                      {requests.length > 0 && (
                        <ul className="space-y-2 text-sm">
                          {requests.map((r) => (
                            <li key={r.id} className="rounded-lg border bg-muted/30 p-3">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="font-bold">{consultLabel[r.consultationType]}</span>
                                <Badge variant="warning">{r.status}</Badge>
                              </div>
                              {r.notes && <p className="text-muted-foreground mt-1">{r.notes}</p>}
                              <p className="text-xs text-muted-foreground mt-1">{formatDate(r.createdAt)} · {formatTime(r.createdAt)}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Administrative */}
        <TabsContent value="admin">
          <div className="grid md:grid-cols-2 gap-4">
            <Card><CardContent className="p-5">
              <h3 className="font-bold mb-3">معرّفات الملف</h3>
              <dl className="space-y-2 text-sm">
                <Row label="رقم بسمة" value={<span className="font-bold text-primary">{patient.fileNoBasma}</span>} />
                <Row label="رقم البيروني" value={raw?.file_no_biruni ?? ''} />
                <Row label="تاريخ الملف الإلكتروني" value={dateTxt(raw?.electronic_file_date)} />
                <Row label="تاريخ فتح ملف بسمة" value={dateTxt(raw?.basma_file_open_date)} />
                <Row label="تاريخ فتح ملف البيروني" value={dateTxt(raw?.biruni_file_open_date)} />
                <Row label="الرقم الوطني للمريض" value={raw?.national_id_patient ?? ''} />
                <Row label="الرقم الوطني للأب" value={raw?.national_id_father ?? ''} />
                <Row label="حالة التسجيل" value={raw?.registration_status ?? ''} />
                <Row label="تاريخ التسجيل" value={dateTxt(raw?.registration_date)} />
              </dl>
            </CardContent></Card>

            <Card><CardContent className="p-5">
              <h3 className="font-bold mb-3">المعلومات السكانية</h3>
              <dl className="space-y-2 text-sm">
                <Row label="الاسم الكامل" value={raw?.full_name ?? ''} />
                <Row label="اسم الأب" value={raw?.father_name ?? ''} />
                <Row label="اسم الأم" value={raw?.mother_name ?? ''} />
                <Row label="تاريخ الميلاد" value={dateTxt(raw?.dob)} />
                <Row label="الجنس" value={genderTxt} />
                <Row label="الجنسية" value={enumLabel(nationalityOptions, raw?.nationality, patient.nationality)} />
                <Row label="مقدم الرعاية" value={enumLabel(caregiverOptions, raw?.caregiver, patient.caregiver)} />
                <Row label="تعليم مقدم الرعاية" value={enumLabel(caregiverEducationOptions, raw?.caregiver_education, patient.caregiverEducation)} />
                <Row label="السجل العائلي" value={listTxt(raw?.family_registry)} />
                <Row label="الإقامة" value={listTxt(raw?.residence)} />
                <Row label="الهواتف" value={listTxt(raw?.phones)} />
              </dl>
            </CardContent></Card>

            <Card className="md:col-span-2"><CardContent className="p-5">
              <h3 className="font-bold mb-3">الإحالة والعلاج والمتابعة</h3>
              <dl className="space-y-2 text-sm">
                <Row label="الحالة الحيوية" value={raw?.life_status ? <Badge variant="secondary">{lifeStatusLabel[patient.lifeStatus]}</Badge> : ''} />
                <Row label="الإحالة" value={referralTxt(raw?.referral)} />
                <Row label="العلاج العام" value={listTxt(raw?.general_treatment)} />
                <Row label="المتابعة" value={listTxt(raw?.follow_up)} />
              </dl>
            </CardContent></Card>
          </div>
        </TabsContent>

        {/* Appointments */}
        <TabsContent value="appointments">
          <Card><CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">{ar.record.appointments}</h3>
              <Button size="sm" onClick={() => navigate(`/appointments?patient_file_no=${encodeURIComponent(patient.fileNoBasma)}`)}><CalendarPlus className="h-4 w-4" />{ar.appt.new}</Button>
            </div>
            {patientAppointments.length ? (
              <div className="space-y-2">{patientAppointments.map((a) => <AppointmentRow key={a.id} appointment={a} showCancel />)}</div>
            ) : (
              <EmptyState title={ar.appt.empty} action={<Button variant="outline" size="sm" onClick={() => navigate(`/appointments?patient_file_no=${encodeURIComponent(patient.fileNoBasma)}`)}>{ar.appt.new}</Button>} />
            )}
          </CardContent></Card>
        </TabsContent>

        {/* Visit history */}
        <TabsContent value="history">
          <Card><CardContent className="p-4">
            <h3 className="font-bold mb-3">{ar.record.history}</h3>
            {history.length ? (
              <div className="divide-y">
                {history.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 py-3 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-bold">{formatDate(c.arrivalTime)}</span>
                    <span className="text-muted-foreground">{formatTime(c.arrivalTime)}</span>
                    <Badge variant="muted">{getDepartmentLabel(c.department)}</Badge>
                    {c.isEmergency && <Badge variant="warning">{ar.common.emergencyTag}</Badge>}
                    <span className="text-muted-foreground ms-auto truncate">{c.visitReason}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4">{ar.record.noHistory}</p>
            )}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-bold text-end">{value}</dd>
    </div>
  )
}
