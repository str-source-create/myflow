/**
 * SubmissionsPage.jsx
 * Source file for the cleanflow application.
 */

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import StatusBadge from '../components/StatusBadge'
import { useAdmin } from '../context/AdminContext'
import { useAutoRefresh } from '../hooks/useAutoRefresh'
import { formatDateTime } from '../utils/timezone'

const TABS = [
  ['all', 'All'],
  ['pending_review', 'Pending Review'],
  ['approved', 'Approved'],
  ['re_clean_needed', 'Re-clean Needed'],
]

export default function SubmissionsPage() {
  const navigate = useNavigate()
  const { submissions, refreshAdminData } = useAdmin()
  useAutoRefresh(refreshAdminData, 30_000)
  const [tab, setTab] = useState('all')
  const [loading] = useState(false)
  const [error] = useState('')

  const filtered = useMemo(() => {
    if (tab === 'all') return submissions
    return submissions.filter((submission) => submission.reviewStatus === tab)
  }, [submissions, tab])

  if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-6">Loading submissions...</div>
  if (error) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>

  return (
    <div className="space-y-6">
      <h1 className="font-[Manrope] text-2xl font-bold text-slate-900">Submissions</h1>

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
        <EmptyState icon="🧾" title="No submissions in this filter" message="Try another filter tab." />
      ) : (
        <div className="space-y-3">
          {filtered.map((submission) => (
            <article key={submission.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-[Manrope] text-lg font-semibold text-slate-900">{submission.propertyName}</h2>
                  <p className="text-sm text-slate-500">{submission.taskTitle}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {submission.workerName} • {formatDateTime(submission.submittedAt)}
                  </p>
                </div>
                <StatusBadge status={submission.reviewStatus} />
              </div>
              <p className="mt-3 text-sm text-slate-600">
                Checklist: {submission.checklistCompleted}/{submission.checklistTotal}
              </p>
              <p className="text-sm text-slate-600">
                Photos: {submission.beforePhotos + submission.afterPhotos + submission.problemPhotos} uploaded
              </p>
              <button
                type="button"
                onClick={() => navigate(`/admin/submissions/${submission.id}`)}
                className="mt-3 min-h-[44px] rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white"
              >
                Review
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

