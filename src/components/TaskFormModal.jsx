/**
 * TaskFormModal.jsx
 * Reusable create/edit task modal for calendar interactions.
 */
import { useEffect, useState } from 'react'
import ConfirmModal from './ConfirmModal'

const AREA_ORDER = ['Kitchen', 'Bathroom', 'Bedroom', 'Living', 'Final']

const DEFAULT_CHECKLIST = [
  { id: 'k1', area: 'Kitchen', title: 'Counters wiped', required: true, selected: true, custom: false },
  { id: 'k2', area: 'Kitchen', title: 'Sink cleaned', required: true, selected: true, custom: false },
  { id: 'k3', area: 'Kitchen', title: 'Dishes checked', required: true, selected: true, custom: false },
  { id: 'k4', area: 'Kitchen', title: 'Trash removed', required: true, selected: true, custom: false },
  { id: 'b1', area: 'Bathroom', title: 'Toilet cleaned', required: true, selected: true, custom: false },
  { id: 'b2', area: 'Bathroom', title: 'Shower/tub cleaned', required: true, selected: true, custom: false },
  { id: 'b3', area: 'Bathroom', title: 'Towels placed', required: true, selected: true, custom: false },
  { id: 'b4', area: 'Bathroom', title: 'Supplies restocked', required: true, selected: true, custom: false },
  { id: 'bd1', area: 'Bedroom', title: 'Beds made', required: true, selected: true, custom: false },
  { id: 'bd2', area: 'Bedroom', title: 'Linens checked', required: true, selected: true, custom: false },
  { id: 'bd3', area: 'Bedroom', title: 'Floors cleaned', required: true, selected: true, custom: false },
  { id: 'l1', area: 'Living', title: 'Surfaces wiped', required: true, selected: true, custom: false },
  { id: 'l2', area: 'Living', title: 'Furniture reset', required: true, selected: true, custom: false },
  { id: 'l3', area: 'Living', title: 'Floors cleaned', required: true, selected: true, custom: false },
  { id: 'f1', area: 'Final', title: 'Lights off', required: true, selected: true, custom: false },
  { id: 'f2', area: 'Final', title: 'Doors/windows locked', required: true, selected: true, custom: false },
  { id: 'f3', area: 'Final', title: 'Keys returned', required: true, selected: true, custom: false },
]

/**
 * Generates stable local ids for custom checklist rows.
 */
function makeLocalId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

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
  const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(buildInitialForm({ selectedTask, selectedCell }))
      setChecklist(DEFAULT_CHECKLIST)
      setError('')
    }
  }, [open, selectedTask, selectedCell])

  /**
   * Toggles whether a checklist row is included for task creation.
   */
  function toggleChecklistSelected(itemId) {
    setChecklist((prev) => prev.map((item) => (item.id === itemId ? { ...item, selected: !item.selected } : item)))
  }

  /**
   * Toggles required state for checklist row.
   */
  function toggleChecklistRequired(itemId) {
    setChecklist((prev) => prev.map((item) => (item.id === itemId ? { ...item, required: !item.required } : item)))
  }

  /**
   * Updates checklist row label.
   */
  function updateChecklistTitle(itemId, title) {
    setChecklist((prev) => prev.map((item) => (item.id === itemId ? { ...item, title } : item)))
  }

  /**
   * Adds custom checklist row under selected area group.
   */
  function addCustomChecklistItem(area) {
    setChecklist((prev) => [
      ...prev,
      {
        id: makeLocalId('custom'),
        area,
        title: '',
        required: true,
        selected: true,
        custom: true,
      },
    ])
  }

  /**
   * Removes a custom checklist row.
   */
  function removeCustomChecklistItem(itemId) {
    setChecklist((prev) => prev.filter((item) => item.id !== itemId))
  }

  /**
   * Toggles selected worker for task assignment.
   */
  function toggleWorker(workerId) {
    setForm((prev) => ({
      ...prev,
      assignedWorkerIds: prev.assignedWorkerIds.includes(workerId)
        ? prev.assignedWorkerIds.filter((id) => id !== workerId)
        : [...prev.assignedWorkerIds, workerId],
    }))
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

      if (!selectedTask) {
        const selectedChecklist = checklist
          .filter((item) => item.selected && item.title.trim())
          .map((item, index) => ({
            area: item.area,
            title: item.title.trim(),
            required: item.required,
            sortOrder: index + 1,
          }))

        if (!selectedChecklist.length) {
          setError('Select at least one checklist item.')
          setSaving(false)
          return
        }

        payload.checklistItems = selectedChecklist
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
            <div className="space-y-3 rounded-xl border border-slate-200 p-3">
              <p className="text-sm font-medium text-slate-700">Checklist</p>
              {AREA_ORDER.map((area) => {
                const areaItems = checklist.filter((item) => item.area === area)
                return (
                  <div key={area} className="rounded-xl border border-slate-200 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-[Manrope] text-sm font-semibold text-slate-900">{area}</p>
                      <button
                        type="button"
                        onClick={() => addCustomChecklistItem(area)}
                        className="min-h-[44px] rounded-xl border border-blue-600 px-3 py-2 text-xs font-semibold text-blue-600"
                      >
                        Add custom item
                      </button>
                    </div>

                    <div className="space-y-2">
                      {areaItems.map((item) => (
                        <div key={item.id} className="rounded-xl border border-slate-200 p-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <label className="flex min-h-[44px] items-center gap-2 text-xs font-semibold text-slate-700">
                              <input
                                type="checkbox"
                                checked={item.selected}
                                onChange={() => toggleChecklistSelected(item.id)}
                                className="h-5 w-5"
                              />
                              Include
                            </label>

                            <label className="flex min-h-[44px] items-center gap-2 text-xs font-semibold text-slate-700">
                              <input
                                type="checkbox"
                                checked={item.required}
                                onChange={() => toggleChecklistRequired(item.id)}
                                className="h-5 w-5"
                              />
                              Required
                            </label>

                            {item.custom ? (
                              <button
                                type="button"
                                onClick={() => removeCustomChecklistItem(item.id)}
                                className="ml-auto min-h-[44px] rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white"
                              >
                                Delete
                              </button>
                            ) : null}
                          </div>

                          <input
                            value={item.title}
                            onChange={(event) => updateChecklistTitle(item.id, event.target.value)}
                            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-base"
                            placeholder="Checklist item"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
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
