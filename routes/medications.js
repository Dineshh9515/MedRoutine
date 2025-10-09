const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Medication = require('../models/Medication');
const { protect } = require('../middleware/auth');

// @route   GET /api/medications
// @desc    Get all medications for logged in user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { isActive, startDate, endDate } = req.query;
    
    const query = { user: req.user.id };
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (startDate) {
      query.startDate = { $gte: new Date(startDate) };
    }
    
    if (endDate) {
      query.endDate = { $lte: new Date(endDate) };
    }

    const medications = await Medication.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: medications.length,
      data: { medications }
    });
  } catch (error) {
    console.error('Get medications error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/medications/:id
// @desc    Get single medication
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const medication = await Medication.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!medication) {
      return res.status(404).json({ success: false, message: 'Medication not found' });
    }

    res.json({
      success: true,
      data: { medication }
    });
  } catch (error) {
    console.error('Get medication error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/medications
// @desc    Create new medication
// @access  Private
router.post('/', protect, [
  body('name').trim().notEmpty().withMessage('Medication name is required'),
  body('dosage.amount').isNumeric().withMessage('Dosage amount must be a number'),
  body('dosage.unit').notEmpty().withMessage('Dosage unit is required'),
  body('frequency').notEmpty().withMessage('Frequency is required'),
  body('schedule').isArray({ min: 1 }).withMessage('At least one schedule time is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const medicationData = {
      ...req.body,
      user: req.user.id
    };

    const medication = await Medication.create(medicationData);

    res.status(201).json({
      success: true,
      message: 'Medication created successfully',
      data: { medication }
    });
  } catch (error) {
    console.error('Create medication error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/medications/:id
// @desc    Update medication
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let medication = await Medication.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!medication) {
      return res.status(404).json({ success: false, message: 'Medication not found' });
    }

    medication = await Medication.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Medication updated successfully',
      data: { medication }
    });
  } catch (error) {
    console.error('Update medication error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/medications/:id
// @desc    Delete medication
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const medication = await Medication.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!medication) {
      return res.status(404).json({ success: false, message: 'Medication not found' });
    }

    await medication.deleteOne();

    res.json({
      success: true,
      message: 'Medication deleted successfully'
    });
  } catch (error) {
    console.error('Delete medication error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PATCH /api/medications/:id/toggle-active
// @desc    Toggle medication active status
// @access  Private
router.patch('/:id/toggle-active', protect, async (req, res) => {
  try {
    const medication = await Medication.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!medication) {
      return res.status(404).json({ success: false, message: 'Medication not found' });
    }

    medication.isActive = !medication.isActive;
    await medication.save();

    res.json({
      success: true,
      message: `Medication ${medication.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { medication }
    });
  } catch (error) {
    console.error('Toggle medication error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;