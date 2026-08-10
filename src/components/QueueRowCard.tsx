import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PhoneCall,
  IdCard,
  ChevronLeft,
  CheckCircle2,
  MoreVertical,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConsultIcons } from './ConsultIcons'
import { TokenStatusBadge, EmergencyBadge, PendingCompletionBadge } from './StatusBadges'
import { useStore } from '@/store/useStore'
import { patientConsultNeeds } from '@/lib/consultRequests'
import { useLiveNow } from '@/hooks/useLiveNow'
import { ar } from '@/i18n/ar'
import { formatTime, formatWait, formatAge, cn } from '@/lib/utils'
import type { QueueRow } from '@/lib/selectors'

/** Queue card matching the reference layout: name · consults · token badge · meta · status · actions. */
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
  const cancelQueueToken = useStore((s) => s.cancelQueueToken)
  const pushToast = useStore((s) => s.pushToast)
  const consultRequests = useStore((s) => s.consultRequests)
  const now = useLiveNow(30_000)

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const { token, patient, checkIn } = row
  const resolvedPatient = patient ?? getPatient(token.patientFileNo)
  const fileNo = token.patientFileNo
  const name = resolvedPatient
    ? `${resolvedPatient.firstName} ${resolvedPatient.familyName}`.trim()
    : 'مريض غير مسجّل'

  const arrivalIso = checkIn?.arrivalTime || token.issueTime
  const consultNeeds = resolvedPatient
    ? patientConsultNeeds(resolvedPatient, consultRequests)
    : []
  const ageLabel = resolvedPatient ? formatAge(resolvedPatient.dob) : ''
  const isWaiting = token.status === 'waiting'
  const isCalled = token.status === 'called'
  const canCancel = isWaiting || isCalled
  const needsCompletion =
    Boolean(token.pendingData)
    || resolvedPatient?.registrationStatus === 'partial'
    || resolvedPatient?.registrationStatus === 'pending'
    || resolvedPatient?.unregistered === true
  const showEmergency = token.isEmergency && token.status !== 'served' && token.status !== 'cancelled'

  useEffect(() => {
    if (!menuOpen) return
    const onPointer = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const open = () => {
    if (fileNo) navigate(`/patients/${encodeURIComponent(fileNo)}`)
  }

  const handleCancel = () => {
    setMenuOpen(false)
    void cancelQueueToken(token.id)
  }

  const handleCall = async () => {
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
  }

  const handleServed = async () => {
    const ok = await setTokenStatus(token.id, 'served')
    if (ok) {
      pushToast({ variant: 'success', title: ar.tokenStatus.served, description: `${token.number} — ${name}` })
    }
  }

  return (
    <div
      className={cn(
        'relative rounded-xl border bg-card p-3.5 transition-colors hover:bg-muted/30',
        token.isEmergency && 'border-warning/50 bg-warning/5',
      )}
    >
      {/* Header: name + consult icons · token badge · overflow menu */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={open}
              className="font-bold text-foreground hover:text-primary text-start truncate"
              disabled={!fileNo}
            >
              {name}
            </button>
            {consultNeeds.length > 0 && (
              <ConsultIcons needs={consultNeeds} patient={resolvedPatient} />
            )}
          </div>
        </div>

        <Badge
          variant={token.isEmergency ? 'warning' : 'default'}
          className={cn(
            'shrink-0 font-display text-sm px-2.5 py-1',
            token.isEmergency ? 'bg-warning/35 text-warning-foreground' : 'bg-primary-soft text-primary',
          )}
        >
          {token.number}
        </Badge>

        {/* Keep cancel in overflow menu — do not remove */}
        {showActions && canCancel && (
          <div className="relative shrink-0 -mt-0.5" ref={menuRef}>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground"
              aria-label="المزيد"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute end-0 top-full z-20 mt-1 min-w-[10.5rem] rounded-lg border bg-card py-1 shadow-card animate-fade-in"
              >
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm font-bold text-destructive hover:bg-destructive/10"
                  onClick={handleCancel}
                >
                  <X className="h-4 w-4" />
                  {ar.queue.cancelAction}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Meta: file · age · arrival · live wait */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="font-bold text-foreground/85">
          {ar.common.fileNo}: {token.patientFileNo || '—'}
        </span>
        {ageLabel ? <span>{ageLabel}</span> : null}
        <span className="font-bold text-foreground/85">
          {ar.common.arrivalTime}: {formatTime(arrivalIso)}
        </span>
        <span>
          {ar.common.wait}: {formatWait(arrivalIso, now)}
        </span>
      </div>

      {/* Status badges — emergency + pending completion side-by-side on one row */}
      <div className="mt-2.5 flex flex-row items-center gap-2 flex-nowrap">
        {showEmergency && <EmergencyBadge />}
        {needsCompletion && <PendingCompletionBadge />}
        {!showEmergency && <TokenStatusBadge status={token.status} />}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {isWaiting && (
            <Button size="sm" variant="outline" disabled={callBlocked} onClick={() => void handleCall()}>
              <PhoneCall className="h-4 w-4" />
              {ar.common.call}
            </Button>
          )}
          {isCalled && (
            <Button size="sm" variant="outline" onClick={() => void handleServed()}>
              <CheckCircle2 className="h-4 w-4" />
              {ar.tokenStatus.served}
            </Button>
          )}
          {fileNo && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/patients/${encodeURIComponent(fileNo)}/id-card`)}
            >
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
