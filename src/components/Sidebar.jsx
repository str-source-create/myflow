/**
 * Sidebar.jsx
 * Admin navigation links for all management surfaces.
 */
import { NavLink } from 'react-router-dom'

const LINKS = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/calendar', label: 'Calendar' },
  { to: '/admin/attendance', label: 'Attendance' },
  { to: '/admin/properties', label: 'Properties' },
  { to: '/admin/tasks', label: 'Tasks' },
  { to: '/admin/workers', label: 'Workers' },
  { to: '/admin/submissions', label: 'Submissions' },
  { to: '/admin/settings', label: 'Settings' },
]

function Item({ to, label, onNavigate }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex min-h-[44px] items-center rounded-xl px-3 text-sm font-semibold ${
          isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-100'
        }`
      }
    >
      {label}
    </NavLink>
  )
}

export default function Sidebar({ adminName, onLogout, onNavigate }) {
  return (
    <div className="flex h-full flex-col bg-white p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">CleanFlow</p>
        <h2 className="mt-1 font-[Manrope] text-xl font-bold text-slate-900">Admin</h2>
      </div>

      <nav className="mt-6 space-y-1">
        {LINKS.map((link) => (
          <Item key={link.to} to={link.to} label={link.label} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="mt-auto rounded-xl border border-slate-200 p-3">
        <p className="text-sm font-semibold text-slate-900">{adminName || 'Admin'}</p>
        <button
          type="button"
          onClick={onLogout}
          className="mt-3 min-h-[44px] w-full rounded-xl bg-slate-100 px-4 py-2.5 font-semibold text-slate-700"
        >
          Log Out
        </button>
      </div>
    </div>
  )
}
