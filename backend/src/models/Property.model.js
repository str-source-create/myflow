/**
 * Property.model.js
 * Source file for the cleanflow application.
 */

const mongoose = require('mongoose')

const propertySchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  address:       { type: String, required: true },
  wifiName:      { type: String, default: '' },
  wifiPassword:  { type: String, default: '' },
  gpsLocation:   { type: String, default: '' },
  accessNotes:   { type: String, default: '' },
  parkingNotes:  { type: String, default: '' },
  cleaningNotes: { type: String, default: '' },
  importantNotes:{ type: String, default: '' },
  active:        { type: Boolean, default: true },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true })

module.exports = mongoose.model('Property', propertySchema)
