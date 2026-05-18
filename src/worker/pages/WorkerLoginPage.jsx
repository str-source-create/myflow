/**
 * WorkerLoginPage.jsx
 * Worker authentication screen backed by POST /api/auth/login.
 */
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { DEMO_WORKER, useWorker } from '../context/WorkerContext'
import { apiRequest } from '../../lib/api'

export default function WorkerLoginPage() {
  const navigate = useNavigate()
  const { loginWorker, currentUser } = useWorker()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (currentUser) {
    return <Navigate to="/worker/" replace />
  }

  function handleSubmit(event) {
    void handleLoginSubmit(event)
  }

  /**
   * Handles worker login with backend auth and role verification.
   */
  async function handleLoginSubmit(event) {
    event.preventDefault()
    setError('')

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
        return
      }

      if (user.role !== 'worker' && user.role !== 'admin') {
        setError('This account does not have worker access.')
        return
      }

      loginWorker(
        {
          id: user._id,
          name: user.name,
          email: user.email,
          streak: user.streak || DEMO_WORKER.streak,
          role: user.role,
        },
        token,
      )
      navigate('/worker/', { replace: true })
    } catch (err) {
      setError(err.message || 'Incorrect email or password')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-md space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">CleanFlow Worker</p>
          <h1 className="mt-1 font-[Manrope] text-3xl font-bold text-slate-900">Sign in</h1>
          <p className="mt-1 text-sm text-slate-500">Use your cleaner account to view today tasks.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="jessica@cleanflow.com"
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
              placeholder="Enter password"
              required
            />
          </div>

          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

          <button
            type="submit"
            className="min-h-[44px] w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition-all active:scale-95"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}
