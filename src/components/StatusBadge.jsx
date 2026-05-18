/**
 * StatusBadge.jsx
 * Source file for the cleanflow application.
 */

const MAP = {
  scheduled: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  submitted: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  re_clean_needed: 'bg-red-100 text-red-700',
  pending_review: 'bg-amber-100 text-amber-700',
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-slate-100 text-slate-700',
}

const LABEL = {
  in_progress: 'In Progress',
  re_clean_needed: 'Re-clean Needed',
  pending_review: 'Pending Review',
}

export default function StatusBadge({ status }) {
  const key = status || 'scheduled'
  return (
    <span className={`inline-flex min-h-[28px] items-center rounded-full px-2.5 text-xs font-semibold ${MAP[key] || MAP.scheduled}`}>
      {LABEL[key] || key.replaceAll('_', ' ').replace(/\b\w/g, (x) => x.toUpperCase())}
    </span>
  )
}

