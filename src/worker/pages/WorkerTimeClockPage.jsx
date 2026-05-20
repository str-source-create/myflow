/**
 * WorkerTimeClockPage.jsx
 * Worker clock-in/clock-out experience using server-side attendance timestamps.
 */
import { useEffect, useMemo, useState } from 'react'
import { useWorker } from '../context/WorkerContext'
import { getTimezone } from '../../utils/timezone'

/**
 * Formats nullable Date-like values for display.
 */
function formatTime(value) {
  if (!value) return '--:--'
  // Time clock times must respect the app timezone set by admin settings.
  return new Date(value).toLocaleTimeString('en-US', {
    timeZone: getTimezone(),
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Formats the live clock text in the configured app timezone. */
function formatNowTime() {
  return new Date().toLocaleTimeString('en-US', {
    timeZone: getTimezone(),
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/** Formats the header date in the configured app timezone. */
function formatTodayLabel() {
  return new Date().toLocaleDateString('en-US', {
    timeZone: getTimezone(),
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Formats worked-minute totals to hour/minute string.
 */
function formatDuration(minutes) {
  if (!Number.isFinite(minutes)) return '--h --m'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

export default function WorkerTimeClockPage() {
  const { currentUser, clockIn, clockOut, getTodayAttendance } = useWorker()
  const [nowText, setNowText] = useState(formatNowTime())
  const [record, setRecord] = useState(null)
  const [notes, setNotes] = useState('')
  const [showClockOutForm, setShowClockOutForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  /**
   * Loads today's attendance from backend for refresh-safe state.
   */
  useEffect(() => {
    void (async () => {
      try {
        const todayRecord = await getTodayAttendance()
        setRecord(todayRecord)
      } catch (err) {
        setError(err.message || 'Failed to load attendance.')
      }
    })()
  }, [getTodayAttendance])

  useEffect(() => {
    const interval = setInterval(() => {
      setNowText(formatNowTime())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const statusMeta = useMemo(() => {
    switch (record?.status) {
      case 'clocked_in':
        return { label: 'Clocked In', color: 'text-blue-600 bg-blue-50 border-blue-200' }
      case 'clocked_out':
        return { label: 'Clocked Out', color: 'text-green-600 bg-green-50 border-green-200' }
      case 'missed_clock_out':
        return { label: 'Missed Clock Out', color: 'text-red-600 bg-red-50 border-red-200' }
      default:
        return { label: 'Not Clocked In', color: 'text-slate-600 bg-slate-50 border-slate-200' }
    }
  }, [record])

  /**
   * Records worker clock-in using server-side timestamp.
   */
  async function handleClockIn() {
    setError('')
    setLoading(true)
    try {
      const saved = await clockIn()
      setRecord(saved)
    } catch (err) {
      setError(err.message || 'Failed to clock in.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Records worker clock-out with optional notes.
   */
  async function handleClockOut() {
    setError('')
    setLoading(true)
    try {
      const saved = await clockOut(notes)
      setRecord(saved)
      setNotes('')
      setShowClockOutForm(false)
    } catch (err) {
      setError(err.message || 'Failed to clock out.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 px-4 py-5 pb-24">
      <header className="sticky top-0 z-10 -mx-4 border-b border-slate-200 bg-slate-50 px-4 py-4">
        <h1 className="font-[Manrope] text-2xl font-bold text-slate-900">Employee Time Clock</h1>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="font-[Manrope] text-xl font-bold text-slate-900">{currentUser?.name || 'Worker'}</p>
        <p className="mt-1 text-sm text-slate-500">
          {formatTodayLabel()}
        </p>
        <p className="mt-2 text-sm text-slate-600">Current time: {nowText}</p>

        <div className={`mt-4 inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${statusMeta.color}`}>
          ● {statusMeta.label}
        </div>
      </section>

      {record?.status === 'clocked_in' && !showClockOutForm ? (
        <button
          type="button"
          onClick={() => setShowClockOutForm(true)}
          disabled={loading}
          className="min-h-[44px] w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white"
        >
          CLOCK OUT
        </button>
      ) : null}

      {!record || record.status === 'not_started' || record.status === 'missed_clock_out' ? (
        <button
          type="button"
          onClick={() => void handleClockIn()}
          disabled={loading}
          className="min-h-[44px] w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white"
        >
          {loading ? 'Saving...' : 'CLOCK IN'}
        </button>
      ) : null}

      {showClockOutForm ? (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="block text-sm font-medium text-slate-700">Clock-out notes (optional)</label>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base"
            placeholder="Anything to report from this shift?"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowClockOutForm(false)}
              className="min-h-[44px] w-full rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleClockOut()}
              disabled={loading}
              className="min-h-[44px] w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white"
            >
              {loading ? 'Saving...' : 'Confirm Clock Out'}
            </button>
          </div>
        </section>
      ) : null}

      <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="font-[Manrope] text-lg font-bold text-slate-900">Today's Summary</h2>
        <p className="text-sm text-slate-700">Clock In: {formatTime(record?.clockInAt)}</p>
        <p className="text-sm text-slate-700">Clock Out: {formatTime(record?.clockOutAt)}</p>
        <p className="text-sm font-medium text-slate-900">Total: {formatDuration(record?.totalWorkedMinutes)}</p>
      </section>

      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
    </div>
  )
}
