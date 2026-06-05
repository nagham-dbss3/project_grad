import { useNavigate } from 'react-router-dom'
import { LogOut, Mail, Shield, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/misc'
import { PageHeader } from '@/components/PageHeader'
import { useStore } from '@/store/useStore'
import { ar } from '@/i18n/ar'

export function ProfileScreen() {
  const navigate = useNavigate()
  const staff = useStore((s) => s.staff)
  const logout = useStore((s) => s.logout)
  if (!staff) return null

  return (
    <div className="max-w-xl mx-auto">
      <PageHeader title={ar.profile.title} />

      <Card className="mb-4">
        <CardContent className="p-6 flex items-center gap-4">
          <Avatar name={`${staff.firstName} ${staff.lastName}`} className="h-16 w-16 text-xl" />
          <div>
            <p className="text-xl font-bold">{staff.firstName} {staff.lastName}</p>
            <p className="text-sm text-muted-foreground">موظفة استقبال</p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="p-6 space-y-4">
          <h3 className="font-bold flex items-center gap-2"><User className="h-4 w-4 text-primary" />{ar.profile.contact}</h3>
          <div className="flex items-center gap-3 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{staff.contactEmail}</span>
          </div>
          <hr />
          <h3 className="font-bold flex items-center gap-2"><Shield className="h-4 w-4 text-primary" />{ar.profile.security}</h3>
          <p className="text-sm text-muted-foreground">{ar.profile.securityNote}</p>
          <Button variant="outline" disabled>تغيير كلمة المرور</Button>
        </CardContent>
      </Card>

      <Button
        variant="destructive"
        className="w-full"
        onClick={() => {
          logout()
          navigate('/login', { replace: true })
        }}
      >
        <LogOut className="h-4 w-4" />
        {ar.common.logout}
      </Button>
    </div>
  )
}
