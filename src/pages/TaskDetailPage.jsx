/**
 * TaskDetailPage.jsx
 * Source file for the cleanflow application.
 */

import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ConfirmModal from '../components/ConfirmModal'
import StatusBadge from '../components/StatusBadge'
import { useAdmin } from '../context/AdminContext'
import { formatTime } from '../utils/timezone'

export default function TaskDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { tasks, workers, submissions, updateTask, deleteTask } = useAdmin()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)

  const task = useMemo(() => tasks.find((item) => item.id === id), [tasks, id])
  const [editForm, setEditForm] = useState({ date: task?.date || '', startTime: task?.startTime || '', endTime: task?.endTime || '', assignedWorkerIds: task?.assignedWorkerIds || [] })

  if (!task) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">Task not found.</div>
  }

  const assignedWorkers = task.assignedWorkerIds
    .map((workerId) => workers.find((worker) => worker.id === workerId)?.name)
    .filter(Boolean)

  const linkedSubmission = submissions.find((submission) => submission.taskId === task.id)

  function toggleWorker(workerId) {
    setEditForm((prev) => ({
      ...prev,
      assignedWorkerIds: prev.assignedWorkerIds.includes(workerId)
        ? prev.assignedWorkerIds.filter((idItem) => idItem !== workerId)
        : [...prev.assignedWorkerIds, workerId],
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-[Manrope] text-2xl font-bold text-slate-900">{task.title}</h1>
        <StatusBadge status={task.status} />
      </div>

      <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <Row label="Property" value={task.propertyName} />
        <Row label="Date" value={task.date} />
        <Row label="Time" value={`${task.startTime} - ${task.endTime}`} />
        <Row label="Assigned Workers" value={assignedWorkers.join(', ') || 'None'} />
        <Row label="Priority" value={task.priority} />
        <Row label="Type" value={task.taskType} />
        <Row label="Manager Notes" value={task.managerNotes || '-'} />
        <Row label="Status History" value={`${task.status} • ${task.statusChangedAt || 'n/a'}`} />
        {task.startedAt ? (
          <div className="space-y-1 text-sm text-slate-600">
            {/* Show server timestamps in the configured app timezone. */}
            <p>Started: {formatTime(task.startedAt)}</p>
            {task.endedAt ? <p>Ended: {formatTime(task.endedAt)}</p> : null}
            {task.durationSeconds ? (
              <p className="font-medium">
                Total: {Math.floor(task.durationSeconds / 3600)}h {Math.floor((task.durationSeconds % 3600) / 60)}m
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      {task.status === 'submitted' && linkedSubmission ? (
        <button
          type="button"
          onClick={() => navigate(`/admin/submissions/${linkedSubmission.id}`)}
          className="min-h-[44px] rounded-xl bg-amber-500 px-4 py-2.5 font-semibold text-white"
        >
          Review Submission
        </button>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setEditMode((prev) => !prev)}
          className="min-h-[44px] rounded-xl border border-blue-600 px-4 py-2.5 font-semibold text-blue-600"
        >
          {editMode ? 'Close Edit' : 'Edit Task'}
        </button>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="min-h-[44px] rounded-xl bg-red-600 px-4 py-2.5 font-semibold text-white"
        >
          Delete Task
        </button>
      </div>

      {editMode ? (
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-[Manrope] text-lg font-bold text-slate-900">Quick Edit</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-sm text-slate-700">Date</span>
              <input type="date" value={editForm.date} onChange={(event) => setEditForm((prev) => ({ ...prev, date: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-slate-700">Start</span>
              <input type="time" value={editForm.startTime} onChange={(event) => setEditForm((prev) => ({ ...prev, startTime: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-slate-700">End</span>
              <input type="time" value={editForm.endTime} onChange={(event) => setEditForm((prev) => ({ ...prev, endTime: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base" />
            </label>
          </div>

          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-sm font-medium text-slate-700">Workers</p>
            {workers.filter((worker) => worker.active).map((worker) => (
              <label key={worker.id} className="mt-2 flex min-h-[44px] items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={editForm.assignedWorkerIds.includes(worker.id)} onChange={() => toggleWorker(worker.id)} className="h-5 w-5" />
                {worker.name}
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              updateTask(task.id, editForm)
              setEditMode(false)
            }}
            className="min-h-[44px] rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white"
          >
            Save Task Changes
          </button>
        </section>
      ) : null}

      <ConfirmModal
        open={deleteOpen}
        title="Delete Task"
        message="Are you sure you want to delete this task?"
        confirmLabel="Delete"
        confirmDanger
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          deleteTask(task.id)
          setDeleteOpen(false)
          navigate('/admin/tasks')
        }}
      />
    </div>
  )
}

function Row({ label, value }) {
  return (
    <p className="text-sm text-slate-700">
      <span className="font-semibold text-slate-900">{label}: </span>
      {value}
    </p>
  )
}

