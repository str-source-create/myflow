/**
 * photo.controller.js
 * Source file for the cleanflow application.
 */

const Photo = require('../models/Photo.model')
const cloudinaryModule = require('../config/cloudinary')
const { isCloudinaryConfigured } = cloudinaryModule
const sendResponse = require('../utils/sendResponse')

exports.uploadPhoto = async (req, res, next) => {
  try {
    if (!req.file) return sendResponse(res, 400, false, 'No photo file provided')

    if (!isCloudinaryConfigured()) {
      return sendResponse(res, 503, false,
        'Photo storage is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in backend/.env')
    }

    const { taskId, photoType, standardId, caption } = req.body
    if (!taskId || !photoType) {
      return sendResponse(res, 400, false, 'taskId and photoType are required')
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinaryModule.uploader.upload_stream(
        { folder: `cleanflow/tasks/${taskId}/${photoType}`, resource_type: 'image' },
        (error, result) => error ? reject(error) : resolve(result)
      ).end(req.file.buffer)
    })

    const photo = await Photo.create({
      taskId,
      photoType,
      standardId: standardId || null,
      uploadedBy: req.user._id,
      photoUrl: result.secure_url,
      cloudinaryPublicId: result.public_id,
      caption: caption || ''
    })

    return sendResponse(res, 201, true, 'Photo uploaded', photo)
  } catch (err) { next(err) }
}

exports.getTaskPhotos = async (req, res, next) => {
  try {
    const photos = await Photo.find({ taskId: req.params.taskId })
    // Group by type
    const grouped = {
      before: photos.filter(p => p.photoType === 'before'),
      after:  photos.filter(p => p.photoType === 'after'),
      problem:photos.filter(p => p.photoType === 'problem'),
      standard_proof: photos.filter(p => p.photoType === 'standard_proof'),
      extra:  photos.filter(p => p.photoType === 'extra')
    }
    return sendResponse(res, 200, true, 'Photos fetched', grouped)
  } catch (err) { next(err) }
}

exports.getPropertyPhotos = async (req, res, next) => {
  try {
    const photos = await Photo.find({ propertyId: req.params.propertyId, photoType: 'reference' })
    return sendResponse(res, 200, true, 'Property photos fetched', photos)
  } catch (err) { next(err) }
}

exports.deletePhoto = async (req, res, next) => {
  try {
    const photo = await Photo.findById(req.params.id)
    if (!photo) return sendResponse(res, 404, false, 'Photo not found')

    // Only attempt Cloudinary deletion if credentials are configured
    if (isCloudinaryConfigured() && photo.cloudinaryPublicId) {
      try {
        await cloudinaryModule.uploader.destroy(photo.cloudinaryPublicId)
      } catch (cloudinaryErr) {
        // Log but don't block DB deletion — the asset may already be gone
        console.warn('[Photo] Cloudinary delete failed for', photo.cloudinaryPublicId, cloudinaryErr.message)
      }
    }

    await photo.deleteOne()
    return sendResponse(res, 200, true, 'Photo deleted')
  } catch (err) { next(err) }
}
