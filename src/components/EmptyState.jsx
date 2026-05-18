/**
 * EmptyState.jsx
 * Source file for the cleanflow application.
 */

export default function EmptyState({ icon = '•', title, message, actionLabel, onAction }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500">
        {icon}
      </div>
      <h3 className="mt-3 font-[Manrope] text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{message}</p>
      {actionLabel ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 min-h-[44px] rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}

