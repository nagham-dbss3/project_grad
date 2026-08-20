import { useState } from 'react'
import { CalendarDays, CheckCircle2, Clock, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store/useStore'
import { useMasterData } from '@/lib/useMasterData'
import { ar } from '@/i18n/ar'
import { formatDate, formatTime } from '@/lib/utils'
import type { Appointment, AppointmentStatus } from '@/mock/types'

const statusMeta: Record<AppointmentStatus, { label: string; variant: 'default' | 'secondary' | 'muted' | 'warning' }> = {
  scheduled: { label: 'مجدول', variant: 'warning' },
  confirmed: { label: 'مؤكد', variant: 'secondary' },
  cancelled: { label: 'ملغى', variant: 'muted' },
  completed: { label: 'منتهٍ', variant: 'default' },
}

export function AppointmentRow({
  appointment,
  showCancel,
  onCancelled,
  onConfirmed,
  onCompleted,
}: {
  appointment: Appointment
  showCancel?: boolean
  onCancelled?: (appointment: Appointment) => void
  onConfirmed?: (appointment: Appointment) => void
  onCompleted?: (appointment: Appointment) => void
}) {
  const cancelAppointment = useStore((s) => s.cancelAppointment)
  const confirmAppointment = useStore((s) => s.confirmAppointment)
  const completeAppointment = useStore((s) => s.completeAppointment)
  const pushToast = useStore((s) => s.pushToast)
  const { getDepartmentLabel } = useMasterData()
  const [cancelling, setCancelling] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [completing, setCompleting] = useState(false)

  const doctor = appointment.doctorName
  const meta = statusMeta[appointment.status]
  const patientLabel = appointment.patientName ?? appointment.patientFileNo
  const busy = confirming || cancelling || completing

  const handleConfirm = async () => {
    setConfirming(true)
    const updated = await confirmAppointment(appointment.id)
    setConfirming(false)
    if (updated) {
      onConfirmed?.(updated)
      pushToast({ variant: 'success', title: ar.appt.confirmSuccess })
    }
  }

  const handleComplete = async () => {
    setCompleting(true)
    const updated = await completeAppointment(appointment.id)
    setCompleting(false)
    if (updated) {
      onCompleted?.(updated)
      pushToast({ variant: 'success', title: ar.appt.completeSuccess })
    }
  }

  const handleCancel = async () => {
    setCancelling(true)
    const updated = await cancelAppointment(appointment.id)
    setCancelling(false)
    if (updated) {
      onCancelled?.(updated)
      pushToast({ variant: 'info', title: ar.appt.cancelled })
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary shrink-0">
        <CalendarDays className="h-5 w-5" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold">{formatDate(appointment.dateTime)}</span>
          <span className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{formatTime(appointment.dateTime)}</span>
          <Badge variant={meta.variant}>{meta.label}</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {patientLabel} · {getDepartmentLabel(appointment.department)}{doctor && ` · ${doctor}`} · {appointment.type === 'followUp' ? ar.appt.followUp : ar.appt.initialExam}
        </p>
        {appointment.notes && <p className="text-xs text-muted-foreground mt-0.5">{appointment.notes}</p>}
      </div>
      {appointment.status === 'scheduled' && (
        <Button
          size="sm"
          variant="outline"
          className="border-primary bg-background text-primary hover:bg-primary-soft hover:text-primary"
          disabled={busy}
          onClick={() => void handleConfirm()}
        >
          <CheckCircle2 className="h-4 w-4" />
          {ar.appt.confirmAppointment}
        </Button>
      )}
      {showCancel && appointment.status === 'scheduled' && (
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => void handleCancel()}>
          <X className="h-4 w-4" />
          {ar.appt.cancel}
        </Button>
      )}
      {appointment.status === 'confirmed' && (
        <Button size="sm" disabled={busy} onClick={() => void handleComplete()}>
          <CheckCircle2 className="h-4 w-4" />
          {ar.appt.completeAppointment}
        </Button>
      )}
    </div>
  )
}
