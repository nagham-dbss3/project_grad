import { useNavigate } from 'react-router-dom'
import { PhoneCall, IdCard, ChevronLeft, Siren, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConsultIcons } from './ConsultIcons'
import { TokenStatusBadge } from './StatusBadges'
import { useStore } from '@/store/useStore'
import { ar } from '@/i18n/ar'
import { formatTime, formatWait, formatAge, cn } from '@/lib/utils'
import type { QueueRow } from '@/lib/selectors'

/** A single token row in a department lane (token #, file #, name, age, arrival, wait, status, consults). */
export function QueueRowCard({
  row,
  showActions = true,
  onCallToken,
  callBlocked = false,
}: {
  row: QueueRow
  showActions?: boolean
  onCallToken?: (tokenId: string) => Promise<void>
  callBlocked?: boolean
}) {
  const navigate = useNavigate()
  const getPatient = useStore((s) => s.getPatient)
  const callToken = useStore((s) => s.callToken)
  const setTokenStatus = useStore((s) => s.setTokenStatus)
  const pushToast = useStore((s) => s.pushToast)
  const { token, patient, checkIn } = row
  const resolvedPatient = patient ?? getPatient(token.patientFileNo)
  const fileNo = token.patientFileNo
  const name = resolvedPatient
    ? `${resolvedPatient.firstName} ${resolvedPatient.familyName}`.trim()
    : 'مريض غير مسجّل'

  const open = () => {
    if (fileNo) navigate(`/patients/${encodeURIComponent(fileNo)}`)
  }

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
            {resolvedPatient && <ConsultIcons needs={resolvedPatient.consultationNeeds} patient={resolvedPatient} />}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span className="font-bold text-foreground/80">{ar.common.fileNo}: {token.patientFileNo}</span>
            {resolvedPatient && <span>{formatAge(resolvedPatient.dob)}</span>}
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
              disabled={callBlocked}
              onClick={async () => {
                if (callBlocked) {
                  pushToast({ variant: 'warning', title: ar.nav.queue, description: ar.checkin.waitForServed })
                  return
                }
                if (onCallToken) {
                  await onCallToken(token.id)
                  return
                }
                const ok = await callToken(token.id)
                if (ok) {
                  pushToast({ variant: 'info', title: ar.common.call, description: `${token.number} — ${name}` })
                }
              }}
            >
              <PhoneCall className="h-4 w-4" />
              {ar.common.call}
            </Button>
          )}
          {token.status === 'called' && (
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const ok = await setTokenStatus(token.id, 'served')
                if (ok) {
                  pushToast({ variant: 'success', title: ar.tokenStatus.served, description: `${token.number} — ${name}` })
                }
              }}
            >
              <CheckCircle2 className="h-4 w-4" />
              {ar.tokenStatus.served}
            </Button>
          )}
          {fileNo && (
            <Button size="sm" variant="ghost" onClick={() => navigate(`/patients/${encodeURIComponent(fileNo)}/id-card`)}>
              <IdCard className="h-4 w-4" />
              {ar.patients.printId}
            </Button>
          )}
          <Button size="sm" variant="ghost" className="ms-auto" onClick={open} disabled={!fileNo}>
            {ar.common.open}
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
