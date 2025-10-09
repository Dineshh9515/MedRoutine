const express = require('express');
const router = express.Router();
const Caregiver = require('../models/Caregiver');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @route   GET /api/caregivers
// @desc    Get all caregivers for logged in user (as patient)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const caregivers = await Caregiver.find({ patient: req.user.id })
      .populate('caregiver', 'firstName lastName email phone profileImage')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: caregivers.length,
      data: { caregivers }
    });
  } catch (error) {
    console.error('Get caregivers error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/caregivers/patients
// @desc    Get all patients user is caregiver for
// @access  Private
router.get('/patients', protect, async (req, res) => {
  try {
    const patients = await Caregiver.find({ caregiver: req.user.id, status: 'active' })
      .populate('patient', 'firstName lastName email phone profileImage')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: patients.length,
      data: { patients }
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/caregivers/invite
// @desc    Invite a caregiver
// @access  Private
router.post('/invite', protect, async (req, res) => {
  try {
    const { email, relationship, permissions } = req.body;

    // Find caregiver by email
    const caregiverUser = await User.findOne({ email });
    if (!caregiverUser) {
      return res.status(404).json({ success: false, message: 'User not found with this email' });
    }

    // Check if user is trying to add themselves
    if (caregiverUser._id.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot add yourself as a caregiver' });
    }

    // Check if relationship already exists
    const existingCaregiver = await Caregiver.findOne({
      patient: req.user.id,
      caregiver: caregiverUser._id
    });

    if (existingCaregiver) {
      return res.status(400).json({ success: false, message: 'Caregiver relationship already exists' });
    }

    const caregiver = await Caregiver.create({
      patient: req.user.id,
      caregiver: caregiverUser._id,
      relationship,
      permissions: permissions || {}
    });

    const populatedCaregiver = await Caregiver.findById(caregiver._id)
      .populate('caregiver', 'firstName lastName email phone');

    res.status(201).json({
      success: true,
      message: 'Caregiver invitation sent successfully',
      data: { caregiver: populatedCaregiver }
    });
  } catch (error) {
    console.error('Invite caregiver error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PATCH /api/caregivers/:id/accept
// @desc    Accept caregiver invitation
// @access  Private
router.patch('/:id/accept', protect, async (req, res) => {
  try {
    const caregiver = await Caregiver.findOne({
      _id: req.params.id,
      caregiver: req.user.id,
      status: 'pending'
    });

    if (!caregiver) {
      return res.status(404).json({ success: false, message: 'Invitation not found' });
    }

    await caregiver.acceptInvitation();

    const populatedCaregiver = await Caregiver.findById(caregiver._id)
      .populate('patient', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Invitation accepted successfully',
      data: { caregiver: populatedCaregiver }
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PATCH /api/caregivers/:id/decline
// @desc    Decline caregiver invitation
// @access  Private
router.patch('/:id/decline', protect, async (req, res) => {
  try {
    const caregiver = await Caregiver.findOne({
      _id: req.params.id,
      caregiver: req.user.id,
      status: 'pending'
    });

    if (!caregiver) {
      return res.status(404).json({ success: false, message: 'Invitation not found' });
    }

    await caregiver.declineInvitation();

    res.json({
      success: true,
      message: 'Invitation declined'
    });
  } catch (error) {
    console.error('Decline invitation error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PATCH /api/caregivers/:id/revoke
// @desc    Revoke caregiver access (patient only)
// @access  Private
router.patch('/:id/revoke', protect, async (req, res) => {
  try {
    const caregiver = await Caregiver.findOne({
      _id: req.params.id,
      patient: req.user.id
    });

    if (!caregiver) {
      return res.status(404).json({ success: false, message: 'Caregiver relationship not found' });
    }

    await caregiver.revokeAccess();

    res.json({
      success: true,
      message: 'Caregiver access revoked successfully'
    });
  } catch (error) {
    console.error('Revoke access error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/caregivers/:id/permissions
// @desc    Update caregiver permissions (patient only)
// @access  Private
router.put('/:id/permissions', protect, async (req, res) => {
  try {
    const caregiver = await Caregiver.findOne({
      _id: req.params.id,
      patient: req.user.id
    });

    if (!caregiver) {
      return res.status(404).json({ success: false, message: 'Caregiver relationship not found' });
    }

    caregiver.permissions = { ...caregiver.permissions, ...req.body };
    await caregiver.save();

    res.json({
      success: true,
      message: 'Permissions updated successfully',
      data: { caregiver }
    });
  } catch (error) {
    console.error('Update permissions error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/caregivers/pending
// @desc    Get pending caregiver invitations
// @access  Private
router.get('/pending', protect, async (req, res) => {
  try {
    const pendingInvitations = await Caregiver.find({
      caregiver: req.user.id,
      status: 'pending'
    })
    .populate('patient', 'firstName lastName email phone')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: pendingInvitations.length,
      data: { invitations: pendingInvitations }
    });
  } catch (error) {
    console.error('Get pending invitations error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;