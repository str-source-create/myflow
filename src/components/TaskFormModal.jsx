/**
 * TaskFormModal.jsx
 * Reusable create/edit task modal for calendar interactions.
 * Checklist items are auto-generated from the selected property's template.
 */
import { useEffect, useState } from 'react'
import ConfirmModal from './ConfirmModal'
import { apiRequest } from '../lib/api'

/**
 * Creates editable modal form state from selected task/cell context.
 */
function buildInitialForm({ selectedTask, selectedCell }) {
  return {
    title: selectedTask?.title || '',
    propertyId: selectedTask?.propertyId || selectedCell?.propertyId || '',
    taskType: selectedTask?.taskType || 'turnover',
    date: selectedTask?.date || selectedCell?.date || '',
    startTime: selectedTask?.startTime || '10:00',
    endTime: selectedTask?.endTime || '14:00',
    priority: selectedTask?.priority || 'medium',
    assignedWorkerIds: selectedTask?.assignedWorkerIds || [],
    taskLeadId: selectedTask?.taskLeadId || '',
    managerNotes: selectedTask?.managerNotes || '',
  }
}

export default function TaskFormModal({
  open,
  selectedTask,
  selectedCell,
  properties,
  workers,
  onClose,
  onSave,
  onDelete,
  onOpenDetails,
}) {
  const [form, setForm] = useState(buildInitialForm({ selectedTask, selectedCell }))
  const [propertyChecklist, setPropertyChecklist] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(buildInitialForm({ selectedTask, selectedCell }))
      setError('')
    }
  }, [open, selectedTask, selectedCell])

  useEffect(() => {
    if (!open || !form.propertyId) {
      setPropertyChecklist(null)
      return
    }

    // Preview the checklist template that will be auto-copied on task creation.
    apiRequest(`/property-checklist/property/${form.propertyId}`, {}, 'admin')
      .then((res) => setPropertyChecklist(res.data || null))
      .catch(() => setPropertyChecklist(null))
  }, [open, form.propertyId])

  /**
   * Toggles selected worker for task assignment.
   */
  function toggleWorker(workerId) {
    setForm((prev) => {
      const nextAssigned = prev.assignedWorkerIds.includes(workerId)
        ? prev.assignedWorkerIds.filter((id) => id !== workerId)
        : [...prev.assignedWorkerIds, workerId]

      return {
        ...prev,
        assignedWorkerIds: nextAssigned,
        taskLeadId: nextAssigned.includes(prev.taskLeadId) ? prev.taskLeadId : (nextAssigned[0] || ''),
      }
    })
  }

  /**
   * Persists create/edit task changes.
   */
  async function handleSave() {
    if (!form.propertyId || !form.date || !form.startTime || !form.endTime) {
      setError('Property, date, start time, and end time are required.')
      return
    }

    setError('')
    setSaving(true)

    try {
      const selectedProperty = properties.find((property) => property.id === form.propertyId)
      const payload = {
        ...form,
        title: form.title || `${selectedProperty?.name || 'Property'} - Turnover Cleaning`,
      }

      await onSave(payload)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save task.')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-[Manrope] text-xl font-bold text-slate-900">
          {selectedTask ? 'Edit Task' : 'Create Task'}
        </h2>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Property</span>
            <select
              value={form.propertyId}
              onChange={(event) => setForm((prev) => ({ ...prev, propertyId: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base"
            >
              <option value="">Select property</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>{property.name}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Task Type</span>
            <select
              value={form.taskType}
              onChange={(event) => setForm((prev) => ({ ...prev, taskType: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base"
            >
              <option value="turnover">Turnover</option>
              <option value="deep_cleaning">Deep Cleaning</option>
              <option value="inspection">Inspection</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Date</span>
              <input
                type="date"
                value={form.date}
                onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Start Time</span>
              <input
                type="time"
                value={form.startTime}
                onChange={(event) => setForm((prev) => ({ ...prev, startTime: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">End Time</span>
              <input
                type="time"
                value={form.endTime}
                onChange={(event) => setForm((prev) => ({ ...prev, endTime: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Priority</span>
            <select
              value={form.priority}
              onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>

          <div className="rounded-xl border border-slate-200 p-3">
            <p className="mb-2 text-sm font-medium text-slate-700">Assign Workers</p>
            {workers.filter((worker) => worker.active).map((worker) => (
              <label key={worker.id} className="flex min-h-[44px] items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.assignedWorkerIds.includes(worker.id)}
                  onChange={() => toggleWorker(worker.id)}
                  className="h-5 w-5"
                />
                {worker.name}
              </label>
            ))}
          </div>

          {form.assignedWorkerIds.length >= 2 ? (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Task Lead</span>
              <select
                value={form.taskLeadId}
                onChange={(event) => setForm((prev) => ({ ...prev, taskLeadId: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base"
              >
                <option value="">Select lead</option>
                {workers
                  .filter((worker) => form.assignedWorkerIds.includes(worker.id))
                  .map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.name}
                    </option>
                  ))}
              </select>
            </label>
          ) : null}

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Manager Notes</span>
            <textarea
              rows={3}
              value={form.managerNotes}
              onChange={(event) => setForm((prev) => ({ ...prev, managerNotes: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base"
            />
          </label>

          {!selectedTask ? (
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700">Checklist Preview</p>
                {form.propertyId ? (
                  <button
                    type="button"
                    onClick={() => window.open(`/admin/properties/${form.propertyId}/checklist`, '_blank')}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Edit checklist ↗
                  </button>
                ) : null}
              </div>

              {propertyChecklist?.areas?.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {propertyChecklist.areas.map((area) => (
                    <span
                      key={area.area}
                      className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600"
                    >
                      {area.area} ({area.items.length})
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-amber-600">
                  No checklist set up for this property yet. Workers will have an empty checklist.
                </p>
              )}
            </div>
          ) : null}
        </div>

        {error ? <p className="mt-3 text-sm font-medium text-red-600">{error}</p> : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="min-h-[44px] rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white"
          >
            {saving ? 'Saving...' : 'Save Task'}
          </button>

          {selectedTask ? (
            <button
              type="button"
              onClick={() => onOpenDetails(selectedTask.id)}
              className="min-h-[44px] rounded-xl border border-blue-600 px-4 py-2.5 font-semibold text-blue-600"
            >
              Open Full Details
            </button>
          ) : null}

          {selectedTask ? (
            <button
              type="button"
              onClick={() => setConfirmDeleteOpen(true)}
              className="min-h-[44px] rounded-xl bg-red-600 px-4 py-2.5 font-semibold text-white"
            >
              Delete Task
            </button>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-700"
          >
            Cancel
          </button>
        </div>
      </div>

      <ConfirmModal
        open={confirmDeleteOpen}
        title="Delete Task"
        message="Are you sure you want to delete this task?"
        confirmLabel="Delete"
        confirmDanger
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={() => {
          void onDelete(selectedTask.id)
          setConfirmDeleteOpen(false)
          onClose()
        }}
      />
    </div>
  )
}
