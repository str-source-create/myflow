/**
 * AdminContext.jsx
 * Provides authenticated admin state and CRUD methods backed by backend APIs.
 * This replaces demo/local-only data so refreshes always reload persisted server data.
 * Features:
 *  - updateWorker, deactivateWorker, resetWorkerPassword (Feature 3)
 *  - settings fetch on load + updateSettings (Feature 4)
 *  - normalizeTask includes taskLeadId (Feature 5)
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { apiFormRequest, apiRequest } from '../lib/api'

const AdminContext = createContext(null)

/**
 * Demo credentials shown in UI hints; real authentication uses backend login.
 */
export const DEMO_ADMIN = {
  name: 'Sarah Admin',
  email: 'admin@cleanflow.com',
  password: 'admin123',
}

/**
 * Normalizes property shape for current frontend pages.
 */
function normalizeProperty(property, standards = []) {
  return {
    id: property._id,
    name: property.name,
    address: property.address,
    wifiName: property.wifiName || '',
    wifiPassword: property.wifiPassword || '',
    gpsLocation: property.gpsLocation || '',
    accessNotes: property.accessNotes || '',
    parkingNotes: property.parkingNotes || '',
    cleaningNotes: property.cleaningNotes || '',
    importantNotes: property.importantNotes || '',
    active: Boolean(property.active),
    standards,
  }
}

/**
 * Normalizes standard objects for admin and worker rendering.
 */
function normalizeStandard(standard) {
  return {
    id: standard._id,
    propertyId: standard.propertyId,
    areaName: standard.areaName,
    instruction: standard.instruction || '',
    required: Boolean(standard.required),
    sortOrder: standard.sortOrder || 0,
    referencePhotoUrl: standard.referencePhotoUrl || null,
    cloudinaryPublicId: standard.cloudinaryPublicId || null,
  }
}

/**
 * Normalizes task shape while keeping legacy fields used by existing pages.
 * Includes taskLeadId for the multi-cleaner task lead feature.
 */
function normalizeTask(task) {
  const propertyObj = typeof task.propertyId === 'object' ? task.propertyId : null
  const workers = Array.isArray(task.assignedWorkerIds)
    ? task.assignedWorkerIds.map((item) => (typeof item === 'object' ? item._id : item))
    : []

  return {
    id: task._id,
    title: task.title,
    propertyId: propertyObj?._id || task.propertyId,
    propertyName: propertyObj?.name || '',
    address: propertyObj?.address || '',
    assignedWorkerIds: workers,
    taskLeadId: task.taskLeadId || null,
    date: task.date,
    startTime: task.startTime,
    endTime: task.endTime,
    taskType: task.taskType,
    priority: task.priority,
    status: task.status,
    managerNotes: task.managerNotes || '',
    startedAt: task.startedAt || null,
    endedAt: task.endedAt || null,
    durationSeconds: task.durationSeconds ?? null,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  }
}

/**
 * Normalizes submission for existing review/list pages.
 */
function normalizeSubmission(submission) {
  // Guard against malformed/null API records.
  if (!submission) return null

  // Populated refs may be null (e.g., referenced doc deleted), so guard each one.
  const taskObj = submission.taskId && typeof submission.taskId === 'object' ? submission.taskId : null
  const propertyObj = submission.propertyId && typeof submission.propertyId === 'object' ? submission.propertyId : null
  const workerObj = submission.workerId && typeof submission.workerId === 'object' ? submission.workerId : null
  const reviewedByObj = submission.reviewedBy && typeof submission.reviewedBy === 'object'
    ? submission.reviewedBy
    : null

  return {
    id: submission._id,
    taskId: taskObj?._id || submission.taskId || null,
    taskTitle: taskObj?.title || 'Cleaning Task',
    propertyName: propertyObj?.name || 'Property',
    workerId: workerObj?._id || submission.workerId || null,
    workerName: workerObj?.name || 'Worker',
    date: taskObj?.date || '',
    checklistCompleted: submission.checklistCompleted || 0,
    checklistTotal: submission.checklistTotal || 0,
    standardPhotosUploaded: submission.standardPhotosUploaded || 0,
    standardPhotosTotal: submission.standardPhotosTotal || 0,
    // Kept for UI compatibility; before is now optional/deprecated for workers.
    beforePhotos: 0,
    afterPhotos: submission.standardPhotosUploaded || 0,
    problemPhotos: submission.issueFound ? 1 : 0,
    cleanerNotes: submission.cleanerNotes || '',
    issueFound: Boolean(submission.issueFound),
    issueDescription: submission.issueDescription || '',
    reviewStatus: submission.reviewStatus || 'pending_review',
    submittedAt: submission.submittedAt,
    reviewMeta: reviewedByObj
      ? {
          reviewedBy: reviewedByObj.name,
          reviewedAt: submission.reviewedAt,
        }
      : null,
  }
}

