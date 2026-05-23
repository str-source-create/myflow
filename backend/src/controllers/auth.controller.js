/**
 * auth.controller.js
 * Login + admin invite flow (send / validate / accept invite).
 */
const crypto = require('crypto')
const User = require('../models/User.model')
const Invite = require('../models/Invite.model')
const generateToken = require('../utils/generateToken')
const sendResponse = require('../utils/sendResponse')
const sendMail = require('../config/mail')

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return sendResponse(res, 400, false, 'Email and password are required')
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) {
      // Return generic message — don't reveal whether email exists.
      return sendResponse(res, 401, false, 'Invalid email or password')
    }

    // Check if account is temporarily locked due to too many failed attempts.
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil - Date.now()) / 60000)
      return sendResponse(res, 423, false,
        `Account temporarily locked due to too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.`
      )
    }

    const isMatch = await user.comparePassword(password)

    if (!isMatch) {
      // Increment failed attempt counter toward lockout threshold.
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1

      // Lock account for 30 minutes after 5 consecutive failures.
      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000)
        await user.save()
        return sendResponse(res, 423, false,
          'Too many failed attempts. Account locked for 30 minutes.'
        )
      }

      await user.save()
      const attemptsLeft = 5 - user.failedLoginAttempts
      return sendResponse(res, 401, false,
        `Invalid email or password. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining before lockout.`
      )
    }

    // Successful login — reset lockout counter and record metadata.
    user.failedLoginAttempts = 0
    user.lockedUntil  = null
    user.lastLoginAt  = new Date()
    user.lastLoginIp  = req.ip || req.headers['x-forwarded-for'] || null
    await user.save()

    if (!user.active) {
      return sendResponse(res, 403, false, 'Your account has been deactivated. Contact your manager.')
    }

    const token = generateToken(user._id, user.role)

    return sendResponse(res, 200, true, 'Login successful', { token, user })
  } catch (err) {
    next(err)
  }
}

/**
 * sendInvite — admin sends an invite email to a new manager.
 * Generates a secure random token and emails a signup link.
 * Token expires in 48 hours. Any existing invite for that email is replaced.
 */
exports.sendInvite = async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email) return sendResponse(res, 400, false, 'Email is required')

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) return sendResponse(res, 400, false, 'This email already has an account')

    const token     = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000)

    // Replace any prior invite for this email
    await Invite.findOneAndDelete({ email: email.toLowerCase() })
    await Invite.create({ email, role: 'admin', token, invitedBy: req.user._id, expiresAt })

    const inviteUrl = `${process.env.FRONTEND_URL}/admin/accept-invite/${token}`

    await sendMail({
      to: email,
      subject: `${req.user.name} invited you to CleanFlow`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <h2 style="color:#0f172a">You're invited to CleanFlow</h2>
          <p style="color:#64748b">${req.user.name} has invited you as an admin manager.</p>
          <a href="${inviteUrl}"
            style="display:inline-block;margin:24px 0;background:#2563eb;color:white;
                   padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:600">
            Accept Invitation
          </a>
          <p style="color:#94a3b8;font-size:13px">This link expires in 48 hours.</p>
          <p style="color:#94a3b8;font-size:13px">If you did not expect this, ignore this email.</p>
        </div>
      `
    })

    // Log invite URL to console when email is not configured (dev/test)
    console.log(`[Invite] URL for ${email}: ${inviteUrl}`)

    return sendResponse(res, 200, true, `Invitation sent to ${email}`)
  } catch (err) { next(err) }
}

/**
 * validateInvite — checks if an invite token is valid and unexpired.
 * Called when the invitee opens the accept-invite link.
 */
exports.validateInvite = async (req, res, next) => {
  try {
    const invite = await Invite.findOne({
      token: req.params.token,
      accepted: false,
      expiresAt: { $gt: new Date() }
    })
    if (!invite) return sendResponse(res, 404, false, 'Invite link is invalid or has expired')
    return sendResponse(res, 200, true, 'Valid invite', { email: invite.email, role: invite.role })
  } catch (err) { next(err) }
}

/**
 * acceptInvite — creates the new admin account from a valid invite token.
 * Called when the invitee submits their name and password.
 */
exports.acceptInvite = async (req, res, next) => {
  try {
    const { token, name, password } = req.body
    if (!token || !name || !password) {
      return sendResponse(res, 400, false, 'Token, name, and password are required')
    }

    const invite = await Invite.findOne({
      token,
      accepted: false,
      expiresAt: { $gt: new Date() }
    })
    if (!invite) return sendResponse(res, 400, false, 'Invite link is invalid or has expired')

    const user = await User.create({
      name: name.trim(),
      email: invite.email,
      password,
      role: invite.role,
      active: true,
    })

    invite.accepted = true
    await invite.save()

    const jwtToken = generateToken(user._id, user.role)
    return sendResponse(res, 201, true, 'Account created successfully', { token: jwtToken, user })
  } catch (err) { next(err) }
}

/**
 * checkSetup — returns whether an admin account already exists.
 * Used by the frontend SetupPage to show first-time setup when no admin is found.
 * Public endpoint — no authentication required.
 */
exports.checkSetup = async (req, res, next) => {
  try {
    const adminExists = await User.findOne({ role: 'admin' })
    return sendResponse(res, 200, true, 'Setup status', {
      setupRequired: !adminExists,
    })
  } catch (err) { next(err) }
}

/**
 * createFirstAdmin — creates the first admin account (one-time use only).
 * If any admin account already exists this endpoint returns 403.
 * After the first admin is created, the invite system is used for subsequent admins.
 */
exports.createFirstAdmin = async (req, res, next) => {
  try {
    const adminExists = await User.findOne({ role: 'admin' })
    if (adminExists) {
      return sendResponse(res, 403, false,
        'An admin account already exists. Use the invite system to add more admins.'
      )
    }

    const { name, email, password } = req.body
    if (!name || !email || !password) {
      return sendResponse(res, 400, false, 'Name, email, and password are required')
    }
    if (password.length < 8) {
      return sendResponse(res, 400, false, 'Password must be at least 8 characters')
    }

    const admin = await User.create({ name: name.trim(), email, password, role: 'admin', active: true })
    const token = generateToken(admin._id, admin.role)

    return sendResponse(res, 201, true, 'Admin account created', { token, user: admin })
  } catch (err) { next(err) }
}