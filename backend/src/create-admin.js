/**
 * create-admin.js
 *
 * Production-grade admin account bootstrap script.
 *
 * - Safely run ANY number of times — never deletes existing data.
 * - Creates admin ONLY if no admin account with that email exists yet.
 * - Reads credentials from env vars so the password is never hard-coded.
 *
 * Usage (one-time setup):
 *   node src/create-admin.js
 *
 * Or with custom credentials inline:
 *   ADMIN_EMAIL=owner@mycompany.com ADMIN_PASSWORD=SecurePass123 node src/create-admin.js
 *
 * Defaults (when env vars are not set):
 *   ADMIN_EMAIL    = admin@cleanflow.com
 *   ADMIN_PASSWORD = admin123          ← change this for any real deployment
 *   ADMIN_NAME     = CleanFlow Admin
 */
require('dotenv').config()
const mongoose = require('mongoose')
const connectDB = require('./config/db')
const User = require('./models/User.model')

async function ensureAdmin() {
  await connectDB()

  const email    = process.env.ADMIN_EMAIL    || 'admin@cleanflow.com'
  const password = process.env.ADMIN_PASSWORD || 'admin123'
  const name     = process.env.ADMIN_NAME     || 'CleanFlow Admin'

  const existing = await User.findOne({ email, role: 'admin' })

  if (existing) {
    console.log(`\n✓ Admin already exists: ${existing.email} — nothing changed.\n`)
  } else {
    await User.create({ name, email, password, role: 'admin' })
    console.log(`\n✓ Admin account created successfully!`)
    console.log(`  Email:    ${email}`)
    console.log(`  Password: ${password}`)
    console.log(`  URL:      http://localhost:5173/admin/login\n`)
    console.log('  ⚠  Remember to change the default password before going live.\n')
  }

  await mongoose.connection.close()
}

ensureAdmin().catch(err => {
  console.error('create-admin failed:', err.message)
  mongoose.connection.close()
  process.exit(1)
})
