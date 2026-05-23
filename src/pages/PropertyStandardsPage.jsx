/**
 * PropertyStandardsPage.jsx
 * Admin standard management with real file uploads and immediate persistence.
 * Reference photos are shown at full height (h-48) with a lightbox on click
 * and a proper delete button that removes the image from Cloudinary.
 */
import { useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import ConfirmModal from '../components/ConfirmModal'
import EmptyState from '../components/EmptyState'
import PhotoLightbox from '../components/PhotoLightbox'
import StatusBadge from '../components/StatusBadge'
import { useAdmin } from '../context/AdminContext'

export default function PropertyStandardsPage() {
  const { id } = useParams()
  const { properties, addStandard, updateStandard, deleteStandard, uploadReferencePhoto, deleteReferencePhoto } = useAdmin()
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState({ areaName: '', instruction: '', required: true })
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  // Lightbox state: URL of photo to show, or null
  const [lightboxUrl, setLightboxUrl] = useState(null)
  const fileInputRef = useRef(null)
  const inputRefs = useRef({})

  const property = useMemo(() => properties.find((item) => item.id === id), [properties, id])

  if (!property) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">Property not found.</div>
  }

  /**
   * Handles reference photo selection and local preview rendering.
   */
  function handlePhotoSelect(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  /**
   * Clears the selected photo from the add-standard form.
   */
  function removePhoto() {
    setPhotoFile(null)
    setPhotoPreview('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  /**
   * Persists a new standard via API using FormData.
   */
  async function saveStandard() {
    if (!form.areaName.trim()) {
      setError('Area Name is required.')
      return
    }

    setError('')
    setSaving(true)
    try {
      await addStandard(property.id, {
        areaName: form.areaName,
        instruction: form.instruction,
        required: form.required,
        photoFile,
      })
      setForm({ areaName: '', instruction: '', required: true })
      removePhoto()
    } catch (err) {
      setError(err.message || 'Failed to save standard.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-[Manrope] text-2xl font-bold text-slate-900">{property.name} Standards</h1>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-[Manrope] text-lg font-bold text-slate-900">Add Standard</h2>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Area Name</span>
          <input
            value={form.areaName}
            onChange={(event) => setForm((prev) => ({ ...prev, areaName: event.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Instruction</span>
          <textarea
            rows={3}
            value={form.instruction}
            onChange={(event) => setForm((prev) => ({ ...prev, instruction: event.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>

        <label className="flex min-h-[44px] items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={form.required}
            onChange={(event) => setForm((prev) => ({ ...prev, required: event.target.checked }))}
            className="h-5 w-5"
          />
          Required
        </label>

        {/* Hidden real file input — triggered by the upload button click. */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handlePhotoSelect}
          className="hidden"
        />

        {/* Preview area — shown after photo selected. */}
        {photoPreview ? (
          <div className="relative">
            <img
              src={photoPreview}
              alt="Reference preview"
              className="h-40 w-full rounded-xl border border-slate-200 object-cover"
            />
            <button
              type="button"
              onClick={removePhoto}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-xs text-white"
            >
              x
            </button>
          </div>
        ) : null}

        {!photoPreview ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full min-h-[44px] flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-8 text-slate-400 transition-all hover:border-blue-400 hover:text-blue-500"
          >
            <span className="text-2xl">📷</span>
            <span className="text-sm font-medium">Click to upload reference photo</span>
          </button>
        ) : null}

        <button
          type="button"
          onClick={saveStandard}
          disabled={saving}
          className="min-h-[44px] rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700"
        >
          {saving ? 'Saving...' : 'Save Standard'}
        </button>

        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
      </section>

      {property.standards.length === 0 ? (
        <EmptyState icon="🧼" title="No standards yet" message="Add your first cleaning standard above." />
      ) : (
        <section className="space-y-3">
          {property.standards.map((standard) => (
            <article key={standard.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-[Manrope] text-lg font-semibold text-slate-900">{standard.areaName}</h3>
                {standard.required ? <StatusBadge status="pending_review" /> : null}
              </div>

              <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
                {standard.referencePhotoUrl ? (
                  <div className="space-y-2">
                    {/* Reference photo — portrait 3:4 aspect ratio, click to lightbox */}
                    <div className="relative w-full overflow-hidden rounded-xl bg-slate-100" style={{ aspectRatio: '3 / 4' }}>
                      <button
                        type="button"
                        onClick={() => setLightboxUrl(standard.referencePhotoUrl)}
                        className="absolute inset-0 w-full h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        <img
                          src={standard.referencePhotoUrl}
                          alt={standard.areaName}
                          className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                        />
                      </button>
                    </div>
                    <p className="text-center text-xs text-slate-500">Reference photo</p>
                    <button
                      type="button"
                      onClick={() => deleteReferencePhoto(property.id, standard.id)}
                      className="min-h-[44px] text-sm font-semibold text-red-600"
                    >
                      Remove photo
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    {/* Placeholder maintains the same portrait aspect ratio */}
                    <div
                      className="w-full rounded-xl border-2 border-dashed border-slate-200 bg-slate-100 flex flex-col items-center justify-center text-slate-400 gap-2 mb-2"
                      style={{ aspectRatio: '3 / 4' }}
                    >
                      <span className="text-3xl">📷</span>
                      <span className="text-xs font-medium">No reference photo</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => inputRefs.current[standard.id]?.click()}
                      className="mt-2 min-h-[44px] rounded-xl border border-blue-600 px-4 py-2.5 font-semibold text-blue-600"
                    >
                      Choose File
                    </button>
                  </div>
                )}
                <input
                  ref={(element) => {
                    inputRefs.current[standard.id] = element
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (!file) return
                    void uploadReferencePhoto(property.id, standard.id, file)
                    event.target.value = ''
                  }}
                />
              </div>

              <textarea
                value={standard.instruction}
                onChange={(event) =>
                  updateStandard(property.id, standard.id, { instruction: event.target.value })
                }
                rows={3}
                className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    updateStandard(property.id, standard.id, { required: !standard.required })
                  }
                  className="min-h-[44px] rounded-xl border border-blue-600 px-4 py-2.5 text-sm font-semibold text-blue-600"
                >
                  {standard.required ? 'Mark Optional' : 'Mark Required'}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteId(standard.id)}
                  className="min-h-[44px] rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Delete Standard
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      <ConfirmModal
        open={Boolean(deleteId)}
        title="Delete Standard"
        message="This action cannot be undone."
        confirmLabel="Delete"
        confirmDanger
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          deleteStandard(property.id, deleteId)
          setDeleteId(null)
        }}
      />

      {/* Full-screen photo lightbox */}
      {lightboxUrl && (
        <PhotoLightbox
          photos={[lightboxUrl]}
          index={0}
          onClose={() => setLightboxUrl(null)}
          onIndex={() => {}}
        />
      )}
    </div>
  )
}
