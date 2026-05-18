/**
 * settings.routes.js
 * GET /api/settings  — any authenticated user
 * PUT /api/settings  — admin only
 */
const express = require('express')
const router = express.Router()
const { protect } = require('../middlewares/auth.middleware')
const { requireAdmin } = require('../middlewares/role.middleware')
const ctrl = require('../controllers/settings.controller')

router.get('/',  protect, ctrl.getSettings)
router.put('/',  protect, requireAdmin, ctrl.updateSettings)

module.exports = router
