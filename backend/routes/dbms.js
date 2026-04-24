const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const DBMSAnalysis = require('../models/DBMSAnalysis');
const User = require('../models/User');

const XP_MAP = { Easy: 10, Medium: 20, Hard: 35 };

// Helper: check DBMS badges
const checkDBMSBadges = async (user, analyses) => {
  const badges = [];
  const total = analyses.length;
  const existingBadgeNames = user.badges.map((b) => b.name);

  const transactionCount = analyses.filter((a) => a.conceptUsed.includes('Transactions (ACID)')).length;
  const indexingCount = analyses.filter((a) => a.conceptUsed.includes('Indexing')).length;

  if (total >= 5 && !existingBadgeNames.includes('DBMS Starter')) {
    badges.push({ name: 'DBMS Starter', icon: '🗄️' });
  }
  if (total >= 15 && !existingBadgeNames.includes('DBMS Expert')) {
    badges.push({ name: 'DBMS Expert', icon: '💾' });
  }
  if (transactionCount >= 5 && !existingBadgeNames.includes('Transaction Master')) {
    badges.push({ name: 'Transaction Master', icon: '🔐' });
  }
  if (indexingCount >= 5 && !existingBadgeNames.includes('Index Optimizer')) {
    badges.push({ name: 'Index Optimizer', icon: '⚡' });
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

// @route   GET /api/dbms
router.get('/', protect, async (req, res) => {
  try {
    const { type, concept, difficulty, page = 1, limit = 20 } = req.query;
    const filter = { user: req.user._id };
    if (type) filter.problemType = type;
    if (concept) filter.conceptUsedIn = concept;
    if (difficulty) filter.difficulty = difficulty;

    const total = await DBMSAnalysis.countDocuments(filter);
    const analyses = await DBMSAnalysis.find(filter, {
      orderBy: 'created_at DESC',
      offset: (Number(page) - 1) * Number(limit),
      limit: Number(limit),
    });

    res.json({ analyses, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/dbms
router.post('/', protect, async (req, res) => {
  try {
    const {
      title, problemType, problemStatement, conceptUsed,
      approachExplanation, alternativeApproach, optimizationInsight,
      indexUsed, realWorldMapping, sqlQuery, difficulty,
    } = req.body;

    if (!title || !problemType || !problemStatement) {
      return res.status(400).json({ message: 'Title, type, and problem statement are required' });
    }

    const xpEarned = XP_MAP[difficulty] || 20;
    const analysis = await DBMSAnalysis.create({
      user: req.user._id,
      title, problemType, problemStatement, conceptUsed: conceptUsed || [],
      approachExplanation, alternativeApproach, optimizationInsight,
      indexUsed, realWorldMapping, sqlQuery,
      difficulty: difficulty || 'Medium',
      xpEarned,
    });

    const user = await User.findById(req.user._id);
    user.xp += xpEarned;

    const allAnalyses = await DBMSAnalysis.find({ user: req.user._id });
    const newBadges = await checkDBMSBadges(user, allAnalyses);
    await user.save();

    res.status(201).json({ analysis, xpEarned, newBadges });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/dbms/stats
router.get('/stats', protect, async (req, res) => {
  try {
    const analyses = await DBMSAnalysis.find({ user: req.user._id });

    const conceptStats = {};
    const typeStats = {};

    analyses.forEach((a) => {
      a.conceptUsed.forEach((c) => {
        conceptStats[c] = (conceptStats[c] || 0) + 1;
      });
      typeStats[a.problemType] = (typeStats[a.problemType] || 0) + 1;
    });

    res.json({
      total: analyses.length,
      conceptStats,
      typeStats,
      recentAnalyses: analyses.slice(-5).reverse(),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/dbms/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const analysis = await DBMSAnalysis.findOne({ _id: req.params.id, user: req.user._id });
    if (!analysis) return res.status(404).json({ message: 'Analysis not found' });
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/dbms/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const analysis = await DBMSAnalysis.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    if (!analysis) return res.status(404).json({ message: 'Analysis not found' });
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   DELETE /api/dbms/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const analysis = await DBMSAnalysis.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!analysis) return res.status(404).json({ message: 'Analysis not found' });
    res.json({ message: 'Analysis deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
