/**
 * propertyChecklist.controller.js
 * Handles reading and saving property checklist templates.
 */
const PropertyChecklist = require('../models/PropertyChecklist.model')
const sendResponse = require('../utils/sendResponse')

/**
 * getChecklist returns the checklist template for a property.
 * Returns an empty areas array if no checklist has been set up yet.
 */
exports.getChecklist = async (req, res, next) => {
  try {
    const checklist = await PropertyChecklist.findOne({
      propertyId: req.params.propertyId,
    })

    if (!checklist) {
      return sendResponse(res, 200, true, 'No checklist yet', {
        propertyId: req.params.propertyId,
        areas: [],
      })
    }

    return sendResponse(res, 200, true, 'Checklist fetched', checklist)
  } catch (err) { next(err) }
}

/**
 * saveChecklist creates or fully replaces the checklist template.
 * Uses upsert so it works for first-time setup and later updates.
 */
exports.saveChecklist = async (req, res, next) => {
  try {
    const { areas } = req.body

    if (!Array.isArray(areas)) {
      return sendResponse(res, 400, false, 'areas must be an array')
    }

    const checklist = await PropertyChecklist.findOneAndUpdate(
      { propertyId: req.params.propertyId },
      { propertyId: req.params.propertyId, areas },
      { upsert: true, new: true, runValidators: true },
    )

    return sendResponse(res, 200, true, 'Checklist saved', checklist)
  } catch (err) { next(err) }
}
