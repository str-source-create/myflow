/**
 * photo.routes.js
 * Source file for the cleanflow application.
 */

const express = require('express')
const router = express.Router()
const { protect } = require('../middlewares/auth.middleware')
const upload = require('../middlewares/upload.middleware')
const ctrl = require('../controllers/photo.controller')

router.post('/upload',              protect, upload.single('photo'), ctrl.uploadPhoto)
router.get('/task/:taskId',         protect, ctrl.getTaskPhotos)
router.get('/property/:propertyId', protect, ctrl.getPropertyPhotos)
router.delete('/:id',               protect, ctrl.deletePhoto)

module.exports = router
