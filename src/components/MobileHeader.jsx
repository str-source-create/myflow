/**
 * MobileHeader.jsx
 * Source file for the cleanflow application.
 */

export default function MobileHeader({ onMenu }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">CleanFlow</p>
        <h1 className="font-[Manrope] text-base font-bold text-slate-900">Admin Panel</h1>
      </div>
      <button
        type="button"
        onClick={onMenu}
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200"
      >
        ☰
      </button>
    </header>
  )
}

