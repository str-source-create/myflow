/**
 * StatCard.jsx
 * Source file for the cleanflow application.
 */

export default function StatCard({ label, value }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-[Manrope] text-3xl font-bold text-slate-900">{value}</p>
    </article>
  )
}

