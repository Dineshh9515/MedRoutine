const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Medication name is required'],
    trim: true
  },
  dosage: {
    amount: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      required: true,
      enum: ['mg', 'ml', 'g', 'mcg', 'units', 'drops', 'tablets', 'capsules', 'teaspoons', 'tablespoons']
    }
  },
  frequency: {
    type: String,
    required: true,
    enum: ['once_daily', 'twice_daily', 'three_times_daily', 'four_times_daily', 'every_x_hours', 'as_needed', 'weekly', 'monthly', 'custom']
  },
  schedule: [{
    time: {
      type: String,
      required: true // Format: "HH:MM"
    },
    days: {
      type: [String],
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }
  }],
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  prescribedBy: {
    type: String,
    trim: true
  },
  reason: {
    type: String,
    trim: true
  },
  instructions: {
    type: String,
    trim: true
  },
  sideEffects: [{
    type: String
  }],
  interactions: [{
    type: String
  }],
  shape: {
    type: String,
    enum: ['round', 'oval', 'capsule', 'rectangular', 'other']
  },
  color: {
    type: String
  },
  imageUrl: {
    type: String
  },
  refillReminder: {
    enabled: {
      type: Boolean,
      default: false
    },
    daysBeforeRefill: {
      type: Number,
      default: 7
    },
    remainingQuantity: {
      type: Number
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient querying
medicationSchema.index({ user: 1, isActive: 1 });
medicationSchema.index({ user: 1, startDate: 1 });

module.exports = mongoose.model('Medication', medicationSchema);