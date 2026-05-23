/**
 * User.model.js
 * Source file for the cleanflow application.
 */

const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name:           { type: String, required: true, trim: true },
  email:          { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:       { type: String, required: true, minlength: 4 },
  phone:          { type: String, default: '' },
  role:           { type: String, enum: ['admin', 'worker'], default: 'worker' },
  active:         { type: Boolean, default: true },
  tasksCompleted: { type: Number, default: 0 },
  streak:         { type: Number, default: 0 },
  // ── Security fields ────────────────────────────────────────────────────────
  // Track failed login attempts; lock the account after 5 consecutive failures.
  failedLoginAttempts: { type: Number, default: 0 },
  // Non-null date means the account is locked until that moment.
  lockedUntil:         { type: Date,   default: null },
  // Metadata recorded on each successful login for admin audit in Settings.
  lastLoginAt:         { type: Date,   default: null },
  lastLoginIp:         { type: String, default: null },
}, { timestamps: true })

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

// Check password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Remove password from all JSON responses
userSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  return obj
}

module.exports = mongoose.model('User', userSchema)
