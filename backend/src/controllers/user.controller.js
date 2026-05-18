/**
 * user.controller.js
 * Worker/admin user management: CRUD, soft-delete, password reset.
 */
const crypto = require('crypto')
const User = require('../models/User.model')
const sendResponse = require('../utils/sendResponse')
const sendMail = require('../config/mail')

exports.getMe = async (req, res, next) => {
  try {
    return sendResponse(res, 200, true, 'Current user', req.user)
  } catch (err) { next(err) }
}

exports.getUsers = async (req, res, next) => {
  try {
    const filter = {}
    if (req.query.role) filter.role = req.query.role
    const users = await User.find(filter).sort({ createdAt: -1 })
    return sendResponse(res, 200, true, 'Users fetched', users)
  } catch (err) { next(err) }
}

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return sendResponse(res, 404, false, 'User not found')
    return sendResponse(res, 200, true, 'User fetched', user)
  } catch (err) { next(err) }
}

exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body
    if (!name || !email || !password) {
      return sendResponse(res, 400, false, 'Name, email, and password are required')
    }
    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) return sendResponse(res, 400, false, 'Email already in use')

    const user = await User.create({ name, email, password, phone, role })

    // Send welcome email to new worker
    await sendMail({
      to: email,
      subject: 'Welcome to CleanFlow',
      html: `
        <h2>Welcome to CleanFlow, ${name}!</h2>
        <p>Your account has been created.</p>
        <p><strong>Login URL:</strong> ${process.env.FRONTEND_URL}/worker/login</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${password}</p>
        <p>Please log in and change your password.</p>
      `
    })

    return sendResponse(res, 201, true, 'User created', user)
  } catch (err) { next(err) }
}

exports.updateUser = async (req, res, next) => {
  try {
    const { password, ...rest } = req.body
    const user = await User.findByIdAndUpdate(req.params.id, rest, { new: true })
    if (!user) return sendResponse(res, 404, false, 'User not found')
    return sendResponse(res, 200, true, 'User updated', user)
  } catch (err) { next(err) }
}

/**
 * deactivateUser — sets active:false instead of hard-deleting.
 * We never hard-delete workers because their task history must remain intact.
 */
exports.deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    )
    if (!user) return sendResponse(res, 404, false, 'User not found')
    return sendResponse(res, 200, true, 'Worker deactivated', user)
  } catch (err) { next(err) }
}

/**
 * resetPassword — generates a temporary password and emails it to the worker.
 * Also returns the temp password to the admin so they can share it verbally.
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return sendResponse(res, 404, false, 'User not found')

    const tempPassword = crypto.randomBytes(4).toString('hex').toUpperCase()
    user.password = tempPassword
    await user.save()

    await sendMail({
      to: user.email,
      subject: 'Your CleanFlow password has been reset',
      html: `
        <h2>Password Reset</h2>
        <p>Your manager has reset your CleanFlow password.</p>
        <p><strong>New temporary password: ${tempPassword}</strong></p>
        <p>Log in at: ${process.env.FRONTEND_URL}/worker/login</p>
        <p>Please change your password after logging in.</p>
      `
    })

    return sendResponse(res, 200, true, 'Password reset', { tempPassword })
  } catch (err) { next(err) }
}