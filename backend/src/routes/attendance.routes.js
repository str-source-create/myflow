/**
 * attendance.routes.js
 * Attendance routes for worker self-service clocking and admin reporting.
 */
const express = require('express')
const { protect } = require('../middlewares/auth.middleware')
const { requireAdmin, requireWorker } = require('../middlewares/role.middleware')
const ctrl = require('../controllers/attendance.controller')

const router = express.Router()

// Worker routes.
router.post('/clock-in', protect, requireWorker, ctrl.clockIn)
router.post('/clock-out', protect, requireWorker, ctrl.clockOut)
router.get('/me/today', protect, requireWorker, ctrl.getMyToday)
router.get('/me/history', protect, requireWorker, ctrl.getMyHistory)

// Admin routes.
router.get('/', protect, requireAdmin, ctrl.getAll)
router.get('/today', protect, requireAdmin, ctrl.getToday)
router.get('/worker/:workerId', protect, requireAdmin, ctrl.getByWorker)
router.patch('/:id', protect, requireAdmin, ctrl.updateRecord)

module.exports = router
