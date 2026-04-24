const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const DSAProblem = require('../models/DSAProblem');
const User = require('../models/User');

const XP_MAP = { Easy: 10, Medium: 20, Hard: 35 };

// Helper: check and award badges
const checkBadges = async (user, problems) => {
  const badges = [];
  const dpCount = problems.filter((p) => p.patternUsed === 'Dynamic Programming').length;
  const graphCount = problems.filter((p) => p.patternUsed === 'Graph BFS/DFS').length;
  const total = problems.length;

  const existingBadgeNames = user.badges.map((b) => b.name);

  if (dpCount >= 5 && !existingBadgeNames.includes('DP Warrior')) {
    badges.push({ name: 'DP Warrior', icon: '🧠' });
  }
  if (dpCount >= 15 && !existingBadgeNames.includes('DP Master')) {
    badges.push({ name: 'DP Master', icon: '🏆' });
  }
  if (graphCount >= 5 && !existingBadgeNames.includes('Graph Explorer')) {
    badges.push({ name: 'Graph Explorer', icon: '🗺️' });
  }
  if (total >= 10 && !existingBadgeNames.includes('Problem Solver')) {
    badges.push({ name: 'Problem Solver', icon: '⚡' });
  }
  if (total >= 50 && !existingBadgeNames.includes('DSA Champion')) {
    badges.push({ name: 'DSA Champion', icon: '🥇' });
  }

  if (badges.length > 0) {
    user.badges.push(...badges);
    badges.forEach((b) => {
      user.notifications.push({
        message: `🏆 Badge earned: "${b.name}" ${b.icon}`,
        type: 'achievement',
      });
    });
    await user.save();
  }
  return badges;
};

// @route   GET /api/dsa
router.get('/', protect, async (req, res) => {
  try {
    const { pattern, difficulty, status, page = 1, limit = 20 } = req.query;
    const filter = { user: req.user._id };
    if (pattern) filter.patternUsed = pattern;
    if (difficulty) filter.difficulty = difficulty;
    if (status) filter.status = status;

    const total = await DSAProblem.countDocuments(filter);
    const problems = await DSAProblem.find(filter, {
      orderBy: 'created_at DESC',
      offset: (Number(page) - 1) * Number(limit),
      limit: Number(limit),
    });

    res.json({ problems, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/dsa
router.post('/', protect, async (req, res) => {
  try {
    const { title, link, difficulty, patternUsed, topic, learningInsight, mistakesMade, optimizationIdea, timeTaken, status } = req.body;

    if (!title || !difficulty || !patternUsed) {
      return res.status(400).json({ message: 'Title, difficulty, and pattern are required' });
    }

    const xpEarned = XP_MAP[difficulty] || 10;
    const problem = await DSAProblem.create({
      user: req.user._id,
      title, link, difficulty, patternUsed, topic,
      learningInsight, mistakesMade, optimizationIdea,
      timeTaken: timeTaken || 0,
      status: status || 'Solved',
      xpEarned,
    });

    // Update user XP
    const user = await User.findById(req.user._id);
    user.xp += xpEarned;

    // Update weak areas based on patterns
    const allProblems = await DSAProblem.find({ user: req.user._id });
    const patternCounts = {};
    allProblems.forEach((p) => {
      patternCounts[p.patternUsed] = (patternCounts[p.patternUsed] || 0) + 1;
    });

    const allPatterns = ['Dynamic Programming', 'Graph BFS/DFS', 'Binary Search', 'Sliding Window', 'Two Pointer', 'Greedy', 'Backtracking'];
    const weak = allPatterns.filter((p) => (patternCounts[p] || 0) < 3);
    user.weakAreas = weak;

    const newBadges = await checkBadges(user, allProblems);
    await user.save();

    res.status(201).json({ problem, xpEarned, newBadges });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/dsa/stats
router.get('/stats', protect, async (req, res) => {
  try {
    const problems = await DSAProblem.find({ user: req.user._id });

    const patternStats = {};
    const difficultyStats = { Easy: 0, Medium: 0, Hard: 0 };
    const topicStats = {};

    problems.forEach((p) => {
      patternStats[p.patternUsed] = (patternStats[p.patternUsed] || 0) + 1;
      difficultyStats[p.difficulty] = (difficultyStats[p.difficulty] || 0) + 1;
      topicStats[p.topic] = (topicStats[p.topic] || 0) + 1;
    });

    res.json({
      total: problems.length,
      patternStats,
      difficultyStats,
      topicStats,
      recentProblems: problems.slice(-5).reverse(),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/dsa/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const problem = await DSAProblem.findOne({ _id: req.params.id, user: req.user._id });
    if (!problem) return res.status(404).json({ message: 'Problem not found' });
    res.json(problem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/dsa/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const problem = await DSAProblem.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    if (!problem) return res.status(404).json({ message: 'Problem not found' });
    res.json(problem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   DELETE /api/dsa/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const problem = await DSAProblem.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!problem) return res.status(404).json({ message: 'Problem not found' });
    res.json({ message: 'Problem deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
