const mongoose = require('mongoose');
const crypto = require('crypto');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  // Share links
  shareToken: {
    type: String,
    unique: true,
    sparse: true
  },
  sharePassword: {
    type: String,
    select: false // Don't include in queries by default
  },
  shareType: {
    type: String,
    enum: ['none', 'one-time', 'time-based'],
    default: 'none'
  },
  accessType: {
    type: String,
    enum: ['public', 'password-protected'],
    default: 'public'
  },
  expiresAt: {
    type: Date
  },
  revoked: {
    type: Boolean,
    default: false
  },
}, { timestamps: true });

// Generate a secure random token for sharing
noteSchema.methods.generateShareToken = function() {
  return crypto.randomBytes(32).toString('hex');
};

// Generate a secure random password for password-protected links
noteSchema.methods.generateSharePassword = function() {
  return crypto.randomBytes(9).toString('base64url');
};

// Check if the note is accessible via share link
noteSchema.methods.isAccessibleViaShare = function() {
  if (!this.shareToken) return false;
  if (this.revoked) return false;
  if (this.expiresAt && this.expiresAt < new Date()) return false;
  if (this.shareType === 'one-time' && this.viewCount > 0) return false;
  return true;
};

// Increment view count (used when viewing via share link)
noteSchema.methods.incrementViewCount = async function() {
  this.viewCount += 1;
  await this.save();
};

module.exports = mongoose.model('Note', noteSchema);
