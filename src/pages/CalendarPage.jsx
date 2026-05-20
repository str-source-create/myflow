/**
 * CalendarPage.jsx
 * Weekly admin calendar view by property row and day column.
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import TaskFormModal from '../components/TaskFormModal'
import { apiRequest } from '../lib/api'
import { useAdmin } from '../context/AdminContext'
import { getTimezone } from '../utils/timezone'

/**
 * Returns Monday for any date.
 */
function getMonday(date) {
  const copy = new Date(date)
  const day = getWeekdayInTimezone(copy, getTimezone()) || 7
  if (day !== 1) copy.setDate(copy.getDate() - (day - 1))
  // Keep a stable midday anchor to avoid timezone boundary drift.
  copy.setHours(12, 0, 0, 0)
  return copy
}

/** Returns weekday number (0=Sun..6=Sat) for a given timezone. */
function getWeekdayInTimezone(date, timeZone) {
  const short = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(date)
  const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return map[short] ?? 0
}

/**
 * Formats date to YYYY-MM-DD using LOCAL date parts.
 * Never use toISOString() here — it converts to UTC and shifts the date
 * for users in UTC+ timezones (e.g. local midnight May 18 = UTC May 17).
 */
function formatDateKey(date) {
  return date.toLocaleDateString('en-CA', { timeZone: getTimezone() })
}

/**
 * Gets seven-day range from a Monday anchor.
 */
function getWeekDays(weekStart) {
  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + index)
    return date
  })
}

/**
 * Maps API task shape to calendar UI task shape.
 */
function mapTask(task) {
  const property = typeof task.propertyId === 'object' ? task.propertyId : null
  const workers = Array.isArray(task.assignedWorkerIds)
    ? task.assignedWorkerIds.map((worker) => (typeof worker === 'object' ? worker.name : '')).filter(Boolean)
    : []

  return {
    id: task._id,
    propertyId: property?._id || task.propertyId,
    date: task.date,
    startTime: task.startTime,
    endTime: task.endTime,
    status: task.status,
    taskType: task.taskType,
    priority: task.priority,
    managerNotes: task.managerNotes || '',
    assignedWorkerIds: Array.isArray(task.assignedWorkerIds)
      ? task.assignedWorkerIds.map((worker) => (typeof worker === 'object' ? worker._id : worker))
      : [],
    workerInitials: workers.map((name) => name.split(' ').map((part) => part[0]).join('')).join(', '),
    durationSeconds: task.durationSeconds ?? null,
    title: task.title,
  }
}

