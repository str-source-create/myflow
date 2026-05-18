/**
 * WorkerUploadPhotosPage.jsx
 * Multi-photo staging tray for After and Problem photo types.
 * Workers select multiple photos, review them in the staging tray,
 * then upload all at once.  Already-uploaded photos are shown with
 * a delete (×) button and open in a lightbox on tap.
 * "Before" photos have been removed — only After and Problem are required.
 */
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import PhotoStagingTray from '../components/PhotoStagingTray'
import TaskTimer from '../components/TaskTimer'
import { useWorker } from '../context/WorkerContext'

function TaskTabs({ taskId, activeTab }) {
  const tabs = [
    { label: 'Details', to: `/worker/tasks/${taskId}` },
    { label: 'Standards', to: `/worker/tasks/${taskId}/standards` },
    { label: 'Checklist', to: `/worker/tasks/${taskId}/checklist` },
    { label: 'Photos', to: `/worker/tasks/${taskId}/photos` },
  ]

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {tabs.map((tab) => (
        <Link
          key={tab.label}
          to={tab.to}
          className={`min-h-[44px] shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold ${
            activeTab === tab.label
              ? 'bg-blue-600 text-white'
              : 'border border-slate-200 bg-white text-slate-700'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}

export default function WorkerUploadPhotosPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { tasks, addPhoto, deletePhoto, updateTask } = useWorker()

  // Per-section uploading / error state
  const [afterUploading, setAfterUploading] = useState(false)
  const [afterError, setAfterError] = useState('')
  const [problemUploading, setProblemUploading] = useState(false)
  const [problemError, setProblemError] = useState('')

  const task = tasks.find((item) => item.id === id)

  if (!task) {
    return <Navigate to="/worker/" replace />
  }

  const requiredAfterPhotos = Math.max(1, task.standards.filter((s) => s.required).length)

  /**
   * Uploads an array of files for the given photo type sequentially.
   * Sequential (not parallel) to avoid overloading mobile network connections.
   */
  async function uploadFiles(type, files, setLoading, setError) {
    setError('')
    setLoading(true)
    try {
      for (const file of files) {
        await addPhoto(task.id, type, file)
      }
    } catch (err) {
      setError(err.message || 'Failed to upload photo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeletePhoto(type, photoId) {
    try {
      await deletePhoto(task.id, photoId, type)
    } catch {
      // Non-blocking: show nothing, photo stays in list
    }
  }

  return (
    <div className="space-y-5 px-4 py-5 pb-28">
      <header className="sticky top-0 z-10 -mx-4 space-y-4 border-b border-slate-200 bg-slate-50 px-4 pb-4 pt-1">
        <h1 className="font-[Manrope] text-2xl font-bold text-slate-900">{task.propertyName}</h1>
        <TaskTabs taskId={task.id} activeTab="Photos" />
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <TaskTimer startedAt={task.startedAt} endedAt={task.endedAt} status={task.status} />
        <p className="text-sm font-medium text-slate-700">
          Required: {Math.min(task.photos.after.length, requiredAfterPhotos)} of {requiredAfterPhotos} after photos uploaded
        </p>
      </div>

      {/* After Photos — required, one per cleaning standard */}
      <PhotoStagingTray
        title="After Photos"
        photos={task.photos.after}
        onUpload={(files) => uploadFiles('after', files, setAfterUploading, setAfterError)}
        onDelete={(photoId) => handleDeletePhoto('after', photoId)}
        uploading={afterUploading}
        error={afterError}
      />

      {/* Problem Photos — optional, for issues found during cleaning */}
      <PhotoStagingTray
        title="Problem Photos"
        photos={task.photos.problem}
        onUpload={(files) => uploadFiles('problem', files, setProblemUploading, setProblemError)}
        onDelete={(photoId) => handleDeletePhoto('problem', photoId)}
        uploading={problemUploading}
        error={problemError}
      >
        {/* Issue description textarea rendered inside the Problem section */}
        {typeof task.problemDescription === 'string' ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Describe the issue</label>
            <input
              type="text"
              value={task.problemDescription}
              onChange={(event) => updateTask(task.id, { problemDescription: event.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Example: broken lamp in living room"
            />
          </div>
        ) : null}
      </PhotoStagingTray>

      <div className="fixed bottom-20 left-0 right-0 z-20 border-t border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto w-full max-w-3xl">
          <button
            type="button"
            onClick={() => navigate(`/worker/tasks/${task.id}/submit`)}
            className="min-h-[44px] w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition-all active:scale-95"
          >
            Continue to Submit
          </button>
        </div>
      </div>
    </div>
  )
}

