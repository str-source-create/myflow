/**
 * WorkerStandardsPage.jsx
 * Shows manager reference standards and uploads worker proof photos to backend.
 * Proof photos show in a larger preview with lightbox support on tap.
 */
import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import PhotoLightbox from '../../components/PhotoLightbox'
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

function CameraPlaceholder() {
  return (
    <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-100 text-slate-500">
      <div className="text-center text-sm">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-200">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 7h3l2-2h4l2 2h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
        </div>
        Reference photo set by manager
      </div>
    </div>
  )
}

export default function WorkerStandardsPage() {
  const { id } = useParams()
  const { tasks, setStandardProofPhoto } = useWorker()
  // Lightbox for reference photos
  const [refLightbox, setRefLightbox] = useState(null)
  // Lightbox for proof photos
  const [proofLightbox, setProofLightbox] = useState(null)

  const task = tasks.find((item) => item.id === id)

  if (!task) {
    return <Navigate to="/worker/" replace />
  }

  const completed = task.standards.filter((standard) => standard.proofPhoto).length
  const total = task.standards.length

  return (
    <div className="space-y-5 px-4 py-5 pb-20">
      <header className="sticky top-0 z-10 -mx-4 space-y-4 border-b border-slate-200 bg-slate-50 px-4 pb-4 pt-1">
        <h1 className="font-[Manrope] text-2xl font-bold text-slate-900">{task.propertyName}</h1>
        <TaskTabs taskId={task.id} activeTab="Standards" />
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <TaskTimer startedAt={task.startedAt} endedAt={task.endedAt} status={task.status} />
        <p className="text-sm font-medium text-slate-700">
          {completed} of {total} standards have proof photos
        </p>
      </div>

      {task.standards.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
          No standards were assigned for this task.
        </div>
      ) : (
        <div className="space-y-3">
          {task.standards.map((standard) => (
            <article
              key={standard.id}
              className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-[Manrope] text-base font-semibold text-slate-900">{standard.areaName}</h2>
                {standard.required ? (
                  <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                    Required
                  </span>
                ) : null}
              </div>

              {standard.referencePhotoUrl ? (
                /* Reference photo — portrait 3:4 aspect ratio, tap to lightbox */
                <div className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100" style={{ aspectRatio: '3 / 4' }}>
                  <button
                    type="button"
                    onClick={() => setRefLightbox(standard.referencePhotoUrl)}
                    className="absolute inset-0 w-full h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    aria-label="View reference photo"
                  >
                    <img
                      src={standard.referencePhotoUrl}
                      alt={`${standard.areaName} reference`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                </div>
              ) : (
                <CameraPlaceholder />
              )}

              <p className="text-sm text-slate-600">{standard.instruction}</p>

              {standard.proofPhoto ? (
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setProofLightbox(standard.proofPhoto.url)}
                    className="block w-full overflow-hidden rounded-xl border border-green-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                    aria-label="View proof photo"
                  >
                    <img
                      src={standard.proofPhoto.url}
                      alt={`${standard.areaName} proof`}
                      className="h-28 w-full object-cover"
                    />
                  </button>
                  <p className="text-center text-xs font-semibold text-green-700">✓ Proof uploaded — tap to view</p>
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (!file) return
                        void setStandardProofPhoto(task.id, standard.id, file)
                        event.target.value = ''
                      }}
                    />
                    <span className="inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center rounded-xl border border-green-600 px-4 py-2.5 text-center text-sm font-semibold text-green-700 transition-all active:scale-95">
                      Replace Proof Photo
                    </span>
                  </label>
                </div>
              ) : (
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (!file) return
                      void setStandardProofPhoto(task.id, standard.id, file)
                      event.target.value = ''
                    }}
                  />
                  <span className="inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-center font-semibold text-white transition-all active:scale-95">
                    📷 Upload Proof Photo
                  </span>
                </label>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Reference photo lightbox */}
      {refLightbox && (
        <PhotoLightbox
          photos={[refLightbox]}
          index={0}
          onClose={() => setRefLightbox(null)}
          onIndex={() => {}}
        />
      )}

      {/* Proof photo lightbox */}
      {proofLightbox && (
        <PhotoLightbox
          photos={[proofLightbox]}
          index={0}
          onClose={() => setProofLightbox(null)}
          onIndex={() => {}}
        />
      )}
    </div>
  )
}
