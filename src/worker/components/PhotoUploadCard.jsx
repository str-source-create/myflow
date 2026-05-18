/**
 * PhotoUploadCard.jsx
 * Source file for the cleanflow application.
 */

import { useRef } from 'react'

export default function PhotoUploadCard({
  title,
  photos,
  onCameraSelect,
  onGallerySelect,
  issueDescription,
  onIssueDescriptionChange,
}) {
  const cameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)

  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-[Manrope] text-base font-semibold text-slate-900">{title}</h3>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
          {photos.length}
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {photos.length === 0 ? (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-100 text-xs text-slate-500">
            No photo
          </div>
        ) : null}

        {photos.map((photo) => (
          <img
            key={photo.id}
            src={photo.url}
            alt={photo.name}
            className="h-20 w-20 shrink-0 rounded-xl border border-slate-200 object-cover"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="min-h-[44px] rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition-all active:scale-95"
        >
          Take Photo
        </button>

        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          className="min-h-[44px] rounded-xl border border-blue-600 px-4 py-3 font-semibold text-blue-600"
        >
          Upload from Gallery
        </button>
      </div>

      {typeof issueDescription === 'string' ? (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Describe the issue</label>
          <input
            type="text"
            value={issueDescription}
            onChange={(event) => onIssueDescriptionChange(event.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Example: broken lamp in living room"
          />
        </div>
      ) : null}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onCameraSelect(file)
          event.target.value = ''
        }}
      />

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onGallerySelect(file)
          event.target.value = ''
        }}
      />
    </section>
  )
}

