import { useEffect } from 'react'
import { CheckCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/states'
import { PageHeader } from '@/components/PageHeader'
import { NotificationRow } from '@/components/NotificationRow'
import { useStore } from '@/store/useStore'
import { ar } from '@/i18n/ar'

export function NotificationsScreen() {
  const notifications = useStore((s) => s.notifications)
  const unreadCount = useStore((s) => s.unreadCount)
  const loading = useStore((s) => s.notificationsLoading)
  const error = useStore((s) => s.notificationsError)
  const fetchNotifications = useStore((s) => s.fetchNotifications)
  const markAll = useStore((s) => s.markAllNotificationsRead)

  useEffect(() => {
    void fetchNotifications()
  }, [fetchNotifications])

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title={ar.notif.title}
        description={unreadCount ? `${unreadCount} ${ar.notif.unread}` : undefined}
        action={
          unreadCount ? (
            <Button variant="outline" onClick={() => void markAll()}>
              <CheckCheck className="h-4 w-4" />
              {ar.notif.markAll}
            </Button>
          ) : undefined
        }
      />
      <Card>
        <CardContent className="p-4">
          {loading && notifications.length === 0 ? (
            <ListSkeleton rows={5} />
          ) : error && notifications.length === 0 ? (
            <ErrorState onRetry={() => void fetchNotifications()} />
          ) : notifications.length ? (
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
