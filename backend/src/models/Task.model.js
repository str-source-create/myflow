/**
 * Task.model.js
 * Stores assignment, scheduling, workflow status, and server-side timing metadata.
 */
const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema({
  title:            { type: String, required: true },
  propertyId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  assignedWorkerIds:[{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  date:             { type: String, required: true },
  startTime:        { type: String, required: true },
  endTime:          { type: String, required: true },
  taskType:         { type: String, enum: ['turnover', 'deep_cleaning', 'inspection', 'maintenance'], default: 'turnover' },
  priority:         { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status:           { type: String, enum: ['scheduled', 'in_progress', 'submitted', 'approved', 're_clean_needed'], default: 'scheduled' },
  // Server-managed timing fields used by worker stopwatch and admin reporting.
  startedAt:        { type: Date, default: null },
  endedAt:          { type: Date, default: null },
  durationSeconds:  { type: Number, default: null },
  managerNotes:     { type: String, default: '' },
  // taskLeadId — responsible for submitting the job.
  // Defaults to first assigned worker when null.
  taskLeadId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true })

module.exports = mongoose.model('Task', taskSchema)