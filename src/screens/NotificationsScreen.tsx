import { CheckCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/states'
import { PageHeader } from '@/components/PageHeader'
import { NotificationRow } from '@/components/NotificationRow'
import { useStore } from '@/store/useStore'
import { ar } from '@/i18n/ar'

export function NotificationsScreen() {
  const notifications = useStore((s) => s.notifications)
  const markAll = useStore((s) => s.markAllNotificationsRead)
  const unread = notifications.filter((n) => !n.isRead).length

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title={ar.notif.title}
        description={unread ? `${unread} ${ar.notif.unread}` : undefined}
        action={
          unread ? (
            <Button variant="outline" onClick={markAll}>
              <CheckCheck className="h-4 w-4" />
              {ar.notif.markAll}
            </Button>
          ) : undefined
        }
      />
      <Card>
        <CardContent className="p-4">
          {notifications.length ? (
            <div className="divide-y">
              {notifications.map((n) => <NotificationRow key={n.id} notification={n} />)}
            </div>
          ) : (
            <EmptyState title={ar.notif.empty} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
