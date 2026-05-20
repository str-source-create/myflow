/**
 * PropertyChecklist model
 *
 * Stores the permanent cleaning checklist template for a property.
 * Each property has exactly ONE checklist (one-to-one relationship).
 *
 * When a cleaning task is created for a property, the system
 * automatically copies this template into individual ChecklistItem
 * documents for that task. Workers then tick those task-specific items.
 *
 * Admin edits this template and future tasks get the updated checklist.
 * Existing task checklists are not affected when template is updated.
 */
const mongoose = require('mongoose')
const { Schema } = mongoose

const checklistItemSchema = new Schema({
  label: { type: String, required: true, trim: true },
  required: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
}, { _id: true })

const checklistAreaSchema = new Schema({
  area: { type: String, required: true, trim: true },
  sortOrder: { type: Number, default: 0 },
  items: [checklistItemSchema],
}, { _id: true })

const propertyChecklistSchema = new Schema({
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
    unique: true,
  },
  areas: [checklistAreaSchema],
}, { timestamps: true })

module.exports = mongoose.model('PropertyChecklist', propertyChecklistSchema)
