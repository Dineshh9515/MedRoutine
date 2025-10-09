const mongoose = require('mongoose');

const caregiverSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  caregiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  relationship: {
    type: String,
    required: true,
    enum: ['family', 'friend', 'professional', 'nurse', 'doctor', 'other']
  },
  permissions: {
    viewMedications: {
      type: Boolean,
      default: true
    },
    viewReminders: {
      type: Boolean,
      default: true
    },
    editMedications: {
      type: Boolean,
      default: false
    },
    receiveNotifications: {
      type: Boolean,
      default: true
    },
    viewHistory: {
      type: Boolean,
      default: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'declined', 'revoked'],
    default: 'pending'
  },
  invitedAt: {
    type: Date,
    default: Date.now
  },
  acceptedAt: {
    type: Date
  },
  revokedAt: {
    type: Date
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Composite index to prevent duplicate caregiver relationships
caregiverSchema.index({ patient: 1, caregiver: 1 }, { unique: true });

// Method to accept invitation
caregiverSchema.methods.acceptInvitation = function() {
  this.status = 'active';
  this.acceptedAt = new Date();
  return this.save();
};

// Method to decline invitation
caregiverSchema.methods.declineInvitation = function() {
  this.status = 'declined';
  return this.save();
};

// Method to revoke access
caregiverSchema.methods.revokeAccess = function() {
  this.status = 'revoked';
  this.revokedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Caregiver', caregiverSchema);