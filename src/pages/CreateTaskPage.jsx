/**
 * CreateTaskPage.jsx
 * Admin task creation form with:
 *  - Area-based checklist builder pre-loaded from DEFAULT_CHECKLIST_TEMPLATE
 *  - Task Lead selector (shown when 2+ workers are assigned)
 *  - All selected checklist items saved via the addTask context method
 */
import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdmin } from '../context/AdminContext'
import { getTodayString } from '../utils/timezone'
import { DEFAULT_CHECKLIST_TEMPLATE } from '../data/checklistTemplate'

/** Generates a short random ID for area/item keys. */
const uid = () => Math.random().toString(36).slice(2, 9)

const INITIAL = {
  title: '',
  propertyId: '',
  taskType: 'turnover',
  date: '',
  startTime: '',
  endTime: '',
  priority: 'medium',
  assignedWorkerIds: [],
  taskLeadId: '',
  managerNotes: '',
}

export default function CreateTaskPage() {
  const navigate = useNavigate()
  const { properties, workers, addTask } = useAdmin()

  const [form, setForm] = useState({ ...INITIAL, date: getTodayString() })
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [saving, setSaving] = useState(false)

  // Tracks which area is being renamed inline in the header row.
  const [renamingAreaId, setRenamingAreaId] = useState(null)
  const [renameValue, setRenameValue] = useState('')

  // Controls the inline Add Area block rendered below all areas.
  const [showAddArea, setShowAddArea] = useState(false)
  const [newAreaName, setNewAreaName] = useState('')

  // Tracks inline Add Item input values by area ID.
  const [addItemValues, setAddItemValues] = useState({})

  // Input refs used for auto-focus on Add Area and Rename flows.
  const newAreaInputRef = useRef(null)
  const renameInputRef = useRef(null)

  // Area-based checklist state — initialized from DEFAULT_CHECKLIST_TEMPLATE
  const [areas, setAreas] = useState(() =>
    DEFAULT_CHECKLIST_TEMPLATE.map((section) => ({
      id: uid(),
      area: section.area,
      collapsed: false,
      items: section.items.map((item) => ({
        id: uid(),
        label: item.label,
        required: item.required,
        selected: true,
      })),
    }))
  )

  const activeWorkers = useMemo(() => workers.filter((w) => w.active), [workers])

  /** Updates a top-level task form field. */
  function setField(key, value) {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      return next
    })
  }

  /** Updates selected property and auto-fills title. */
  function onPropertyChange(value) {
    const property = properties.find((p) => p.id === value)
    setForm((prev) => ({
      ...prev,
      propertyId: value,
      title: property ? `${property.name} - Turnover Cleaning` : prev.title,
    }))
  }

  /** Toggles worker assignment. Auto-sets lead to first assigned worker. */
  function toggleWorker(workerId) {
    setForm((prev) => {
      const next = prev.assignedWorkerIds.includes(workerId)
        ? prev.assignedWorkerIds.filter((id) => id !== workerId)
        : [...prev.assignedWorkerIds, workerId]
      return {
        ...prev,
        assignedWorkerIds: next,
        // Keep existing lead if still in the list; otherwise default to first worker
        taskLeadId: next.includes(prev.taskLeadId) ? prev.taskLeadId : (next[0] || ''),
      }
    })
  }

  // ——— Checklist area handlers ———

  const toggleCollapse = (areaId) =>
    setAreas((prev) => prev.map((a) => (a.id === areaId ? { ...a, collapsed: !a.collapsed } : a)))

  const toggleItem = (areaId, itemId) =>
    setAreas((prev) =>
      prev.map((a) =>
        a.id === areaId
          ? { ...a, items: a.items.map((i) => (i.id === itemId ? { ...i, selected: !i.selected } : i)) }
          : a,
      ),
    )

  const toggleRequired = (areaId, itemId) =>
    setAreas((prev) =>
      prev.map((a) =>
        a.id === areaId
          ? { ...a, items: a.items.map((i) => (i.id === itemId ? { ...i, required: !i.required } : i)) }
          : a,
      ),
    )

  const deleteItem = (areaId, itemId) =>
    setAreas((prev) =>
      prev.map((a) => (a.id === areaId ? { ...a, items: a.items.filter((i) => i.id !== itemId) } : a)),
    )

  const addItem = (areaId, label) => {
    if (!label.trim()) return
    setAreas((prev) =>
      prev.map((a) =>
        a.id === areaId
          ? { ...a, items: [...a.items, { id: uid(), label: label.trim(), required: true, selected: true }] }
          : a,
      ),
    )
  }

  /** Opens inline rename mode for the selected area header. */
  const startRename = (areaId, currentName) => {
    setRenamingAreaId(areaId)
    setRenameValue(currentName)
    setTimeout(() => renameInputRef.current?.focus(), 50)
  }

  /** Commits inline rename changes for the selected area. */
  const confirmRename = (areaId) => {
    const name = renameValue.trim()
    if (!name) return
    setAreas((prev) => prev.map((a) => (a.id === areaId ? { ...a, area: name } : a)))
    setRenamingAreaId(null)
    setRenameValue('')
  }

  /** Cancels inline rename mode and clears edit value. */
  const cancelRename = () => {
    setRenamingAreaId(null)
    setRenameValue('')
  }

  const deleteArea = (areaId) => {
    // This page is retained for compatibility, but must not use browser popups.
    setAreas((prev) => prev.filter((a) => a.id !== areaId))
  }

  /**
   * confirmAddArea — adds a new area using the inline input value.
   * Called when user clicks Add or presses Enter.
   */
  const confirmAddArea = () => {
    const name = newAreaName.trim()
    if (!name) return
    setAreas((prev) => [...prev, {
      id: uid(),
      area: name,
      collapsed: false,
      items: []
    }])
    setNewAreaName('')
    setShowAddArea(false)
  }

  /** Hides inline Add Area mode and clears the pending area name. */
  const cancelAddArea = () => {
    setShowAddArea(false)
    setNewAreaName('')
  }

  /** Handles Enter on inline Add Item input for a specific area. */
  const handleAddItemKeyDown = (event, areaId) => {
    if (event.key !== 'Enter') return
    const value = addItemValues[areaId]?.trim()
    if (!value) return
    addItem(areaId, value)
    setAddItemValues((prev) => ({ ...prev, [areaId]: '' }))
  }

  /** Adds the typed inline Add Item value and keeps the row visible. */
  const handleAddItemClick = (areaId) => {
    const value = addItemValues[areaId]?.trim()
    if (!value) return
    addItem(areaId, value)
    setAddItemValues((prev) => ({ ...prev, [areaId]: '' }))
  }

  /**
   * Creates the task and saves all selected checklist items.
   */
  async function handleCreate() {
    if (!form.propertyId || !form.title.trim() || !form.date || !form.startTime || !form.endTime) {
      setError('Please complete all required fields.')
      return
    }

    // Build selected items for the task creation payload
    const selectedItems = []
    areas.forEach((section, areaIndex) => {
      section.items
        .filter((item) => item.selected && item.label.trim())
        .forEach((item, itemIndex) => {
          selectedItems.push({
            area: section.area,
            title: item.label.trim(),
            required: item.required,
            sortOrder: areaIndex * 100 + itemIndex,
          })
        })
    })

    if (!selectedItems.length) {
      setError('Select at least one checklist item.')
      return
    }

    setError('')
    setSaving(true)

    try {
      await addTask({
        ...form,
        taskLeadId: form.taskLeadId || undefined,
        checklistItems: selectedItems,
      })
      setToast('Task created successfully.')
      setTimeout(() => navigate('/admin/tasks'), 700)
    } catch (err) {
      setError(err.message || 'Failed to create task.')
      setSaving(false)
      return
    }

    setSaving(false)
  }

  // Workers assigned to this task (for lead selector)
  const selectedWorkers = activeWorkers.filter((w) => form.assignedWorkerIds.includes(w.id))

  return (
    <div className="space-y-6">
      <h1 className="font-[Manrope] text-2xl font-bold text-slate-900">Create Task</h1>

      {/* ——— Task details ——— */}
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <L label="Property*">
          <select
            value={form.propertyId}
            onChange={(e) => onPropertyChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base"
          >
            <option value="">Select property</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </L>

        <L label="Task Title*">
          <input
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base"
          />
        </L>

        <L label="Task Type">
          <select
            value={form.taskType}
            onChange={(e) => setField('taskType', e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base"
          >
            <option value="turnover">Turnover</option>
            <option value="deep_cleaning">Deep Cleaning</option>
            <option value="inspection">Inspection</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </L>

        <div className="grid gap-3 sm:grid-cols-3">
          <L label="Date*">
            <input
              type="date"
              value={form.date}
              onChange={(e) => setField('date', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base"
            />
          </L>
          <L label="Start*">
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => setField('startTime', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base"
            />
          </L>
          <L label="End*">
            <input
              type="time"
              value={form.endTime}
              onChange={(e) => setField('endTime', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base"
            />
          </L>
        </div>

        <L label="Priority">
          <select
            value={form.priority}
            onChange={(e) => setField('priority', e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </L>

        {/* Assign Workers */}
        <L label="Assign Workers">
          <div className="space-y-2 rounded-xl border border-slate-200 p-3">
            {activeWorkers.map((worker) => (
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
        </L>

        {/* Task Lead selector — only shown when 2+ workers are assigned */}
        {selectedWorkers.length >= 2 && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="mb-3 text-sm font-semibold text-blue-900">
              Who is the Task Lead?{' '}
              <span className="font-normal text-blue-700">(responsible for submitting)</span>
            </p>
            <div className="space-y-2">
              {selectedWorkers.map((worker) => (
                <label key={worker.id} className="flex min-h-[44px] items-center gap-3 text-sm text-slate-800">
                  <input
                    type="radio"
                    name="taskLeadId"
                    value={worker.id}
                    checked={form.taskLeadId === worker.id}
                    onChange={() => setField('taskLeadId', worker.id)}
                    className="h-4 w-4 accent-blue-600"
                  />
                  {worker.name}
                </label>
              ))}
            </div>
          </div>
        )}

        <L label="Manager Notes">
          <textarea
            rows={3}
            value={form.managerNotes}
            onChange={(e) => setField('managerNotes', e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base"
          />
        </L>
      </section>

      {/* ——— Checklist Builder ——— */}
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-[Manrope] text-lg font-bold text-slate-900">Checklist Builder</h2>
          <span className="text-xs text-slate-400">
            {areas.reduce((acc, a) => acc + a.items.filter((i) => i.selected).length, 0)} items selected
          </span>
        </div>

        {areas.map((section) => (
          <div key={section.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Area header */}
            <div className="flex items-center gap-2 border-b border-slate-100 p-3">
              <button
                type="button"
                onClick={() => toggleCollapse(section.id)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg
                  className={`h-4 w-4 transition-transform ${section.collapsed ? '' : 'rotate-90'}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>

              {/* Inline area rename editor (replaces browser prompt). */}
              {renamingAreaId === section.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    ref={renameInputRef}
                    type="text"
                    value={renameValue}
                    onChange={(event) => setRenameValue(event.target.value)}
                    className="flex-1 rounded-lg border border-blue-400 px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') confirmRename(section.id)
                      if (event.key === 'Escape') cancelRename()
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => confirmRename(section.id)}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={cancelRename}
                    className="px-2 py-1.5 text-xs text-slate-500"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <span className="flex-1 text-sm font-semibold text-slate-800">{section.area}</span>
                  <span className="mr-1 text-xs text-slate-400">
                    {section.items.filter((i) => i.selected).length}/{section.items.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => startRename(section.id, section.area)}
                    className="rounded-lg px-2.5 py-1 text-xs text-blue-600 transition-colors hover:bg-blue-50"
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteArea(section.id)}
                    className="rounded-lg px-2.5 py-1 text-xs text-red-500 transition-colors hover:bg-red-50"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>

            {/* Items list */}
            {!section.collapsed && (
              <div className="space-y-1 p-3">
                {section.items.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 py-1">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={() => toggleItem(section.id, item.id)}
                      className="mt-0.5 h-4 w-4 flex-shrink-0 accent-blue-600"
                    />
                    <span
                      className={`flex-1 text-sm leading-snug ${
                        item.selected ? 'text-slate-800' : 'text-slate-400 line-through'
                      }`}
                    >
                      {item.label}
                    </span>
                    <span
                      className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs ${
                        item.required ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.required ? 'Required' : 'Optional'}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleRequired(section.id, item.id)}
                      className="flex-shrink-0 text-xs text-slate-300 hover:text-slate-500"
                      title="Toggle required / optional"
                    >
                      ⇄
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteItem(section.id, item.id)}
                      className="flex-shrink-0 text-slate-300 hover:text-red-400"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {/* Add item row — always visible at the bottom of each expanded area. */}
                <div className="mt-2 flex items-center gap-2 border-t border-slate-100 pt-2">
                  <input
                    type="text"
                    value={addItemValues[section.id] || ''}
                    onChange={(event) => setAddItemValues((prev) => ({ ...prev, [section.id]: event.target.value }))}
                    onKeyDown={(event) => handleAddItemKeyDown(event, section.id)}
                    placeholder="Add item..."
                    className="flex-1 border-0 bg-transparent py-1 text-sm text-slate-600 placeholder-slate-300 focus:outline-none focus:ring-0"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddItemClick(section.id)}
                    className="rounded-lg px-2 py-1 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Inline Add Area — appears below all areas (replaces browser prompt). */}
        {showAddArea ? (
          <div className="rounded-2xl border-2 border-blue-400 bg-blue-50 p-4">
            <p className="mb-3 text-sm font-semibold text-blue-800">New Area Name</p>
            <div className="flex gap-2">
              <input
                ref={newAreaInputRef}
                type="text"
                value={newAreaName}
                onChange={(event) => setNewAreaName(event.target.value)}
                placeholder='e.g. "2nd Floor Living Room", "Pool Area", "Garage"'
                className="flex-1 rounded-xl border border-blue-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') confirmAddArea()
                  if (event.key === 'Escape') cancelAddArea()
                }}
                autoFocus
              />
              <button
                type="button"
                onClick={confirmAddArea}
                disabled={!newAreaName.trim()}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Add
              </button>
              <button
                type="button"
                onClick={cancelAddArea}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setShowAddArea(true)
              setNewAreaName('')
              setTimeout(() => newAreaInputRef.current?.focus(), 50)
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-5 text-sm font-medium text-slate-400 transition-all hover:border-blue-400 hover:text-blue-500"
          >
            <i className="ti ti-plus text-lg" />
            Add Custom Area (e.g. "2nd Floor Living Room", "Pool Area")
          </button>
        )}
      </section>

      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
      {toast ? <p className="text-sm font-medium text-green-600">{toast}</p> : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void handleCreate()}
          disabled={saving}
          className="min-h-[44px] rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white disabled:opacity-60"
        >
          {saving ? 'Creating…' : 'Create Task'}
        </button>
        <button
          type="button"
          onClick={() => navigate('/admin/tasks')}
          className="min-h-[44px] rounded-xl border border-blue-600 px-4 py-2.5 font-semibold text-blue-600"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

/** Reusable labeled form field wrapper. */
function L({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  )
}
