/**
 * settings.routes.js
 * GET /api/settings            — any authenticated user
 * PUT /api/settings            — admin only
 * GET /api/settings/email-status — admin only: is email transport configured?
 * POST /api/settings/test-email  — admin only: send a test email to self
 */
const express = require('express')
const router = express.Router()
const { protect } = require('../middlewares/auth.middleware')
const { requireAdmin } = require('../middlewares/role.middleware')
const ctrl = require('../controllers/settings.controller')

router.get('/',             protect, ctrl.getSettings)
router.put('/',             protect, requireAdmin, ctrl.updateSettings)
router.get('/email-status', protect, requireAdmin, ctrl.getEmailStatus)
router.post('/test-email',  protect, requireAdmin, ctrl.sendTestEmail)

module.exports = router
