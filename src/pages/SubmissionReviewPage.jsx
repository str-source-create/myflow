/**
 * SubmissionReviewPage.jsx
 * Admin submission review screen that loads real photos and proof evidence from API.
 * "Before" photos removed — only After and Problem photos are relevant.
 * Photos open in a full-screen lightbox on click.
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ConfirmModal from '../components/ConfirmModal'
import PhotoLightbox from '../components/PhotoLightbox'
import StatusBadge from '../components/StatusBadge'
import { useAdmin } from '../context/AdminContext'
import { apiRequest } from '../lib/api'

/**
 * SubmissionReviewPage loads a submission record, task evidence photos, and manager review controls.
 */
export default function SubmissionReviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { submissions, tasks, properties, approveSubmission, requestFix } = useAdmin()
  const [tab, setTab] = useState('after')
  const [lightbox, setLightbox] = useState(null) // { photos: string[], index: number }
  const [approveOpen, setApproveOpen] = useState(false)
  const [fixOpen, setFixOpen] = useState(false)
  const [fixReason, setFixReason] = useState('')
  const [toast, setToast] = useState('')
  const [photosByType, setPhotosByType] = useState({ before: [], after: [], problem: [], standard_proof: [] })
  const [photosLoading, setPhotosLoading] = useState(false)
  const [photosError, setPhotosError] = useState('')

  const submission = useMemo(() => submissions.find((item) => item.id === id), [submissions, id])
  const task = useMemo(
    () => tasks.find((item) => item.id === submission?.taskId),
    [tasks, submission],
  )
  const property = useMemo(
    () => properties.find((item) => item.id === task?.propertyId),
    [properties, task],
  )

  /**
   * Loads persisted task photos by type so review survives refresh.
   */
  useEffect(() => {
    void (async () => {
      if (!task?.id) return

      setPhotosLoading(true)
      setPhotosError('')
      try {
        const res = await apiRequest(`/photos/task/${task.id}`, {}, 'admin')
        setPhotosByType({
          before: res.data?.before || [],
          after: res.data?.after || [],
          problem: res.data?.problem || [],
          standard_proof: res.data?.standard_proof || [],
        })
      } catch (err) {
        setPhotosError(err.message || 'Failed to load submission photos.')
      } finally {
        setPhotosLoading(false)
      }
    })()
  }, [task?.id])

  const proofByStandardId = useMemo(() => {
    return new Map(
      (photosByType.standard_proof || [])
        .filter((photo) => photo.standardId)
        .map((photo) => [String(photo.standardId), photo]),
    )
  }, [photosByType.standard_proof])

  const readOnly = submission?.reviewStatus !== 'pending_review'

  if (!submission || !task) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">Submission not found.</div>
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-[Manrope] text-2xl font-bold text-slate-900">Submission Review</h1>
        <StatusBadge status={submission.reviewStatus} />
      </div>

      {toast ? <p className="text-sm font-medium text-green-600">{toast}</p> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-[Manrope] text-lg font-bold text-slate-900">Task Info</h2>
          <p className="text-sm text-slate-700">Property: {submission.propertyName}</p>
          <p className="text-sm text-slate-700">Date: {submission.date}</p>
          <p className="text-sm text-slate-700">Worker: {submission.workerName}</p>
          <p className="text-sm text-slate-700">Checklist: {submission.checklistCompleted}/{submission.checklistTotal}</p>
          <p className="text-sm text-slate-700">Notes: {submission.cleanerNotes}</p>
          {task.startedAt ? (
            <div className="space-y-1 text-sm text-slate-600">
              <p>Started: {new Date(task.startedAt).toLocaleTimeString()}</p>
              {task.endedAt ? <p>Ended: {new Date(task.endedAt).toLocaleTimeString()}</p> : null}
              {task.durationSeconds ? (
                <p className="font-medium">
                  Total: {Math.floor(task.durationSeconds / 3600)}h {Math.floor((task.durationSeconds % 3600) / 60)}m
                </p>
              ) : null}
            </div>
          ) : null}
          {submission.issueFound ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
              Issue: {submission.issueDescription}
            </p>
          ) : null}
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-[Manrope] text-lg font-bold text-slate-900">Photos</h2>
          <div className="flex gap-2">
            {['after', 'problem'].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value)}
                className={`min-h-[44px] rounded-xl px-4 py-2.5 text-sm font-semibold ${
                  tab === value ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-600'
                }`}
              >
                {value}
              </button>
            ))}
          </div>

          {photosLoading ? <p className="text-sm text-slate-500">Loading photos...</p> : null}
          {photosError ? <p className="text-sm font-medium text-red-600">{photosError}</p> : null}

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(photosByType[tab] || []).map((photo, idx) => (
              <button
                key={photo._id}
                type="button"
                onClick={() =>
                  setLightbox({
                    photos: (photosByType[tab] || []).map((p) => p.photoUrl),
                    index: idx,
                  })
                }
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <img src={photo.photoUrl} alt={photo._id} className="h-24 w-full rounded-xl object-cover" />
              </button>
            ))}
          </div>

          {!photosLoading && !(photosByType[tab] || []).length ? (
            <p className="text-sm text-slate-500">No {tab} photos uploaded.</p>
          ) : null}
        </section>
      </div>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-[Manrope] text-lg font-bold text-slate-900">Standards Proof Comparison</h2>
        {(property?.standards || []).map((standard) => {
          const refUrl = standard.referencePhotoUrl
          const proofUrl = proofByStandardId.get(String(standard.id))?.photoUrl
          return (
            <div key={standard.id} className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reference</p>
                {refUrl ? (
                  <button
                    type="button"
                    onClick={() => setLightbox({ photos: [refUrl], index: 0 })}
                    className="mt-1 block w-full overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <img
                      src={refUrl}
                      alt={`${standard.areaName} reference`}
                      className="h-24 w-full object-cover"
                    />
                  </button>
                ) : (
                  <div className="mt-1 h-24 rounded-xl border border-dashed border-slate-300 bg-slate-50" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cleaner Proof</p>
                {proofUrl ? (
                  <button
                    type="button"
                    onClick={() => setLightbox({ photos: [proofUrl], index: 0 })}
                    className="mt-1 block w-full overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <img
                      src={proofUrl}
                      alt={`${standard.areaName} proof`}
                      className="h-24 w-full object-cover"
                    />
                  </button>
                ) : (
                  <div className="mt-1 h-24 rounded-xl border border-dashed border-slate-300 bg-slate-50" />
                )}
              </div>
              <p className="text-sm text-slate-600 sm:col-span-2">{standard.areaName}</p>
            </div>
          )
        })}
      </section>

      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white p-3 md:left-60">
        {readOnly ? (
          <p className="text-sm text-slate-600">
            Reviewed by {submission.reviewMeta?.reviewedBy || 'Admin'} at {submission.reviewMeta?.reviewedAt || 'n/a'}
          </p>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFixOpen(true)}
              className="min-h-[44px] w-full rounded-xl bg-amber-500 px-4 py-2.5 font-semibold text-white"
            >
              Request Fix
            </button>
            <button
              type="button"
              onClick={() => setApproveOpen(true)}
              className="min-h-[44px] w-full rounded-xl bg-green-600 px-4 py-2.5 font-semibold text-white"
            >
              Approve
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        open={approveOpen}
        title="Approve Submission"
        message="Approve this cleaning submission?"
        confirmLabel="Approve"
        onCancel={() => setApproveOpen(false)}
        onConfirm={() => {
          approveSubmission(submission.id)
          setApproveOpen(false)
          setToast('Submission approved successfully.')
          setTimeout(() => navigate('/admin/submissions'), 800)
        }}
      />

      {fixOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="font-[Manrope] text-xl font-bold text-slate-900">Request Fix</h3>
            <textarea
              value={fixReason}
              onChange={(event) => setFixReason(event.target.value)}
              rows={4}
              className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-base"
              placeholder="Enter reason for re-clean"
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setFixOpen(false)}
                className="min-h-[44px] w-full rounded-xl bg-slate-100 px-4 py-2.5 font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!fixReason.trim()) return
                  requestFix(submission.id, fixReason)
                  setFixOpen(false)
                  setToast('Fix request sent.')
                  setTimeout(() => navigate('/admin/submissions'), 800)
                }}
                className="min-h-[44px] w-full rounded-xl bg-amber-500 px-4 py-2.5 font-semibold text-white"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Photo lightbox */}
      {lightbox && (
        <PhotoLightbox
          photos={lightbox.photos}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onIndex={(idx) => setLightbox((prev) => ({ ...prev, index: idx }))}
        />
      )}
    </div>
  )
}
