/**
 * TaskTimer.jsx
 * Shows live task elapsed time while in progress and final duration after submit.
 */
import { useEffect, useState } from 'react'

/**
 * TaskTimer — shows a live stopwatch while task is in_progress
 * and final duration when task is submitted.
 */
export default function TaskTimer({ startedAt, endedAt }) {
  const [display, setDisplay] = useState('00:00:00')

  useEffect(() => {
    if (!startedAt) return undefined

    /**
     * Calculates display from server timestamps so refresh keeps accurate time.
     */
    const calcDisplay = () => {
      const start = new Date(startedAt).getTime()
      const end = endedAt ? new Date(endedAt).getTime() : Date.now()
      const totalSeconds = Math.max(0, Math.floor((end - start) / 1000))
      const h = Math.floor(totalSeconds / 3600)
      const m = Math.floor((totalSeconds % 3600) / 60)
      const s = totalSeconds % 60
      setDisplay(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }

    calcDisplay()

    if (!endedAt) {
      const interval = setInterval(calcDisplay, 1000)
      return () => clearInterval(interval)
    }

    return undefined
  }, [startedAt, endedAt])

  if (!startedAt) return null

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">⏱</div>
      <div>
        <p className="text-xs font-medium text-blue-600">{endedAt ? 'Total Duration' : 'Time Elapsed'}</p>
        <p className="font-[Manrope] text-2xl font-bold tabular-nums text-blue-700">{display}</p>
      </div>
    </div>
  )
}