/**
 * Normalizes worker list records.
 */
function normalizeWorker(worker) {
  return {
    id: worker._id,
    name: worker.name,
    email: worker.email,
    phone: worker.phone || '',
    active: Boolean(worker.active),
    tasksCompleted: worker.tasksCompleted || 0,
    rating: 5,
  }
}

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    const saved = localStorage.getItem('cf_admin_user')
    return saved ? JSON.parse(saved) : null
  })
  const [properties, setProperties] = useState([])
  const [workers, setWorkers] = useState([])
  const [tasks, setTasks] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(false)
  /** App-wide settings (timezone, companyName, etc.) loaded from backend. */
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('cf_settings')
      return saved ? JSON.parse(saved) : { timezone: 'America/Toronto' }
    } catch {
      return { timezone: 'America/Toronto' }
    }
  })

  /**
   * Loads all admin dashboard datasets from backend.
   * Also fetches app settings and stores them in localStorage for timezone usage.
   */
  const refreshAdminData = useCallback(async () => {
    if (!localStorage.getItem('cf_admin_token')) return

    setLoading(true)
    try {
      // Fetch each resource independently so one API failure never blocks submissions.
      let propertiesData = []
      let workersData = []
      let tasksData = []
      let submissionsData = []
      let settingsData = null

      try {
        const propertiesRes = await apiRequest('/properties', {}, 'admin')
        propertiesData = propertiesRes.data || []
      } catch (err) {
        console.error('Failed to fetch properties:', err)
      }

      try {
        const workersRes = await apiRequest('/users?role=worker', {}, 'admin')
        workersData = workersRes.data || []
      } catch (err) {
        console.error('Failed to fetch workers:', err)
      }

      try {
        const tasksRes = await apiRequest('/tasks', {}, 'admin')
        tasksData = tasksRes.data || []
      } catch (err) {
        console.error('Failed to fetch tasks:', err)
      }

      try {
        const submissionsRes = await apiRequest('/submissions', {}, 'admin')
        submissionsData = submissionsRes.data || []
      } catch (err) {
        console.error('Failed to fetch submissions:', err)
      }

      try {
        const settingsRes = await apiRequest('/settings', {}, 'admin')
        settingsData = settingsRes.data || null
      } catch (err) {
        console.warn('Could not load settings (non-fatal):', err?.message)
      }

      // Persist settings to localStorage so timezone utilities can read them synchronously
      if (settingsData) {
        setSettings(settingsData)
        localStorage.setItem('cf_settings', JSON.stringify(settingsData))
      }

      const propertyItems = propertiesData || []

      // Fetch standards for each property so existing pages continue to render nested standards.
      // Each fetch is individually guarded so a single failing property never aborts the whole refresh.
      const standardsByProperty = await Promise.all(
        propertyItems.map(async (property) => {
          const standardsRes = await apiRequest(`/standards/property/${property._id}`, {}, 'admin')
            .catch(() => ({ data: [] }))
          return {
            propertyId: property._id,
            standards: (standardsRes.data || []).map(normalizeStandard),
          }
        }),
      )

      const standardsMap = new Map(standardsByProperty.map((item) => [item.propertyId, item.standards]))

      setProperties(propertyItems.map((item) => normalizeProperty(item, standardsMap.get(item._id) || [])))
      setWorkers((workersData || []).map(normalizeWorker))
      setTasks((tasksData || []).map(normalizeTask))
      setSubmissions((submissionsData || []).map(normalizeSubmission).filter(Boolean))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshAdminData().catch(() => {
      // Keep shell rendered; pages show data-level fallback states.
    })
  }, [refreshAdminData])

  /**
   * Stores admin identity and token after successful backend login.
   */
  function loginAdmin(user, token) {
    setAdmin(user)
    localStorage.setItem('cf_admin_user', JSON.stringify(user))
    if (token) {
      localStorage.setItem('cf_admin_token', token)
    }
  }

  /**
   * Clears admin auth session.
   */
  function logoutAdmin() {
    setAdmin(null)
    localStorage.removeItem('cf_admin_user')
    localStorage.removeItem('cf_admin_token')
  }

  /**
   * Auto-logout admin on any 401 from API (token stale, user deleted, etc).
   */
  useEffect(() => {
    function handleUnauthorized(e) {
      if (e.detail?.role === 'admin') {
        setAdmin(null)
        localStorage.removeItem('cf_admin_user')
        localStorage.removeItem('cf_admin_token')
        window.location.replace('/admin/login')
      }
    }
    window.addEventListener('cf:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('cf:unauthorized', handleUnauthorized)
  }, [])

  /**
   * Creates a property in DB and updates local cache.
   */
  async function addProperty(data) {
    const res = await apiRequest(
      '/properties',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      'admin',
    )

    const normalized = normalizeProperty(res.data, [])
    setProperties((prev) => [normalized, ...prev])
    return normalized
  }

  /**
   * Updates property fields in DB and local cache.
   */
  async function updateProperty(id, data) {
    const res = await apiRequest(
      `/properties/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      'admin',
    )

    const updated = normalizeProperty(res.data)
    setProperties((prev) => prev.map((property) => (property.id === id ? { ...property, ...updated } : property)))
  }

  /**
   * Soft-deletes property via backend and removes it from local lists.
   */
  async function deleteProperty(id) {
    await apiRequest(`/properties/${id}`, { method: 'DELETE' }, 'admin')
    setProperties((prev) => prev.filter((property) => property.id !== id))
    setTasks((prev) => prev.filter((task) => task.propertyId !== id))
  }

  /**
   * Creates a standard for a property and optionally uploads reference image.
   */
  async function addStandard(propertyId, data) {
    const formData = new FormData()
    formData.append('propertyId', propertyId)
    formData.append('areaName', data.areaName || '')
    formData.append('instruction', data.instruction || '')
    formData.append('required', String(Boolean(data.required)))
    if (data.photoFile) {
      formData.append('photo', data.photoFile)
    }

    const res = await apiFormRequest('/standards', formData, 'POST', 'admin')
    const normalized = normalizeStandard(res.data)

    setProperties((prev) =>
      prev.map((property) =>
        property.id === propertyId
          ? { ...property, standards: [...property.standards, normalized] }
          : property,
      ),
    )

    return normalized
  }

  /**
   * Updates a standard and supports optional new photo upload.
   */
  async function updateStandard(propertyId, standardId, data) {
    const formData = new FormData()
    if (Object.prototype.hasOwnProperty.call(data, 'areaName')) formData.append('areaName', data.areaName)
    if (Object.prototype.hasOwnProperty.call(data, 'instruction')) formData.append('instruction', data.instruction)
    if (Object.prototype.hasOwnProperty.call(data, 'required')) formData.append('required', String(Boolean(data.required)))
    if (Object.prototype.hasOwnProperty.call(data, 'sortOrder')) formData.append('sortOrder', String(data.sortOrder))
    if (data.photoFile) formData.append('photo', data.photoFile)

    const res = await apiFormRequest(`/standards/${standardId}`, formData, 'PUT', 'admin')
    const normalized = normalizeStandard(res.data)

    setProperties((prev) =>
      prev.map((property) =>
        property.id === propertyId
          ? {
              ...property,
              standards: property.standards.map((standard) =>
                standard.id === standardId ? normalized : standard,
              ),
            }
          : property,
      ),
    )
  }

  /**
   * Deletes a standard from DB and local cache.
   */
  async function deleteStandard(propertyId, standardId) {
    await apiRequest(`/standards/${standardId}`, { method: 'DELETE' }, 'admin')

    setProperties((prev) =>
      prev.map((property) =>
        property.id === propertyId
          ? { ...property, standards: property.standards.filter((standard) => standard.id !== standardId) }
          : property,
      ),
    )
  }

  /**
   * Dedicated helper for replacing standard reference photo.
   */
  async function uploadReferencePhoto(propertyId, standardId, file) {
    const formData = new FormData()
    formData.append('photo', file)

    const res = await apiFormRequest(`/standards/${standardId}/upload-reference-photo`, formData, 'POST', 'admin')
    const normalized = normalizeStandard(res.data)

    setProperties((prev) =>
      prev.map((property) =>
        property.id === propertyId
          ? {
              ...property,
              standards: property.standards.map((standard) =>
                standard.id === standardId ? normalized : standard,
              ),
            }
          : property,
      ),
    )

    return normalized
  }

  /**
   * Deletes the reference photo for a standard via Cloudinary + backend, then clears local URL.
   */
  async function deleteReferencePhoto(propertyId, standardId) {
    await apiRequest(`/standards/${standardId}/reference-photo`, { method: 'DELETE' }, 'admin')

    setProperties((prev) =>
      prev.map((property) =>
        property.id === propertyId
          ? {
              ...property,
              standards: property.standards.map((standard) =>
                standard.id === standardId
                  ? { ...standard, referencePhotoUrl: null }
                  : standard,
              ),
            }
          : property,
      ),
    )
  }

  /**
   * Creates a task; checklist items are generated server-side from property template.
   */
  async function addTask(data) {
    const res = await apiRequest(
      '/tasks',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      'admin',
    )

    const task = normalizeTask(res.data)
    setTasks((prev) => [task, ...prev])
    return task
  }

  /**
   * Updates task metadata in DB and local cache.
   */
  async function updateTask(id, data) {
    const res = await apiRequest(
      `/tasks/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      'admin',
    )

    const normalized = normalizeTask(res.data)
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, ...normalized } : task)))
  }

  /**
   * Deletes task and clears linked cached submission.
   */
  async function deleteTask(id) {
    await apiRequest(`/tasks/${id}`, { method: 'DELETE' }, 'admin')
    setTasks((prev) => prev.filter((task) => task.id !== id))
    setSubmissions((prev) => prev.filter((submission) => submission.taskId !== id))
  }

  /**
   * Approves a submission by approving its task.
   */
  async function approveSubmission(submissionId) {
    const target = submissions.find((item) => item.id === submissionId)
    if (!target) throw new Error('Submission not found')

    await apiRequest(`/tasks/${target.taskId}/approve`, { method: 'PATCH' }, 'admin')
    await refreshAdminData()
  }

  /**
   * Requests fix by changing task/submission status.
   */
  async function requestFix(submissionId, reason) {
    const target = submissions.find((item) => item.id === submissionId)
    if (!target) throw new Error('Submission not found')

    await apiRequest(
      `/tasks/${target.taskId}/request-fix`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      },
      'admin',
    )

    await refreshAdminData()
  }

  /**
   * Creates worker account in backend.
   */
  async function addWorker(data) {
    const payload = {
      ...data,
      role: 'worker',
    }

    const res = await apiRequest(
      '/users',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      'admin',
    )

    const worker = normalizeWorker(res.data)
    setWorkers((prev) => [worker, ...prev])
    return worker
  }

  /**
   * Updates an existing worker's profile (name, email, phone).
   */
  async function updateWorker(id, data) {
    const res = await apiRequest(
      `/users/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      'admin',
    )
    const updated = normalizeWorker(res.data)
    setWorkers((prev) => prev.map((w) => (w.id === id ? updated : w)))
    return updated
  }

  /**
   * Deactivates a worker (soft-delete) — sets active: false on the server.
   */
  async function deactivateWorker(id) {
    await apiRequest(`/users/${id}`, { method: 'DELETE' }, 'admin')
    setWorkers((prev) => prev.map((w) => (w.id === id ? { ...w, active: false } : w)))
  }

  /**
   * Reactivates a previously deactivated worker — sets active: true on the server.
   */
  async function reactivateWorker(id) {
    const res = await apiRequest(
      `/users/${id}`,
      { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: true }) },
      'admin',
    )
    const updated = normalizeWorker(res.data)
    setWorkers((prev) => prev.map((w) => (w.id === id ? updated : w)))
    return updated
  }

  /**
   * Resets a worker's password to a server-generated temporary password.
   * Returns { tempPassword } so the admin can display it.
   */
  async function resetWorkerPassword(id) {
    const res = await apiRequest(`/users/${id}/reset-password`, { method: 'POST' }, 'admin')
    return res.data
  }

  /**
   * Saves app-wide settings (timezone, companyName, etc.) to the backend.
   * Also persists to localStorage for synchronous timezone utility access.
   */
  async function updateSettings(data) {
    const res = await apiRequest(
      '/settings',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      'admin',
    )
    const updated = res.data || data
    setSettings(updated)
    localStorage.setItem('cf_settings', JSON.stringify(updated))
    return updated
  }

  const value = useMemo(
    () => ({
      admin,
      properties,
      workers,
      tasks,
      submissions,
      settings,
      loading,
      loginAdmin,
      logoutAdmin,
      refreshAdminData,
      addProperty,
      updateProperty,
      deleteProperty,
      addStandard,
      updateStandard,
      deleteStandard,
      uploadReferencePhoto,
      deleteReferencePhoto,
      addTask,
      updateTask,
      deleteTask,
      approveSubmission,
      requestFix,
      addWorker,
      updateWorker,
      deactivateWorker,
      reactivateWorker,
      resetWorkerPassword,
      updateSettings,
    }),
    [admin, properties, workers, tasks, submissions, settings, loading, refreshAdminData],
  )

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider')
  }
  return context
}