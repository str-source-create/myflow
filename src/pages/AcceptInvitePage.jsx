/**
 * AcceptInvitePage.jsx
 * PUBLIC page — no auth required.
 * Shown when a new manager clicks the invite link in their email.
 * Validates the token, then lets them set their name and password.
 * On success: creates their account and shows a redirect message.
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiRequest } from '../lib/api'

export default function AcceptInvitePage() {
  const { token } = useParams()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  /** Validate the token on mount and pre-fill the email. */
  useEffect(() => {
    if (!token) {
      setError('Invalid invite link.')
      setLoading(false)
      return
    }

    apiRequest(`/auth/invite/${token}`, {}, 'admin')
      .then((res) => {
        setEmail(res.data?.email || '')
      })
      .catch((err) => {
        setError(err.message || 'This invite link is invalid or has expired.')
      })
      .finally(() => setLoading(false))
  }, [token])

  /** Submit name + password to create the account. */
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!name.trim()) return setError('Full name is required.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    if (password !== confirmPassword) return setError('Passwords do not match.')

    setSubmitting(true)
    try {
      await apiRequest(
        '/auth/accept-invite',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, name: name.trim(), password }),
        },
        'admin',
      )
      setSuccess(true)
      setTimeout(() => navigate('/admin/login'), 2500)
    } catch (err) {
      setError(err.message || 'Failed to create account.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Validating invite…</p>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm space-y-4 rounded-2xl border border-green-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700 text-2xl">
            ✓
          </div>
          <h1 className="font-[Manrope] text-xl font-bold text-slate-900">Account created!</h1>
          <p className="text-sm text-slate-500">Redirecting to login…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div>
          <h1 className="font-[Manrope] text-2xl font-bold text-slate-900">Accept Invitation</h1>
          <p className="mt-1 text-sm text-slate-500">Create your CleanFlow manager account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email — read-only, pre-filled from token */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              value={email}
              readOnly
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Full Name*</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password*</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Confirm Password*</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base"
              required
            />
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !email}
            className="w-full min-h-[44px] rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-60"
          >
            {submitting ? 'Creating account…' : 'Create My Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
