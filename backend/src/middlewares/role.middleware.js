/**
 * role.middleware.js
 * Source file for the cleanflow application.
 */

const sendResponse = require('../utils/sendResponse')

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return sendResponse(res, 403, false, 'Admin access required')
  }
  next()
}

const requireWorker = (req, res, next) => {
  if (!req.user) {
    return sendResponse(res, 401, false, 'Not authorized')
  }
  // Admins can also access worker routes
  if (req.user.role !== 'worker' && req.user.role !== 'admin') {
    return sendResponse(res, 403, false, 'Worker access required')
  }
  next()
}

module.exports = { requireAdmin, requireWorker }
