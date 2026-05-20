/**
 * PropertyDetailPage.jsx
 * Displays property details with standards and the property checklist entry point.
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ConfirmModal from '../components/ConfirmModal'
import EmptyState from '../components/EmptyState'
import StatusBadge from '../components/StatusBadge'
import { useAdmin } from '../context/AdminContext'
import { apiRequest } from '../lib/api'

export default function PropertyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { properties, deleteProperty, deleteStandard } = useAdmin()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [stdDeleteId, setStdDeleteId] = useState(null)
  const [checklistData, setChecklistData] = useState(null)

  // TODO: replace with API call
  const property = useMemo(() => properties.find((item) => item.id === id), [properties, id])

  useEffect(() => {
    if (!property?.id) return

    // Checklist preview is non-blocking for this page, so failures stay silent.
    apiRequest(`/property-checklist/property/${property.id}`, {}, 'admin')
      .then((res) => setChecklistData(res.data))
      .catch(() => {})
  }, [property?.id])

  const checklistAreas = checklistData?.areas?.map((area) => area.area) || []
  const checklistAreaCount = checklistAreas.length
  const checklistItemCount = checklistData?.areas?.reduce((sum, area) => sum + area.items.length, 0) || 0

  if (!property) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">Property not found.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-[Manrope] text-2xl font-bold text-slate-900">{property.name}</h1>
        <StatusBadge status={property.active ? 'active' : 'inactive'} />
      </div>

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <Info label="Address" value={property.address} />
        <Info label="WiFi" value={`${property.wifiName} / ${property.wifiPassword}`} />
        <Info label="GPS" value={property.gpsLocation || 'Not set'} href={property.gpsLocation} />
        <Info label="Access Notes" value={property.accessNotes || '-'} />
        <Info label="Parking Notes" value={property.parkingNotes || '-'} />
        <Info label="Cleaning Notes" value={property.cleaningNotes || '-'} />
        <Info label="Important Notes" value={property.importantNotes || '-'} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-[Manrope] text-xl font-bold text-slate-900">Cleaning Checklist</h2>
            <p className="mt-1 text-sm text-slate-500">
              {checklistItemCount > 0
                ? `${checklistItemCount} items across ${checklistAreaCount} areas`
                : 'No checklist set up yet — tasks will have an empty checklist'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/admin/properties/${property.id}/checklist`)}
            className="min-h-[44px] rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700"
          >
            <i className="ti ti-clipboard-list" />{' '}
            {checklistItemCount > 0 ? 'Edit Checklist' : 'Set Up Checklist'}
          </button>
        </div>

        {checklistAreas.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {checklistAreas.map((area) => (
              <span key={area} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                {area}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => navigate(`/admin/properties/${property.id}/edit`)}
          className="min-h-[44px] rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700"
        >
          Edit Property
        </button>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="min-h-[44px] rounded-xl bg-red-600 px-4 py-2.5 font-semibold text-white hover:bg-red-700"
        >
          Delete Property
        </button>
        <button
          type="button"
          onClick={() => navigate(`/admin/properties/${property.id}/standards`)}
          className="min-h-[44px] rounded-xl border border-blue-600 px-4 py-2.5 font-semibold text-blue-600 hover:bg-blue-50"
        >
          Manage Standards
        </button>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-[Manrope] text-xl font-bold text-slate-900">Reference Standards</h2>
          <button
            type="button"
            onClick={() => navigate(`/admin/properties/${property.id}/standards`)}
            className="min-h-[44px] rounded-xl border border-blue-600 px-4 py-2.5 text-sm font-semibold text-blue-600"
          >
            Add Standard
          </button>
        </div>

        {property.standards.length === 0 ? (
          <EmptyState
            icon="📷"
            title="No standards yet"
            message="Add standards so cleaners can match reference setup."
          />
        ) : (
          <div className="space-y-3">
            {property.standards.map((standard) => (
              <article key={standard.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-[Manrope] text-lg font-semibold text-slate-900">{standard.areaName}</h3>
                  {standard.required ? <StatusBadge status="pending_review" /> : null}
                </div>
                {standard.referencePhotoUrl ? (
                  <img
                    src={standard.referencePhotoUrl}
                    alt={standard.areaName}
                    className="mt-3 h-40 w-full rounded-xl border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="mt-3 flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-100 text-slate-500">
                    <span className="text-2xl">📷</span>
                  </div>
                )}
                <p className="mt-2 text-sm text-slate-600">{standard.instruction}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/properties/${property.id}/standards`)}
                    className="min-h-[44px] rounded-xl border border-blue-600 px-4 py-2.5 text-sm font-semibold text-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setStdDeleteId(standard.id)}
                    className="min-h-[44px] rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <ConfirmModal
        open={deleteOpen}
        title="Delete Property"
        message="Are you sure? This cannot be undone."
        confirmLabel="Delete"
        confirmDanger
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          deleteProperty(property.id)
          setDeleteOpen(false)
          navigate('/admin/properties')
        }}
      />

      <ConfirmModal
        open={Boolean(stdDeleteId)}
        title="Delete Standard"
        message="Delete this standard?"
        confirmLabel="Delete"
        confirmDanger
        onCancel={() => setStdDeleteId(null)}
        onConfirm={() => {
          deleteStandard(property.id, stdDeleteId)
          setStdDeleteId(null)
        }}
      />
    </div>
  )
}

function Info({ label, value, href }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
          {value}
        </a>
      ) : (
        <p className="text-sm text-slate-700">{value}</p>
      )}
    </div>
  )
}
