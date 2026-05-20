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
const PropertyChecklist = require('../models/PropertyChecklist.model')
const User = require('../models/User.model')
const sendResponse = require('../utils/sendResponse')
const sendMail = require('../config/mail')

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
    // Create the task first; checklist items are derived from property template.
    const task = await Task.create({ ...req.body, createdBy: req.user._id })

    // Load the saved checklist template for this property.
    const propertyChecklist = await PropertyChecklist.findOne({ propertyId: task.propertyId })

    // Generate task-specific checklist items from the property template.
    if (propertyChecklist && Array.isArray(propertyChecklist.areas) && propertyChecklist.areas.length > 0) {
      const checklistItems = []

      propertyChecklist.areas.forEach((areaObj, areaIndex) => {
        const sortedItems = [...(areaObj.items || [])].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        sortedItems.forEach((item, itemIndex) => {
          checklistItems.push({
            taskId: task._id,
            propertyId: task.propertyId,
            area: areaObj.area,
            title: item.label,
            required: item.required,
            completed: false,
            sortOrder: areaIndex * 100 + itemIndex,
          })
        })
      })

      if (checklistItems.length > 0) {
        await ChecklistItem.insertMany(checklistItems)
      }
    }

    return sendResponse(res, 201, true, 'Task created', task)
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

    // Only assigned workers may submit this task.
    const isAssigned = (task.assignedWorkerIds || []).some(
      (id) => String(id) === String(req.user._id),
    )
    if (!isAssigned) {
      return sendResponse(res, 403, false, 'You are not assigned to this task')
    }

    // Count checklist completion
    const allItems      = await ChecklistItem.find({ taskId })
    const completedItems= allItems.filter(i => i.completed).length

    // Count distinct standards that have at least one proof photo.
    // Using Photo.distinct prevents duplicate uploads from inflating coverage.
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
      issueDescription: issueDescription || '',
      reviewStatus: 'pending_review',
      submittedAt: new Date(),
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
  } catch (err) {
    // Log full error to simplify production debugging of missing submissions.
    console.error('submitTask error:', err)
    next(err)
  }
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