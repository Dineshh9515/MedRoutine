const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// @route   GET /api/users/search
// @desc    Search users by email (for caregiver invitations)
// @access  Private
router.get('/search', protect, async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email query parameter is required' });
    }

    const user = await User.findOne({ email }).select('firstName lastName email profileImage');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Search user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      data: { user: user.getPublicProfile() }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/users/account
// @desc    Deactivate user account
// @access  Private
router.delete('/account', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;