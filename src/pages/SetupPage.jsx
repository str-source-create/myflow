/**
 * SetupPage.jsx
 * First-time setup page — shown when no admin account exists in the database.
 * Route: /admin/setup (public, no authentication required).
 *
 * Behaviour:
 *  - Checks /api/auth/setup-status on mount.
 *  - If setupRequired === false: shows "Admin already exists" message.
 *  - If setupRequired === true: shows the account creation form.
 *  - On success: auto-logs in the new admin and navigates to dashboard.
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest } from '../lib/api'
import { useAdmin } from '../context/AdminContext'

export default function SetupPage() {
  const navigate = useNavigate()
  const { loginAdmin } = useAdmin()

  const [checking, setChecking] = useState(true)
  const [setupRequired, setSetupRequired] = useState(false)

  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  // Check setup status on mount — don't show the form if admin already exists.
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/setup-status`
        )
        const data = await res.json()
        setSetupRequired(data?.data?.setupRequired === true)
      } catch {
        // If the check fails, show the form — the create endpoint will guard itself.
        setSetupRequired(true)
      } finally {
        setChecking(false)
      }
    })()
  }, [])

  /** Password strength: weak / medium / strong */
  function passwordStrength(pw) {
    if (pw.length < 8) return { label: 'Too short', color: 'bg-red-400', width: 'w-1/4' }
    const score =
      (pw.length >= 10 ? 1 : 0) +
      (/[A-Z]/.test(pw) ? 1 : 0) +
      (/[0-9]/.test(pw) ? 1 : 0) +
      (/[^A-Za-z0-9]/.test(pw) ? 1 : 0)
    if (score <= 1) return { label: 'Weak',   color: 'bg-red-400',    width: 'w-1/3' }
    if (score <= 2) return { label: 'Medium', color: 'bg-amber-400',  width: 'w-2/3' }
    return               { label: 'Strong',  color: 'bg-green-500',  width: 'w-full' }
  }

  const strength = password ? passwordStrength(password) : null

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      const res = await apiRequest('/auth/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const user  = res?.data?.user
      const token = res?.data?.token

      if (!user || !token) {
        setError('Setup failed. Please try again.')
        return
      }

      // Auto-login the new admin and navigate to dashboard.
      loginAdmin({ id: user._id, name: user.name, email: user.email, role: user.role }, token)
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Setup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Checking setup status…</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">CleanFlow</p>

        {!setupRequired ? (
          /* Admin already exists — direct to login */
          <div className="mt-4 space-y-4">
            <h1 className="font-[Manrope] text-2xl font-bold text-slate-900">Admin account already exists</h1>
            <p className="text-sm text-slate-500">
              This CleanFlow instance already has an admin account.
              Use the login page to sign in, or ask an existing admin to send you an invite.
            </p>
            <Link
              to="/admin/login"
              className="block min-h-[44px] w-full rounded-xl bg-blue-600 px-4 py-3 text-center font-semibold text-white hover:bg-blue-700"
            >
              Go to Login
            </Link>
          </div>
        ) : (
          /* First-time setup form */
          <>
            <h1 className="mt-2 font-[Manrope] text-2xl font-bold text-slate-900">
              Welcome to CleanFlow
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Let's create your admin account to get started.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Full name */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Sarah Admin"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="admin@yourcompany.com"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Minimum 8 characters"
                  required
                />
                {/* Password strength meter */}
                {strength && (
                  <div className="mt-1.5 space-y-1">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full transition-all ${strength.color} ${strength.width}`} />
                    </div>
                    <p className="text-xs text-slate-500">{strength.label}</p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

              <button
                type="submit"
                disabled={loading}
                className={`min-h-[44px] w-full rounded-xl px-4 py-2.5 font-semibold text-white transition-all ${
                  loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                }`}
              >
                {loading ? 'Creating account…' : 'Create Admin Account'}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-slate-400">
              Already have an account?{' '}
              <Link to="/admin/login" className="text-blue-600 hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
