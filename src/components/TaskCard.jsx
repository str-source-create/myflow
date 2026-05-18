/**
 * TaskCard.jsx
 * Source file for the cleanflow application.
 */

import StatusBadge from './StatusBadge'

const PRIORITY_STYLE = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-slate-100 text-slate-700',
}

function initials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function TaskCard({ task, workerNames, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-[Manrope] text-lg font-semibold text-slate-900">{task.title}</h3>
          <p className="text-sm text-slate-500">{task.propertyName}</p>
        </div>
        <StatusBadge status={task.status} />
      </div>

      <p className="mt-2 text-sm text-slate-600">
        {task.date} • {task.startTime} - {task.endTime}
      </p>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex -space-x-2">
          {workerNames.length === 0 ? <span className="text-xs text-slate-400">Unassigned</span> : null}
          {workerNames.map((name) => (
            <span
              key={name}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white bg-blue-100 text-xs font-semibold text-blue-700"
              title={name}
            >
              {initials(name)}
            </span>
          ))}
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.low}`}>
          {(task.priority || 'low').toUpperCase()}
        </span>
      </div>
    </button>
  )
}

