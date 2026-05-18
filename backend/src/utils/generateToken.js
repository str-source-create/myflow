/**
 * generateToken.js
 * Source file for the cleanflow application.
 */

const jwt = require('jsonwebtoken')

const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

module.exports = generateToken
