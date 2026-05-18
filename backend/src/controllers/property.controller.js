/**
 * property.controller.js
 * Source file for the cleanflow application.
 */

const Property = require('../models/Property.model')
const Standard = require('../models/Standard.model')
const sendResponse = require('../utils/sendResponse')

exports.getProperties = async (req, res, next) => {
  try {
    const properties = await Property.find({ active: true }).sort({ createdAt: -1 })
    return sendResponse(res, 200, true, 'Properties fetched', properties)
  } catch (err) { next(err) }
}

exports.getProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id)
    if (!property) return sendResponse(res, 404, false, 'Property not found')
    const standards = await Standard.find({ propertyId: req.params.id }).sort({ sortOrder: 1 })
    return sendResponse(res, 200, true, 'Property fetched', { ...property.toJSON(), standards })
  } catch (err) { next(err) }
}

exports.createProperty = async (req, res, next) => {
  try {
    const property = await Property.create({ ...req.body, createdBy: req.user._id })
    return sendResponse(res, 201, true, 'Property created', property)
  } catch (err) { next(err) }
}

exports.updateProperty = async (req, res, next) => {
  try {
    const property = await Property.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!property) return sendResponse(res, 404, false, 'Property not found')
    return sendResponse(res, 200, true, 'Property updated', property)
  } catch (err) { next(err) }
}

exports.deleteProperty = async (req, res, next) => {
  try {
    const property = await Property.findByIdAndUpdate(req.params.id, { active: false }, { new: true })
    if (!property) return sendResponse(res, 404, false, 'Property not found')
    return sendResponse(res, 200, true, 'Property deleted')
  } catch (err) { next(err) }
}
