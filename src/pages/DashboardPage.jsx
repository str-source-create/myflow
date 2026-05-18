/**
 * DashboardPage.jsx
 * Renders admin operational KPIs and today's workload from persisted backend data.
 */
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import TaskCard from '../components/TaskCard'
import { useAdmin } from '../context/AdminContext'
import { useAutoRefresh } from '../hooks/useAutoRefresh'

export default function DashboardPage() {
  /**
   * DashboardPage renders today's operational summary from backend-derived context data.
   */
  const navigate = useNavigate()
  const { tasks, submissions, properties, workers, refreshAdminData } = useAdmin()
  useAutoRefresh(refreshAdminData, 30_000)
  const [loading] = useState(false)
  const [error] = useState('')

  // Use the browser-local current date key so the dashboard always reflects "today".
  const today = new Date().toISOString().split('T')[0]
  const todayTasks = useMemo(() => tasks.filter((task) => task.date === today), [tasks])
  const pendingSubmissions = useMemo(
    () => submissions.filter((submission) => submission.reviewStatus === 'pending_review'),
    [submissions],
  )

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6">Loading dashboard...</div>
  }

  if (error) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Jobs Today" value={todayTasks.length} />
        <StatCard label="Pending Reviews" value={pendingSubmissions.length} />
        <StatCard label="Total Properties" value={properties.length} />
        <StatCard label="Active Workers" value={workers.filter((worker) => worker.active).length} />
      </section>

      <section className="space-y-4">
        <h2 className="font-[Manrope] text-xl font-bold text-slate-900">Today's Tasks</h2>
        {todayTasks.length === 0 ? (
          <EmptyState icon="📅" title="No tasks today" message="You're all clear for today." />
        ) : (
          <div className="space-y-3">
            {todayTasks.map((task) => {
              const names = task.assignedWorkerIds
                .map((workerId) => workers.find((worker) => worker.id === workerId)?.name)
                .filter(Boolean)

              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  workerNames={names}
                  onClick={() => navigate(`/admin/tasks/${task.id}`)}
                />
              )
            })}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-[Manrope] text-xl font-bold text-slate-900">Pending Submissions</h2>
        {pendingSubmissions.length === 0 ? (
          <EmptyState icon="✅" title="No pending reviews" message="All submissions are reviewed." />
        ) : (
          <div className="space-y-3">
            {pendingSubmissions.map((submission) => (
              <article
                key={submission.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div>
                  <h3 className="font-[Manrope] text-base font-semibold text-slate-900">{submission.propertyName}</h3>
                  <p className="text-sm text-slate-500">
                    {submission.workerName} • Submitted at {submission.submittedAt}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={submission.reviewStatus} />
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/submissions/${submission.id}`)}
                    className="min-h-[44px] rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700"
                  >
                    Review
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
