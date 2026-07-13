import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MonitorPlay, Maximize2, Stethoscope, Sun, BedDouble, Siren, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'
import { PageHeader } from '@/components/PageHeader'
import { ListSkeleton, ErrorState } from '@/components/ui/states'
import { Card } from '@/components/ui/card'
import { useStore } from '@/store/useStore'
import { ar } from '@/i18n/ar'
import { cn } from '@/lib/utils'
import type { Department } from '@/mock/types'

const departments: Department[] = ['clinic', 'dayCare', 'inpatient']
const icons: Record<Department, LucideIcon> = { clinic: Stethoscope, dayCare: Sun, inpatient: BedDouble }

export function WaitingScreen({ fullscreen }: { fullscreen?: boolean }) {
  const navigate = useNavigate()
  const displayQueues = useStore((s) => s.displayQueues)
  const displayQueuesLoading = useStore((s) => s.displayQueuesLoading)
  const displayQueuesError = useStore((s) => s.displayQueuesError)
  const fetchDisplayQueues = useStore((s) => s.fetchDisplayQueues)

  useEffect(() => {
    fetchDisplayQueues()
    const id = setInterval(fetchDisplayQueues, 30_000)
    return () => clearInterval(id)
  }, [fetchDisplayQueues])

  const boardContent = displayQueuesLoading ? (
    <ListSkeleton rows={3} />
  ) : displayQueuesError ? (
    <Card><ErrorState onRetry={() => fetchDisplayQueues()} /></Card>
  ) : (
    <div className={cn('grid gap-4', fullscreen ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-3')}>
      {departments.map((d) => {
        const rows = displayQueues[d] ?? []
        const serving = rows.find((r) => r.token.status === 'called') ?? rows.find((r) => r.token.isEmergency)
        const next = rows.filter((r) => r.token.id !== serving?.token.id).slice(0, 4)
        const Icon = icons[d]
        return (
          <section key={d} className="rounded-2xl border bg-card overflow-hidden">
            <header className="gradient-hope text-white p-4 flex items-center gap-2">
              <Icon className="h-6 w-6" />
              <h2 className={cn('font-bold', fullscreen ? 'text-2xl' : 'text-lg')}>{ar.dept[d]}</h2>
            </header>
            <div className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{ar.waiting.nowServing}</p>
              {serving ? (
                <div className={cn('rounded-xl p-4 mb-4 text-center', serving.token.isEmergency ? 'bg-warning/20' : 'bg-primary-soft')}>
                  {serving.token.isEmergency && <Siren className="h-5 w-5 mx-auto text-warning-foreground mb-1" />}
                  <p className={cn('font-display font-bold leading-none', fullscreen ? 'text-7xl' : 'text-5xl', serving.token.isEmergency ? 'text-warning-foreground' : 'text-primary')}>
                    {serving.token.number}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl bg-muted p-6 mb-4 text-center text-muted-foreground font-bold">{ar.waiting.noTokens}</div>
              )}
              <p className="text-xs text-muted-foreground mb-2">{ar.waiting.next}</p>
              <div className="flex flex-wrap gap-2">
                {next.length ? next.map((r) => (
                  <span key={r.token.id} className={cn('rounded-lg border px-3 py-1.5 font-display font-bold', fullscreen ? 'text-2xl' : 'text-lg', r.token.isEmergency && 'border-warning/50 bg-warning/10 text-warning-foreground')}>
                    {r.token.number}
                  </span>
                )) : <span className="text-sm text-muted-foreground">—</span>}
              </div>
            </div>
          </section>
        )
      })}
    </div>
  )

  if (fullscreen) {
    return (
      <div className="min-h-screen p-6 lg:p-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Logo className="h-14" />
            <p className="text-muted-foreground text-lg border-s ps-3">{ar.waiting.subtitle}</p>
          </div>
          <Button variant="outline" className="no-print" onClick={() => navigate('/waiting-screen')}>{ar.common.close}</Button>
        </div>
        {boardContent}
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={ar.waiting.title}
        description={ar.waiting.subtitle}
        action={
          <Button onClick={() => navigate('/waiting-screen/display')}>
            <Maximize2 className="h-4 w-4" />
            عرض ملء الشاشة
          </Button>
        }
      />
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <MonitorPlay className="h-4 w-4" />
        تُعرض هذه الشاشة في صالة الانتظار — وتعكس ما سيظهر لاحقاً في تطبيق ولي الأمر.
      </div>
      {boardContent}
    </div>
  )
}
