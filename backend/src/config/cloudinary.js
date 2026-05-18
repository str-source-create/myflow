/**
 * cloudinary.js
 * Source file for the cleanflow application.
 */

const cloudinary = require('cloudinary').v2

const REQUIRED_KEYS = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
const PLACEHOLDER = 'PASTE_YOUR'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

/**
 * Returns true only when all three credentials are set and not placeholder values.
 * Safe to call at any time — does not throw.
 */
function isCloudinaryConfigured() {
  return REQUIRED_KEYS.every((key) => {
    const val = process.env[key]
    return val && !val.startsWith(PLACEHOLDER)
  })
}

// Warn once at startup so developers know photo uploads will be skipped.
if (!isCloudinaryConfigured()) {
  console.warn(
    '[CleanFlow] ⚠  Cloudinary credentials not configured.\n' +
    '   Photo uploads will be skipped until CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY\n' +
    '   and CLOUDINARY_API_SECRET are set in backend/.env'
  )
}

module.exports = cloudinary
module.exports.isCloudinaryConfigured = isCloudinaryConfigured
