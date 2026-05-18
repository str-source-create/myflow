/**
 * Submission.model.js
 * Source file for the cleanflow application.
 */

const mongoose = require('mongoose')

const submissionSchema = new mongoose.Schema({
  taskId:                 { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  propertyId:             { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
  workerId:               { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  checklistCompleted:     { type: Number, default: 0 },
  checklistTotal:         { type: Number, default: 0 },
  standardPhotosUploaded: { type: Number, default: 0 },
  standardPhotosTotal:    { type: Number, default: 0 },
  cleanerNotes:           { type: String, default: '' },
  issueFound:             { type: Boolean, default: false },
  issueDescription:       { type: String, default: '' },
  reviewStatus:           { type: String, enum: ['pending_review', 'approved', 'rejected'], default: 'pending_review' },
  reviewedBy:             { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt:             { type: Date, default: null },
  managerFeedback:        { type: String, default: '' },
  submittedAt:            { type: Date, default: Date.now }
}, { timestamps: true })

module.exports = mongoose.model('Submission', submissionSchema)
