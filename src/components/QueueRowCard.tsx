import { useNavigate } from 'react-router-dom'
import { PhoneCall, IdCard, ChevronLeft, Siren } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConsultIcons } from './ConsultIcons'
import { TokenStatusBadge } from './StatusBadges'
import { useStore } from '@/store/useStore'
import { ar } from '@/i18n/ar'
import { formatTime, formatWait, formatAge, cn } from '@/lib/utils'
import type { QueueRow } from '@/lib/selectors'

/** A single token row in a department lane (token #, file #, name, age, arrival, wait, status, consults). */
export function QueueRowCard({ row, showActions = true }: { row: QueueRow; showActions?: boolean }) {
  const navigate = useNavigate()
  const callToken = useStore((s) => s.callToken)
  const pushToast = useStore((s) => s.pushToast)
  const { token, patient, checkIn } = row
  const name = patient ? `${patient.firstName} ${patient.familyName}` : 'مريض غير مسجّل'

  const open = () => patient && navigate(`/patients/${patient.fileNoBasma}`)

  return (
    <div
      className={cn(
        'rounded-xl border p-3 transition-colors',
        token.isEmergency ? 'border-warning/60 bg-warning/10' : 'border-border bg-card hover:bg-muted/40',
      )}
    >
      <div className="flex items-start gap-3">
        {/* Token number block */}
        <div
          className={cn(
            'flex flex-col items-center justify-center rounded-lg px-2.5 py-1.5 min-w-[3.25rem] shrink-0',
            token.isEmergency ? 'bg-warning/30 text-warning-foreground' : 'bg-primary-soft text-primary',
          )}
        >
          {token.isEmergency && <Siren className="h-3.5 w-3.5 mb-0.5" />}
          <span className="font-display font-bold text-base leading-none">{token.number}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={open} className="font-bold text-foreground hover:text-primary truncate text-start">
              {name}
            </button>
            {patient && <ConsultIcons needs={patient.consultationNeeds} patient={patient} />}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span className="font-bold text-foreground/80">{ar.common.fileNo}: {token.patientFileNo}</span>
            {patient && <span>{formatAge(patient.dob)}</span>}
            {checkIn && <span>{ar.common.arrivalTime}: {formatTime(checkIn.arrivalTime)}</span>}
            <span>{ar.common.wait}: {checkIn ? formatWait(checkIn.arrivalTime) : '—'}</span>
          </div>
          <div className="mt-2">
            <TokenStatusBadge status={token.status} emergency={token.isEmergency} />
            {token.pendingData && (
              <span className="ms-2 text-xs font-bold text-warning-foreground">• {ar.emergency.pendingFlag}</span>
            )}
          </div>
        </div>
      </div>

      {showActions && (
        <div className="mt-3 flex items-center gap-1.5">
          {token.status === 'waiting' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                callToken(token.id)
                pushToast({ variant: 'info', title: ar.common.call, description: `${token.number} — ${name}` })
              }}
            >
              <PhoneCall className="h-4 w-4" />
              {ar.common.call}
            </Button>
          )}
          {patient && (
            <Button size="sm" variant="ghost" onClick={() => navigate(`/patients/${patient.fileNoBasma}/id-card`)}>
              <IdCard className="h-4 w-4" />
              {ar.patients.printId}
            </Button>
          )}
          <Button size="sm" variant="ghost" className="ms-auto" onClick={open}>
            {ar.common.open}
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
