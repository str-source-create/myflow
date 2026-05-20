/**
 * AttendancePage.jsx
 * Admin attendance table with date/worker/status filters.
 */
import { useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../lib/api'
import { useAdmin } from '../context/AdminContext'
import { formatDateTime as formatDateTimeWithTimezone } from '../utils/timezone'

/**
 * Formats date-time safely for table display.
 */
function formatDateTime(value) {
  // Render attendance timestamps using the app-configured timezone.
  return value ? formatDateTimeWithTimezone(value) : '--'
}

/**
 * Converts worked minutes to hour/minute label.
 */
function formatTotal(minutes) {
  if (!Number.isFinite(minutes)) return '--'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

const STATUS_STYLES = {
  clocked_in: 'bg-blue-50 text-blue-700',
  clocked_out: 'bg-green-50 text-green-700',
  missed_clock_out: 'bg-red-50 text-red-700',
  not_started: 'bg-slate-100 text-slate-700',
}

export default function AttendancePage() {
  const { workers } = useAdmin()
  const [records, setRecords] = useState([])
  const [filters, setFilters] = useState({ date: '', workerId: '', status: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  /**
   * Fetches attendance with filter query params.
   */
  async function fetchAttendance() {
    setLoading(true)
    setError('')
    try {
      const search = new URLSearchParams()
      if (filters.date) search.set('date', filters.date)
      if (filters.workerId) search.set('workerId', filters.workerId)
      if (filters.status) search.set('status', filters.status)

      const res = await apiRequest(`/attendance${search.toString() ? `?${search.toString()}` : ''}`, {}, 'admin')
      setRecords(res.data || [])
    } catch (err) {
      setError(err.message || 'Failed to load attendance.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchAttendance()
  }, [filters.date, filters.workerId, filters.status])

  const rows = useMemo(() => records, [records])

  return (
    <div className="space-y-6">
      <h1 className="font-[Manrope] text-2xl font-bold text-slate-900">Employee Attendance</h1>

      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Date</span>
          <input
            type="date"
            value={filters.date}
            onChange={(event) => setFilters((prev) => ({ ...prev, date: event.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Worker</span>
          <select
            value={filters.workerId}
            onChange={(event) => setFilters((prev) => ({ ...prev, workerId: event.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base"
          >
            <option value="">All workers</option>
            {workers.map((worker) => (
              <option key={worker.id} value={worker.id}>{worker.name}</option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Status</span>
          <select
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base"
          >
            <option value="">All statuses</option>
            <option value="clocked_in">Clocked In</option>
            <option value="clocked_out">Clocked Out</option>
            <option value="missed_clock_out">Missed Clock Out</option>
            <option value="not_started">Not Started</option>
          </select>
        </label>
      </section>

      {loading ? <p className="text-sm text-slate-500">Loading attendance...</p> : null}
      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Worker</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Clock In</th>
              <th className="px-4 py-3">Clock Out</th>
              <th className="px-4 py-3">Total Hours</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((record) => (
              <tr key={record._id} className="border-b border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">{record.workerName || record.workerId?.name || '--'}</td>
                <td className="px-4 py-3 text-slate-600">{record.date}</td>
                <td className="px-4 py-3 text-slate-600">{formatDateTime(record.clockInAt)}</td>
                <td className="px-4 py-3 text-slate-600">{formatDateTime(record.clockOutAt)}</td>
                <td className="px-4 py-3 text-slate-600">{formatTotal(record.totalWorkedMinutes)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[record.status] || STATUS_STYLES.not_started}`}>
                    {record.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{record.notes || '--'}</td>
              </tr>
            ))}

            {!rows.length ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">No attendance records found.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
