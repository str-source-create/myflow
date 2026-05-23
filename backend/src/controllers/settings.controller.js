/**
 * settings.controller.js
 * Get and update global app settings (singleton document).
 */
const Settings = require('../models/Settings.model')
const sendResponse = require('../utils/sendResponse')
const sendMail = require('../config/mail')

/**
 * getSettings — returns the singleton settings document.
 * Creates a default document if none exists yet.
 */
exports.getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne()
    if (!settings) {
      settings = await Settings.create({})
    }
    return sendResponse(res, 200, true, 'Settings fetched', settings)
  } catch (err) { next(err) }
}

/**
 * updateSettings — merges the request body into the singleton settings document.
 * Admin only. Creates the document if it does not exist yet (upsert).
 */
exports.updateSettings = async (req, res, next) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      {},
      { $set: req.body },
      { new: true, upsert: true }
    )
    return sendResponse(res, 200, true, 'Settings updated', settings)
  } catch (err) { next(err) }
}

/**
 * getEmailStatus — reports whether the email transport is configured.
 * Checks that all required env vars are present and not placeholder values.
 * Admin only.
 */
exports.getEmailStatus = async (req, res, next) => {
  try {
    const configured = !!(
      process.env.EMAIL_HOST &&
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASS &&
      process.env.EMAIL_USER !== 'PASTE_YOUR_EMAIL'
    )
    return sendResponse(res, 200, true, 'Email status', {
      configured,
      from: configured ? (process.env.EMAIL_FROM || process.env.EMAIL_USER) : null,
    })
  } catch (err) { next(err) }
}

/**
 * sendTestEmail — sends a test email to the requesting admin's address.
 * Useful for verifying that EMAIL_* env vars are correctly set.
 * Admin only.
 */
exports.sendTestEmail = async (req, res, next) => {
  try {
    await sendMail({
      to: req.user.email,
      subject: 'CleanFlow — Test Email',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <h2 style="color:#0f172a">Email is working! ✅</h2>
          <p style="color:#64748b">
            This is a test email from CleanFlow.<br>
            Your email notifications are configured correctly.
          </p>
          <p style="color:#94a3b8;font-size:13px;margin-top:24px">
            Sent to: ${req.user.email}<br>
            Time: ${new Date().toLocaleString()}
          </p>
        </div>
      `,
    })
    return sendResponse(res, 200, true, `Test email sent to ${req.user.email}`)
  } catch (err) {
    // Return 500 with the mailer error so the admin can diagnose the issue.
    return sendResponse(res, 500, false,
      `Email failed: ${err.message}. Check your EMAIL_* settings in .env`
    )
  }
}