export default function CalendarPage() {
  const navigate = useNavigate()
  const { properties, workers, addTask, updateTask, deleteTask } = useAdmin()
  const [weekStart, setWeekStart] = useState(getMonday(new Date()))
  const [tasks, setTasks] = useState([])
  const [selectedCell, setSelectedCell] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  /**
   * propertySearch — filters the property rows in the calendar grid.
   * Empty string shows all properties.
   * Case-insensitive match on property name or address.
   */
  const [propertySearch, setPropertySearch] = useState('')

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart])
  const startDate = formatDateKey(weekDays[0])
  const endDate = formatDateKey(weekDays[6])

  /** Filter properties based on the calendar search input. */
  const filteredProperties = useMemo(
    () => properties.filter((property) => {
      if (!propertySearch.trim()) return true
      const query = propertySearch.toLowerCase()
      return (
        property.name?.toLowerCase().includes(query) ||
        property.address?.toLowerCase().includes(query)
      )
    }),
    [properties, propertySearch],
  )

  /** Human-readable week range label shown in the calendar header. */
  const weekRangeLabel = useMemo(() => {
    const firstDay = weekDays[0]
    const lastDay = weekDays[6]
    // Calendar labels follow the selected app timezone for consistent admin view.
    const firstPart = firstDay.toLocaleDateString([], { timeZone: getTimezone(), month: 'short', day: 'numeric' })
    const lastPart = lastDay.toLocaleDateString([], { timeZone: getTimezone(), month: 'short', day: 'numeric' })
    return `${firstPart} - ${lastPart}`
  }, [weekDays])

  /**
   * Fetches one-week task range only.
   */
  async function fetchWeekTasks() {
    setLoading(true)
    setError('')
    try {
      const res = await apiRequest(`/tasks?startDate=${startDate}&endDate=${endDate}`, {}, 'admin')
      setTasks((res.data || []).map(mapTask))
    } catch (err) {
      setError(err.message || 'Failed to load calendar tasks.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchWeekTasks()
  }, [startDate, endDate])

  /**
   * Opens create modal with property/date prefilled.
   */
  function openCreateModal(propertyId = '', date = '') {
    setSelectedTask(null)
    setSelectedCell({ propertyId, date })
    setShowModal(true)
  }

  /**
   * Opens edit modal with selected task.
   */
  function openEditModal(task) {
    setSelectedTask(task)
    setSelectedCell(null)
    setShowModal(true)
  }

  /**
   * Saves task create/edit and refreshes the weekly grid.
   */
  async function handleSaveTask(payload) {
    if (selectedTask) {
      await updateTask(selectedTask.id, payload)
    } else {
      await addTask(payload)
    }
    await fetchWeekTasks()
  }

  /**
   * Deletes a task and refreshes the weekly grid.
   */
  async function handleDeleteTask(taskId) {
    await deleteTask(taskId)
    await fetchWeekTasks()
  }

  /** Moves the calendar by one week backward. */
  function goToPrevWeek() {
    setWeekStart((prev) => {
      const next = new Date(prev)
      next.setDate(prev.getDate() - 7)
      return next
    })
  }

  /** Moves the calendar by one week forward. */
  function goToNextWeek() {
    setWeekStart((prev) => {
      const next = new Date(prev)
      next.setDate(prev.getDate() + 7)
      return next
    })
  }

  /** Jumps the calendar to the current week. */
  function goToToday() {
    setWeekStart(getMonday(new Date()))
  }

  return (
    <div className="space-y-6">
      {/* Calendar header — week navigation + property search. */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Left: title and week navigation controls. */}
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <h1 className="mr-2 font-[Manrope] text-2xl font-bold text-slate-900">Task Calendar</h1>
          <button
            type="button"
            onClick={goToPrevWeek}
            className="min-h-[44px] rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            aria-label="Previous week"
            title="Previous week"
          >
            <span className="inline-flex items-center gap-1.5">
              <i className="ti ti-chevron-left" />
              Previous Week
            </span>
          </button>
          <span className="min-w-[160px] text-center text-sm font-medium text-slate-600">{weekRangeLabel}</span>
          <button
            type="button"
            onClick={goToNextWeek}
            className="min-h-[44px] rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            aria-label="Next week"
            title="Next week"
          >
            <span className="inline-flex items-center gap-1.5">
              Next Week
              <i className="ti ti-chevron-right" />
            </span>
          </button>
          <button
            type="button"
            onClick={goToToday}
            className="min-h-[44px] rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            Today
          </button>
        </div>

        {/* Right: property row search with inline clear control. */}
        <div className="relative w-full sm:w-64">
          <i className="ti ti-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
          <input
            type="text"
            value={propertySearch}
            onChange={(event) => setPropertySearch(event.target.value)}
            placeholder="Search properties..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {propertySearch && (
            <button
              type="button"
              onClick={() => setPropertySearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
            >
              <i className="ti ti-x text-sm" />
            </button>
          )}
        </div>

        {/* Header action: quick access to task creation modal. */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => openCreateModal()}
            className="min-h-[44px] flex-shrink-0 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white"
          >
            <i className="ti ti-plus" /> Create Task
          </button>
        </div>
      </div>

      {/* Search result summary appears only while searching. */}
      {propertySearch.trim() && (
        <p className="mb-3 text-xs text-slate-500">
          Showing {filteredProperties.length} of {properties.length} properties
          {filteredProperties.length === 0 ? (
            <span className="ml-2 font-medium text-amber-600">- no properties match "{propertySearch}"</span>
          ) : null}
        </p>
      )}

      {loading ? <p className="text-sm text-slate-500">Loading calendar...</p> : null}
      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

      {/* Empty search state when no property row matches the query. */}
      {filteredProperties.length === 0 && propertySearch.trim() ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">
          <i className="ti ti-search text-4xl text-slate-300" />
          <p className="mt-3 font-semibold text-slate-600">No properties found</p>
          <p className="mt-1 text-sm text-slate-400">
            No properties match <strong>"{propertySearch}"</strong>
          </p>
          <button
            type="button"
            onClick={() => setPropertySearch('')}
            className="mt-4 text-sm text-blue-600 hover:underline"
          >
            Clear search
          </button>
        </div>
      ) : (
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-[1100px] w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 min-w-[160px] border-b border-r border-slate-200 bg-white px-3 py-3 text-left text-sm font-semibold text-slate-700">
                Property
              </th>
              {weekDays.map((day) => (
                <th key={formatDateKey(day)} className="min-w-[120px] border-b border-slate-200 bg-white px-3 py-3 text-left text-sm font-semibold text-slate-700">
                  {day.toLocaleDateString([], { timeZone: getTimezone(), weekday: 'short', month: 'numeric', day: 'numeric' })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredProperties.map((property) => (
              <tr key={property.id}>
                <td className="sticky left-0 z-10 min-w-[160px] border-r border-t border-slate-100 bg-white px-3 py-3 align-top">
                  <p className="text-sm font-semibold text-slate-900">{property.name}</p>
                  <p className="text-xs text-slate-500">{property.address}</p>
                </td>

                {weekDays.map((day) => {
                  const dateKey = formatDateKey(day)
                  const dayTasks = tasks.filter((task) => task.propertyId === property.id && task.date === dateKey)

                  return (
                    <td key={`${property.id}-${dateKey}`} className="min-w-[120px] border-l border-t border-slate-100 p-2 align-top">
                      {dayTasks.length ? (
                        <div className="space-y-2">
                          {dayTasks.map((task) => (
                            <div
                              key={task.id}
                              onClick={() => openEditModal(task)}
                              className="cursor-pointer rounded-xl border border-slate-200 bg-white p-2 shadow-sm transition-all hover:border-blue-300"
                            >
                              <div className="mb-1 flex items-center justify-between">
                                <StatusBadge status={task.status} size="xs" />
                                <span className="text-xs text-slate-400">{task.startTime}</span>
                              </div>
                              <p className="truncate text-xs font-semibold text-slate-800">{task.taskType}</p>
                              <p className="truncate text-xs text-slate-500">{task.workerInitials || '--'}</p>
                              {task.durationSeconds ? (
                                <p className="text-xs text-slate-400">
                                  {Math.floor(task.durationSeconds / 3600)}h {Math.floor((task.durationSeconds % 3600) / 60)}m
                                </p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openCreateModal(property.id, dateKey)}
                          className="flex min-h-[72px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 transition-all hover:border-blue-300 hover:text-blue-600"
                        >
                          <span className="text-lg">+</span>
                          Add task
                        </button>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      <TaskFormModal
        open={showModal}
        selectedTask={selectedTask}
        selectedCell={selectedCell}
        properties={properties}
        workers={workers}
        onClose={() => setShowModal(false)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        onOpenDetails={(taskId) => navigate(`/admin/tasks/${taskId}`)}
      />
    </div>
  )
}
