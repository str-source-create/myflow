/**
 * AdminLayout.jsx
 * Source file for the cleanflow application.
 */

import { Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAdmin } from '../context/AdminContext'
import MobileHeader from './MobileHeader'
import Sidebar from './Sidebar'

export default function AdminLayout() {
  const navigate = useNavigate()
  const { admin, logoutAdmin } = useAdmin()
  const [drawerOpen, setDrawerOpen] = useState(false)

  function handleLogout() {
    logoutAdmin()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-slate-200 md:block">
        <Sidebar adminName={admin?.name} onLogout={handleLogout} />
      </aside>

      <MobileHeader onMenu={() => setDrawerOpen(true)} />

      {drawerOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-slate-900/40"
            aria-label="Close drawer"
          />
          <div className="absolute inset-y-0 left-0 w-72 border-r border-slate-200 bg-white">
            <Sidebar
              adminName={admin?.name}
              onLogout={handleLogout}
              onNavigate={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      ) : null}

      <main className="px-4 py-6 pb-6 md:ml-60 md:px-6 md:py-8 md:pb-8">
        <Outlet />
      </main>
    </div>
  )
}

