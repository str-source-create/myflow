/**
 * PropertyChecklistPage.jsx
 * Admin editor for a property's permanent checklist template.
 * This template is copied into task-specific checklist items when tasks are created.
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ConfirmModal from '../components/ConfirmModal'
import { useAdmin } from '../context/AdminContext'
import { DEFAULT_CHECKLIST_TEMPLATE } from '../data/checklistTemplate'
import { apiRequest } from '../lib/api'

/** Generates short local IDs for inline editor rows. */
const uid = () => Math.random().toString(36).slice(2, 9)

/** Builds editable checklist state from the shared default template. */
function buildDefaultAreas() {
  return DEFAULT_CHECKLIST_TEMPLATE.map((section) => ({
    id: uid(),
    area: section.area,
    collapsed: false,
    items: section.items.map((item) => ({
      id: uid(),
      label: item.label,
      required: item.required,
    })),
  }))
}

export default function PropertyChecklistPage() {
  const { id: propertyId } = useParams()
  const navigate = useNavigate()
  const { properties } = useAdmin()

  const [areas, setAreas] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Inline editor states (no browser prompt/confirm popups).
  const [renamingAreaId, setRenamingAreaId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [showAddArea, setShowAddArea] = useState(false)
  const [newAreaName, setNewAreaName] = useState('')
  const [addItemValues, setAddItemValues] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)

  const property = useMemo(
    () => properties.find((entry) => entry.id === propertyId),
    [properties, propertyId],
  )

  useEffect(() => {
    /** Loads current checklist template for this property from backend. */
    async function loadChecklist() {
      setLoading(true)
      setError('')
      try {
        const res = await apiRequest(`/property-checklist/property/${propertyId}`, {}, 'admin')
        const data = res.data

        if (Array.isArray(data?.areas) && data.areas.length > 0) {
          const sortedAreas = [...data.areas].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
          setAreas(sortedAreas.map((section) => ({
            id: section._id || uid(),
            area: section.area,
            collapsed: false,
            items: [...(section.items || [])]
              .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
              .map((item) => ({
                id: item._id || uid(),
                label: item.label,
                required: Boolean(item.required),
              })),
          })))
        } else {
          setAreas(buildDefaultAreas())
        }
      } catch (err) {
        setError(err.message || 'Failed to load checklist. Showing default template.')
        setAreas(buildDefaultAreas())
      } finally {
        setLoading(false)
      }
    }

    void loadChecklist()
  }, [propertyId])

  /** Toggles one area between expanded and collapsed. */
  function toggleCollapse(areaId) {
    setAreas((prev) => prev.map((area) => (area.id === areaId ? { ...area, collapsed: !area.collapsed } : area)))
  }

  /** Starts inline rename mode for an area. */
  function startRename(areaId, name) {
    setRenamingAreaId(areaId)
    setRenameValue(name)
  }

  /** Saves inline rename changes. */
  function confirmRename(areaId) {
    const nextName = renameValue.trim()
    if (!nextName) return
    setAreas((prev) => prev.map((area) => (area.id === areaId ? { ...area, area: nextName } : area)))
    setRenamingAreaId(null)
    setRenameValue('')
  }

  /** Adds a custom area from inline input. */
  function confirmAddArea() {
    const name = newAreaName.trim()
    if (!name) return
    setAreas((prev) => [...prev, { id: uid(), area: name, collapsed: false, items: [] }])
    setShowAddArea(false)
    setNewAreaName('')
  }

  /** Deletes area after ConfirmModal approval. */
  function deleteArea(areaId) {
    setAreas((prev) => prev.filter((area) => area.id !== areaId))
  }

  /** Adds one item to an area from inline input. */
  function addItem(areaId, label) {
    const clean = label.trim()
    if (!clean) return
    setAreas((prev) => prev.map((area) => (
      area.id === areaId
        ? { ...area, items: [...area.items, { id: uid(), label: clean, required: true }] }
        : area
    )))
  }

  /** Deletes one item from area. */
  function deleteItem(areaId, itemId) {
    setAreas((prev) => prev.map((area) => (
      area.id === areaId
        ? { ...area, items: area.items.filter((item) => item.id !== itemId) }
        : area
    )))
  }

  /** Toggles required flag for an item. */
  function toggleRequired(areaId, itemId) {
    setAreas((prev) => prev.map((area) => (
      area.id === areaId
        ? {
            ...area,
            items: area.items.map((item) => (item.id === itemId ? { ...item, required: !item.required } : item)),
          }
        : area
    )))
  }

  /** Updates item label in inline text input. */
  function updateItemLabel(areaId, itemId, value) {
    setAreas((prev) => prev.map((area) => (
      area.id === areaId
        ? {
            ...area,
            items: area.items.map((item) => (item.id === itemId ? { ...item, label: value } : item)),
          }
        : area
    )))
  }

  /** Saves full checklist template to backend. */
  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      await apiRequest(
        `/property-checklist/property/${propertyId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            areas: areas.map((section, areaIndex) => ({
              area: section.area,
              sortOrder: areaIndex,
              items: section.items
                .filter((item) => item.label.trim())
                .map((item, itemIndex) => ({
                  label: item.label.trim(),
                  required: Boolean(item.required),
                  sortOrder: itemIndex,
                })),
            })),
          }),
        },
        'admin',
      )
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.message || 'Failed to save checklist.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">Loading checklist...</div>
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => navigate(`/admin/properties/${propertyId}`)}
        className="text-sm font-medium text-blue-600 hover:underline"
      >
        ← Back to {property?.name || 'Property'}
      </button>

      <div>
        <h1 className="font-[Manrope] text-2xl font-bold text-slate-900">Cleaning Checklist</h1>
        <p className="mt-1 text-sm text-slate-500">
          {(property?.name || 'This property')} — edit the checklist template for future tasks.
        </p>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        This checklist is automatically used every time a cleaning task is created for this property.
      </div>

      <div className="space-y-3">
        {areas.map((section) => {
          const requiredCount = section.items.filter((item) => item.required).length
          return (
            <article key={section.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleCollapse(section.id)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                >
                  <i className={`ti ti-chevron-${section.collapsed ? 'right' : 'down'} text-sm`} />
                </button>

                {renamingAreaId === section.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(event) => setRenameValue(event.target.value)}
                      className="flex-1 rounded-lg border border-blue-400 px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') confirmRename(section.id)
                        if (event.key === 'Escape') setRenamingAreaId(null)
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
                      onClick={() => setRenamingAreaId(null)}
                      className="px-2 py-1.5 text-xs text-slate-500"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-semibold text-slate-800">{section.area}</span>
                    <span className="text-xs text-slate-400">{requiredCount}/{section.items.length}</span>
                    <button
                      type="button"
                      onClick={() => startRename(section.id, section.area)}
                      className="rounded-lg px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-100"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(section.id)}
                      className="rounded-lg px-2.5 py-1 text-xs text-red-500 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>

              {!section.collapsed ? (
                <div className="space-y-2">
                  {section.items.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-200 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={item.label}
                          onChange={(event) => updateItemLabel(section.id, item.id, event.target.value)}
                          className="min-w-[260px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => toggleRequired(section.id, item.id)}
                          className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                            item.required
                              ? 'border-blue-200 bg-blue-50 text-blue-700'
                              : 'border-slate-200 bg-white text-slate-600'
                          }`}
                        >
                          {item.required ? 'Required' : 'Optional'}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteItem(section.id, item.id)}
                          className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="mt-2 flex items-center gap-2 border-t border-slate-100 pt-2">
                    <input
                      type="text"
                      value={addItemValues[section.id] || ''}
                      onChange={(event) => setAddItemValues((prev) => ({ ...prev, [section.id]: event.target.value }))}
                      placeholder="Add item..."
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyDown={(event) => {
                        if (event.key !== 'Enter') return
                        const value = addItemValues[section.id]?.trim()
                        if (!value) return
                        addItem(section.id, value)
                        setAddItemValues((prev) => ({ ...prev, [section.id]: '' }))
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const value = addItemValues[section.id]?.trim()
                        if (!value) return
                        addItem(section.id, value)
                        setAddItemValues((prev) => ({ ...prev, [section.id]: '' }))
                      }}
                      className="rounded-xl border border-blue-200 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ) : null}
            </article>
          )
        })}
      </div>

      {showAddArea ? (
        <div className="rounded-2xl border-2 border-blue-400 bg-blue-50 p-4">
          <p className="mb-3 text-sm font-semibold text-blue-800">New Area Name</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newAreaName}
              onChange={(event) => setNewAreaName(event.target.value)}
              placeholder='e.g. "Pool Area"'
              className="flex-1 rounded-xl border border-blue-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(event) => {
                if (event.key === 'Enter') confirmAddArea()
                if (event.key === 'Escape') { setShowAddArea(false); setNewAreaName('') }
              }}
              autoFocus
            />
            <button
              type="button"
              onClick={confirmAddArea}
              disabled={!newAreaName.trim()}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => { setShowAddArea(false); setNewAreaName('') }}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-600"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddArea(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-5 text-sm font-medium text-slate-400 transition-all hover:border-blue-400 hover:text-blue-500"
        >
          <i className="ti ti-plus text-lg" /> Add Custom Area
        </button>
      )}

      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
      {saved ? <p className="text-sm font-medium text-green-600">Checklist saved successfully.</p> : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="min-h-[44px] rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white"
        >
          {saving ? 'Saving...' : 'Save Checklist'}
        </button>
        <button
          type="button"
          onClick={() => setAreas(buildDefaultAreas())}
          className="min-h-[44px] rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
        >
          Reset to Default Template
        </button>
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Area"
        message="Delete this area and all its items? This cannot be undone."
        confirmLabel="Delete"
        confirmDanger
        onConfirm={() => {
          if (!deleteTarget) return
          deleteArea(deleteTarget)
          setDeleteTarget(null)
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
