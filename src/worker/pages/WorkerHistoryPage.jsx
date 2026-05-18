/**
 * WorkerHistoryPage.jsx
 * Source file for the cleanflow application.
 */

import { useState } from 'react'
import StatusBadge from '../components/StatusBadge'
import { useWorker } from '../context/WorkerContext'

export default function WorkerHistoryPage() {
  const { tasks } = useWorker()
  const [openId, setOpenId] = useState(null)

  // TODO: GET /api/submissions?workerId=me
  const history = tasks.filter((task) => task.status === 'submitted' || task.status === 'approved')

  return (
    <div className="space-y-5 px-4 py-5 pb-24">
      <header className="sticky top-0 z-10 -mx-4 border-b border-slate-200 bg-slate-50 px-4 py-4">
        <h1 className="font-[Manrope] text-2xl font-bold text-slate-900">History</h1>
        <p className="mt-1 text-sm text-slate-500">Submitted and approved jobs</p>
      </header>

      {history.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No past submissions yet.
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((task) => {
            const expanded = openId === task.id

            return (
              <button
                key={task.id}
                type="button"
                onClick={() => setOpenId(expanded ? null : task.id)}
                className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-[Manrope] text-lg font-semibold text-slate-900">{task.propertyName}</h2>
                    <p className="mt-1 text-sm text-slate-500">{task.date} - {task.startTime}</p>
                  </div>
                  <StatusBadge status={task.status} />
                </div>

                {expanded ? (
                  <div className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-sm text-slate-600">
                    <p>Address: {task.address}</p>
                    <p>Submitted: {task.submittedAt || 'Not recorded'}</p>
                    <p>Notes: {task.notes || 'No notes'}</p>
                  </div>
                ) : null}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

