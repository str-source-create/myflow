/**
 * WorkerProfilePage.jsx
 * Shows worker summary, change-password form, time-clock entry, and logout.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../../lib/api'
import { useWorker } from '../context/WorkerContext'

/** Minimum acceptable password length. */
const MIN_PW_LENGTH = 8

/** Returns a strength label and colour class for a given password string. */
function passwordStrength(pw) {
  if (!pw) return null
  const hasUpper = /[A-Z]/.test(pw)
  const hasDigit = /[0-9]/.test(pw)
  const hasSpecial = /[^A-Za-z0-9]/.test(pw)
  const long = pw.length >= 12
  const score = [pw.length >= MIN_PW_LENGTH, hasUpper, hasDigit, hasSpecial, long].filter(Boolean).length
  if (score <= 2) return { label: 'Weak', color: 'text-red-600', bar: 'bg-red-400', width: 'w-1/4' }
  if (score === 3) return { label: 'Fair', color: 'text-amber-600', bar: 'bg-amber-400', width: 'w-2/4' }
  if (score === 4) return { label: 'Good', color: 'text-blue-600', bar: 'bg-blue-400', width: 'w-3/4' }
  return { label: 'Strong', color: 'text-green-600', bar: 'bg-green-500', width: 'w-full' }
}

/** Toggle-visibility password input. */
function PasswordInput({ id, value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="new-password"
        className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500 hover:text-slate-700"
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
  )
}

export default function WorkerProfilePage() {
  const navigate = useNavigate()
  const { currentUser, tasks, logoutWorker } = useWorker()

  const completedCount = tasks.filter((task) => ['submitted', 'approved'].includes(task.status)).length

  // ── Change-password form state ──────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  const strength = passwordStrength(pwForm.next)

  function setPwField(field, val) {
    setPwForm((prev) => ({ ...prev, [field]: val }))
    setPwError('')
    setPwSuccess(false)
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)

    if (!pwForm.current) return setPwError('Enter your current password.')
    if (pwForm.next.length < MIN_PW_LENGTH) return setPwError(`New password must be at least ${MIN_PW_LENGTH} characters.`)
    if (pwForm.next !== pwForm.confirm) return setPwError('New passwords do not match.')
    if (pwForm.next === pwForm.current) return setPwError('New password must differ from the current password.')

    setPwSaving(true)
    try {
      await apiRequest(
        '/users/me/password',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
        },
        'worker',
      )
      setPwForm({ current: '', next: '', confirm: '' })
      setPwSuccess(true)
    } catch (err) {
      setPwError(err.message || 'Failed to change password.')
    } finally {
      setPwSaving(false)
    }
  }

  function handleLogout() {
    logoutWorker()
    navigate('/worker/login', { replace: true })
  }

  return (
    <div className="space-y-5 px-4 py-5 pb-24">
      <header className="sticky top-0 z-10 -mx-4 border-b border-slate-200 bg-slate-50 px-4 py-4">
        <h1 className="font-[Manrope] text-2xl font-bold text-slate-900">Profile</h1>
      </header>

      {/* ── Identity card ────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-slate-500">Worker</p>
        <h2 className="mt-1 font-[Manrope] text-xl font-bold text-slate-900">{currentUser?.name}</h2>
        <p className="mt-1 text-sm text-slate-500">{currentUser?.email}</p>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Tasks Completed</p>
          <p className="mt-1 font-[Manrope] text-2xl font-bold text-slate-900">{completedCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Streak</p>
          <p className="mt-1 font-[Manrope] text-2xl font-bold text-slate-900">{currentUser?.streak || 0}</p>
        </div>
      </section>

      {/* ── Time Clock entry ─────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => navigate('/worker/time-clock')}
        className="flex min-h-[44px] w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-blue-300"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl text-blue-600">⏰</div>
        <div className="text-left">
          <p className="font-semibold text-slate-900">Employee Time Clock</p>
          <p className="text-sm text-slate-500">Clock in and out for your shift</p>
        </div>
        <span className="ml-auto text-slate-400">›</span>
      </button>

      {/* ── Change Password ───────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-[Manrope] text-base font-bold text-slate-900">Change Password</h3>
        <p className="mt-0.5 text-sm text-slate-500">Use a strong password of at least {MIN_PW_LENGTH} characters.</p>

        <form onSubmit={handleChangePassword} className="mt-4 space-y-3" noValidate>
          <div>
            <label htmlFor="pw-current" className="mb-1 block text-sm font-medium text-slate-700">Current password</label>
            <PasswordInput
              id="pw-current"
              value={pwForm.current}
              onChange={(e) => setPwField('current', e.target.value)}
              placeholder="Enter current password"
            />
          </div>

          <div>
            <label htmlFor="pw-next" className="mb-1 block text-sm font-medium text-slate-700">New password</label>
            <PasswordInput
              id="pw-next"
              value={pwForm.next}
              onChange={(e) => setPwField('next', e.target.value)}
              placeholder={`At least ${MIN_PW_LENGTH} characters`}
            />
            {/* Strength meter */}
            {pwForm.next && strength && (
              <div className="mt-2">
                <div className="h-1.5 w-full rounded-full bg-slate-100">
                  <div className={`h-1.5 rounded-full transition-all ${strength.bar} ${strength.width}`} />
                </div>
                <p className={`mt-1 text-xs font-semibold ${strength.color}`}>{strength.label}</p>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="pw-confirm" className="mb-1 block text-sm font-medium text-slate-700">Confirm new password</label>
            <PasswordInput
              id="pw-confirm"
              value={pwForm.confirm}
              onChange={(e) => setPwField('confirm', e.target.value)}
              placeholder="Re-enter new password"
            />
            {/* Live match indicator */}
            {pwForm.confirm && (
              <p className={`mt-1 text-xs font-semibold ${pwForm.next === pwForm.confirm ? 'text-green-600' : 'text-red-500'}`}>
                {pwForm.next === pwForm.confirm ? 'Passwords match' : 'Passwords do not match'}
              </p>
            )}
          </div>

          {pwError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {pwError}
            </div>
          )}
          {pwSuccess && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              Password changed successfully.
            </div>
          )}

          <button
            type="submit"
            disabled={pwSaving}
            className="min-h-[44px] w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition-all active:scale-95 disabled:opacity-60"
          >
            {pwSaving ? 'Saving…' : 'Update Password'}
          </button>
        </form>
      </section>

      {/* ── Logout ───────────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleLogout}
        className="min-h-[44px] w-full rounded-xl bg-slate-100 px-4 py-3 font-semibold text-slate-700"
      >
        Log Out
      </button>
    </div>
  )
}
