/**
 * WorkerLayout.jsx
 * Source file for the cleanflow application.
 */

import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useWorker } from '../context/WorkerContext'

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  )
}

function TasksIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 7h3l2-2h4l2 2h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  )
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  )
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </svg>
  )
}

export default function WorkerLayout() {
  const { tasks } = useWorker()
  const location = useLocation()

  const activeTask =
    tasks.find((task) => task.status === 'in_progress') || tasks.find((task) => task.status === 'scheduled')

  const cameraTarget = activeTask ? `/worker/tasks/${activeTask.id}/photos` : '/worker/'
  const tasksTarget = activeTask ? `/worker/tasks/${activeTask.id}` : '/worker/'

  const items = [
    { to: '/worker/', label: 'Home', icon: <HomeIcon /> },
    { to: tasksTarget, label: 'Tasks', icon: <TasksIcon /> },
    { to: cameraTarget, label: 'Camera', icon: <CameraIcon />, center: true },
    { to: '/worker/history', label: 'History', icon: <HistoryIcon /> },
    { to: '/worker/profile', label: 'Profile', icon: <ProfileIcon /> },
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto w-full max-w-3xl pb-24">
        <Outlet />
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto grid h-20 max-w-3xl grid-cols-5 px-2">
          {items.map((item) => {
            const isTaskRoute = location.pathname.startsWith('/worker/tasks/')
            const isActive =
              item.label === 'Tasks'
                ? isTaskRoute && !location.pathname.endsWith('/photos')
                : item.label === 'Camera'
                  ? location.pathname.endsWith('/photos')
                  : location.pathname === item.to

            return (
              <NavLink
                key={item.label}
                to={item.to}
                className="flex min-h-[44px] flex-col items-center justify-center text-xs font-medium"
              >
                <span
                  className={
                    item.center
                      ? `-mt-7 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white ${
                          isActive ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white'
                        }`
                      : `${isActive ? 'text-blue-600' : 'text-slate-500'}`
                  }
                >
                  {item.icon}
                </span>
                <span className={`${item.center ? 'mt-1' : 'mt-1'} ${isActive ? 'text-blue-600' : 'text-slate-500'}`}>
                  {item.label}
                </span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

