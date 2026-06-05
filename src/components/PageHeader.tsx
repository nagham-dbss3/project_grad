import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PageHeader({
  title,
  description,
  action,
  back,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  back?: boolean
}) {
  const navigate = useNavigate()
  return (
    <div className="flex items-start gap-3 mb-5">
      {back && (
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="رجوع" className="mt-0.5">
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {action && <div className="ms-auto">{action}</div>}
    </div>
  )
}
