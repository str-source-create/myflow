/**
 * AddWorkerPage.jsx
 * Creates a worker account in backend and displays onboarding confirmation.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdmin } from '../context/AdminContext'

const INITIAL = {
  name: '',
  email: '',
  phone: '',
  tempPassword: '',
  active: true,
}

export default function AddWorkerPage() {
  const navigate = useNavigate()
  const { addWorker } = useAdmin()
  const [form, setForm] = useState(INITIAL)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [saving, setSaving] = useState(false)

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (!form.name.trim() || !form.email.trim() || !form.tempPassword.trim()) {
      setError('Name, email, and temporary password are required.')
      return
    }

    setError('')
    setSaving(true)
    try {
      await addWorker({
        name: form.name,
        email: form.email,
        phone: form.phone,
        active: form.active,
        password: form.tempPassword,
      })
      setToast(`Worker added. Temp password: ${form.tempPassword}`)
      setTimeout(() => navigate('/admin/workers'), 900)
    } catch (err) {
      setError(err.message || 'Failed to create worker.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-[Manrope] text-2xl font-bold text-slate-900">Add Worker</h1>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {[
          ['name', 'Full Name*'],
          ['email', 'Email*'],
          ['phone', 'Phone'],
          ['tempPassword', 'Temporary Password*'],
        ].map(([key, label]) => (
          <label key={key} className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
            <input
              value={form[key]}
              onChange={(event) => setField(key, event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base"
            />
          </label>
        ))}

        <label className="flex min-h-[44px] items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(event) => setField('active', event.target.checked)}
            className="h-5 w-5"
          />
          Active
        </label>
      </section>

      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
      {toast ? <p className="text-sm font-medium text-green-600">{toast}</p> : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="min-h-[44px] rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white"
        >
          {saving ? 'Saving...' : 'Save Worker'}
        </button>
        <button
          type="button"
          onClick={() => navigate('/admin/workers')}
          className="min-h-[44px] rounded-xl border border-blue-600 px-4 py-2.5 font-semibold text-blue-600"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
