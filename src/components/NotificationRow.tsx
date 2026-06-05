import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Info, BellRing } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store/useStore'
import { ar } from '@/i18n/ar'
import { formatTime, formatDate, cn } from '@/lib/utils'
import type { AppNotification, NotificationType } from '@/mock/types'

const typeMeta: Record<NotificationType, { icon: typeof Info; tone: string }> = {
  alert: { icon: AlertTriangle, tone: 'bg-warning/25 text-warning-foreground' },
  info: { icon: Info, tone: 'bg-primary-soft text-primary' },
  reminder: { icon: BellRing, tone: 'bg-accent-soft text-accent' },
}

export function NotificationRow({ notification, compact }: { notification: AppNotification; compact?: boolean }) {
  const navigate = useNavigate()
  const markRead = useStore((s) => s.markNotificationRead)
  const meta = typeMeta[notification.type]
  const Icon = meta.icon

  const onClick = () => {
    markRead(notification.id)
    if (notification.relatedPatientFileNo) navigate(`/patients/${notification.relatedPatientFileNo}`)
  }

  return (
    <div className={cn('flex items-start gap-3 py-3', !notification.isRead && 'ps-2')}>
      {!notification.isRead && <span className="mt-2 h-2 w-2 rounded-full bg-primary shrink-0" />}
      <span className={cn('inline-flex h-8 w-8 items-center justify-center rounded-lg shrink-0', meta.tone)}>
        <Icon className="h-4 w-4" />
      </span>
      <button onClick={onClick} className="flex-1 min-w-0 text-start">
        <p className={cn('text-sm leading-snug', notification.isRead ? 'text-muted-foreground' : 'font-bold text-foreground')}>
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {compact ? formatTime(notification.timestamp) : `${formatDate(notification.timestamp)} · ${formatTime(notification.timestamp)}`}
          {notification.relatedPatientFileNo && ` · ${ar.common.fileNo} ${notification.relatedPatientFileNo}`}
        </p>
      </button>
      {!notification.isRead && !compact && (
        <Button variant="ghost" size="sm" onClick={() => markRead(notification.id)}>
          {ar.notif.markRead}
        </Button>
      )}
    </div>
  )
}
