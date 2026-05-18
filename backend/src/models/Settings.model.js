/**
 * Settings.model.js
 * Stores global app configuration as a singleton document.
 * Use Settings.findOne() to read, Settings.findOneAndUpdate({}, data, { upsert: true }) to write.
 */
const mongoose = require('mongoose')

const settingsSchema = new mongoose.Schema({
  timezone:    { type: String, default: 'America/Toronto' },
  companyName: { type: String, default: 'CleanFlow' },
  dateFormat:  { type: String, default: 'MM/DD/YYYY' },
  timeFormat:  { type: String, default: '12h' },
}, { timestamps: true })

module.exports = mongoose.model('Settings', settingsSchema)
