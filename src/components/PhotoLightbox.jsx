/**
 * PhotoLightbox.jsx
 * Full-screen photo lightbox overlay with prev/next navigation,
 * keyboard shortcuts (Escape + arrow keys), and body-scroll locking.
 * Rendered into document.body via a React portal so it always sits on top.
 *
 * Props:
 *   photos   {string[]}  – ordered array of photo URLs
 *   index    {number}    – currently visible photo index
 *   onClose  {function}  – called when the user dismisses the lightbox
 *   onIndex  {function}  – called with the new index when navigating
 */
import { useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function PhotoLightbox({ photos, index, onClose, onIndex }) {
  const total = photos.length
  const hasPrev = index > 0
  const hasNext = index < total - 1

  // Lock body scroll while the lightbox is open.
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  // Keyboard: Escape closes, arrow keys navigate.
  const handleKey = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && hasPrev) onIndex(index - 1)
      if (e.key === 'ArrowRight' && hasNext) onIndex(index + 1)
    },
    [onClose, hasPrev, hasNext, index, onIndex],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  const src = photos[index]
  if (!src) return null

  return createPortal(
    // Clicking the backdrop closes the lightbox.
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Photo lightbox"
    >
      {/* Main photo — stop propagation so clicking the image doesn't close */}
      <img
        src={src}
        alt={`Photo ${index + 1} of ${total}`}
        className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Close button (top-right) */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-2xl leading-none text-white hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        aria-label="Close lightbox"
      >
        ×
      </button>

      {/* Photo counter pill (bottom-center) */}
      {total > 1 && (
        <p className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm font-medium text-white">
          {index + 1} / {total}
        </p>
      )}

      {/* Previous arrow */}
      {hasPrev && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onIndex(index - 1) }}
          className="absolute left-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-3xl leading-none text-white hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Previous photo"
        >
          ‹
        </button>
      )}

      {/* Next arrow — offset right to avoid overlap with close button */}
      {hasNext && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onIndex(index + 1) }}
          className="absolute right-16 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-3xl leading-none text-white hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Next photo"
        >
          ›
        </button>
      )}
    </div>,
    document.body,
  )
}
