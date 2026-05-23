/**
 * SettingsPage.jsx
 * Admin app settings.
 * Includes:
 *  - Timezone selector (Feature 4) — persisted to DB + localStorage
 *  - Company Name
 *  - Last Login info — helps admin spot unauthorized access
 *  - Team Members — invite manager button + list
 *  - Email Notifications — status indicator + test email button
 *  - Legacy notification toggles
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdmin } from '../context/AdminContext'
import { apiRequest } from '../lib/api'
import { formatDateTime } from '../utils/timezone'

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
  const navigate = useNavigate()
  const { settings, updateSettings, admin, workers } = useAdmin()

  const [timezone, setTimezone] = useState(settings?.timezone || 'America/Toronto')
  const [companyName, setCompanyName] = useState(settings?.companyName || '')
  const [notifications, setNotifications] = useState(true)
  const [autoAssign, setAutoAssign] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Email status state
  const [emailConfigured, setEmailConfigured] = useState(false)
  const [emailFrom, setEmailFrom] = useState('')
  const [testEmailSending, setTestEmailSending] = useState(false)
  const [testEmailMsg, setTestEmailMsg] = useState('')

  // Load email status from backend on mount.
  useEffect(() => {
    void (async () => {
      try {
        const res = await apiRequest('/settings/email-status', {}, 'admin')
        setEmailConfigured(res?.data?.configured === true)
        setEmailFrom(res?.data?.from || '')
      } catch {
        // Non-critical — just don't show the green status
      }
    })()
  }, [])

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

  /** Sends a test email to the admin's own address. */
  async function sendTestEmail() {
    setTestEmailSending(true)
    setTestEmailMsg('')
    try {
      const res = await apiRequest('/settings/test-email', { method: 'POST' }, 'admin')
      setTestEmailMsg(res?.message || 'Test email sent!')
    } catch (err) {
      setTestEmailMsg(err.message || 'Failed to send test email.')
    } finally {
      setTestEmailSending(false)
    }
  }

  // Filter admin-role users for Team Members list.
  const adminUsers = (workers || []).filter((w) => w.role === 'admin')

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

        {/* Last Login info — helps admin spot unauthorized access */}
        {admin?.lastLoginAt && (
          <div className="mt-4 rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-500 mb-0.5">Last Login</p>
            <p className="text-sm text-slate-700">{formatDateTime(admin.lastLoginAt)}</p>
          </div>
        )}
      </section>

      {/* ——— Team Members ——— */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-1 font-[Manrope] text-lg font-bold text-slate-900">Team Members</h2>
        <p className="mb-4 text-sm text-slate-500">
          Invite managers to access the admin dashboard. They receive an email with a setup link.
        </p>

        <button
          type="button"
          onClick={() => navigate('/admin/invite')}
          className="mb-5 min-h-[44px] rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 active:scale-95 transition-all"
        >
          ✉ Invite a Manager
        </button>

        {/* List of existing admin accounts */}
        {adminUsers.length > 0 && (
          <div className="space-y-2">
            {adminUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                  Admin
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ——— Email Notifications ——— */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-1 font-[Manrope] text-lg font-bold text-slate-900">Email Notifications</h2>
        <p className="mb-4 text-sm text-slate-500">
          CleanFlow sends emails for: task assignments, submission reviews,
          manager invites, and password resets.
        </p>

        {/* Status indicator */}
        <div className={`flex items-center gap-2 rounded-xl p-3 mb-4 ${
          emailConfigured
            ? 'bg-green-50 border border-green-200'
            : 'bg-amber-50 border border-amber-200'
        }`}>
          <span className={emailConfigured ? 'text-green-600' : 'text-amber-500'}>
            {emailConfigured ? '✓' : '⚠'}
          </span>
          <p className={`text-sm font-medium ${emailConfigured ? 'text-green-700' : 'text-amber-700'}`}>
            {emailConfigured
              ? `Email configured — sending from ${emailFrom}`
              : 'Email not configured — notifications will not be sent'}
          </p>
        </div>

        {emailConfigured ? (
          <div className="space-y-2">
            <button
              type="button"
              onClick={sendTestEmail}
              disabled={testEmailSending}
              className="min-h-[44px] rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-60"
            >
              {testEmailSending ? 'Sending…' : '✉ Send Test Email'}
            </button>
            {testEmailMsg && (
              <p className="text-sm font-medium text-slate-600">{testEmailMsg}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            To enable emails, add <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">EMAIL_HOST</code>,{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">EMAIL_USER</code>, and{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">EMAIL_PASS</code>{' '}
            to your backend <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">.env</code> file and restart the server.
          </p>
        )}
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
