/**
 * ConfirmModal.jsx
 * Source file for the cleanflow application.
 */

import { useEffect } from 'react'

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmDanger = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="font-[Manrope] text-xl font-bold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] w-full rounded-xl bg-slate-100 px-4 py-2.5 font-semibold text-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`min-h-[44px] w-full rounded-xl px-4 py-2.5 font-semibold text-white ${
              confirmDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

