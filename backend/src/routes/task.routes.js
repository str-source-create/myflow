/**
 * task.routes.js
 * Source file for the cleanflow application.
 */

const express = require('express')
const router = express.Router()
const { protect } = require('../middlewares/auth.middleware')
const { requireAdmin, requireWorker } = require('../middlewares/role.middleware')
const ctrl = require('../controllers/task.controller')

// IMPORTANT: /my must come BEFORE /:id
router.get('/my',      protect, requireWorker, ctrl.getMyTasks)
router.get('/',        protect, requireAdmin,  ctrl.getTasks)
router.get('/:id',     protect, ctrl.getTask)
router.post('/',       protect, requireAdmin,  ctrl.createTask)
router.put('/:id',     protect, requireAdmin,  ctrl.updateTask)
router.delete('/:id',  protect, requireAdmin,  ctrl.deleteTask)
router.patch('/:id/start',       protect, requireWorker, ctrl.startTask)
router.patch('/:id/submit',      protect, requireWorker, ctrl.submitTask)
router.patch('/:id/approve',     protect, requireAdmin,  ctrl.approveTask)
router.patch('/:id/request-fix', protect, requireAdmin,  ctrl.requestFix)

module.exports = router
