/**
 * WorkerContext.jsx
 * Provides worker-authenticated task state sourced from backend APIs.
 * All checklist, photo, task status, and attendance actions are persisted immediately.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { apiFormRequest, apiRequest } from '../../lib/api'

const WorkerContext = createContext(null)

/**
 * Demo credentials shown in UI hints; real authentication uses backend login.
 */
export const DEMO_WORKER = {
  id: 'w1',
  name: 'Jessica Chen',
  email: 'jessica@cleanflow.com',
  password: 'worker123',
  streak: 5,
}

/**
 * Normalizes checklist item documents.
 */
function normalizeChecklistItem(item) {
  return {
    id: item._id,
    area: item.area,
    title: item.title,
    required: Boolean(item.required),
    completed: Boolean(item.completed),
    completedAt: item.completedAt,
    note: item.note || '',
  }
}

/**
 * Normalizes photo object to current UI shape.
 */
function normalizePhoto(photo) {
  return {
    id: photo._id,
    name: photo.caption || photo.photoType,
    url: photo.photoUrl,
    standardId: photo.standardId || null,
  }
}

/**
 * Builds worker task shape expected by existing pages.
 */
function normalizeTask(task, checklistItems, standards, photosByType, submission) {
  const property = task.propertyId || {}

  const standardsWithProof = standards.map((standard) => {
    const proofPhoto = (photosByType.standard_proof || []).find(
      (photo) => String(photo.standardId || '') === String(standard._id),
    )

    return {
      id: standard._id,
      areaName: standard.areaName,
      instruction: standard.instruction || '',
      required: Boolean(standard.required),
      referencePhotoUrl: standard.referencePhotoUrl || null,
      proofPhoto: proofPhoto ? normalizePhoto(proofPhoto) : null,
    }
  })

  return {
    id: task._id,
    title: task.title,
    propertyName: property.name || '',
    address: property.address || '',
    date: task.date,
    startTime: task.startTime,
    endTime: task.endTime,
    status: task.status,
    taskType: task.taskType,
    priority: task.priority,
    managerNotes: task.managerNotes || '',
    accessNotes: property.accessNotes || '',
    importantNotes: property.importantNotes || '',
    wifi: {
      name: property.wifiName || '',
      password: property.wifiPassword || '',
    },
    startedAt: task.startedAt || null,
    endedAt: task.endedAt || null,
    durationSeconds: task.durationSeconds ?? null,
    checklistItems,
    standards: standardsWithProof,
    photos: {
      before: (photosByType.before || []).map(normalizePhoto),
      after: (photosByType.after || []).map(normalizePhoto),
      problem: (photosByType.problem || []).map(normalizePhoto),
      standard_proof: (photosByType.standard_proof || []).map(normalizePhoto),
    },
    notes: submission?.cleanerNotes || '',
    problemDescription: submission?.issueDescription || '',
    submittedAt: submission?.submittedAt || null,
    // Populated when the manager requests a re-clean via the review UI.
    managerFeedback: submission?.managerFeedback || '',
    // Feature 5: Multi-cleaner task lead — used to determine who can submit.
    taskLeadId: task.taskLeadId || null,
    assignedWorkerIds: Array.isArray(task.assignedWorkerIds)
      ? task.assignedWorkerIds.map((w) => (typeof w === 'object' ? w._id : w))
      : [],
    assignedWorkerNames: Array.isArray(task.assignedWorkerIds)
      ? task.assignedWorkerIds
          .filter((w) => typeof w === 'object')
          .map((w) => ({ id: w._id, name: w.name }))
      : [],
  }
}

