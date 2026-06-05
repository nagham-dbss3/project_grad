import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Fingerprint, Lock, User, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/misc'
import { Logo } from '@/components/Logo'
import { useStore } from '@/store/useStore'
import { currentStaff } from '@/mock/data'
import { ar } from '@/i18n/ar'

const MAX_ATTEMPTS = 3

export function LoginScreen() {
  const login = useStore((s) => s.login)
  const navigate = useNavigate()
  const [username, setUsername] = useState('maha')
  const [password, setPassword] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const locked = attempts >= MAX_ATTEMPTS

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (locked) return
    setLoading(true)
    setError('')
    setTimeout(() => {
      setLoading(false)
      // Mock login: accept any non-empty username + password (demo password: 1234).
      if (username.trim() && password.trim().length > 0) {
        login(currentStaff)
        navigate('/', { replace: true })
      } else {
        const next = attempts + 1
        setAttempts(next)
        setError(next >= MAX_ATTEMPTS ? ar.login.locked : ar.login.invalid)
      }
    }, 600)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <Logo className="h-24 mb-3" />
          <p className="text-sm text-muted-foreground">{ar.login.subtitle}</p>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4">{ar.login.title}</h2>
          <form onSubmit={submit} className="space-y-4">
            <Field label={ar.login.username} htmlFor="username">
              <div className="relative">
                <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="ps-9"
                  disabled={locked}
                  autoComplete="username"
                />
              </div>
            </Field>
            <Field label={ar.login.password} htmlFor="password" error={error || undefined} hint={ar.login.hint}>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="ps-9"
                  disabled={locked}
                  autoComplete="current-password"
                  placeholder="••••"
                />
              </div>
            </Field>

            <Button type="submit" size="lg" className="w-full" disabled={loading || locked}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
              {ar.login.signIn}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              disabled={locked}
              onClick={() => {
                login(currentStaff)
                navigate('/', { replace: true })
              }}
            >
              <Fingerprint className="h-5 w-5" />
              {ar.login.pin}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
