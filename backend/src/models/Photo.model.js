/**
 * Photo.model.js
 * Stores uploaded task and standards evidence photos backed by Cloudinary URLs.
 */
const mongoose = require('mongoose')

const photoSchema = new mongoose.Schema({
  taskId:            { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  propertyId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
  standardId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Standard', default: null },
  uploadedBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // NOTE: `before` is deprecated in worker UI but kept for backward data compatibility.
  photoType:         { type: String, enum: ['reference', 'before', 'after', 'problem', 'standard_proof', 'extra'], required: true },
  photoUrl:          { type: String, required: true },
  cloudinaryPublicId:{ type: String, required: true },
  caption:           { type: String, default: '' }
}, { timestamps: true })

module.exports = mongoose.model('Photo', photoSchema)