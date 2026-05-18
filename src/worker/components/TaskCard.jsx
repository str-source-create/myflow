/**
 * TaskCard.jsx
 * Source file for the cleanflow application.
 */

import { useNavigate } from 'react-router-dom'
import ProgressBar from './ProgressBar'
import StatusBadge from './StatusBadge'

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s7-6.2 7-13a7 7 0 1 0-14 0c0 6.8 7 13 7 13Z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

export default function TaskCard({ task }) {
  const navigate = useNavigate()

  const completed = task.checklistItems.filter((item) => item.completed).length
  const total = task.checklistItems.length

  const openTask = () => navigate(`/worker/tasks/${task.id}`)
  const openPhotos = () => navigate(`/worker/tasks/${task.id}/photos`)

  const clickable = task.status !== 'in_progress'

  return (
    <article
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${
        clickable ? 'cursor-pointer active:scale-[0.995]' : ''
      }`}
      onClick={clickable ? openTask : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') openTask()
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-[Manrope] text-lg font-semibold text-slate-900">{task.propertyName}</h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
            <PinIcon />
            {task.address}
          </p>
          <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
            <ClockIcon />
            {task.startTime} - {task.endTime}
          </p>
        </div>
        <StatusBadge status={task.status} />
      </div>

      {task.status === 'in_progress' && total > 0 ? (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <ProgressBar value={completed} total={total} />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={openTask}
              className="min-h-[44px] rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition-all active:scale-95"
            >
              Open Task
            </button>
            <button
              type="button"
              onClick={openPhotos}
              className="min-h-[44px] rounded-xl border border-blue-600 px-4 py-3 font-semibold text-blue-600"
            >
              Upload Photos
            </button>
          </div>
        </div>
      ) : null}

      {/* Re-clean needed — prominent amber strip with manager's note */}
      {task.status === 're_clean_needed' ? (
        <div
          className="mt-3 cursor-pointer rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5"
          onClick={openTask}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openTask() }}
        >
          <p className="text-xs font-semibold text-amber-700">⚠️ Re-clean requested by manager</p>
          {task.managerFeedback ? (
            <p className="mt-0.5 text-xs text-amber-600 line-clamp-2">{task.managerFeedback}</p>
          ) : null}
          <p className="mt-1 text-xs font-semibold text-amber-700 underline">Tap to start re-clean →</p>
        </div>
      ) : null}
    </article>
  )
}

