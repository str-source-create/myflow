/**
 * useAutoRefresh.js
 * Calls a data-fetch function on a configurable interval.
 * Pauses automatically when the browser tab is hidden (document.visibilityState)
 * to avoid unnecessary network traffic.
 *
 * Usage:
 *   import { useAutoRefresh } from '../hooks/useAutoRefresh'
 *   useAutoRefresh(refreshAdminData, 30_000) // poll every 30 seconds
 *
 * @param {function} fn         – Async or sync function to call on each tick.
 *                                Use a stable reference (useCallback) to avoid
 *                                unintentionally resetting the interval.
 * @param {number}   intervalMs – Polling interval in milliseconds (default: 30 000).
 */
import { useEffect, useRef } from 'react'

export function useAutoRefresh(fn, intervalMs = 30_000) {
  // Keep a ref so the interval closure always calls the latest version of fn
  // without needing fn in the dependency array (avoids resetting on every render).
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    let cancelled = false

    /**
     * tick — async wrapper so we can await the fetch function and catch any
     * errors it throws. A failed refresh must NEVER crash the interval or the
     * React component tree; it is silently swallowed so polling continues.
     */
    const tick = async () => {
      if (cancelled) return
      // Skip the poll when the tab is backgrounded — saves bandwidth on mobile.
      if (document.visibilityState === 'hidden') return
      try {
        await fnRef.current()
      } catch (err) {
        // Silent fail — a failed refresh never crashes the app.
        // The interval keeps running so the next tick can succeed.
        console.warn('Auto-refresh tick failed (non-fatal):', err?.message)
      }
    }

    // Run once immediately on mount so pages feel instant on first load.
    tick()

    // Then re-poll every intervalMs.
    const id = setInterval(tick, intervalMs)

    return () => {
      // Signal any in-flight tick to abort and clear the timer.
      cancelled = true
      clearInterval(id)
    }
  }, [intervalMs])
}
