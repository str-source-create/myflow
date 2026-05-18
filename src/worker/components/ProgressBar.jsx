/**
 * ProgressBar.jsx
 * Source file for the cleanflow application.
 */

export default function ProgressBar({ value, total }) {
  const safeTotal = total || 1
  const percentage = Math.min(100, Math.round((value / safeTotal) * 100))

  return (
    <div className="space-y-2">
      <div className="h-2 w-full rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full bg-blue-600 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-slate-500">{value} / {total} completed</p>
    </div>
  )
}

