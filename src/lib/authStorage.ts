import type { ApiUser } from '@/lib/api'
import { useStore } from '@/store/useStore'

const TOKEN_KEY = 'basma_auth_token'
const USER_KEY = 'basma_auth_user'

export function saveAuthSession(token: string, user: ApiUser): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuthSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function loadAuthSession(): { token: string; user: ApiUser } | null {
  const token = localStorage.getItem(TOKEN_KEY)
  const raw = localStorage.getItem(USER_KEY)
  if (!token || !raw) return null
  try {
    return { token, user: JSON.parse(raw) as ApiUser }
  } catch {
    clearAuthSession()
    return null
  }
}

/** Restore persisted session into Zustand before the first render. */
export function hydrateAuthSession(): void {
  const saved = loadAuthSession()
  if (saved) useStore.getState().setSession(saved)
}
