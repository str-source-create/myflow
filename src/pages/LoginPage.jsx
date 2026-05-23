/**
 * LoginPage.jsx
 * Admin authentication screen backed by POST /api/auth/login.
 */
import { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAdmin } from '../context/AdminContext'
import { apiRequest } from '../lib/api'

export default function LoginPage() {
  const navigate = useNavigate()
  const { admin, loginAdmin } = useAdmin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  // Session-expired message shown when redirected from an expired auth session.
  const [sessionMsg, setSessionMsg] = useState('')

  // Detect if the user was redirected here due to an expired token.
  useEffect(() => {
    if (localStorage.getItem('cf_session_expired') === 'true') {
      setSessionMsg('Your session has expired. Please sign in again.')
      localStorage.removeItem('cf_session_expired')
    }
  }, [])

  if (admin) {
    return <Navigate to="/admin/dashboard" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const user = response?.data?.user
      const token = response?.data?.token

      if (!user || !token) {
        setError('Login failed. Please try again.')
        setLoading(false)
        return
      }

      if (user.role !== 'admin') {
        setError('This account does not have admin access.')
        setLoading(false)
        return
      }

      loginAdmin({ id: user._id, name: user.name, email: user.email, role: user.role }, token)
      setLoading(false)
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Incorrect email or password')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">CleanFlow</p>
        <h1 className="mt-2 font-[Manrope] text-2xl font-bold text-slate-900">Admin Login</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to manage properties, tasks, and submissions.</p>

        {/* Session-expired banner — shown after automatic token expiry redirect */}
        {sessionMsg && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {sessionMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
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
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <button
            type="button"
            onClick={() => {
              setToast('Contact your system administrator')
              setTimeout(() => setToast(''), 2000)
            }}
            className="min-h-[44px] w-full rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            Forgot password?
          </button>
        </form>

        {toast ? <p className="mt-3 text-sm font-medium text-blue-600">{toast}</p> : null}
      </div>
    </div>
  )
}
