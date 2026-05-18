/**
 * WorkerTaskDetailPage.jsx
 * Worker task details with server-backed start action and persisted stopwatch.
 * Feature 5: Shows task lead/collaborator banner; only the task lead can start the task.
 */
import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import TaskTimer from '../components/TaskTimer'
import { useWorker } from '../context/WorkerContext'

function EyeIcon({ open }) {
  return open ? (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6A3 3 0 0 0 14 14" />
      <path d="M9.9 5.1A10 10 0 0 1 12 5c6 0 9.7 7 9.8 7-.6 1.2-1.4 2.4-2.3 3.4" />
      <path d="M6.2 6.2C4.6 7.6 3.5 9.4 2.2 12c0 0 3.8 7 9.8 7 1.6 0 3-.3 4.2-.9" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function TaskTabs({ taskId, activeTab }) {
  const tabs = [
    { label: 'Details', to: `/worker/tasks/${taskId}` },
    { label: 'Standards', to: `/worker/tasks/${taskId}/standards` },
    { label: 'Checklist', to: `/worker/tasks/${taskId}/checklist` },
    { label: 'Photos', to: `/worker/tasks/${taskId}/photos` },
  ]

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {tabs.map((tab) => (
        <Link
          key={tab.label}
          to={tab.to}
          className={`min-h-[44px] shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold ${
            activeTab === tab.label
              ? 'bg-blue-600 text-white'
              : 'border border-slate-200 bg-white text-slate-700'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}

export default function WorkerTaskDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { tasks, startTask, currentUser } = useWorker()
  const [showPassword, setShowPassword] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')

  // TODO: replace with API call to GET /api/tasks/:id
  const task = tasks.find((item) => item.id === id)

  if (!task) {
    return <Navigate to="/worker/" replace />
  }

  /**
   * True if there is no designated lead (single-worker task),
   * or if the current user IS the lead.
   */
  const isLead = !task.taskLeadId || task.taskLeadId === currentUser?.id

  /** Name of the lead worker (for collaborator message). */
  const leadName =
    task.assignedWorkerNames?.find((w) => w.id === task.taskLeadId)?.name || 'the task lead'

  /**
   * Starts task using backend timestamp and prevents duplicate taps.
   */
  async function handleStartTask() {
    setError('')
    setStarting(true)
    try {
      await startTask(task.id)
    } catch (err) {
      setError(err.message || 'Failed to start task.')
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="space-y-5 px-4 py-5 pb-28">
      <header className="sticky top-0 z-10 -mx-4 space-y-4 border-b border-slate-200 bg-slate-50 px-4 pb-4 pt-1">
        <button
          type="button"
          onClick={() => navigate('/worker/')}
          className="min-h-[44px] rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700"
        >
          Back
        </button>

        <div>
          <h1 className="font-[Manrope] text-2xl font-bold text-slate-900">{task.propertyName}</h1>
          <div className="mt-2">
            <StatusBadge status={task.status} />
          </div>
        </div>

        <TaskTabs taskId={task.id} activeTab="Details" />
      </header>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="font-[Manrope] text-base font-semibold text-slate-900">Property details</h2>

        <TaskTimer startedAt={task.startedAt} endedAt={task.endedAt} status={task.status} />

        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.address)}`}
          target="_blank"
          rel="noreferrer"
          className="block rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700"
        >
          {task.address} (Open in Maps)
        </a>

        <div className="rounded-xl border border-slate-200 p-3">
          <p className="text-sm text-slate-500">WiFi name</p>
          <p className="font-medium text-slate-900">{task.wifi.name}</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm text-slate-500">Password</p>
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="inline-flex min-h-[44px] items-center gap-1 rounded-lg px-2 text-blue-600"
            >
              <EyeIcon open={showPassword} />
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <p className="font-medium text-slate-900">{showPassword ? task.wifi.password : '••••••••'}</p>
        </div>

        <div className="rounded-xl border border-slate-200 p-3">
          <p className="text-sm text-slate-500">Guest check-in</p>
          <p className="font-medium text-slate-900">{task.guestCheckIn}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4 shadow-sm">
        <h3 className="font-[Manrope] text-sm font-semibold text-blue-900">Access notes</h3>
        <p className="mt-1 text-sm text-blue-800">{task.accessNotes}</p>
      </section>

      {task.importantNotes ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <h3 className="font-[Manrope] text-sm font-semibold text-amber-700">Important notes</h3>
          <p className="mt-1 text-sm text-amber-700">{task.importantNotes}</p>
        </section>
      ) : null}

      {/* Task lead / collaborator banner — only shown on multi-worker tasks */}
      {task.taskLeadId && (
        <section
          className={`rounded-2xl border p-4 shadow-sm ${
            isLead
              ? 'border-green-200 bg-green-50'
              : 'border-blue-200 bg-blue-50'
          }`}
        >
          {isLead ? (
            <p className="text-sm font-semibold text-green-800">
              👑 You are the Task Lead for this job. You are responsible for starting and submitting.
            </p>
          ) : (
            <p className="text-sm font-semibold text-blue-800">
              🤝 You are a collaborator on this task. <strong>{leadName}</strong> will start and submit.
            </p>
          )}
        </section>
      )}

      {/* Re-clean feedback — shown prominently when manager requests a fix */}
      {task.status === 're_clean_needed' && task.managerFeedback ? (
        <section className="rounded-2xl border border-amber-400 bg-amber-50 p-4 shadow-sm">
          <div className="flex items-start gap-2">
            <span className="text-xl">⚠️</span>
            <div>
              <h3 className="font-[Manrope] text-sm font-semibold text-amber-800">Manager requested a re-clean</h3>
              <p className="mt-1 text-sm text-amber-700">{task.managerFeedback}</p>
            </div>
          </div>
        </section>
      ) : task.status === 're_clean_needed' ? (
        <section className="rounded-2xl border border-amber-400 bg-amber-50 p-4 shadow-sm">
          <p className="text-sm font-semibold text-amber-800">⚠️ Manager has requested a re-clean for this property.</p>
        </section>
      ) : null}

      <div className="fixed bottom-20 left-0 right-0 z-20 border-t border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
          <div className="min-w-[120px]">
            <StatusBadge status={task.status} />
          </div>

          {task.status === 'scheduled' ? (
            isLead ? (
              <button
                type="button"
                onClick={() => void handleStartTask()}
                disabled={starting}
                className="min-h-[44px] w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition-all active:scale-95"
              >
                {starting ? 'Starting...' : 'Start Task'}
              </button>
            ) : (
              <p className="w-full text-center text-sm text-slate-500">
                Waiting for {leadName} to start this task.
              </p>
            )
          ) : null}

          {task.status === 'in_progress' ? (
            <button
              type="button"
              onClick={() => navigate(`/worker/tasks/${task.id}/checklist`)}
              className="min-h-[44px] w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition-all active:scale-95"
            >
              Go to Checklist
            </button>
          ) : null}

          {task.status === 'submitted' ? (
            <button
              type="button"
              disabled
              className="min-h-[44px] w-full rounded-xl bg-slate-200 px-4 py-3 font-semibold text-slate-500"
            >
              View Submission
            </button>
          ) : null}

          {task.status === 're_clean_needed' ? (
            isLead ? (
              <button
                type="button"
                onClick={() => void handleStartTask()}
                disabled={starting}
                className="min-h-[44px] w-full rounded-xl bg-amber-500 px-4 py-3 font-semibold text-white transition-all active:scale-95"
              >
                {starting ? 'Starting…' : 'Start Re-clean'}
              </button>
            ) : (
              <p className="w-full text-center text-sm text-slate-500">
                Waiting for {leadName} to start re-clean.
              </p>
            )
          ) : null}
        </div>
      </div>

      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
    </div>
  )
}
