import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarPlus, AlertTriangle, CheckCircle2, Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Field } from '@/components/ui/misc'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/states'
import { PageHeader } from '@/components/PageHeader'
import { AppointmentRow } from '@/components/AppointmentRow'
import { useStore } from '@/store/useStore'
import { doctors } from '@/mock/data'
import { ar } from '@/i18n/ar'
import { departmentOptions } from '@/i18n/enums'
import { genId, formatTime, MOCK_TODAY } from '@/lib/utils'
import type { Appointment, AppointmentType, Department } from '@/mock/types'

const TIME_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30']

export function AppointmentsScreen() {
  const [params] = useSearchParams()
  const patients = useStore((s) => s.patients)
  const appointments = useStore((s) => s.appointments)
  const addAppointment = useStore((s) => s.addAppointment)
  const pushNotification = useStore((s) => s.pushNotification)
  const pushToast = useStore((s) => s.pushToast)

  const [fileNo, setFileNo] = useState(params.get('fileNo') ?? '')
  const [department, setDepartment] = useState<Department>('clinic')
  const [doctorId, setDoctorId] = useState('')
  const [date, setDate] = useState('2026-06-08')
  const [time, setTime] = useState('')
  const [type, setType] = useState<AppointmentType>('followUp')
  const [notes, setNotes] = useState('')

  const patient = patients.find((p) => p.fileNoBasma === fileNo.trim())
  const deptDoctors = doctors.filter((d) => d.department === department)

  // Conflict check: same doctor + same dateTime already booked
  const conflict = useMemo(() => {
    if (!doctorId || !date || !time) return false
    const dt = `${date}T${time}:00`
    return appointments.some((a) => a.doctorId === doctorId && a.dateTime === dt && a.status !== 'cancelled')
  }, [appointments, doctorId, date, time])

  const bookedTimes = useMemo(() => {
    if (!doctorId || !date) return new Set<string>()
    return new Set(
      appointments
        .filter((a) => a.doctorId === doctorId && a.dateTime.startsWith(date) && a.status !== 'cancelled')
        .map((a) => formatTime(a.dateTime)),
    )
  }, [appointments, doctorId, date])

  const todays = appointments
    .filter((a) => new Date(a.dateTime).toDateString() === MOCK_TODAY.toDateString() && a.status !== 'cancelled')
    .sort((a, b) => a.dateTime.localeCompare(b.dateTime))

  const canConfirm = patient && doctorId && date && time && !conflict

  const confirm = () => {
    if (!canConfirm) return
    const appt: Appointment = {
      id: genId('ap'),
      patientFileNo: patient!.fileNoBasma,
      department,
      doctorId,
      dateTime: `${date}T${time}:00`,
      type,
      status: 'confirmed',
      notes: notes || undefined,
      createdByReceptionId: 'staff_1',
    }
    addAppointment(appt)
    pushNotification({ type: 'reminder', message: `تم تأكيد موعد ${patient!.firstName} ${patient!.familyName} بتاريخ ${date} ${time}`, relatedPatientFileNo: patient!.fileNoBasma, timestamp: MOCK_TODAY.toISOString() })
    pushToast({ variant: 'success', title: ar.appt.confirmed })
    setTime('')
    setNotes('')
  }

  return (
    <div>
      <PageHeader title={ar.appt.title} description="إنشاء وتعديل وإلغاء المواعيد مع التحقق من التعارض." />

      <div className="grid lg:grid-cols-2 gap-4">
        {/* New appointment form */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="font-bold flex items-center gap-2"><CalendarPlus className="h-4 w-4 text-primary" />{ar.appt.new}</h3>

            <Field label={ar.common.fileNo} required>
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={fileNo} onChange={(e) => setFileNo(e.target.value)} className="ps-9" placeholder={ar.common.searchByFile} />
              </div>
              {fileNo && (patient ? (
                <p className="text-xs text-secondary mt-1 font-bold">✓ {patient.firstName} {patient.familyName}</p>
              ) : (
                <p className="text-xs text-destructive mt-1 font-bold">{ar.patients.empty}</p>
              ))}
            </Field>

            <div className="grid sm:grid-cols-2 gap-3">
              <Field label={ar.common.department}>
                <Select value={department} onChange={(e) => { setDepartment(e.target.value as Department); setDoctorId('') }}>
                  {departmentOptions.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </Select>
              </Field>
              <Field label={ar.appt.doctor}>
                <Select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} placeholder="اختر الطبيب">
                  {deptDoctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </Select>
              </Field>
              <Field label={ar.appt.date}><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
              <Field label={ar.appt.type}>
                <Select value={type} onChange={(e) => setType(e.target.value as AppointmentType)}>
                  <option value="followUp">{ar.appt.followUp}</option>
                  <option value="initialExam">{ar.appt.initialExam}</option>
                </Select>
              </Field>
            </div>

            <Field label={ar.appt.time} required>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {TIME_SLOTS.map((t) => {
                  const taken = bookedTimes.has(t)
                  const active = time === t
                  return (
                    <button
                      key={t}
                      disabled={taken}
                      onClick={() => setTime(t)}
                      className={`rounded-lg border px-2 py-2 text-sm font-bold transition-colors ${
                        active ? 'border-primary bg-primary text-primary-foreground'
                        : taken ? 'border-border bg-muted text-muted-foreground line-through cursor-not-allowed'
                        : 'border-input bg-background hover:bg-accent-soft hover:text-accent'
                      }`}
                    >
                      {t}
                    </button>
                  )
                })}
              </div>
            </Field>

            {conflict && (
              <div className="rounded-lg bg-warning/15 text-warning-foreground p-3 text-sm font-bold flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  {ar.appt.conflict}
                  <p className="font-normal mt-1">{ar.appt.alternatives}: {TIME_SLOTS.filter((t) => !bookedTimes.has(t)).slice(0, 3).join('، ')}</p>
                </div>
              </div>
            )}

            <Field label={`${ar.appt.notes} (${ar.common.optional})`}><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>

            <Button className="w-full" disabled={!canConfirm} onClick={confirm}>
              <CheckCircle2 className="h-5 w-5" />
              {ar.common.confirm}
            </Button>
          </CardContent>
        </Card>

        {/* Today's appointments */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">{ar.appt.title} — {ar.common.today}</h3>
              <Badge variant="muted">{todays.length}</Badge>
            </div>
            {todays.length ? (
              <div className="space-y-2">{todays.map((a) => <AppointmentRow key={a.id} appointment={a} showCancel />)}</div>
            ) : (
              <EmptyState title={ar.appt.empty} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
