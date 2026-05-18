/**
 * upload.middleware.js
 * Source file for the cleanflow application.
 */

const multer = require('multer')

// Store in memory so we can upload directly to Cloudinary
const storage = multer.memoryStorage()

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('Only image files are allowed (jpg, png, webp)'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max per photo
})

module.exports = upload
