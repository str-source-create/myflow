/**
 * PropertyCard.jsx
 * Source file for the cleanflow application.
 */

import StatusBadge from './StatusBadge'

export default function PropertyCard({ property, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-[Manrope] text-lg font-semibold text-slate-900">{property.name}</h3>
        <StatusBadge status={property.active ? 'active' : 'inactive'} />
      </div>
      <p className="mt-1 text-sm text-slate-500">{property.address}</p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {property.standards.length} standards
      </p>
    </button>
  )
}

