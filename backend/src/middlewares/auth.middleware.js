/**
 * auth.middleware.js
 * Source file for the cleanflow application.
 */

const jwt = require('jsonwebtoken')
const User = require('../models/User.model')
const sendResponse = require('../utils/sendResponse')

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendResponse(res, 401, false, 'Not authorized — no token provided')
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret')

    const user = await User.findById(decoded.id).select('-password')
    if (!user) return sendResponse(res, 401, false, 'User no longer exists')
    if (!user.active) return sendResponse(res, 403, false, 'Your account has been deactivated')

    req.user = user
    next()
  } catch (err) {
    return sendResponse(res, 401, false, 'Token invalid or expired — please log in again')
  }
}

module.exports = { protect }
