/**
 * WorkerProfilePage.jsx
 * Shows worker summary, logout, and entry point to Employee Time Clock.
 */
import { useNavigate } from 'react-router-dom'
import { useWorker } from '../context/WorkerContext'

export default function WorkerProfilePage() {
  const navigate = useNavigate()
  const { currentUser, tasks, logoutWorker } = useWorker()

  const completedCount = tasks.filter((task) => ['submitted', 'approved'].includes(task.status)).length

  function handleLogout() {
    logoutWorker()
    navigate('/worker/login', { replace: true })
  }

  return (
    <div className="space-y-5 px-4 py-5 pb-24">
      <header className="sticky top-0 z-10 -mx-4 border-b border-slate-200 bg-slate-50 px-4 py-4">
        <h1 className="font-[Manrope] text-2xl font-bold text-slate-900">Profile</h1>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-slate-500">Worker</p>
        <h2 className="mt-1 font-[Manrope] text-xl font-bold text-slate-900">{currentUser?.name}</h2>
        <p className="mt-1 text-sm text-slate-500">{currentUser?.email}</p>
      </section>

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
