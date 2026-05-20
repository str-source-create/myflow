/**
 * WorkerChecklistPage.jsx
 * Displays grouped checklist and persists complete/uncomplete actions immediately.
 * Uses optimistic UI updates: the item toggles instantly in the UI while the
 * server call is in-flight, and reverts if the call fails.
 * Auto-refreshes every 15 s so multiple workers on the same task stay in sync.
 */
import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import ChecklistItem from '../components/ChecklistItem'
import ProgressBar from '../components/ProgressBar'
import TaskTimer from '../components/TaskTimer'
import { useWorker } from '../context/WorkerContext'
import { useAutoRefresh } from '../../hooks/useAutoRefresh'

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

const AREA_ORDER_HINT = ['Kitchen', 'Bedrooms', 'Bathroom', 'All Areas — Sweeping & Dusting', 'Outdoor — Porch / Patio / Spa', 'Final Check']

export default function WorkerChecklistPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { tasks, toggleChecklistItem, refreshTasks } = useWorker()
  const [updatingItemId, setUpdatingItemId] = useState('')
  const [error, setError] = useState('')
  // Track in-flight item IDs for optimistic rendering (show toggled state immediately).
  const [pendingItems, setPendingItems] = useState(new Set())

  // Auto-refresh every 15 s so two workers on the same task stay in sync.
  useAutoRefresh(refreshTasks, 15_000)

  const task = tasks.find((item) => item.id === id)

  if (!task) {
    return <Navigate to="/worker/" replace />
  }

  // Apply optimistic toggles: items in pendingItems show the opposite of their stored state.
  const optimisticItems = task.checklistItems.map((item) =>
    pendingItems.has(item.id) ? { ...item, completed: !item.completed } : item,
  )

  // Group by actual task area names so custom property areas are never hidden.
  const grouped = optimisticItems.reduce((acc, item) => {
    if (!acc[item.area]) acc[item.area] = []
    acc[item.area].push(item)
    return acc
  }, {})

  // Keep common areas in a predictable order, then append any custom areas.
  const orderedAreaNames = Object.keys(grouped).sort((a, b) => {
    const ia = AREA_ORDER_HINT.indexOf(a)
    const ib = AREA_ORDER_HINT.indexOf(b)
    if (ia === -1 && ib === -1) return a.localeCompare(b)
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })

  const completed = optimisticItems.filter((item) => item.completed).length
  const total = optimisticItems.length

  /**
   * Optimistic toggle: flip the item visually immediately, persist to server,
   * revert on error so the UI never silently lies about the server state.
   */
  async function handleToggle(itemId) {
    setError('')
    setUpdatingItemId(itemId)
    // Optimistic: add to pending set so the item renders toggled instantly.
    setPendingItems((prev) => new Set([...prev, itemId]))
    try {
      await toggleChecklistItem(task.id, itemId)
    } catch (err) {
      setError(err.message || 'Failed to update checklist item.')
    } finally {
      // Remove from pending — context state now reflects the server truth.
      setPendingItems((prev) => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
      setUpdatingItemId('')
    }
  }

  return (
    <div className="space-y-5 px-4 py-5 pb-28">
      <header className="sticky top-0 z-10 -mx-4 space-y-4 border-b border-slate-200 bg-slate-50 px-4 pb-4 pt-1">
        <h1 className="font-[Manrope] text-2xl font-bold text-slate-900">{task.propertyName}</h1>
        <TaskTabs taskId={task.id} activeTab="Checklist" />
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <TaskTimer startedAt={task.startedAt} endedAt={task.endedAt} status={task.status} />
        <ProgressBar value={completed} total={total} />
      </section>

      <section className="space-y-4">
        {orderedAreaNames.map((area) => (
          <article key={area} className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="font-[Manrope] text-base font-semibold text-slate-900">{area}</h2>
            <div className="space-y-2">
              {grouped[area].map((item) => (
                <ChecklistItem
                  key={item.id}
                  item={item}
                  onToggle={() => void handleToggle(item.id)}
                />
              ))}
            </div>
          </article>
        ))}
      </section>

      {updatingItemId ? <p className="text-sm text-slate-500">Saving checklist change...</p> : null}
      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

      <div className="fixed bottom-20 left-0 right-0 z-20 border-t border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
          <p className="text-sm font-medium text-slate-700">
            {completed} / {total} completed
          </p>
          <button
            type="button"
            onClick={() => navigate(`/worker/tasks/${task.id}/photos`)}
            className="min-h-[44px] rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition-all active:scale-95"
          >
            Go to Photos
          </button>
        </div>
      </div>
    </div>
  )
}
