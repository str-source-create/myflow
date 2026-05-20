/**
 * AddPropertyPage.jsx
 * Creates a property in backend and navigates to its persisted details page.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdmin } from '../context/AdminContext'

const INITIAL = {
  name: '',
  address: '',
  wifiName: '',
  wifiPassword: '',
  gpsLocation: '',
  accessNotes: '',
  parkingNotes: '',
  cleaningNotes: '',
  importantNotes: '',
}

export default function AddPropertyPage() {
  const navigate = useNavigate()
  const { addProperty } = useAdmin()
  const [form, setForm] = useState(INITIAL)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [saving, setSaving] = useState(false)
  const [showChecklistPrompt, setShowChecklistPrompt] = useState(false)
  const [newPropertyId, setNewPropertyId] = useState('')

  function handleChange(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (!form.name.trim() || !form.address.trim()) {
      setError('Property name and address are required.')
      return
    }

    setError('')
    setSaving(true)
    try {
      const created = await addProperty({ ...form })
      setToast('Property saved!')
      // Prompt checklist setup immediately after property creation.
      setNewPropertyId(created.id)
      setShowChecklistPrompt(true)
    } catch (err) {
      setError(err.message || 'Failed to save property.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-[Manrope] text-2xl font-bold text-slate-900">Add Property</h1>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <Input label="Property Name*" value={form.name} onChange={(value) => handleChange('name', value)} />
        <Input label="Address*" value={form.address} onChange={(value) => handleChange('address', value)} />
        <Input label="WiFi Name" value={form.wifiName} onChange={(value) => handleChange('wifiName', value)} />

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">WiFi Password</span>
          <div className="flex gap-2">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.wifiPassword}
              onChange={(event) => handleChange('wifiPassword', event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="min-h-[44px] rounded-xl border border-slate-200 px-3"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>

        <Input label="Google Maps Link" value={form.gpsLocation} onChange={(value) => handleChange('gpsLocation', value)} />
        <TextArea label="Access Notes" value={form.accessNotes} onChange={(value) => handleChange('accessNotes', value)} />
        <TextArea label="Parking Notes" value={form.parkingNotes} onChange={(value) => handleChange('parkingNotes', value)} />
        <TextArea label="Cleaning Notes" value={form.cleaningNotes} onChange={(value) => handleChange('cleaningNotes', value)} />

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <TextArea
            label="Important Notes"
            value={form.importantNotes}
            onChange={(value) => handleChange('importantNotes', value)}
          />
        </div>
      </section>

      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
      {toast ? <p className="text-sm font-medium text-green-600">{toast}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="min-h-[44px] rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700"
        >
          {saving ? 'Saving...' : 'Save Property'}
        </button>
        <button
          type="button"
          onClick={() => navigate('/admin/properties')}
          className="min-h-[44px] rounded-xl border border-blue-600 px-4 py-2.5 font-semibold text-blue-600 hover:bg-blue-50"
        >
          Cancel
        </button>
      </div>

      {showChecklistPrompt ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <i className="ti ti-circle-check text-2xl text-green-600" />
            </div>
            <h2 className="mb-2 text-center font-[Manrope] text-lg font-bold text-slate-900">Property saved!</h2>
            <p className="mb-6 text-center text-sm text-slate-500">
              Would you like to set up the cleaning checklist for this property now?
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => navigate(`/admin/properties/${newPropertyId}/checklist`)}
                className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Set Up Checklist Now
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/properties')}
                className="w-full rounded-xl py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50"
              >
                Skip for now — do it later
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Input({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </label>
  )
}

function TextArea({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </label>
  )
}
