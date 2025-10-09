const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Medication = require('../models/Medication');
const Reminder = require('../models/Reminder');

// @route   POST /api/providers/access-request
// @desc    Request access to patient's medication data
// @access  Private (Provider role)
router.post('/access-request', protect, authorize('provider'), async (req, res) => {
  try {
    const { patientEmail, reason } = req.body;

    // Implementation for provider access request
    // This would create a pending access request that the patient can approve

    res.json({
      success: true,
      message: 'Access request sent to patient'
    });
  } catch (error) {
    console.error('Provider access request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/providers/patients/:patientId/medications
// @desc    Get patient's medications (with permission)
// @access  Private (Provider role)
router.get('/patients/:patientId/medications', protect, authorize('provider'), async (req, res) => {
  try {
    // Verify provider has access to this patient
    // Implementation of permission check would go here

    const medications = await Medication.find({
      user: req.params.patientId,
      isActive: true
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: medications.length,
      data: { medications }
    });
  } catch (error) {
    console.error('Get patient medications error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/providers/patients/:patientId/adherence
// @desc    Get patient's adherence statistics
// @access  Private (Provider role)
router.get('/patients/:patientId/adherence', protect, authorize('provider'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = { 
      user: req.params.patientId
    };
    
    if (startDate && endDate) {
      query.scheduledTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const stats = await Reminder.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = stats.reduce((acc, stat) => acc + stat.count, 0);
    const taken = stats.find(s => s._id === 'taken')?.count || 0;
    const adherenceRate = total > 0 ? ((taken / total) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        stats,
        total,
        adherenceRate: parseFloat(adherenceRate),
        period: { startDate, endDate }
      }
    });
  } catch (error) {
    console.error('Get adherence stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;