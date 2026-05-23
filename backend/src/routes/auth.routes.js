/**
 * auth.routes.js
 * Authentication and invite-flow endpoints.
 */
const express = require('express')
const router = express.Router()
const { protect } = require('../middlewares/auth.middleware')
const { requireAdmin } = require('../middlewares/role.middleware')
const authCtrl = require('../controllers/auth.controller')

router.post('/login',          authCtrl.login)
// Admin invite flow
router.post('/invite',         protect, requireAdmin, authCtrl.sendInvite)
router.get('/invite/:token',   authCtrl.validateInvite)
router.post('/accept-invite',  authCtrl.acceptInvite)
// First-time setup — public, one-time use. Returns 403 once any admin exists.
router.get('/setup-status',    authCtrl.checkSetup)
router.post('/create-admin',   authCtrl.createFirstAdmin)

module.exports = router