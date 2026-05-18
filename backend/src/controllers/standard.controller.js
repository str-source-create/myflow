/**
 * standard.controller.js
 * Manages property cleaning standards and reference-photo uploads.
 */
const Standard = require('../models/Standard.model')
const cloudinaryModule = require('../config/cloudinary')
const { isCloudinaryConfigured } = cloudinaryModule
const sendResponse = require('../utils/sendResponse')

/**
 * Uploads an in-memory file buffer to Cloudinary.
 * Only call this after confirming isCloudinaryConfigured() === true.
 */
const uploadToCloudinary = (buffer, folder) => new Promise((resolve, reject) => {
  cloudinaryModule.uploader.upload_stream(
    { folder, resource_type: 'image' },
    (error, result) => (error ? reject(error) : resolve(result))
  ).end(buffer)
})

/**
 * Parses booleans sent from multipart/form-data payloads.
 */
const parseRequiredFlag = (value, fallback = true) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true') return true
    if (normalized === 'false') return false
  }
  return fallback
}

exports.getStandards = async (req, res, next) => {
  try {
    const standards = await Standard.find({ propertyId: req.params.propertyId }).sort({ sortOrder: 1 })
    return sendResponse(res, 200, true, 'Standards fetched', standards)
  } catch (err) { next(err) }
}

exports.getStandard = async (req, res, next) => {
  try {
    const standard = await Standard.findById(req.params.id)
    if (!standard) return sendResponse(res, 404, false, 'Standard not found')
    return sendResponse(res, 200, true, 'Standard fetched', standard)
  } catch (err) { next(err) }
}

exports.createStandard = async (req, res, next) => {
  try {
    const payload = {
      propertyId: req.body.propertyId,
      areaName: req.body.areaName,
      instruction: req.body.instruction || '',
      required: parseRequiredFlag(req.body.required, true),
      sortOrder: Number.isFinite(Number(req.body.sortOrder)) ? Number(req.body.sortOrder) : 0,
    }

    if (req.file) {
      if (!isCloudinaryConfigured()) {
        // Save standard without photo — admin can add a reference photo once Cloudinary is set up
        console.warn('[CleanFlow] Standard created without reference photo — Cloudinary not configured.')
      } else {
        const uploadResult = await uploadToCloudinary(req.file.buffer, `cleanflow/standards/${payload.propertyId}`)
        payload.referencePhotoUrl = uploadResult.secure_url
        payload.cloudinaryPublicId = uploadResult.public_id
      }
    }

    const standard = await Standard.create(payload)
    const message = req.file && !isCloudinaryConfigured()
      ? 'Standard created (photo skipped — Cloudinary not configured)'
      : 'Standard created'
    return sendResponse(res, 201, true, message, standard)
  } catch (err) { next(err) }
}

exports.updateStandard = async (req, res, next) => {
  try {
    const standard = await Standard.findById(req.params.id)
    if (!standard) return sendResponse(res, 404, false, 'Standard not found')

    if (typeof req.body.areaName === 'string') standard.areaName = req.body.areaName
    if (typeof req.body.instruction === 'string') standard.instruction = req.body.instruction
    if (Object.prototype.hasOwnProperty.call(req.body, 'required')) {
      standard.required = parseRequiredFlag(req.body.required, standard.required)
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'sortOrder') && Number.isFinite(Number(req.body.sortOrder))) {
      standard.sortOrder = Number(req.body.sortOrder)
    }

    if (req.file) {
      if (!isCloudinaryConfigured()) {
        console.warn('[CleanFlow] Standard photo update skipped — Cloudinary not configured.')
      } else {
        // Remove existing Cloudinary image before replacing it.
        if (standard.cloudinaryPublicId) {
          await cloudinaryModule.uploader.destroy(standard.cloudinaryPublicId)
        }
        const uploadResult = await uploadToCloudinary(req.file.buffer, `cleanflow/standards/${standard.propertyId}`)
        standard.referencePhotoUrl = uploadResult.secure_url
        standard.cloudinaryPublicId = uploadResult.public_id
      }
    }

    await standard.save()

    if (!standard) return sendResponse(res, 404, false, 'Standard not found')
    return sendResponse(res, 200, true, 'Standard updated', standard)
  } catch (err) { next(err) }
}

exports.deleteStandard = async (req, res, next) => {
  try {
    const standard = await Standard.findById(req.params.id)
    if (!standard) return sendResponse(res, 404, false, 'Standard not found')
    if (standard.cloudinaryPublicId && isCloudinaryConfigured()) {
      await cloudinaryModule.uploader.destroy(standard.cloudinaryPublicId)
    }
    await standard.deleteOne()
    return sendResponse(res, 200, true, 'Standard deleted')
  } catch (err) { next(err) }
}

exports.uploadReferencePhoto = async (req, res, next) => {
  try {
    if (!req.file) return sendResponse(res, 400, false, 'No photo file provided')

    if (!isCloudinaryConfigured()) {
      return sendResponse(res, 503, false,
        'Photo storage is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in backend/.env')
    }

    const standard = await Standard.findById(req.params.id)
    if (!standard) return sendResponse(res, 404, false, 'Standard not found')

    // Delete old photo from Cloudinary if it exists
    if (standard.cloudinaryPublicId) {
      await cloudinaryModule.uploader.destroy(standard.cloudinaryPublicId)
    }

    // Upload new photo to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, `cleanflow/standards/${req.params.id}`)

    standard.referencePhotoUrl = result.secure_url
    standard.cloudinaryPublicId = result.public_id
    await standard.save()

    return sendResponse(res, 200, true, 'Reference photo uploaded', standard)
  } catch (err) { next(err) }
}

/**
 * Removes the reference photo from Cloudinary and clears the URL on the standard.
 * Called by admin DELETE /api/standards/:id/reference-photo.
 */
exports.deleteReferencePhoto = async (req, res, next) => {
  try {
    const standard = await Standard.findById(req.params.id)
    if (!standard) return sendResponse(res, 404, false, 'Standard not found')

    if (!standard.referencePhotoUrl) {
      return sendResponse(res, 400, false, 'Standard has no reference photo to delete')
    }

    // Remove from Cloudinary if configured and public ID is stored.
    if (standard.cloudinaryPublicId && isCloudinaryConfigured()) {
      await cloudinaryModule.uploader.destroy(standard.cloudinaryPublicId)
    }

    standard.referencePhotoUrl = null
    standard.cloudinaryPublicId = null
    await standard.save()

    return sendResponse(res, 200, true, 'Reference photo deleted', standard)
  } catch (err) { next(err) }
}