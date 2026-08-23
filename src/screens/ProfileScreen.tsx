import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Mail, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/misc'
import { PageHeader } from '@/components/PageHeader'
import { ChangePasswordCard } from '@/components/ChangePasswordCard'
import { useStore } from '@/store/useStore'
import { fetchMe, logoutRequest, ApiError } from '@/lib/api'
import { unregisterFcmTokenFromBackend } from '@/lib/fcmTokenService'
import { ar } from '@/i18n/ar'

export function ProfileScreen() {
  const navigate = useNavigate()
  const token = useStore((s) => s.token)
  const staff = useStore((s) => s.staff)
  const setUser = useStore((s) => s.setUser)
  const logout = useStore((s) => s.logout)
  const pushToast = useStore((s) => s.pushToast)

  useEffect(() => {
    if (!token) return
    let active = true
    fetchMe(token)
      .then((user) => {
        if (active) setUser(user)
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          logout()
          navigate('/login', { replace: true })
        }
      })
    return () => {
      active = false
    }
  }, [token, setUser, logout, navigate])

  const handleLogout = async () => {
    try {
      if (token) {
        await unregisterFcmTokenFromBackend(token)
        await logoutRequest(token)
      }
    } catch {
      pushToast({ variant: 'error', title: ar.common.logout, description: ar.profile.logoutError })
    } finally {
      logout()
      navigate('/login', { replace: true })
    }
  }

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
        </CardContent>
      </Card>

      <ChangePasswordCard />

      <Button variant="destructive" className="w-full" onClick={handleLogout}>
        <LogOut className="h-4 w-4" />
        {ar.common.logout}
      </Button>
    </div>
  )
}
