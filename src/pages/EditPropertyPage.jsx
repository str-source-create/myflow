/**
 * EditPropertyPage.jsx
 * Updates persisted property fields via backend API.
 */
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAdmin } from '../context/AdminContext'

export default function EditPropertyPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { properties, updateProperty } = useAdmin()
  const property = useMemo(() => properties.find((item) => item.id === id), [properties, id])

  const [form, setForm] = useState(
    property || {
      name: '',
      address: '',
      wifiName: '',
      wifiPassword: '',
      gpsLocation: '',
      accessNotes: '',
      parkingNotes: '',
      cleaningNotes: '',
      importantNotes: '',
      active: true,
    },
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!property) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">Property not found.</div>
  }

  function handleChange(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setError('')
    setSaving(true)
    try {
      await updateProperty(property.id, form)
      navigate(`/admin/properties/${property.id}`)
    } catch (err) {
      setError(err.message || 'Failed to update property.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-[Manrope] text-2xl font-bold text-slate-900">Edit Property</h1>
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {[
          ['name', 'Property Name'],
          ['address', 'Address'],
          ['wifiName', 'WiFi Name'],
          ['wifiPassword', 'WiFi Password'],
          ['gpsLocation', 'Google Maps Link'],
        ].map(([key, label]) => (
          <label key={key} className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
            <input
              value={form[key] || ''}
              onChange={(event) => handleChange(key, event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
        ))}

        {[
          ['accessNotes', 'Access Notes'],
          ['parkingNotes', 'Parking Notes'],
          ['cleaningNotes', 'Cleaning Notes'],
          ['importantNotes', 'Important Notes'],
        ].map(([key, label]) => (
          <label key={key} className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
            <textarea
              rows={3}
              value={form[key] || ''}
              onChange={(event) => handleChange(key, event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
        ))}
      </section>

      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="min-h-[44px] rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => navigate(`/admin/properties/${property.id}`)}
          className="min-h-[44px] rounded-xl border border-blue-600 px-4 py-2.5 font-semibold text-blue-600"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