export function WorkerProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem('cf_worker_user')
    return stored ? JSON.parse(stored) : null
  })
  const [tasks, setTasks] = useState([])
  const [loadingTasks, setLoadingTasks] = useState(false)

  /**
   * Loads shared app settings (including timezone) for worker pages.
   */
  const loadAppSettings = useCallback(async () => {
    try {
      const res = await apiRequest('/settings', {}, 'worker')
      if (res.data) {
        localStorage.setItem('cf_settings', JSON.stringify(res.data))
      }
    } catch (err) {
      // Non-fatal fallback: timezone utility will use browser timezone.
      console.warn('Could not load app settings:', err?.message)
    }
  }, [])

  /**
   * Hydrates worker tasks with checklist, standards, photos, and submission data.
   */
  const refreshTasks = useCallback(async () => {
    if (!localStorage.getItem('cf_worker_token')) return

    setLoadingTasks(true)
    try {
      const tasksRes = await apiRequest('/tasks/my', {}, 'worker')
      const baseTasks = tasksRes.data || []

      const hydrated = await Promise.all(
        baseTasks.map(async (task) => {
          const taskId = task._id
          const propertyId = task.propertyId?._id

          const [checklistRes, standardsRes, photosRes, submissionRes] = await Promise.all([
            apiRequest(`/checklist/task/${taskId}`, {}, 'worker').catch(() => ({ data: [] })),
            propertyId
              ? apiRequest(`/standards/property/${propertyId}`, {}, 'worker').catch(() => ({ data: [] }))
              : Promise.resolve({ data: [] }),
            apiRequest(`/photos/task/${taskId}`, {}, 'worker').catch(() => ({ data: {} })),
            apiRequest(`/submissions/task/${taskId}`, {}, 'worker').catch(() => ({ data: null })),
          ])

          return normalizeTask(
            task,
            (checklistRes.data || []).map(normalizeChecklistItem),
            standardsRes.data || [],
            photosRes.data || {},
            submissionRes.data,
          )
        }),
      )

      setTasks(hydrated)
    } finally {
      setLoadingTasks(false)
    }
  }, [])

  useEffect(() => {
    refreshTasks().catch(() => {
      // Keep UI rendered; page-level fallbacks handle empty/error states.
    })
  }, [refreshTasks])

  useEffect(() => {
    // Restore settings for persisted sessions so worker timezone is correct after reload.
    if (localStorage.getItem('cf_worker_token')) {
      void loadAppSettings()
    }
  }, [loadAppSettings])

  /**
   * Stores worker identity and token after successful login.
   */
  async function loginWorker(user, token) {
    setCurrentUser(user)
    localStorage.setItem('cf_worker_user', JSON.stringify(user))
    if (token) {
      localStorage.setItem('cf_worker_token', token)
    }
    await loadAppSettings()
  }

  /**
   * Clears worker auth session.
   */
  function logoutWorker() {
    setCurrentUser(null)
    localStorage.removeItem('cf_worker_user')
    localStorage.removeItem('cf_worker_token')
  }

  /**
   * Auto-logout worker on any 401 from API (token stale, user deleted, etc).
   */
  useEffect(() => {
    function handleUnauthorized(e) {
      if (e.detail?.role === 'worker') {
        setCurrentUser(null)
        localStorage.removeItem('cf_worker_user')
        localStorage.removeItem('cf_worker_token')
        // Flag consumed by worker login page to show "session expired" message.
        localStorage.setItem('cf_session_expired', 'true')
        window.location.replace('/worker/login')
      }
    }
    window.addEventListener('cf:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('cf:unauthorized', handleUnauthorized)
  }, [])

  /**
   * Updates task object fields in local cache.
   * Used for transient form fields while dedicated API calls persist server state.
   */
  function updateTask(id, changes) {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, ...changes } : task)))
  }

  /**
   * Persists checklist completion toggle immediately.
   */
  async function toggleChecklistItem(taskId, itemId) {
    const task = tasks.find((item) => item.id === taskId)
    const item = task?.checklistItems.find((entry) => entry.id === itemId)
    if (!task || !item) return

    const endpoint = item.completed ? `/checklist/${itemId}/uncomplete` : `/checklist/${itemId}/complete`
    const res = await apiRequest(endpoint, { method: 'PATCH' }, 'worker')
    const updatedItem = normalizeChecklistItem(res.data)

    setTasks((prev) =>
      prev.map((entry) =>
        entry.id === taskId
          ? {
              ...entry,
              checklistItems: entry.checklistItems.map((check) =>
                check.id === itemId ? updatedItem : check,
              ),
            }
          : entry,
      ),
    )
  }

  /**
   * Uploads task photo and updates grouped photo cache immediately.
   */
  async function addPhoto(taskId, type, file, extra = {}) {
    const task = tasks.find((entry) => entry.id === taskId)
    if (!task) return null

    const formData = new FormData()
    formData.append('taskId', taskId)
    formData.append('photoType', type)
    formData.append('photo', file)
    if (extra.standardId) formData.append('standardId', extra.standardId)
    if (extra.caption) formData.append('caption', extra.caption)

    const res = await apiFormRequest('/photos/upload', formData, 'POST', 'worker')
    const photo = normalizePhoto(res.data)

    setTasks((prev) =>
      prev.map((entry) => {
        if (entry.id !== taskId) return entry

        const photoKey = type === 'standard_proof' ? 'standard_proof' : type
        const nextPhotos = {
          ...entry.photos,
          [photoKey]: [...(entry.photos[photoKey] || []), photo],
        }

        // Sync proof photo preview on standards list.
        const nextStandards =
          type === 'standard_proof' && extra.standardId
            ? entry.standards.map((standard) =>
                standard.id === extra.standardId ? { ...standard, proofPhoto: photo } : standard,
              )
            : entry.standards

        return {
          ...entry,
          photos: nextPhotos,
          standards: nextStandards,
        }
      }),
    )

    return photo
  }

  /**
   * Uploads standard proof photo (worker) and updates standard card state.
   */
  async function setStandardProofPhoto(taskId, standardId, file) {
    return addPhoto(taskId, 'standard_proof', file, { standardId })
  }

  /**
   * Deletes an uploaded photo from the server and removes it from local task state.
   * @param {string} taskId   – task the photo belongs to
   * @param {string} photoId  – photo document _id
   * @param {string} type     – photoType key: 'after' | 'problem' | 'standard_proof'
   */
  async function deletePhoto(taskId, photoId, type) {
    await apiRequest(`/photos/${photoId}`, { method: 'DELETE' }, 'worker')

    setTasks((prev) =>
      prev.map((entry) => {
        if (entry.id !== taskId) return entry
        const photoKey = type === 'standard_proof' ? 'standard_proof' : type
        return {
          ...entry,
          photos: {
            ...entry.photos,
            [photoKey]: (entry.photos[photoKey] || []).filter((p) => p.id !== photoId),
          },
        }
      }),
    )
  }

  /**
   * Starts task with server timestamp and refreshes local task timing.
   */
  async function startTask(taskId) {
    const res = await apiRequest(`/tasks/${taskId}/start`, { method: 'PATCH' }, 'worker')
    const task = res.data

    setTasks((prev) =>
      prev.map((entry) =>
        entry.id === taskId
          ? {
              ...entry,
              status: task.status,
              startedAt: task.startedAt,
              endedAt: task.endedAt,
              durationSeconds: task.durationSeconds,
            }
          : entry,
      ),
    )
  }

  /**
   * Submits task completion and syncs returned server timing values.
   */
  async function submitTask(taskId, payload = {}) {
    const res = await apiRequest(
      `/tasks/${taskId}/submit`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      'worker',
    )

    const taskUpdate = res.data?.task

    setTasks((prev) =>
      prev.map((entry) =>
        entry.id === taskId
          ? {
              ...entry,
              status: taskUpdate?.status || 'submitted',
              endedAt: taskUpdate?.endedAt || entry.endedAt,
              durationSeconds: taskUpdate?.durationSeconds ?? entry.durationSeconds,
              notes: payload.cleanerNotes || entry.notes,
              problemDescription: payload.issueDescription || entry.problemDescription,
              submittedAt: new Date().toISOString(),
            }
          : entry,
      ),
    )

    return res.data
  }

  /**
   * Worker clock-in request.
   */
  async function clockIn() {
    const res = await apiRequest('/attendance/clock-in', { method: 'POST' }, 'worker')
    return res.data
  }

  /**
   * Worker clock-out request.
   */
  async function clockOut(notes = '') {
    const res = await apiRequest(
      '/attendance/clock-out',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      },
      'worker',
    )
    return res.data
  }

  /**
   * Returns worker attendance record for today.
   */
  async function getTodayAttendance() {
    const res = await apiRequest('/attendance/me/today', {}, 'worker')
    return res.data
  }

  /**
   * Returns worker attendance history.
   */
  async function getAttendanceHistory() {
    const res = await apiRequest('/attendance/me/history', {}, 'worker')
    return res.data || []
  }

  const value = useMemo(
    () => ({
      currentUser,
      tasks,
      loadingTasks,
      loginWorker,
      logoutWorker,
      refreshTasks,
      updateTask,
      toggleChecklistItem,
      addPhoto,
      deletePhoto,
      setStandardProofPhoto,
      startTask,
      submitTask,
      clockIn,
      clockOut,
      getTodayAttendance,
      getAttendanceHistory,
    }),
    [currentUser, tasks, loadingTasks, refreshTasks],
  )

  return <WorkerContext.Provider value={value}>{children}</WorkerContext.Provider>
}

export function useWorker() {
  const context = useContext(WorkerContext)

  if (!context) {
    throw new Error('useWorker must be used inside WorkerProvider')
  }

  return context
}