/**
 * checklist.routes.js
 * Source file for the cleanflow application.
 */

const express = require('express')
const router = express.Router()
const { protect } = require('../middlewares/auth.middleware')
const { requireAdmin, requireWorker } = require('../middlewares/role.middleware')
const ctrl = require('../controllers/checklist.controller')

router.get('/task/:taskId',      protect, ctrl.getChecklist)
router.post('/',                 protect, requireAdmin, ctrl.createItem)
// batch create — used when saving the full area-based checklist for a task
router.post('/batch',            protect, requireAdmin, ctrl.createManyItems)
router.put('/:id',               protect, requireAdmin, ctrl.updateItem)
router.delete('/:id',            protect, requireAdmin, ctrl.deleteItem)
router.patch('/:id/complete',    protect, ctrl.completeItem)
router.patch('/:id/uncomplete',  protect, ctrl.uncompleteItem)

module.exports = router
