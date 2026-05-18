/**
 * StatusBadge.jsx
 * Source file for the cleanflow application.
 */

const STATUS_STYLES = {
  scheduled: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-50 text-blue-600',
  submitted: 'bg-green-50 text-green-600',
  approved: 'bg-green-700 text-white',
  re_clean_needed: 'bg-red-50 text-red-600',
}

const STATUS_LABELS = {
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  submitted: 'Submitted',
  approved: 'Approved',
  re_clean_needed: 'Re-clean Needed',
}

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex min-h-[28px] items-center rounded-full px-3 py-1 text-xs font-semibold ${
        STATUS_STYLES[status] || STATUS_STYLES.scheduled
      }`}
    >
      {STATUS_LABELS[status] || 'Scheduled'}
    </span>
  )
}

