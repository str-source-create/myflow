/**
 * WorkerHomeScreen.jsx
 * Displays current worker tasks sourced from backend and filtered by server date key.
 * Auto-refreshes every 30 s (while tab is visible) to catch new assignments and status changes.
 */
import TaskCard from '../components/TaskCard'
import { useWorker } from '../context/WorkerContext'
import { useAutoRefresh } from '../../hooks/useAutoRefresh'

function getReadableDate() {
  return new Date().toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

export default function WorkerHomeScreen() {
  const { tasks, currentUser, refreshTasks } = useWorker()

  // Poll for new assignments and status updates every 30 seconds.
  useAutoRefresh(refreshTasks, 30_000)

  const todayKey = new Date().toISOString().split('T')[0]
  const todayTasks = tasks.filter((task) => task.date === todayKey)

  const inProgressCount = todayTasks.filter((task) => task.status === 'in_progress').length
  const submittedCount = todayTasks.filter((task) => task.status === 'submitted').length

  return (
    <div className="space-y-5 px-4 py-5 pb-20">
      <header className="sticky top-0 z-10 -mx-4 border-b border-slate-200 bg-slate-50 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">CleanFlow</p>
            <h1 className="font-[Manrope] text-xl font-bold text-slate-900">Hi, {currentUser?.name}</h1>
          </div>
          <p className="text-sm text-slate-500">{getReadableDate()}</p>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          {todayTasks.length} jobs today - {inProgressCount} in progress - {submittedCount} submitted
        </p>
      </header>

      {todayTasks.length === 0 ? (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="5" width="16" height="15" rx="2" />
              <path d="M8 3v4M16 3v4M4 10h16" />
            </svg>
          </div>
          <h2 className="font-[Manrope] text-lg font-semibold text-slate-900">No tasks scheduled for today</h2>
          <p className="text-sm text-slate-500">Check back later for new assignments.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {todayTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700 shadow-sm">
        You are on a {currentUser?.streak || 0}-task streak. Keep it up!
      </div>
    </div>
  )
}
