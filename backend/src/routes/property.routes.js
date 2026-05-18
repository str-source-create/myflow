/**
 * property.routes.js
 * Source file for the cleanflow application.
 */

const express = require('express')
const router = express.Router()
const { protect } = require('../middlewares/auth.middleware')
const { requireAdmin } = require('../middlewares/role.middleware')
const ctrl = require('../controllers/property.controller')

router.get('/',    protect, ctrl.getProperties)
router.get('/:id', protect, ctrl.getProperty)
router.post('/',   protect, requireAdmin, ctrl.createProperty)
router.put('/:id', protect, requireAdmin, ctrl.updateProperty)
router.delete('/:id', protect, requireAdmin, ctrl.deleteProperty)

module.exports = router
