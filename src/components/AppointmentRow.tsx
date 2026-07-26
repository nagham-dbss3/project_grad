import { useState } from 'react'
import { CalendarDays, Clock, X } from 'lucide-react'
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
}: {
  appointment: Appointment
  showCancel?: boolean
  onCancelled?: (appointment: Appointment) => void
}) {
  const cancelAppointment = useStore((s) => s.cancelAppointment)
  const pushToast = useStore((s) => s.pushToast)
  const { getDepartmentLabel } = useMasterData()
  const [cancelling, setCancelling] = useState(false)

  const doctor = appointment.doctorName
  const meta = statusMeta[appointment.status]
  const patientLabel = appointment.patientName ?? appointment.patientFileNo

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
      {showCancel && appointment.status !== 'cancelled' && (
        <Button size="sm" variant="ghost" disabled={cancelling} onClick={() => void handleCancel()}>
          <X className="h-4 w-4" />
          {ar.appt.cancel}
        </Button>
      )}
    </div>
  )
}
