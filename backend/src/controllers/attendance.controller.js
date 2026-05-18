/**
 * attendance.controller.js
 * Handles worker clock in/out and admin attendance reporting.
 * All clock timestamps are generated on the server.
 */
const Attendance = require('../models/Attendance.model')
const User = require('../models/User.model')
const sendResponse = require('../utils/sendResponse')

/**
 * Returns today's server date in YYYY-MM-DD format.
 */
function getServerDateKey() {
  return new Date().toISOString().split('T')[0]
}

/**
 * Converts active clock-in records from previous days to missed_clock_out.
 * This keeps attendance status consistent for admin views.
 */
async function markMissedClockOuts() {
  const today = getServerDateKey()
  await Attendance.updateMany(
    { status: 'clocked_in', date: { $lt: today } },
    { $set: { status: 'missed_clock_out' } },
  )
}

/**
 * Worker clock-in endpoint.
 * Prevents duplicate clock-in and does not trust client timestamps.
 */
exports.clockIn = async (req, res, next) => {
  try {
    const today = getServerDateKey()
    const existing = await Attendance.findOne({ workerId: req.user._id, date: today })

    if (existing?.status === 'clocked_in') {
      return sendResponse(res, 400, false, 'Already clocked in for today')
    }

    if (existing?.status === 'clocked_out') {
      return sendResponse(res, 400, false, 'Shift already completed for today')
    }

    const record = await Attendance.findOneAndUpdate(
      { workerId: req.user._id, date: today },
      {
        workerId: req.user._id,
        workerName: req.user.name,
        date: today,
        clockInAt: new Date(),
        clockOutAt: null,
        totalWorkedMinutes: null,
        notes: '',
        status: 'clocked_in',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )

    return sendResponse(res, 200, true, 'Clock in recorded', record)
  } catch (err) {
    next(err)
  }
}

/**
 * Worker clock-out endpoint.
 * Uses server current time and computes total worked minutes.
 */
exports.clockOut = async (req, res, next) => {
  try {
    const today = getServerDateKey()
    const record = await Attendance.findOne({ workerId: req.user._id, date: today })

    if (!record || record.status !== 'clocked_in' || !record.clockInAt) {
      return sendResponse(res, 400, false, 'Not clocked in for today')
    }

    const clockOutAt = new Date()
    const totalWorkedMinutes = Math.max(0, Math.round((clockOutAt - record.clockInAt) / 60000))

    record.clockOutAt = clockOutAt
    record.status = 'clocked_out'
    record.notes = req.body?.notes || ''
    record.totalWorkedMinutes = totalWorkedMinutes
    await record.save()

    return sendResponse(res, 200, true, 'Clock out recorded', record)
  } catch (err) {
    next(err)
  }
}

/**
 * Returns the current worker's attendance record for today.
 */
exports.getMyToday = async (req, res, next) => {
  try {
    const today = getServerDateKey()
    const record = await Attendance.findOne({ workerId: req.user._id, date: today })
    return sendResponse(res, 200, true, 'Today attendance fetched', record)
  } catch (err) {
    next(err)
  }
}

/**
 * Returns current worker attendance history.
 */
exports.getMyHistory = async (req, res, next) => {
  try {
    await markMissedClockOuts()
    const records = await Attendance.find({ workerId: req.user._id }).sort({ date: -1 })
    return sendResponse(res, 200, true, 'Attendance history fetched', records)
  } catch (err) {
    next(err)
  }
}

/**
 * Admin list endpoint with optional filters.
 */
exports.getAll = async (req, res, next) => {
  try {
    await markMissedClockOuts()
    const filter = {}
    if (req.query.date) filter.date = req.query.date
    if (req.query.workerId) filter.workerId = req.query.workerId
    if (req.query.status) filter.status = req.query.status

    const records = await Attendance.find(filter)
      .populate('workerId', 'name email')
      .sort({ date: -1, createdAt: -1 })

    return sendResponse(res, 200, true, 'Attendance records fetched', records)
  } catch (err) {
    next(err)
  }
}

/**
 * Admin endpoint for all attendance records today.
 */
exports.getToday = async (req, res, next) => {
  try {
    await markMissedClockOuts()
    const today = getServerDateKey()
    const records = await Attendance.find({ date: today })
      .populate('workerId', 'name email')
      .sort({ createdAt: -1 })

    return sendResponse(res, 200, true, 'Today attendance fetched', records)
  } catch (err) {
    next(err)
  }
}

/**
 * Admin endpoint for one worker's attendance history.
 */
exports.getByWorker = async (req, res, next) => {
  try {
    await markMissedClockOuts()
    const records = await Attendance.find({ workerId: req.params.workerId }).sort({ date: -1 })
    return sendResponse(res, 200, true, 'Worker attendance fetched', records)
  } catch (err) {
    next(err)
  }
}

/**
 * Admin correction endpoint for attendance records.
 */
exports.updateRecord = async (req, res, next) => {
  try {
    const allowedFields = ['clockInAt', 'clockOutAt', 'status', 'notes', 'totalWorkedMinutes']
    const payload = {}

    for (const key of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        payload[key] = req.body[key]
      }
    }

    const record = await Attendance.findByIdAndUpdate(req.params.id, payload, { new: true })
    if (!record) return sendResponse(res, 404, false, 'Attendance record not found')

    return sendResponse(res, 200, true, 'Attendance record updated', record)
  } catch (err) {
    next(err)
  }
}
