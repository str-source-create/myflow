/**
 * Attendance.model.js
 * Stores one attendance record per worker per day.
 * Server-side timestamps are used to avoid client clock manipulation.
 */
const mongoose = require('mongoose')

const { Schema } = mongoose

const attendanceSchema = new Schema(
  {
    workerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    workerName: { type: String, default: '' },
    date: { type: String, required: true },
    clockInAt: { type: Date, default: null },
    clockOutAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['not_started', 'clocked_in', 'clocked_out', 'missed_clock_out'],
      default: 'not_started',
    },
    notes: { type: String, default: '' },
    totalWorkedMinutes: { type: Number, default: null },
  },
  { timestamps: true },
)

// One record per worker per day.
attendanceSchema.index({ workerId: 1, date: 1 }, { unique: true })

module.exports = mongoose.model('Attendance', attendanceSchema)
