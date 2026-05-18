/**
 * settings.controller.js
 * Get and update global app settings (singleton document).
 */
const Settings = require('../models/Settings.model')
const sendResponse = require('../utils/sendResponse')

/**
 * getSettings — returns the singleton settings document.
 * Creates a default document if none exists yet.
 */
exports.getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne()
    if (!settings) {
      settings = await Settings.create({})
    }
    return sendResponse(res, 200, true, 'Settings fetched', settings)
  } catch (err) { next(err) }
}

/**
 * updateSettings — merges the request body into the singleton settings document.
 * Admin only. Creates the document if it does not exist yet (upsert).
 */
exports.updateSettings = async (req, res, next) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      {},
      { $set: req.body },
      { new: true, upsert: true }
    )
    return sendResponse(res, 200, true, 'Settings updated', settings)
  } catch (err) { next(err) }
}
