import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ScanLine,
  Keyboard,
  Siren,
  Clock,
  UserPlus,
  CalendarDays,
  Stethoscope,
  ChevronLeft,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ListSkeleton, ErrorState } from '@/components/ui/states'
import { Skeleton } from '@/components/ui/misc'
import { DepartmentLane, deptIcon } from '@/components/DepartmentLane'
import { NotificationRow } from '@/components/NotificationRow'
import { useStore } from '@/store/useStore'
import { dashboardStats } from '@/lib/selectors'
import { ar } from '@/i18n/ar'
import { formatDate, cn, todayIsoDate } from '@/lib/utils'
import type { Department } from '@/mock/types'

const departments: Department[] = ['clinic', 'dayCare', 'inpatient']

export function DashboardScreen() {
  const navigate = useNavigate()
  const staff = useStore((s) => s.staff)
  const queues = useStore((s) => s.queues)
  const queuesLoading = useStore((s) => s.queuesLoading)
  const queuesError = useStore((s) => s.queuesError)
  const fetchQueues = useStore((s) => s.fetchQueues)
  const fetchPatients = useStore((s) => s.fetchPatients)
  const patients = useStore((s) => s.patients)
  const tokens = useStore((s) => s.tokens)
  const appointments = useStore((s) => s.appointments)
  const fetchAppointments = useStore((s) => s.fetchAppointments)
  const notifications = useStore((s) => s.notifications)
  const [activeTab, setActiveTab] = useState<Department>('clinic')

  useEffect(() => {
    fetchQueues()
    fetchPatients()
    void fetchAppointments(todayIsoDate())
  }, [fetchQueues, fetchPatients, fetchAppointments])

  const todaysAppointments = useMemo(
    () => appointments.filter((a) => a.dateTime.startsWith(todayIsoDate()) && a.status !== 'cancelled').length,
    [appointments],
  )
  const stats = useMemo(() => dashboardStats(tokens, patients, todaysAppointments), [tokens, patients, todaysAppointments])

  return (
    <div className="space-y-5">
      {/* 1. Greeting strip */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {ar.dash.greeting} {staff?.firstName} 👋
          </h1>
          <p className="text-sm text-muted-foreground">{formatDate(new Date().toISOString())}</p>
        </div>
        <div className="flex items-center gap-2">
          <MiniStat label={ar.dash.arrived} value={stats.arrived} tone="primary" />
          <MiniStat label={ar.dash.waiting} value={stats.waiting} tone="warning" />
          <MiniStat label={ar.dash.served} value={stats.served} tone="secondary" />
        </div>
      </div>

      {/* 2. Check-in panel (scan-first) + emergency */}
      <Card className="overflow-hidden border-primary/20">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
            <div className="flex-1">
              <h2 className="text-lg font-bold">{ar.dash.checkInPanelTitle}</h2>
              <p className="text-sm text-muted-foreground">
                امسح رمز الإضبارة لتسجيل وصول المريض ووقت الوصول تلقائياً.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 lg:w-auto">
              <Button size="lg" className="sm:min-w-[14rem]" onClick={() => navigate('/check-in')}>
                <ScanLine className="h-5 w-5" />
                {ar.dash.scanCta}
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/check-in?manual=1')}>
                <Keyboard className="h-5 w-5" />
                {ar.dash.manualCta}
              </Button>
              <Button size="lg" variant="warning" onClick={() => navigate('/emergency')}>
                <Siren className="h-5 w-5" />
                {ar.common.emergency}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Action-needed cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <ActionCard icon={Clock} label={ar.dash.waiting} value={stats.waiting} tone="warning" onClick={() => navigate('/queue')} />
        <ActionCard icon={UserPlus} label={ar.dash.newToRegister} value={stats.newToRegister} tone="accent" onClick={() => navigate('/patients?filter=new')} />
        <ActionCard icon={CalendarDays} label={ar.dash.todaysAppointments} value={stats.todaysAppointments} tone="primary" onClick={() => navigate('/appointments')} />
        <ActionCard icon={Siren} label={ar.dash.activeEmergencies} value={stats.activeEmergencies} tone="emergency" onClick={() => navigate('/queue')} />
        <ActionCard icon={Stethoscope} label={ar.consult.needsCoordination} value={stats.consultsToCoordinate} tone="consult" onClick={() => navigate('/patients?filter=consult')} />
      </div>

      {/* 4. Queues split by department */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">{ar.dash.queuesTitle}</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/queue')}>
            {ar.nav.queue}
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {queuesLoading ? (
          <div className="grid lg:grid-cols-3 gap-4">
            {departments.map((d) => (
              <div key={d} className="rounded-2xl border p-3">
                <Skeleton className="h-8 w-32 mb-3" />
                <ListSkeleton rows={2} />
              </div>
            ))}
          </div>
        ) : queuesError ? (
          <Card>
            <ErrorState onRetry={() => fetchQueues()} />
          </Card>
        ) : (
          <>
            {/* Desktop / tablet: side-by-side lanes */}
            <div className="hidden md:grid md:grid-cols-3 gap-4">
              {departments.map((d) => (
                <DepartmentLane key={d} department={d} rows={queues[d]} />
              ))}
            </div>
            {/* Phone: tabbed lanes */}
            <div className="md:hidden">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Department)}>
                <TabsList className="w-full">
                  {departments.map((d) => {
                    const Icon = deptIcon[d]
                    return (
                      <TabsTrigger key={d} value={d}>
                        <Icon className="h-4 w-4" />
                        {ar.dept[d]}
                        <span className="text-xs">({queues[d].filter((r) => r.token.status === 'waiting').length})</span>
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
                {departments.map((d) => (
                  <TabsContent key={d} value={d} className="mt-3">
                    <DepartmentLane department={d} rows={queues[d]} />
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </>
        )}
      </div>

      {/* 5. Notifications feed */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold">{ar.dash.notificationsFeed}</h2>
            <Button variant="link" size="sm" onClick={() => navigate('/notifications')}>
              {ar.dash.viewAll}
            </Button>
          </div>
          <div className="divide-y">
            {notifications.slice(0, 4).map((n) => (
              <NotificationRow key={n.id} notification={n} compact />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone: 'primary' | 'warning' | 'secondary' }) {
  const toneMap = {
    primary: 'text-primary',
    warning: 'text-warning-foreground',
    secondary: 'text-secondary',
  } as const
  return (
    <div className="text-center px-3 py-1.5 rounded-lg bg-card border">
      <p className={cn('text-xl font-bold leading-none font-display', toneMap[tone])}>{value}</p>
      <p className="text-[11px] text-muted-foreground mt-1">{label}</p>
    </div>
  )
}

const toneStyles: Record<string, { bg: string; text: string }> = {
  warning: { bg: 'bg-warning/20', text: 'text-warning-foreground' },
  accent: { bg: 'bg-accent-soft', text: 'text-accent' },
  primary: { bg: 'bg-primary-soft', text: 'text-primary' },
  emergency: { bg: 'bg-warning/25', text: 'text-warning-foreground' },
  consult: { bg: 'bg-accent-soft', text: 'text-accent' },
}

function ActionCard({
  icon: Icon,
  label,
  value,
  tone,
  onClick,
}: {
  icon: LucideIcon
  label: string
  value: number
  tone: keyof typeof toneStyles
  onClick: () => void
}) {
  const s = toneStyles[tone]
  return (
    <button
      onClick={onClick}
      className={cn(
        'text-start rounded-xl border bg-card p-3.5 transition-all hover:shadow-soft hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        tone === 'emergency' && value > 0 ? 'border-warning/50' : '',
      )}
    >
      <span className={cn('inline-flex h-9 w-9 items-center justify-center rounded-lg mb-2', s.bg, s.text)}>
        <Icon className="h-5 w-5" />
      </span>
      <p className={cn('text-2xl font-bold font-display leading-none', s.text)}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1.5 leading-tight">{label}</p>
    </button>
  )
}
