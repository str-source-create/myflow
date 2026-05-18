/**
 * WorkersPage.jsx
 * Admin worker management page with:
 *  - Edit modal (name, email, phone)
 *  - Deactivate worker (soft-delete)
 *  - Reset password (generates temp password and shows it to admin)
 */
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import WorkerCard from '../components/WorkerCard'
import { useAdmin } from '../context/AdminContext'

export default function WorkersPage() {
  const navigate = useNavigate()
  const { workers, updateWorker, deactivateWorker, resetWorkerPassword } = useAdmin()
  const [query, setQuery] = useState('')

  // Edit modal state
  const [editWorker, setEditWorker] = useState(null) // the worker being edited
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  // Temp password display state (shown after reset)
  const [tempPassword, setTempPassword] = useState('')
  const [tempPasswordWorkerName, setTempPasswordWorkerName] = useState('')

  const filtered = useMemo(
    () =>
      workers.filter((worker) =>
        `${worker.name} ${worker.email}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [workers, query],
  )

  /** Opens the edit modal pre-filled with the selected worker's data. */
  function handleEdit(worker) {
    setEditWorker(worker)
    setEditForm({ name: worker.name, email: worker.email, phone: worker.phone || '' })
    setEditError('')
  }

  /** Saves the edited worker fields. */
  async function handleEditSave(e) {
    e.preventDefault()
    if (!editForm.name.trim()) return setEditError('Name is required.')
    if (!editForm.email.trim()) return setEditError('Email is required.')

    setEditSaving(true)
    setEditError('')
    try {
      await updateWorker(editWorker.id, {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
      })
      setEditWorker(null)
    } catch (err) {
      setEditError(err.message || 'Failed to update worker.')
    } finally {
      setEditSaving(false)
    }
  }

  /** Deactivates a worker after confirmation. */
  async function handleDeactivate(workerId) {
    const worker = workers.find((w) => w.id === workerId)
    if (!confirm(`Deactivate ${worker?.name || 'this worker'}? They will no longer be able to log in.`)) return
    try {
      await deactivateWorker(workerId)
    } catch (err) {
      alert(err.message || 'Failed to deactivate worker.')
    }
  }

  /** Resets a worker's password and shows the temporary password to the admin. */
  async function handleResetPassword(worker) {
    if (!confirm(`Reset password for ${worker.name}? A temporary password will be generated.`)) return
    try {
      const data = await resetWorkerPassword(worker.id)
      setTempPasswordWorkerName(worker.name)
      setTempPassword(data.tempPassword || '')
    } catch (err) {
      alert(err.message || 'Failed to reset password.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-[Manrope] text-2xl font-bold text-slate-900">Workers</h1>
        <button
          type="button"
          onClick={() => navigate('/admin/workers/add')}
          className="min-h-[44px] rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white"
        >
          Add Worker
        </button>
      </div>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search workers"
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base"
      />

      {filtered.length === 0 ? (
        <EmptyState icon="👤" title="No workers found" message="Try a different search." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((worker) => (
            <WorkerCard
              key={worker.id}
              worker={worker}
              onViewTasks={() => navigate(`/admin/tasks?workerId=${worker.id}`)}
              onEdit={handleEdit}
              onDeactivate={handleDeactivate}
            />
          ))}
        </div>
      )}

      {/* ——— Edit Worker Modal ——— */}
      {editWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h2 className="mb-4 font-[Manrope] text-xl font-bold text-slate-900">Edit Worker</h2>
            <form onSubmit={handleEditSave} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Full Name*</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email*</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
                <input
                  value={editForm.phone}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base"
                />
              </div>

              {editError && <p className="text-sm font-medium text-red-600">{editError}</p>}

              {/* Reset password button inside edit modal */}
              <button
                type="button"
                onClick={() => {
                  setEditWorker(null)
                  handleResetPassword(editWorker)
                }}
                className="w-full min-h-[44px] rounded-xl border border-amber-400 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-50"
              >
                Reset Password
              </button>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={editSaving}
                  className="flex-1 min-h-[44px] rounded-xl bg-blue-600 py-2.5 font-semibold text-white disabled:opacity-60"
                >
                  {editSaving ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditWorker(null)}
                  className="flex-1 min-h-[44px] rounded-xl border border-slate-300 py-2.5 font-semibold text-slate-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ——— Temp Password Display Modal ——— */}
      {tempPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-amber-200 bg-white p-6 shadow-xl">
            <h2 className="mb-2 font-[Manrope] text-xl font-bold text-slate-900">Password Reset</h2>
            <p className="mb-4 text-sm text-slate-500">
              Temporary password for <strong>{tempPasswordWorkerName}</strong>. Share it securely — they
              should change it after logging in.
            </p>
            <div className="mb-4 select-all rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 font-mono text-lg font-bold tracking-wider text-amber-900">
              {tempPassword}
            </div>
            <button
              type="button"
              onClick={() => setTempPassword('')}
              className="w-full min-h-[44px] rounded-xl bg-slate-800 py-2.5 font-semibold text-white"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
