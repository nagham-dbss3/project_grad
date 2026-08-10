import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, User, Loader2, AlertCircle } from 'lucide-react'
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-white relative overflow-hidden">
      {/* Soft brand atmosphere behind the white surface */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(42rem 28rem at 92% -8%, oklch(0.62 0.16 240 / 0.12), transparent 58%),
            radial-gradient(36rem 24rem at 4% 108%, oklch(0.74 0.16 150 / 0.1), transparent 55%),
            radial-gradient(28rem 20rem at 0% 0%, oklch(0.62 0.17 320 / 0.08), transparent 50%),
            radial-gradient(24rem 18rem at 100% 100%, oklch(0.86 0.16 90 / 0.12), transparent 50%)
          `,
        }}
      />

      <Card className="relative w-full max-w-md border-border/70 bg-white p-7 sm:p-8 shadow-lg">
        <div className="flex flex-col items-center text-center mb-6">
          <Logo className="h-36 sm:h-44 mb-4 bg-white rounded-xl p-2" />
          <div className="h-1 w-16 rounded-full gradient-brand mb-4" />
          <h1 className="text-xl font-bold text-foreground">{ar.login.title}</h1>
          <p className="text-sm text-muted-foreground mt-1.5">{ar.login.subtitle}</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Field label={ar.login.username} htmlFor="username" error={fieldErrors.username}>
            <div className="relative">
              <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  if (error) setError('')
                }}
                className="ps-9 bg-white"
                disabled={locked}
                autoComplete="username"
              />
            </div>
          </Field>
          <Field label={ar.login.password} htmlFor="password" error={fieldErrors.password}>
            <div className="relative">
              <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (error) setError('')
                }}
                className="ps-9 bg-white"
                disabled={locked}
                autoComplete="current-password"
                placeholder="••••"
              />
            </div>
          </Field>

          {error ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p className="font-bold leading-snug">{error}</p>
            </div>
          ) : null}

          <Button type="submit" size="lg" className="w-full mt-1" disabled={loading || locked}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            {ar.login.signIn}
          </Button>
        </form>
      </Card>
    </div>
  )
}
