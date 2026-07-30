import { useEffect, useState } from 'react'

/** Tick every `intervalMs` so wait-duration labels stay live without full reloads. */
export function useLiveNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}
