import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, KeyRound, Loader2, Lock, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/misc'
import { useStore } from '@/store/useStore'
import { changePasswordRequest, ApiError } from '@/lib/api'
import { ar } from '@/i18n/ar'
import { cn } from '@/lib/utils'

const MIN_PASSWORD_LENGTH = 8

type FieldKey = 'currentPassword' | 'newPassword' | 'confirmPassword'
type FieldErrors = Partial<Record<FieldKey, string>>
type VisibleMap = Record<FieldKey, boolean>

function firstApiField(err: ApiError, key: string): string | undefined {
  const raw = err.fieldErrors?.[key]?.[0]?.trim()
  return raw || undefined
}

function looksWrongCurrent(message: string): boolean {
  const m = message.toLowerCase()
  return m.includes('current password') || m.includes('كلمة السر الحالية') || m.includes('كلمة المرور الحالية')
}

function isWeakPassword(value: string): boolean {
  const hasLetter = /[A-Za-z\u0600-\u06FF]/.test(value)
  const hasDigit = /\d/.test(value)
  return !(hasLetter && hasDigit)
}

function PasswordField({
  id,
  label,
  value,
  error,
  visible,
  disabled,
  autoComplete,
  onChange,
  onToggle,
}: {
  id: string
  label: string
  value: string
  error?: string
  visible: boolean
  disabled: boolean
  autoComplete: string
  onChange: (value: string) => void
  onToggle: () => void
}) {
  const toggleLabel = visible ? ar.profile.hidePassword : ar.profile.showPassword
  return (
    <Field label={label} htmlFor={id} error={error} required>
      <div className="relative">
        <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="ps-9 pe-11"
          disabled={disabled}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className={cn(
            'absolute end-1.5 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-md',
            'text-muted-foreground hover:bg-muted hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:pointer-events-none disabled:opacity-50',
          )}
          onClick={onToggle}
          disabled={disabled}
          aria-label={toggleLabel}
          title={toggleLabel}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </Field>
  )
}

export function ChangePasswordCard() {
  const navigate = useNavigate()
  const token = useStore((s) => s.token)
  const logout = useStore((s) => s.logout)
  const pushToast = useStore((s) => s.pushToast)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState<VisibleMap>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  })

  const clearFieldError = (key: FieldKey) => {
    setFieldErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev))
    if (formError) setFormError('')
  }

  const validate = (): FieldErrors => {
    const errs: FieldErrors = {}
    if (!currentPassword) errs.currentPassword = ar.profile.currentRequired
    if (!newPassword) errs.newPassword = ar.profile.newRequired
    else if (newPassword.length < MIN_PASSWORD_LENGTH) errs.newPassword = ar.profile.passwordShort
    else if (isWeakPassword(newPassword)) errs.newPassword = ar.profile.passwordWeak
    if (!confirmPassword) errs.confirmPassword = ar.profile.confirmRequired
    else if (newPassword && confirmPassword !== newPassword) errs.confirmPassword = ar.profile.mismatch
    return errs
  }

  const applyApiError = (err: ApiError): void => {
    const fields: FieldErrors = {}
    const currentMsg = firstApiField(err, 'current_password')
    const passwordMsg = firstApiField(err, 'password')
    const confirmMsg = firstApiField(err, 'password_confirmation')

    if (currentMsg) fields.currentPassword = looksWrongCurrent(currentMsg) ? ar.profile.currentWrong : currentMsg
    if (passwordMsg) {
      const lower = passwordMsg.toLowerCase()
      if (lower.includes('confirmation') || lower.includes('match') || lower.includes('تأكيد')) {
        fields.confirmPassword = ar.profile.mismatch
      } else if (lower.includes('least') || lower.includes('characters') || lower.includes('أحرف')) {
        fields.newPassword = ar.profile.passwordShort
      } else {
        fields.newPassword = passwordMsg
      }
    }
    if (confirmMsg) fields.confirmPassword = ar.profile.mismatch

    if (Object.keys(fields).length) {
      setFieldErrors(fields)
      return
    }

    if (looksWrongCurrent(err.message)) {
      setFieldErrors({ currentPassword: ar.profile.currentWrong })
      return
    }

    setFormError(err.message && err.message !== 'network' ? err.message : ar.profile.changeFailed)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    const errs = validate()
    if (errs.currentPassword || errs.newPassword || errs.confirmPassword) {
      setFieldErrors(errs)
      return
    }
    if (!token) {
      setFormError(ar.profile.sessionExpired)
      return
    }

    setFieldErrors({})
    setFormError('')
    setLoading(true)
    try {
      await changePasswordRequest(token, {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setVisible({ currentPassword: false, newPassword: false, confirmPassword: false })
      pushToast({ variant: 'success', title: ar.profile.changePassword, description: ar.profile.changeSuccess })
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout()
        navigate('/login', { replace: true })
        pushToast({ variant: 'error', title: ar.profile.changePassword, description: ar.profile.sessionExpired })
        return
      }
      if (err instanceof ApiError && (err.status === 0 || err.message === 'network')) {
        setFormError(ar.login.connection)
        pushToast({ variant: 'error', title: ar.profile.changePassword, description: ar.login.connection })
      } else if (err instanceof ApiError) {
        applyApiError(err)
        pushToast({
          variant: 'error',
          title: ar.profile.changePassword,
          description: looksWrongCurrent(err.message) ? ar.profile.currentWrong : ar.profile.changeFailed,
        })
      } else {
        setFormError(ar.profile.changeFailed)
        pushToast({ variant: 'error', title: ar.profile.changePassword, description: ar.profile.changeFailed })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-6">
        <h3 className="font-bold flex items-center gap-2 mb-1">
          <KeyRound className="h-4 w-4 text-primary" />
          {ar.profile.changePassword}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">{ar.profile.changePasswordHint}</p>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <PasswordField
            id="current-password"
            label={ar.profile.currentPassword}
            value={currentPassword}
            error={fieldErrors.currentPassword}
            visible={visible.currentPassword}
            disabled={loading}
            autoComplete="current-password"
            onChange={(v) => {
              setCurrentPassword(v)
              clearFieldError('currentPassword')
            }}
            onToggle={() => setVisible((s) => ({ ...s, currentPassword: !s.currentPassword }))}
          />
          <PasswordField
            id="new-password"
            label={ar.profile.newPassword}
            value={newPassword}
            error={fieldErrors.newPassword}
            visible={visible.newPassword}
            disabled={loading}
            autoComplete="new-password"
            onChange={(v) => {
              setNewPassword(v)
              clearFieldError('newPassword')
              if (confirmPassword && v === confirmPassword) clearFieldError('confirmPassword')
            }}
            onToggle={() => setVisible((s) => ({ ...s, newPassword: !s.newPassword }))}
          />
          <PasswordField
            id="confirm-password"
            label={ar.profile.confirmPassword}
            value={confirmPassword}
            error={fieldErrors.confirmPassword}
            visible={visible.confirmPassword}
            disabled={loading}
            autoComplete="new-password"
            onChange={(v) => {
              setConfirmPassword(v)
              clearFieldError('confirmPassword')
            }}
            onToggle={() => setVisible((s) => ({ ...s, confirmPassword: !s.confirmPassword }))}
          />

          {formError ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p className="font-bold leading-snug">{formError}</p>
            </div>
          ) : null}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            {ar.profile.savePassword}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
