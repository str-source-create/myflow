/**
 * WorkerSubmitPage.jsx
 * Final worker submission step with validation and persisted task submit action.
 * Feature 5: Collaborators are blocked from submitting — only the task lead can submit.
 */
import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import TaskTimer from '../components/TaskTimer'
import { useWorker } from '../context/WorkerContext'

export default function WorkerSubmitPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { tasks, updateTask, submitTask, currentUser } = useWorker()

  const task = tasks.find((item) => item.id === id)

  const [confirmGuestReady, setConfirmGuestReady] = useState(false)
  const [confirmKeysReturned, setConfirmKeysReturned] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!task) {
    return <Navigate to="/worker/" replace />
  }

  /**
   * True if this worker is the task lead (or if no lead is set — single-worker task).
   */
  const isLead = !task.taskLeadId || task.taskLeadId === currentUser?.id

  /** Name of the lead worker, used in the collaborator blocked message. */
  const leadName =
    task.assignedWorkerNames?.find((w) => w.id === task.taskLeadId)?.name || 'the task lead'

  // Block collaborators from seeing the submit form entirely
  if (!isLead) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center space-y-4 px-4 py-12 text-center">
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-8 shadow-sm">
          <p className="font-[Manrope] text-xl font-bold text-blue-900">You are a collaborator</p>
          <p className="mt-2 text-sm text-blue-700">
            Only <strong>{leadName}</strong> can submit this task.
            <br />
            Make sure you've completed your checklist items and your portion of the work!
          </p>
          <button
            type="button"
            onClick={() => navigate(`/worker/tasks/${task.id}`)}
            className="mt-6 min-h-[44px] w-full rounded-xl border border-blue-600 px-4 py-2.5 font-semibold text-blue-600"
          >
            Back to Task
          </button>
        </div>
      </div>
    )
  }

  const requiredChecklistTotal = task.checklistItems.filter((item) => item.required).length
  const requiredChecklistCompleted = task.checklistItems.filter((item) => item.required && item.completed).length

  const requiredStandardsTotal = task.standards.filter((item) => item.required).length
  const requiredStandardsUploaded = task.standards.filter((item) => item.required && item.proofPhoto).length

  const requiredAfterPhotos = Math.max(1, requiredStandardsTotal)
  const uploadedAfterPhotos = task.photos.after.length

  const canSubmit =
    uploadedAfterPhotos >= requiredAfterPhotos &&
    requiredStandardsUploaded === requiredStandardsTotal &&
    requiredChecklistCompleted === requiredChecklistTotal &&
    confirmGuestReady &&
    confirmKeysReturned

  const disabledReason = useMemo(() => {
    if (uploadedAfterPhotos < requiredAfterPhotos) {
      return 'Upload required after photos before submitting.'
    }

    if (requiredStandardsUploaded !== requiredStandardsTotal) {
      return 'Upload required standards proof photos before submitting.'
    }

    if (requiredChecklistCompleted !== requiredChecklistTotal) {
      return 'Complete all required checklist items before submitting.'
    }

    if (!confirmGuestReady || !confirmKeysReturned) {
      return 'Tick both confirmations before submitting.'
    }

    return ''
  }, [requiredChecklistCompleted, requiredChecklistTotal, confirmGuestReady, confirmKeysReturned])

  /**
   * Persists task submission with cleaner notes and optional issue details.
   */
  async function handleSubmitConfirm() {
    setError('')
    setSubmitting(true)
    try {
      await submitTask(task.id, {
        cleanerNotes: task.notes,
        issueFound: Boolean(task.problemDescription?.trim()),
        issueDescription: task.problemDescription || '',
      })
      setShowModal(false)
      setShowSuccess(true)

      setTimeout(() => {
        navigate('/worker/', { replace: true })
      }, 2000)
    } catch (err) {
      setError(err.message || 'Failed to submit task.')
    } finally {
      setSubmitting(false)
    }
  }

  if (showSuccess) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-5 pb-24 text-center">
        <div className="mb-4 flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-green-100 text-green-700">
          <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 7 9 18l-5-5" />
          </svg>
        </div>
        <h1 className="font-[Manrope] text-2xl font-bold text-slate-900">Job submitted! Great work.</h1>
      </div>
    )
  }

  return (
    <div className="space-y-5 px-4 py-5 pb-24">
      <h1 className="font-[Manrope] text-2xl font-bold text-slate-900">Ready to Submit?</h1>

      <TaskTimer startedAt={task.startedAt} endedAt={task.endedAt} status={task.status} />

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <SummaryRow
          ok={requiredChecklistCompleted === requiredChecklistTotal}
          label={`All required checklist items completed (${requiredChecklistCompleted} / ${requiredChecklistTotal})`}
        />
        <SummaryRow
          ok={uploadedAfterPhotos >= requiredAfterPhotos}
          label={`Required proof photos uploaded (${Math.min(uploadedAfterPhotos, requiredAfterPhotos)} / ${requiredAfterPhotos})`}
        />
        <SummaryRow
          ok={requiredStandardsUploaded === requiredStandardsTotal}
          label={`Standards proof photos uploaded (${requiredStandardsUploaded} / ${requiredStandardsTotal})`}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="mb-1 block text-sm font-medium text-slate-700">Any final notes or issues?</label>
        <textarea
          value={task.notes}
          onChange={(event) => updateTask(task.id, { notes: event.target.value })}
          rows={4}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Add final notes"
        />
      </section>

      <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-3">
          <input
            type="checkbox"
            checked={confirmGuestReady}
            onChange={(event) => setConfirmGuestReady(event.target.checked)}
            className="h-6 w-6 rounded border-slate-300 text-blue-600"
          />
          <span className="text-sm text-slate-800">I confirm the property is guest-ready</span>
        </label>

        <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-3">
          <input
            type="checkbox"
            checked={confirmKeysReturned}
            onChange={(event) => setConfirmKeysReturned(event.target.checked)}
            className="h-6 w-6 rounded border-slate-300 text-blue-600"
          />
          <span className="text-sm text-slate-800">I confirm the keys were returned to the correct location</span>
        </label>
      </section>

      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => setShowModal(true)}
        className={`min-h-[44px] w-full rounded-xl px-4 py-3 font-semibold transition-all ${
          canSubmit ? 'bg-blue-600 text-white active:scale-95' : 'bg-slate-300 text-slate-500'
        }`}
      >
        Submit Job
      </button>

      {!canSubmit && disabledReason ? <p className="text-sm text-red-600">{disabledReason}</p> : null}
      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

      {showModal ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="font-[Manrope] text-xl font-bold text-slate-900">Are you sure you want to submit?</h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="min-h-[44px] rounded-xl bg-slate-100 px-4 py-3 font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitConfirm}
                className="min-h-[44px] rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white"
              >
                {submitting ? 'Submitting...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function SummaryRow({ ok, label }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={ok ? 'text-green-600' : 'text-red-600'}>{ok ? 'OK' : 'NO'}</span>
      <span className="text-slate-700">{label}</span>
    </div>
  )
}
