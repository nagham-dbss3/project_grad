import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, User, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/misc'
import { Logo } from '@/components/Logo'
import { useStore } from '@/store/useStore'
import { loginRequest, ApiError } from '@/lib/api'
import { ar } from '@/i18n/ar'

const MAX_ATTEMPTS = 3
const USERNAME_RE = /^[a-zA-Z0-9._-]+$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface FieldErrors {
  username?: string
  password?: string
}

export function LoginScreen() {
  const setSession = useStore((s) => s.setSession)
  const pushToast = useStore((s) => s.pushToast)
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(false)
  const locked = attempts >= MAX_ATTEMPTS

  const validate = (): FieldErrors => {
    const errs: FieldErrors = {}
    const u = username.trim()
    if (!u) errs.username = ar.login.usernameRequired
    else if (!(u.includes('@') ? EMAIL_RE : USERNAME_RE).test(u)) errs.username = ar.login.usernameInvalid
    if (!password) errs.password = ar.login.passwordRequired
    else if (password.length < 8) errs.password = ar.login.passwordShort
    return errs
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (locked) return
    const errs = validate()
    if (errs.username || errs.password) {
      setFieldErrors(errs)
      return
    }
    setFieldErrors({})
    setLoading(true)
    setError('')
    const email = username.includes('@') ? username.trim() : `${username.trim()}@basma.org`
    try {
      const { token, user } = await loginRequest(email, password)
      setSession({ token, user })
      navigate('/', { replace: true })
    } catch (err) {
      // Connection/config problem is NOT a wrong-password case — don't count it as an attempt.
      if (err instanceof ApiError && (err.status === 0 || err.status >= 500)) {
        setError(ar.login.connection)
        pushToast({ variant: 'error', title: ar.login.title, description: ar.login.connection })
      } else {
        const next = attempts + 1
        setAttempts(next)
        const msg = next >= MAX_ATTEMPTS ? ar.login.locked : ar.login.invalid
        setError(msg)
        pushToast({ variant: 'error', title: ar.login.title, description: msg })
      }
    } finally {
      setLoading(false)
    }
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
            <Field label={ar.login.username} htmlFor="username" error={fieldErrors.username}>
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
            <Field label={ar.login.password} htmlFor="password" error={fieldErrors.password || error || undefined}>
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
          </form>
        </Card>
      </div>
    </div>
  )
}
