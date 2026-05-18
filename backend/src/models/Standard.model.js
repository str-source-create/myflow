/**
 * Standard.model.js
 * Source file for the cleanflow application.
 */

const mongoose = require('mongoose')

const standardSchema = new mongoose.Schema({
  propertyId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  areaName:            { type: String, required: true, trim: true },
  instruction:         { type: String, default: '' },
  referencePhotoUrl:   { type: String, default: null },
  cloudinaryPublicId:  { type: String, default: null },
  required:            { type: Boolean, default: true },
  sortOrder:           { type: Number, default: 0 }
}, { timestamps: true })

module.exports = mongoose.model('Standard', standardSchema)
