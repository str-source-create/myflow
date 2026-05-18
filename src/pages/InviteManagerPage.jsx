/**
 * InviteManagerPage.jsx
 * Admin-only page for inviting new admin/manager accounts.
 * Sends an invite email via POST /api/auth/invite.
 * The invited user receives a link to AcceptInvitePage to set their password.
 */
import { useState } from 'react'
import { apiRequest } from '../lib/api'

export default function InviteManagerPage() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('admin')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  /** Sends the invite via the API. */
  async function handleSend(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    const trimmedEmail = email.trim()
    if (!trimmedEmail) return setError('Email is required.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) return setError('Enter a valid email address.')

    setSending(true)
    try {
      await apiRequest(
        '/auth/invite',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmedEmail, role }),
        },
        'admin',
      )
      setSuccess(`Invite sent to ${trimmedEmail}. They will receive an email with a setup link.`)
      setEmail('')
    } catch (err) {
      setError(err.message || 'Failed to send invite.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[Manrope] text-2xl font-bold text-slate-900">Invite Manager</h1>
        <p className="mt-1 text-sm text-slate-500">
          Send an invite email to onboard a new manager or admin account.
        </p>
      </div>

      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email Address*</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="manager@company.com"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base"
            >
              <option value="admin">Admin</option>
            </select>
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          {success && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={sending}
            className="w-full min-h-[44px] rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-60"
          >
            {sending ? 'Sending Invite…' : 'Send Invite'}
          </button>
        </form>
      </div>
    </div>
  )
}
