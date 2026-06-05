import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ScanLine, Ticket, CalendarPlus, IdCard, Pencil, Clock, Stethoscope } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/ui/states'
import { PatientContextBar } from '@/components/PatientContextBar'
import { ConsultLegend } from '@/components/ConsultIcons'
import { TokenStatusBadge } from '@/components/StatusBadges'
import { AppointmentRow } from '@/components/AppointmentRow'
import { useStore } from '@/store/useStore'
import { ar } from '@/i18n/ar'
import {
  caregiverEducationOptions,
  caregiverOptions,
  departmentLabel,
  lifeStatusLabel,
  nationalityOptions,
  referralCenterOptions,
  referralCountryOptions,
  referringSpecialtyOptions,
} from '@/i18n/enums'
import { formatDate, formatTime } from '@/lib/utils'

export function PatientRecordScreen() {
  const { fileNo } = useParams()
  const navigate = useNavigate()
  const getPatient = useStore((s) => s.getPatient)
  const tokens = useStore((s) => s.tokens)
  const checkIns = useStore((s) => s.checkIns)
  const appointments = useStore((s) => s.appointments)
  const [tab, setTab] = useState('overview')

  const patient = fileNo ? getPatient(fileNo) : undefined

  if (!patient) {
    return (
      <Card className="mt-6"><EmptyState title="لم يُعثر على المريض" description={`رقم الإضبارة ${fileNo}`} action={<Button variant="outline" onClick={() => navigate('/patients')}>{ar.patients.title}</Button>} /></Card>
    )
  }

  const todayToken = tokens.find((t) => t.patientFileNo === patient.fileNoBasma && t.status !== 'served' && t.status !== 'cancelled')
  const todayCheckIn = checkIns.find((c) => c.patientFileNo === patient.fileNoBasma)
  const patientAppointments = appointments.filter((a) => a.patientFileNo === patient.fileNoBasma)
  const upcoming = patientAppointments.filter((a) => a.status !== 'cancelled' && a.status !== 'completed').sort((a, b) => a.dateTime.localeCompare(b.dateTime))
  const history = checkIns.filter((c) => c.patientFileNo === patient.fileNoBasma)

  const opt = <T extends string>(arr: { value: T; label: string }[], v?: T) => (v ? arr.find((o) => o.value === v)?.label ?? '—' : '—')

  return (
    <div>
      <PatientContextBar patient={patient} />

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 my-4">
        <Button onClick={() => navigate('/check-in')}><ScanLine className="h-4 w-4" />{ar.checkin.title}</Button>
        <Button variant="outline" onClick={() => navigate('/check-in')}><Ticket className="h-4 w-4" />{ar.record.issueToken}</Button>
        <Button variant="outline" onClick={() => navigate(`/appointments?fileNo=${patient.fileNoBasma}`)}><CalendarPlus className="h-4 w-4" />{ar.appt.new}</Button>
        <Button variant="outline" onClick={() => navigate(`/patients/${patient.fileNoBasma}/id-card`)}><IdCard className="h-4 w-4" />{ar.idCard.title}</Button>
        <Button variant="ghost" onClick={() => navigate(`/patients/new?edit=${patient.fileNoBasma}`)}><Pencil className="h-4 w-4" />{ar.record.editAdmin}</Button>
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
                    <Row label={ar.common.department} value={departmentLabel[todayCheckIn.department]} />
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
                <h3 className="font-bold mb-3 flex items-center gap-2"><Stethoscope className="h-4 w-4 text-accent" />{ar.consult.title}</h3>
                {patient.consultationNeeds.length ? (
                  <ConsultLegend types={patient.consultationNeeds} />
                ) : (
                  <p className="text-sm text-muted-foreground">{ar.common.none}</p>
                )}
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
                <Row label="رقم البيروني" value={patient.fileNoBiruni} />
                <Row label="تاريخ الملف الإلكتروني" value={patient.electronicFileDate ? formatDate(patient.electronicFileDate) : '—'} />
                <Row label="تاريخ فتح ملف بسمة" value={patient.basmaFileOpenDate ? formatDate(patient.basmaFileOpenDate) : '—'} />
                <Row label="الرقم الوطني" value={patient.nationalIdPatient || '—'} />
              </dl>
            </CardContent></Card>

            <Card><CardContent className="p-5">
              <h3 className="font-bold mb-3">المعلومات السكانية</h3>
              <dl className="space-y-2 text-sm">
                <Row label="الأب / الأم" value={`${patient.fatherName} / ${patient.motherName || '—'}`} />
                <Row label="الجنسية" value={opt(nationalityOptions, patient.nationality)} />
                <Row label="مقدم الرعاية" value={opt(caregiverOptions, patient.caregiver)} />
                <Row label="تعليم مقدم الرعاية" value={opt(caregiverEducationOptions, patient.caregiverEducation)} />
                <Row label="الإقامة" value={`${patient.residence.governorate} — ${patient.residence.city}`} />
                <Row label="الهاتف" value={patient.phones.father || patient.phones.mother || patient.phones.caregiver || '—'} />
              </dl>
            </CardContent></Card>

            <Card><CardContent className="p-5">
              <h3 className="font-bold mb-3">معلومات الإحالة</h3>
              <dl className="space-y-2 text-sm">
                <Row label="تاريخ الإحالة" value={patient.referral.date ? formatDate(patient.referral.date) : '—'} />
                <Row label="بلد الإحالة" value={opt(referralCountryOptions, patient.referral.country)} />
                <Row label="المركز المحوِّل" value={opt(referralCenterOptions, patient.referral.center)} />
                <Row label="اختصاص الطبيب" value={opt(referringSpecialtyOptions, patient.referral.referringDoctorSpecialty)} />
              </dl>
            </CardContent></Card>

            <Card><CardContent className="p-5">
              <h3 className="font-bold mb-3">العلاج والحالة</h3>
              <dl className="space-y-2 text-sm">
                <Row label="الحالة الحيوية" value={<Badge variant="secondary">{lifeStatusLabel[patient.lifeStatus]}</Badge>} />
                <Row label="تلقى علاجاً بدئياً" value={patient.generalTreatment.receivedInitialAtBasma === 'yes' ? 'نعم' : patient.generalTreatment.receivedInitialAtBasma === 'no' ? 'لا' : '—'} />
                <Row label="نوع العلاج البدئي" value={patient.generalTreatment.initialType === 'curative' ? 'شفاء' : patient.generalTreatment.initialType === 'palliative' ? 'تلطيفي' : '—'} />
                {patient.lifeStatus === 'deceased' && (
                  <Row label="تاريخ الوفاة" value={patient.followUp.deathDate ? formatDate(patient.followUp.deathDate) : '—'} />
                )}
              </dl>
            </CardContent></Card>
          </div>
        </TabsContent>

        {/* Appointments */}
        <TabsContent value="appointments">
          <Card><CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">{ar.record.appointments}</h3>
              <Button size="sm" onClick={() => navigate(`/appointments?fileNo=${patient.fileNoBasma}`)}><CalendarPlus className="h-4 w-4" />{ar.appt.new}</Button>
            </div>
            {patientAppointments.length ? (
              <div className="space-y-2">{patientAppointments.map((a) => <AppointmentRow key={a.id} appointment={a} showCancel />)}</div>
            ) : (
              <EmptyState title={ar.appt.empty} action={<Button variant="outline" size="sm" onClick={() => navigate(`/appointments?fileNo=${patient.fileNoBasma}`)}>{ar.appt.new}</Button>} />
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
                    <Badge variant="muted">{departmentLabel[c.department]}</Badge>
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
