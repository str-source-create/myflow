/**
 * user.routes.js
 * Worker/admin user management endpoints.
 */
const express = require('express')
const router = express.Router()
const { protect } = require('../middlewares/auth.middleware')
const { requireAdmin } = require('../middlewares/role.middleware')
const ctrl = require('../controllers/user.controller')

router.get('/me', protect, ctrl.getMe)
router.patch('/me/password', protect, ctrl.changeMyPassword)
router.get('/',   protect, requireAdmin, ctrl.getUsers)
router.get('/:id',protect, requireAdmin, ctrl.getUser)
router.post('/',  protect, requireAdmin, ctrl.createUser)
router.put('/:id',protect, requireAdmin, ctrl.updateUser)
// Soft-delete: sets active:false so task history is preserved
router.delete('/:id', protect, requireAdmin, ctrl.deactivateUser)
router.post('/:id/reset-password', protect, requireAdmin, ctrl.resetPassword)

module.exports = router