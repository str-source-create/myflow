/**
 * propertyChecklist.routes.js
 * API routes for managing a property's permanent checklist template.
 */
const express = require('express')
const router = express.Router()
const { protect } = require('../middlewares/auth.middleware')
const { requireAdmin } = require('../middlewares/role.middleware')
const ctrl = require('../controllers/propertyChecklist.controller')

// Get checklist template for a property (admin and worker can read)
router.get('/property/:propertyId', protect, ctrl.getChecklist)

// Save or fully replace checklist template (admin only)
router.put('/property/:propertyId', protect, requireAdmin, ctrl.saveChecklist)

module.exports = router
