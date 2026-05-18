/**
 * task.controller.js
 * Handles admin/worker task lifecycle including checklist generation,
 * submission metrics, and server-side timer persistence.
 */
const Task = require('../models/Task.model')
const ChecklistItem = require('../models/ChecklistItem.model')
const Submission = require('../models/Submission.model')
const Photo = require('../models/Photo.model')
const Standard = require('../models/Standard.model')
const User = require('../models/User.model')
const sendResponse = require('../utils/sendResponse')
const sendMail = require('../config/mail')

const DEFAULT_CHECKLIST = [
  { area: 'Kitchen',  title: 'Countertops cleaned',       required: true,  sortOrder: 1 },
  { area: 'Kitchen',  title: 'Sink cleaned',              required: true,  sortOrder: 2 },
  { area: 'Kitchen',  title: 'Fridge checked',            required: true,  sortOrder: 3 },
  { area: 'Kitchen',  title: 'Microwave cleaned',         required: true,  sortOrder: 4 },
  { area: 'Kitchen',  title: 'Trash removed',             required: true,  sortOrder: 5 },
  { area: 'Bathroom', title: 'Toilet cleaned',            required: true,  sortOrder: 6 },
  { area: 'Bathroom', title: 'Shower/tub cleaned',        required: true,  sortOrder: 7 },
  { area: 'Bathroom', title: 'Sink cleaned',              required: true,  sortOrder: 8 },
  { area: 'Bathroom', title: 'Mirror cleaned',            required: true,  sortOrder: 9 },
  { area: 'Bathroom', title: 'Towels placed',             required: true,  sortOrder: 10 },
  { area: 'Bathroom', title: 'Supplies restocked',        required: true,  sortOrder: 11 },
  { area: 'Bedroom',  title: 'Beds made',                 required: true,  sortOrder: 12 },
  { area: 'Bedroom',  title: '2 pillows placed',          required: true,  sortOrder: 13 },
  { area: 'Bedroom',  title: 'Floors cleaned',            required: true,  sortOrder: 14 },
  { area: 'Living',   title: 'Sofa arranged',             required: true,  sortOrder: 15 },
  { area: 'Living',   title: 'Tables cleaned',            required: true,  sortOrder: 16 },
  { area: 'Living',   title: 'Floors vacuumed',           required: true,  sortOrder: 17 },
  { area: 'Basement', title: 'Pool table cleaned',        required: false, sortOrder: 18 },
  { area: 'Basement', title: 'Cabinet organized',         required: false, sortOrder: 19 },
  { area: 'Final',    title: 'All lights checked',        required: true,  sortOrder: 20 },
  { area: 'Final',    title: 'Keys returned to cabinet',  required: true,  sortOrder: 21 },
  { area: 'Final',    title: 'Property is guest-ready',   required: true,  sortOrder: 22 },
]

exports.getTasks = async (req, res, next) => {
  try {
    const filter = {}
    if (req.query.date)   filter.date = req.query.date
    // Range filter used by weekly calendar view.
    if (req.query.startDate && req.query.endDate) {
      filter.date = { $gte: req.query.startDate, $lte: req.query.endDate }
    }
    if (req.query.status) filter.status = req.query.status
    const tasks = await Task.find(filter)
      .populate('propertyId', 'name address')
      .populate('assignedWorkerIds', 'name email')
      .sort({ date: -1, startTime: 1 })
    return sendResponse(res, 200, true, 'Tasks fetched', tasks)
  } catch (err) { next(err) }
}

exports.getMyTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ assignedWorkerIds: req.user._id })
      .populate('propertyId', 'name address wifiName wifiPassword gpsLocation accessNotes importantNotes')
      .sort({ date: -1, startTime: 1 })
    return sendResponse(res, 200, true, 'My tasks fetched', tasks)
  } catch (err) { next(err) }
}

exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('propertyId')
      .populate('assignedWorkerIds', 'name email')
    if (!task) return sendResponse(res, 404, false, 'Task not found')
    return sendResponse(res, 200, true, 'Task fetched', task)
  } catch (err) { next(err) }
}

exports.createTask = async (req, res, next) => {
  try {
    const task = await Task.create({ ...req.body, createdBy: req.user._id })

    // Supports custom checklist builders while preserving a fallback template.
    const requestedChecklist = Array.isArray(req.body.checklistItems) && req.body.checklistItems.length
      ? req.body.checklistItems
      : DEFAULT_CHECKLIST

    // Auto-create checklist items for this task.
    const checklistItems = requestedChecklist.map((item, index) => ({
      ...item,
      title: item.title || item.label,
      sortOrder: Number.isFinite(Number(item.sortOrder)) ? Number(item.sortOrder) : index + 1,
      taskId: task._id,
      propertyId: task.propertyId
    }))
    await ChecklistItem.insertMany(checklistItems)

    return sendResponse(res, 201, true, 'Task created with checklist', task)
  } catch (err) { next(err) }
}

exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!task) return sendResponse(res, 404, false, 'Task not found')
    return sendResponse(res, 200, true, 'Task updated', task)
  } catch (err) { next(err) }
}

exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id)
    if (!task) return sendResponse(res, 404, false, 'Task not found')
    await ChecklistItem.deleteMany({ taskId: req.params.id })
    return sendResponse(res, 200, true, 'Task deleted')
  } catch (err) { next(err) }
}

exports.startTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        status: 'in_progress',
        // Server-side start timestamp for stopwatch accuracy after refresh.
        startedAt: new Date(),
        endedAt: null,
        durationSeconds: null,
      },
      { new: true }
    )
    if (!task) return sendResponse(res, 404, false, 'Task not found')
    return sendResponse(res, 200, true, 'Task started', task)
  } catch (err) { next(err) }
}

exports.submitTask = async (req, res, next) => {
  try {
    const { cleanerNotes, issueFound, issueDescription } = req.body
    const taskId = req.params.id

    const task = await Task.findById(taskId).populate('propertyId', 'name')
    if (!task) return sendResponse(res, 404, false, 'Task not found')

    // Count checklist completion
    const allItems      = await ChecklistItem.find({ taskId })
    const completedItems= allItems.filter(i => i.completed).length

    // Count distinct standards that have at least one proof photo.
    // Using Photo.distinct instead of countDocuments prevents a worker uploading
    // multiple photos for the same standard from inflating the count.
    const standards = await Standard.find({ propertyId: task.propertyId._id })
    const coveredStandardIds = await Photo.distinct('standardId', {
      taskId,
      photoType: 'standard_proof',
      standardId: { $ne: null },
    })
    const standardProofPhotos = coveredStandardIds.length

    // Create submission record
    const submission = await Submission.create({
      taskId,
      propertyId: task.propertyId._id,
      workerId: req.user._id,
      checklistCompleted: completedItems,
      checklistTotal: allItems.length,
      standardPhotosUploaded: standardProofPhotos,
      standardPhotosTotal: standards.length,
      cleanerNotes: cleanerNotes || '',
      issueFound: issueFound || false,
      issueDescription: issueDescription || ''
    })

    const endedAt = new Date()
    const durationSeconds = task.startedAt
      ? Math.max(0, Math.floor((endedAt - new Date(task.startedAt)) / 1000))
      : null

    // Update task status and persist server-side timing information.
    const updatedTask = await Task.findByIdAndUpdate(taskId, {
      status: 'submitted',
      endedAt,
      durationSeconds,
    }, { new: true })

    // Notify admin by email
    await sendMail({
      to: process.env.EMAIL_USER,
      subject: `New Submission Ready for Review — ${task.title}`,
      html: `
        <h2>New Submission Ready</h2>
        <p><strong>Task:</strong> ${task.title}</p>
        <p><strong>Property:</strong> ${task.propertyId.name}</p>
        <p><strong>Worker:</strong> ${req.user.name}</p>
        <p><strong>Checklist:</strong> ${completedItems} / ${allItems.length} completed</p>
        <p><strong>Notes:</strong> ${cleanerNotes || 'None'}</p>
        <p>Log in to review: ${process.env.FRONTEND_URL}/admin/submissions/${submission._id}</p>
      `
    })

    return sendResponse(res, 200, true, 'Task submitted successfully', { submission, task: updatedTask })
  } catch (err) { next(err) }
}

exports.approveTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id, { status: 'approved' }, { new: true }
    ).populate('assignedWorkerIds', 'name email')
    if (!task) return sendResponse(res, 404, false, 'Task not found')

    await Submission.findOneAndUpdate(
      { taskId: req.params.id },
      { reviewStatus: 'approved', reviewedBy: req.user._id, reviewedAt: new Date() }
    )

    // Increment tasksCompleted for each assigned worker
    for (const workerId of task.assignedWorkerIds) {
      await User.findByIdAndUpdate(workerId, { $inc: { tasksCompleted: 1 } })
    }

    return sendResponse(res, 200, true, 'Task approved', task)
  } catch (err) { next(err) }
}

exports.requestFix = async (req, res, next) => {
  try {
    const { reason } = req.body
    const task = await Task.findByIdAndUpdate(
      req.params.id, { status: 're_clean_needed' }, { new: true }
    ).populate('assignedWorkerIds', 'name email')
    if (!task) return sendResponse(res, 404, false, 'Task not found')

    await Submission.findOneAndUpdate(
      { taskId: req.params.id },
      { reviewStatus: 'rejected', managerFeedback: reason || '', reviewedBy: req.user._id, reviewedAt: new Date() }
    )

    // Notify each assigned worker
    for (const worker of task.assignedWorkerIds) {
      await sendMail({
        to: worker.email,
        subject: `Fix Requested — ${task.title}`,
        html: `
          <h2>A fix has been requested for your submission</h2>
          <p><strong>Task:</strong> ${task.title}</p>
          <p><strong>Manager feedback:</strong> ${reason || 'Please review and re-clean.'}</p>
          <p>Log in to see details: ${process.env.FRONTEND_URL}/worker/login</p>
        `
      })
    }

    return sendResponse(res, 200, true, 'Fix requested', task)
  } catch (err) { next(err) }
}