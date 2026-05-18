/**
 * PhotoStagingTray.jsx
 * WhatsApp-style multi-photo staging and upload tray.
 *
 * Workflow:
 *   1. Worker taps "Take Photo" or "Gallery" → photos enter the staging tray with instant
 *      local previews via URL.createObjectURL.
 *   2. Worker can tap × to remove any staged photo before uploading.
 *   3. Worker taps "Upload N Photos" → onUpload(files[]) is called.
 *   4. Already-uploaded photos appear in a grid above the staging tray.
 *      Tapping an uploaded photo opens the PhotoLightbox.
 *      Tapping × on an uploaded photo calls onDelete(photoId).
 *
 * Props:
 *   title     {string}              – section heading
 *   photos    {{ id, url }[]}       – already-uploaded photos from server
 *   onUpload  {(File[]) => Promise} – called with staged files when "Upload" is tapped
 *   onDelete  {(id) => Promise}     – called when an uploaded photo × is tapped (optional)
 *   uploading {boolean}             – true while an upload is in flight
 *   error     {string}              – inline error message
 *   children  {ReactNode}           – optional extra content (e.g. issue description input)
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import PhotoLightbox from '../../components/PhotoLightbox'

export default function PhotoStagingTray({
  title,
  photos = [],
  onUpload,
  onDelete,
  uploading = false,
  error = '',
  children,
}) {
  const cameraRef = useRef(null)
  const galleryRef = useRef(null)

  // Staged entries awaiting upload: { file: File, previewUrl: string }
  const [staged, setStaged] = useState([])

  // Lightbox: index into the `photos` (already-uploaded) array
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const lightboxUrls = photos.map((p) => p.url)

  // Revoke object URLs on unmount to prevent memory leaks.
  useEffect(() => {
    return () => staged.forEach((entry) => URL.revokeObjectURL(entry.previewUrl))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Adds newly selected files to the staging tray. */
  const addFiles = useCallback((fileList) => {
    const entries = Array.from(fileList).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }))
    setStaged((prev) => [...prev, ...entries])
  }, [])

  /** Removes one staged item and revokes its object URL. */
  function removeStagedItem(idx) {
    setStaged((prev) => {
      URL.revokeObjectURL(prev[idx].previewUrl)
      return prev.filter((_, i) => i !== idx)
    })
  }

  /** Uploads all staged files and clears the tray. */
  async function handleUploadAll() {
    if (!staged.length || uploading) return
    const files = staged.map((e) => e.file)
    // Eagerly clear the tray and revoke previews before the async call.
    staged.forEach((e) => URL.revokeObjectURL(e.previewUrl))
    setStaged([])
    await onUpload(files)
  }

  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h3 className="font-[Manrope] text-base font-semibold text-slate-900">{title}</h3>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
          {photos.length} uploaded
        </span>
      </div>

      {/* Already-uploaded photos grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, idx) => (
            <div key={photo.id} className="relative">
              <button
                type="button"
                onClick={() => setLightboxIndex(idx)}
                className="block h-24 w-full overflow-hidden rounded-xl border border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label={`View photo ${idx + 1}`}
              >
                <img src={photo.url} alt="" className="h-full w-full object-cover" />
              </button>
              {onDelete && (
                <button
                  type="button"
                  onClick={() => void onDelete(photo.id)}
                  className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-sm font-bold leading-none text-white shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  aria-label="Delete photo"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state (no uploaded photos, nothing staged) */}
      {photos.length === 0 && staged.length === 0 && (
        <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-400">
          No photos yet
        </div>
      )}

      {/* Staging tray — photos selected but not yet uploaded */}
      {staged.length > 0 && (
        <div className="space-y-2 rounded-xl border border-dashed border-blue-300 bg-blue-50/60 p-3">
          <p className="text-xs font-semibold text-blue-600">
            {staged.length} photo{staged.length > 1 ? 's' : ''} staged — ready to upload
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {staged.map((entry, idx) => (
              <div key={entry.previewUrl} className="relative shrink-0">
                <img
                  src={entry.previewUrl}
                  alt=""
                  className="h-20 w-20 rounded-xl border border-blue-200 object-cover opacity-75"
                />
                <button
                  type="button"
                  onClick={() => removeStagedItem(idx)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold leading-none text-white focus-visible:outline-none"
                  aria-label="Remove from staging"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void handleUploadAll()}
            disabled={uploading}
            className="min-h-[44px] w-full rounded-xl bg-green-600 px-4 py-3 font-semibold text-white transition-all active:scale-95 disabled:opacity-50"
          >
            {uploading
              ? 'Uploading…'
              : `Upload ${staged.length} Photo${staged.length > 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {/* Uploading indicator when staged tray is already cleared */}
      {uploading && staged.length === 0 && (
        <p className="text-center text-sm text-slate-500">Uploading…</p>
      )}

      {/* Camera / Gallery selection buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          className="min-h-[44px] rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition-all active:scale-95"
        >
          📷 Take Photo
        </button>
        <button
          type="button"
          onClick={() => galleryRef.current?.click()}
          className="min-h-[44px] rounded-xl border border-blue-600 px-4 py-3 font-semibold text-blue-600 transition-all active:scale-95"
        >
          🖼 Gallery
        </button>
      </div>

      {/* Error message */}
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      {/* Optional extra content (e.g. problem description textarea) */}
      {children}

      {/* Hidden camera input — `capture="environment"` opens rear camera on mobile */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) addFiles(e.target.files)
          e.target.value = ''
        }}
      />

      {/* Hidden gallery input — no `capture` attribute so it opens the file picker */}
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) addFiles(e.target.files)
          e.target.value = ''
        }}
      />

      {/* Lightbox for already-uploaded photos */}
      {lightboxIndex !== null && lightboxUrls.length > 0 && (
        <PhotoLightbox
          photos={lightboxUrls}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndex={setLightboxIndex}
        />
      )}
    </section>
  )
}
