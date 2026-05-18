/**
 * SettingsPage.jsx
 * Admin app settings.
 * Includes:
 *  - Timezone selector (Feature 4) — persisted to DB + localStorage
 *  - Company Name
 *  - Legacy notification toggles
 */
import { useState } from 'react'
import { useAdmin } from '../context/AdminContext'

/** Common timezone list for the selector. */
const TIMEZONES = [
  { value: 'America/Toronto', label: 'Eastern Time — Toronto (ET)' },
  { value: 'America/New_York', label: 'Eastern Time — New York (ET)' },
  { value: 'America/Chicago', label: 'Central Time — Chicago (CT)' },
  { value: 'America/Denver', label: 'Mountain Time — Denver (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time — Los Angeles (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'America/Halifax', label: 'Atlantic Time — Halifax (AT)' },
  { value: 'America/Vancouver', label: 'Pacific Time — Vancouver (PT)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time — London (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time — Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Central European Time — Berlin (CET)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time — Sydney (AET)' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time — Dubai (GST)' },
  { value: 'UTC', label: 'UTC' },
]

export default function SettingsPage() {
  const { settings, updateSettings } = useAdmin()

  const [timezone, setTimezone] = useState(settings?.timezone || 'America/Toronto')
  const [companyName, setCompanyName] = useState(settings?.companyName || '')
  const [notifications, setNotifications] = useState(true)
  const [autoAssign, setAutoAssign] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  /** Saves timezone + companyName to backend and localStorage. */
  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setSuccess('')
    setError('')
    try {
      const data = { timezone, companyName: companyName.trim() }
      await updateSettings(data)
      setSuccess('Settings saved.')
    } catch (err) {
      setError(err.message || 'Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-[Manrope] text-2xl font-bold text-slate-900">Settings</h1>

      {/* ——— General Settings ——— */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-[Manrope] text-lg font-bold text-slate-900">General</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Company Name</label>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. CleanFlow Property Services"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400">
              Used to display task dates and calculate today's schedule.
            </p>
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          {success && <p className="text-sm font-medium text-green-600">{success}</p>}

          <button
            type="submit"
            disabled={saving}
            className="min-h-[44px] rounded-xl bg-blue-600 px-6 py-2.5 font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </form>
      </section>

      {/* ——— Legacy notification toggles ——— */}
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-2 font-[Manrope] text-lg font-bold text-slate-900">Preferences</h2>
        <label className="flex min-h-[44px] items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
          <span className="text-sm text-slate-700">Email notifications</span>
          <input type="checkbox" checked={notifications} onChange={(event) => setNotifications(event.target.checked)} className="h-5 w-5" />
        </label>

        <label className="flex min-h-[44px] items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
          <span className="text-sm text-slate-700">Auto-assign workers</span>
          <input type="checkbox" checked={autoAssign} onChange={(event) => setAutoAssign(event.target.checked)} className="h-5 w-5" />
        </label>
      </section>
    </div>
  )
}
