/**
 * submission.routes.js
 * Source file for the cleanflow application.
 */

const express = require('express')
const router = express.Router()
const { protect } = require('../middlewares/auth.middleware')
const { requireAdmin } = require('../middlewares/role.middleware')
const ctrl = require('../controllers/submission.controller')

router.get('/',                      protect, requireAdmin, ctrl.getSubmissions)
router.get('/task/:taskId',          protect, ctrl.getSubmissionByTask)
router.get('/worker/:workerId',      protect, ctrl.getWorkerSubmissions)
router.get('/:id',                   protect, ctrl.getSubmission)

module.exports = router
