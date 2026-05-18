/**
 * PropertiesPage.jsx
 * Source file for the cleanflow application.
 */

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import PropertyCard from '../components/PropertyCard'
import { useAdmin } from '../context/AdminContext'

export default function PropertiesPage() {
  const navigate = useNavigate()
  const { properties } = useAdmin()
  const [query, setQuery] = useState('')
  const [loading] = useState(false)
  const [error] = useState('')

  const filtered = useMemo(
    () => properties.filter((property) => property.name.toLowerCase().includes(query.toLowerCase())),
    [properties, query],
  )

  if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-6">Loading properties...</div>
  if (error) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-[Manrope] text-2xl font-bold text-slate-900">Properties</h1>
        <button
          type="button"
          onClick={() => navigate('/admin/properties/add')}
          className="min-h-[44px] rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700"
        >
          Add Property
        </button>
      </div>

      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search properties"
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon="🏠"
          title="No properties yet"
          message="Add your first property to get started."
          actionLabel="Add Property"
          onAction={() => navigate('/admin/properties/add')}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onClick={() => navigate(`/admin/properties/${property.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

