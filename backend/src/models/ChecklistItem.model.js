/**
 * ChecklistItem.model.js
 * Represents a single checklist task within a cleaning job.
 * completedBy tracks which worker ticked each item (for multi-worker tasks).
 */
const mongoose = require('mongoose')

const checklistItemSchema = new mongoose.Schema({
  taskId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  propertyId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
  title:       { type: String, required: true },
  area:        { type: String, default: 'General' },
  required:    { type: Boolean, default: true },
  completed:   { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
  // Which worker ticked this item — null until completed.
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  note:        { type: String, default: '' },
  sortOrder:   { type: Number, default: 0 }
}, { timestamps: true })

module.exports = mongoose.model('ChecklistItem', checklistItemSchema)