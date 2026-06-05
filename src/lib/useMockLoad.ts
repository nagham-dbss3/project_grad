import { useCallback, useEffect, useState } from 'react'

export type LoadState = 'loading' | 'ready' | 'error'

/** Simulate network latency + optional error so every screen exercises real states. */
export function useMockLoad(ms = 600, forceError = false): { state: LoadState; reload: () => void } {
  const [state, setState] = useState<LoadState>('loading')
  const [tick, setTick] = useState(0)

  useEffect(() => {
    setState('loading')
    const id = setTimeout(() => setState(forceError ? 'error' : 'ready'), ms)
    return () => clearTimeout(id)
  }, [ms, forceError, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { state, reload }
}
