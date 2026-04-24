const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// @route   POST /api/auth/register
// @desc    Register a new user
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be 6+ chars'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, skillLevel, preferredLanguage, targetRole } = req.body;
    try {
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ message: 'User already exists' });

      const user = await User.create({
        name,
        email,
        password,
        skillLevel: skillLevel || 'Beginner',
        preferredLanguage: preferredLanguage || 'C++',
        targetRole: targetRole || 'SDE',
      });

      // Add welcome notification
      user.notifications.push({
        message: '🎉 Welcome to GoalPath! Start your journey today.',
        type: 'achievement',
      });
      await user.save();

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        skillLevel: user.skillLevel,
        preferredLanguage: user.preferredLanguage,
        targetRole: user.targetRole,
        xp: user.xp,
        streak: user.streak,
        badges: user.badges,
        token: generateToken(user._id),
      });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// @route   POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        skillLevel: user.skillLevel,
        preferredLanguage: user.preferredLanguage,
        targetRole: user.targetRole,
        xp: user.xp,
        streak: user.streak,
        badges: user.badges,
        weakAreas: user.weakAreas,
        token: generateToken(user._id),
      });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// @route   GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const safeUser = { ...user };
  delete safeUser.password;
  res.json(safeUser);
});

// @route   PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, skillLevel, preferredLanguage, targetRole } = req.body;
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (skillLevel) user.skillLevel = skillLevel;
    if (preferredLanguage) user.preferredLanguage = preferredLanguage;
    if (targetRole) user.targetRole = targetRole;
    await user.save();
    res.json({ message: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   GET /api/auth/notifications
router.get('/notifications', protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const notifications = (user.notifications || []).sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
  res.json({ notifications });
});

// @route   PUT /api/auth/notifications/:id/read
router.put('/notifications/:id/read', protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const index = (user.notifications || []).findIndex((n) => n._id === req.params.id);
  if (index >= 0) {
    user.notifications[index].read = true;
  }
  await user.save();
  res.json({ message: 'Marked as read' });
});

module.exports = router;
