/**
 * standard.routes.js
 * Standard CRUD and reference-photo upload routes.
 */
const express = require('express')
const router = express.Router()
const { protect } = require('../middlewares/auth.middleware')
const { requireAdmin } = require('../middlewares/role.middleware')
const upload = require('../middlewares/upload.middleware')
const ctrl = require('../controllers/standard.controller')

router.get('/property/:propertyId', protect, ctrl.getStandards)
router.get('/:id',   protect, ctrl.getStandard)
router.post('/',     protect, requireAdmin, upload.single('photo'), ctrl.createStandard)
router.put('/:id',   protect, requireAdmin, upload.single('photo'), ctrl.updateStandard)
// Reference-photo sub-routes must come BEFORE the generic /:id delete route.
router.post('/:id/upload-reference-photo', protect, requireAdmin, upload.single('photo'), ctrl.uploadReferencePhoto)
router.delete('/:id/reference-photo',      protect, requireAdmin, ctrl.deleteReferencePhoto)
router.delete('/:id',protect, requireAdmin, ctrl.deleteStandard)

module.exports = router