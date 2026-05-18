/**
 * Invite.model.js
 * Stores pending invitations for new admin/manager accounts.
 * Auto-expires after 48 hours using a MongoDB TTL index on expiresAt.
 */
const mongoose = require('mongoose')
const { Schema } = mongoose

const inviteSchema = new Schema({
  email:     { type: String, required: true, lowercase: true },
  role:      { type: String, enum: ['admin'], default: 'admin' },
  token:     { type: String, required: true, unique: true },
  invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true },
  accepted:  { type: Boolean, default: false },
}, { timestamps: true })

// MongoDB TTL — auto-deletes expired invite documents after expiresAt
inviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports = mongoose.model('Invite', inviteSchema)
