/**
 * mail.js
 * Source file for the cleanflow application.
 */

const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

const sendMail = async ({ to, subject, html }) => {
  // Skip sending if email is not configured
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'PASTE_YOUR_EMAIL') {
    console.log(`[Email skipped — not configured] To: ${to} | Subject: ${subject}`)
    return
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html
    })
    console.log(`Email sent to ${to}`)
  } catch (err) {
    // Email errors should NOT crash the API
    console.error('Email error (non-fatal):', err.message)
  }
}

module.exports = sendMail
