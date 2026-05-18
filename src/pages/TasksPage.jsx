/**
 * TasksPage.jsx
 * Source file for the cleanflow application.
 */

import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import TaskCard from '../components/TaskCard'
import { useAdmin } from '../context/AdminContext'

const TABS = [
  ['all', 'All'],
  ['today', 'Today'],
  ['scheduled', 'Scheduled'],
  ['in_progress', 'In Progress'],
  ['submitted', 'Submitted'],
  ['approved', 'Approved'],
]

export default function TasksPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { tasks, workers } = useAdmin()
  const [tab, setTab] = useState('all')
  const [loading] = useState(false)
  const [error] = useState('')

  const workerFilter = params.get('workerId')
  const today = '2026-05-14'

  const filtered = useMemo(() => {
    let list = [...tasks]
    if (workerFilter) {
      list = list.filter((task) => task.assignedWorkerIds.includes(workerFilter))
    }
    if (tab === 'today') return list.filter((task) => task.date === today)
    if (tab !== 'all') return list.filter((task) => task.status === tab)
    return list
  }, [tasks, tab, workerFilter])

  if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-6">Loading tasks...</div>
  if (error) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-[Manrope] text-2xl font-bold text-slate-900">Tasks</h1>
        <button
          type="button"
          onClick={() => navigate('/admin/tasks/create')}
          className="min-h-[44px] rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white"
        >
          Create Task
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`min-h-[44px] shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold ${
              tab === value ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🗓" title="No tasks in this filter" message="Try a different tab." />
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              workerNames={task.assignedWorkerIds
                .map((id) => workers.find((worker) => worker.id === id)?.name)
                .filter(Boolean)}
              onClick={() => navigate(`/admin/tasks/${task.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

