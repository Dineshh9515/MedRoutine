const express = require('express');
const router = express.Router();
const Reminder = require('../models/Reminder');
const Medication = require('../models/Medication');
const { protect } = require('../middleware/auth');

// @route   GET /api/reminders
// @desc    Get all reminders for logged in user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, startDate, endDate, medicationId } = req.query;
    
    const query = { user: req.user.id };
    
    if (status) {
      query.status = status;
    }
    
    if (startDate && endDate) {
      query.scheduledTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.scheduledTime = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.scheduledTime = { $lte: new Date(endDate) };
    }
    
    if (medicationId) {
      query.medication = medicationId;
    }

    const reminders = await Reminder.find(query)
      .populate('medication', 'name dosage frequency')
      .sort({ scheduledTime: -1 });

    res.json({
      success: true,
      count: reminders.length,
      data: { reminders }
    });
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/reminders/today
// @desc    Get today's reminders
// @access  Private
router.get('/today', protect, async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const reminders = await Reminder.find({
      user: req.user.id,
      scheduledTime: { $gte: startOfDay, $lte: endOfDay }
    })
    .populate('medication', 'name dosage frequency imageUrl')
    .sort({ scheduledTime: 1 });

    res.json({
      success: true,
      count: reminders.length,
      data: { reminders }
    });
  } catch (error) {
    console.error('Get today reminders error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/reminders/upcoming
// @desc    Get upcoming reminders (next 7 days)
// @access  Private
router.get('/upcoming', protect, async (req, res) => {
  try {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const reminders = await Reminder.find({
      user: req.user.id,
      scheduledTime: { $gte: now, $lte: nextWeek },
      status: 'pending'
    })
    .populate('medication', 'name dosage frequency')
    .sort({ scheduledTime: 1 })
    .limit(20);

    res.json({
      success: true,
      count: reminders.length,
      data: { reminders }
    });
  } catch (error) {
    console.error('Get upcoming reminders error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/reminders
// @desc    Create a new reminder
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { medicationId, scheduledTime } = req.body;

    // Verify medication belongs to user
    const medication = await Medication.findOne({
      _id: medicationId,
      user: req.user.id
    });

    if (!medication) {
      return res.status(404).json({ success: false, message: 'Medication not found' });
    }

    const reminder = await Reminder.create({
      user: req.user.id,
      medication: medicationId,
      scheduledTime: new Date(scheduledTime)
    });

    const populatedReminder = await Reminder.findById(reminder._id)
      .populate('medication', 'name dosage frequency');

    res.status(201).json({
      success: true,
      message: 'Reminder created successfully',
      data: { reminder: populatedReminder }
    });
  } catch (error) {
    console.error('Create reminder error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PATCH /api/reminders/:id/taken
// @desc    Mark reminder as taken
// @access  Private
router.patch('/:id/taken', protect, async (req, res) => {
  try {
    const reminder = await Reminder.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }

    const { dosage, notes } = req.body;
    await reminder.markAsTaken(dosage, notes);

    const populatedReminder = await Reminder.findById(reminder._id)
      .populate('medication', 'name dosage frequency');

    res.json({
      success: true,
      message: 'Reminder marked as taken',
      data: { reminder: populatedReminder }
    });
  } catch (error) {
    console.error('Mark taken error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PATCH /api/reminders/:id/missed
// @desc    Mark reminder as missed
// @access  Private
router.patch('/:id/missed', protect, async (req, res) => {
  try {
    const reminder = await Reminder.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }

    await reminder.markAsMissed();

    res.json({
      success: true,
      message: 'Reminder marked as missed',
      data: { reminder }
    });
  } catch (error) {
    console.error('Mark missed error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PATCH /api/reminders/:id/snooze
// @desc    Snooze reminder
// @access  Private
router.patch('/:id/snooze', protect, async (req, res) => {
  try {
    const reminder = await Reminder.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }

    const { minutes = 15 } = req.body;
    await reminder.snooze(minutes);

    res.json({
      success: true,
      message: `Reminder snoozed for ${minutes} minutes`,
      data: { reminder }
    });
  } catch (error) {
    console.error('Snooze reminder error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PATCH /api/reminders/:id/skip
// @desc    Skip reminder
// @access  Private
router.patch('/:id/skip', protect, async (req, res) => {
  try {
    const reminder = await Reminder.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }

    reminder.status = 'skipped';
    await reminder.save();

    res.json({
      success: true,
      message: 'Reminder skipped',
      data: { reminder }
    });
  } catch (error) {
    console.error('Skip reminder error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/reminders/stats
// @desc    Get reminder statistics
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = { user: req.user.id };
    
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
        adherenceRate: parseFloat(adherenceRate)
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;