import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarPlus, AlertTriangle, CheckCircle2, Search, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Field } from '@/components/ui/misc'
import { Badge } from '@/components/ui/badge'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/states'
import { PageHeader } from '@/components/PageHeader'
import { AppointmentRow } from '@/components/AppointmentRow'
import { useStore } from '@/store/useStore'
import { apiToAppointment, fetchAppointmentsRequest } from '@/lib/api'
import { doctorsForDepartment } from '@/lib/masterData'
import { ar } from '@/i18n/ar'
import { useMasterData } from '@/lib/useMasterData'
import { formatTime, todayIsoDate } from '@/lib/utils'
import type { Appointment, AppointmentType, Department } from '@/mock/types'

const TIME_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30']

export function AppointmentsScreen() {
  const [params] = useSearchParams()
  const patients = useStore((s) => s.patients)
  const fetchPatientDetails = useStore((s) => s.fetchPatientDetails)
  const getPatient = useStore((s) => s.getPatient)
  const fetchAppointments = useStore((s) => s.fetchAppointments)
  const token = useStore((s) => s.token)
  const doctors = useStore((s) => s.doctors)
  const fetchDoctors = useStore((s) => s.fetchDoctors)
  const createAppointment = useStore((s) => s.createAppointment)
  const pushToast = useStore((s) => s.pushToast)
  const { departmentOptions } = useMasterData()
  const appointmentsLoading = useStore((s) => s.appointmentsLoading)
  const appointmentsError = useStore((s) => s.appointmentsError)

  const patientFileFromUrl = params.get('patient_file_no')?.trim() ?? ''

  const [fileNo, setFileNo] = useState(patientFileFromUrl)
  const [department, setDepartment] = useState<Department>('clinic')
  const [doctorId, setDoctorId] = useState('')
  const [doctorsLoading, setDoctorsLoading] = useState(false)

  useEffect(() => {
    if (departmentOptions.length && !departmentOptions.some((d) => d.value === department)) {
      setDepartment(departmentOptions[0].value)
    }
  }, [departmentOptions, department])

  useEffect(() => {
    let cancelled = false
    setDoctorId('')
    setDoctorsLoading(true)
    void fetchDoctors(department).finally(() => {
      if (!cancelled) setDoctorsLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [department, fetchDoctors])

  const doctorOptions = useMemo(
    () => doctorsForDepartment(doctors, department),
    [doctors, department],
  )
  const [date, setDate] = useState(todayIsoDate())
  const [listDate, setListDate] = useState(todayIsoDate())
  const [time, setTime] = useState('')
  const [type, setType] = useState<AppointmentType>('followUp')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [listAppointments, setListAppointments] = useState<Appointment[]>([])
  const [slotAppointments, setSlotAppointments] = useState<Appointment[]>([])

  useEffect(() => {
    setFileNo(patientFileFromUrl)
    if (patientFileFromUrl && !getPatient(patientFileFromUrl)) {
      void fetchPatientDetails(patientFileFromUrl)
    }
  }, [patientFileFromUrl, getPatient, fetchPatientDetails])

  const loadList = useCallback(async () => {
    const rows = await fetchAppointments(listDate)
    setListAppointments(rows)
  }, [fetchAppointments, listDate])

  useEffect(() => {
    void loadList()
  }, [loadList])

  useEffect(() => {
    if (date === listDate) {
      setSlotAppointments(listAppointments)
      return
    }
    if (!token) {
      setSlotAppointments([])
      return
    }
    let cancelled = false
    fetchAppointmentsRequest(token, date)
      .then((res) => {
        if (!cancelled) setSlotAppointments(res.data.map(apiToAppointment).filter((a) => a.status !== 'cancelled'))
      })
      .catch(() => {
        if (!cancelled) setSlotAppointments([])
      })
    return () => {
      cancelled = true
    }
  }, [date, listDate, listAppointments, token])

  const patient = patients.find((p) => p.fileNoBasma === fileNo.trim())
    ?? (patientFileFromUrl && fileNo.trim() === patientFileFromUrl ? getPatient(patientFileFromUrl) : undefined)

  const conflict = useMemo(() => {
    if (!doctorId || !date || !time) return false
    const dt = `${date}T${time}:00`
    return slotAppointments.some((a) => a.doctorId === doctorId && a.dateTime.startsWith(dt) && a.status !== 'cancelled')
  }, [slotAppointments, doctorId, date, time])

  const bookedTimes = useMemo(() => {
    if (!doctorId || !date) return new Set<string>()
    return new Set(
      slotAppointments
        .filter((a) => a.doctorId === doctorId && a.dateTime.startsWith(date) && a.status !== 'cancelled')
        .map((a) => formatTime(a.dateTime)),
    )
  }, [slotAppointments, doctorId, date])

  const sortedList = useMemo(
    () => [...listAppointments].filter((a) => a.status !== 'cancelled').sort((a, b) => a.dateTime.localeCompare(b.dateTime)),
    [listAppointments],
  )

  const canConfirm = patient && doctorId && date && time && !conflict && !submitting

  const confirm = async () => {
    if (!canConfirm || !patient) return
    setSubmitting(true)
    const appt = await createAppointment({
      patientFileNo: patient.fileNoBasma,
      department,
      doctorId,
      scheduledAt: `${date}T${time}:00`,
      type,
      notes: notes || undefined,
    })
    setSubmitting(false)
    if (!appt) return

    if (date === listDate) {
      setListAppointments((prev) => [...prev, appt])
    }
    if (date !== listDate) {
      setSlotAppointments((prev) => [...prev, appt])
    }
    pushToast({ variant: 'success', title: ar.appt.confirmed })
    setDoctorId('')
    setTime('')
    setNotes('')
  }

  const handleCancelled = (updated: Appointment) => {
    const remove = (prev: Appointment[]) => prev.filter((a) => a.id !== updated.id)
    setListAppointments(remove)
    setSlotAppointments(remove)
  }

  const handleConfirmed = (updated: Appointment) => {
    const replace = (prev: Appointment[]) => prev.map((a) => (a.id === updated.id ? updated : a))
    setListAppointments(replace)
    setSlotAppointments(replace)
  }

  const listTitle =
    listDate === todayIsoDate()
      ? `${ar.appt.title} — ${ar.common.today}`
      : `${ar.appt.title} — ${listDate}`

  return (
    <div>
      <PageHeader title={ar.appt.title} description="إنشاء وتعديل وإلغاء المواعيد مع التحقق من التعارض." />

      <div className="grid lg:grid-cols-2 gap-4">
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
                <Select value={department} onChange={(e) => setDepartment(e.target.value as Department)}>
                  {departmentOptions.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </Select>
              </Field>
              <Field label={ar.appt.doctor} required>
                <div className="relative">
                  <Select
                    value={doctorId}
                    onChange={(e) => setDoctorId(e.target.value)}
                    disabled={doctorsLoading || doctorOptions.length === 0}
                  >
                    <option value="">
                      {doctorsLoading
                        ? ar.appt.loadingDoctors
                        : doctorOptions.length
                          ? ar.appt.selectDoctor
                          : ar.appt.noDoctors}
                    </option>
                    {doctorOptions.map((d) => (
                      <option key={d.id} value={String(d.id)}>{d.name}</option>
                    ))}
                  </Select>
                  {doctorsLoading ? (
                    <Loader2 className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground pointer-events-none" />
                  ) : null}
                </div>
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
                      type="button"
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

            <Button className="w-full" disabled={!canConfirm} onClick={() => void confirm()}>
              <CheckCircle2 className="h-5 w-5" />
              {ar.common.confirm}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h3 className="font-bold">{listTitle}</h3>
              <div className="flex items-center gap-2">
                <Input type="date" value={listDate} onChange={(e) => setListDate(e.target.value)} className="w-auto" />
                <Badge variant="muted">{sortedList.length}</Badge>
              </div>
            </div>
            {appointmentsLoading ? (
              <ListSkeleton rows={4} />
            ) : appointmentsError ? (
              <ErrorState onRetry={() => void loadList()} />
            ) : sortedList.length ? (
              <div className="space-y-2">
                {sortedList.map((a) => (
                  <AppointmentRow key={a.id} appointment={a} showCancel onCancelled={handleCancelled} onConfirmed={handleConfirmed} onCompleted={handleConfirmed} />
                ))}
              </div>
            ) : (
              <EmptyState title={ar.appt.empty} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
