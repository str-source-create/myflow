/**
 * WorkerCard.jsx
 * Displays a worker's summary card with View Tasks, Edit, and Deactivate actions.
 */
import StatusBadge from './StatusBadge'

export default function WorkerCard({ worker, onViewTasks, onEdit, onDeactivate }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-[Manrope] text-lg font-semibold text-slate-900">{worker.name}</h3>
          <p className="text-sm text-slate-500">{worker.email}</p>
          <p className="text-sm text-slate-500">{worker.phone}</p>
        </div>
        <StatusBadge status={worker.active ? 'active' : 'inactive'} />
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <p className="text-slate-600">Tasks completed: {worker.tasksCompleted}</p>
        <p className="font-semibold text-amber-600">★ {worker.rating}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onViewTasks}
          className="min-h-[44px] rounded-xl border border-blue-600 px-4 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50"
        >
          View Tasks
        </button>
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(worker)}
            className="min-h-[44px] rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Edit
          </button>
        )}
        {onDeactivate && worker.active && (
          <button
            type="button"
            onClick={() => onDeactivate(worker.id)}
            className="min-h-[44px] rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            Deactivate
          </button>
        )}
      </div>
    </article>
  )
}
