const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  medication: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medication',
    required: true
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'taken', 'missed', 'skipped', 'snoozed'],
    default: 'pending'
  },
  takenAt: {
    type: Date
  },
  missedAt: {
    type: Date
  },
  snoozeUntil: {
    type: Date
  },
  notificationSent: {
    type: Boolean,
    default: false
  },
  notificationSentAt: {
    type: Date
  },
  notificationChannels: [{
    type: String,
    enum: ['email', 'sms', 'push']
  }],
  dosageTaken: {
    amount: Number,
    unit: String
  },
  notes: {
    type: String
  },
  imageProof: {
    type: String // URL to uploaded image
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
reminderSchema.index({ user: 1, scheduledTime: 1 });
reminderSchema.index({ user: 1, status: 1 });
reminderSchema.index({ medication: 1, scheduledTime: 1 });
reminderSchema.index({ scheduledTime: 1, status: 1 });

// Method to mark reminder as taken
reminderSchema.methods.markAsTaken = function(dosage, notes) {
  this.status = 'taken';
  this.takenAt = new Date();
  if (dosage) this.dosageTaken = dosage;
  if (notes) this.notes = notes;
  return this.save();
};

// Method to mark reminder as missed
reminderSchema.methods.markAsMissed = function() {
  this.status = 'missed';
  this.missedAt = new Date();
  return this.save();
};

// Method to snooze reminder
reminderSchema.methods.snooze = function(minutes = 15) {
  this.status = 'snoozed';
  this.snoozeUntil = new Date(Date.now() + minutes * 60000);
  return this.save();
};

module.exports = mongoose.model('Reminder', reminderSchema);