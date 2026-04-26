const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const DailyGoal = require('../models/DailyGoal');
const User = require('../models/User');

const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getToday = () => formatDate(new Date());

const getPreviousDate = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - 1);
  return formatDate(date);
};

const toIsoDate = (value) => {
  if (!value) return null;
  return formatDate(new Date(value));
};

const updateUserStreakForDate = (user, completedDate) => {
  const lastActiveDate = toIsoDate(user.lastActiveDate);

  if (lastActiveDate === completedDate) {
    return;
  }

  if (lastActiveDate === getPreviousDate(completedDate)) {
    user.streak += 1;
  } else {
    user.streak = 1;
  }

  user.lastActiveDate = new Date(`${completedDate}T12:00:00.000Z`);
};

const areAllGoalsCompleted = (dailyGoal) =>
  !!dailyGoal &&
  Array.isArray(dailyGoal.goals) &&
  dailyGoal.goals.length > 0 &&
  dailyGoal.goals.every((g) => g.completed);

const computeStreakPreview = (user, completedDate) => {
  const lastActiveDate = toIsoDate(user.lastActiveDate);
  const previousDate = getPreviousDate(completedDate);

  if (lastActiveDate === completedDate) {
    return {
      action: 'noop_same_day',
      currentStreak: user.streak,
      nextStreak: user.streak,
      lastActiveDate,
      previousDate,
      completedDate,
    };
  }

  if (lastActiveDate === previousDate) {
    return {
      action: 'increment',
      currentStreak: user.streak,
      nextStreak: user.streak + 1,
      lastActiveDate,
      previousDate,
      completedDate,
    };
  }

  return {
    action: 'reset_to_1',
    currentStreak: user.streak,
    nextStreak: 1,
    lastActiveDate,
    previousDate,
    completedDate,
  };
};

const normalizeGoalTitle = (title = '') =>
  title.trim().toLowerCase().replace(/\s+/g, ' ');

// Default goals generator based on user profile
const generateDefaultGoals = (user) => {
  const goals = [];
  if (user.skillLevel === 'Beginner') {
    goals.push({ type: 'DSA', title: 'Solve 1 Easy DSA Problem', xpReward: 10 });
    goals.push({ type: 'Reading', title: 'Read about Arrays/Strings basics', xpReward: 5 });
    goals.push({ type: 'DBMS', title: 'Learn 1 DBMS concept (Joins or Normalization)', xpReward: 10 });
  } else if (user.skillLevel === 'Intermediate') {
    goals.push({ type: 'DSA', title: 'Solve 2 DSA Problems (Medium)', xpReward: 20 });
    goals.push({ type: 'DBMS', title: 'Analyze 1 DBMS problem with optimization', xpReward: 20 });
    goals.push({ type: 'Project', title: 'Work on your current project for 1 hour', xpReward: 15 });
  } else {
    goals.push({ type: 'DSA', title: 'Solve 1 Hard + 1 Medium problem', xpReward: 40 });
    goals.push({ type: 'DBMS', title: 'Design a database schema for a real-world system', xpReward: 30 });
    goals.push({ type: 'Project', title: 'Implement a key feature in your project', xpReward: 25 });
    goals.push({ type: 'Revision', title: 'Revise 3 past weak area problems', xpReward: 15 });
  }
  return goals;
};

// @route   GET /api/goals/today
router.get('/today', protect, async (req, res) => {
  try {
    const today = getToday();
    let dailyGoal = await DailyGoal.findOne({ user: req.user._id, date: today });

    if (!dailyGoal) {
      const user = await User.findById(req.user._id);
      const defaultGoals = generateDefaultGoals(user);
      dailyGoal = await DailyGoal.create({
        user: req.user._id,
        date: today,
        goals: defaultGoals,
      });
    }

    res.json(dailyGoal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/goals/debug/streak
router.get('/debug/streak', protect, async (req, res) => {
  try {
    const today = getToday();
    const user = await User.findById(req.user._id);
    const dailyGoal = await DailyGoal.findOne({ user: req.user._id, date: today });

    const allDone = !!dailyGoal && (dailyGoal.goals || []).length > 0 && dailyGoal.goals.every((g) => g.completed);
    const preview = computeStreakPreview(user, today);

    res.json({
      userId: user._id,
      today,
      userStreak: user.streak,
      userLastActiveDate: toIsoDate(user.lastActiveDate),
      goalsFoundForToday: !!dailyGoal,
      goalsCount: dailyGoal?.goals?.length || 0,
      completedGoalsCount: dailyGoal?.goals?.filter((g) => g.completed).length || 0,
      streakMaintainedFlag: dailyGoal?.streakMaintained || false,
      allDone,
      preview,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/goals/today/add
router.post('/today/add', protect, async (req, res) => {
  try {
    const today = getToday();
    const { type, title, description, xpReward } = req.body;

    const cleanedTitle = (title || '').trim();
    if (!cleanedTitle) {
      return res.status(400).json({ message: 'Goal title is required' });
    }

    let dailyGoal = await DailyGoal.findOne({ user: req.user._id, date: today });
    if (!dailyGoal) {
      dailyGoal = await DailyGoal.create({ user: req.user._id, date: today, goals: [] });
    }

    const nextTitle = normalizeGoalTitle(cleanedTitle);
    const isDuplicate = (dailyGoal.goals || []).some((g) => normalizeGoalTitle(g.title) === nextTitle);
    if (isDuplicate) {
      return res.status(409).json({ message: 'This goal already exists for today' });
    }

    dailyGoal.goals.push({ type, title: cleanedTitle, description, xpReward: xpReward || 10 });
    await dailyGoal.save();
    res.json(dailyGoal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   DELETE /api/goals/today/:goalId
router.delete('/today/:goalId', protect, async (req, res) => {
  try {
    const today = getToday();
    const dailyGoal = await DailyGoal.findOne({ user: req.user._id, date: today });
    if (!dailyGoal) return res.status(404).json({ message: 'No goals for today' });

    const idx = (dailyGoal.goals || []).findIndex((g) => g._id === req.params.goalId);
    if (idx < 0) return res.status(404).json({ message: 'Goal not found' });

    const goal = dailyGoal.goals[idx];
    if (goal.completed) {
      return res.status(400).json({ message: 'Completed goals cannot be removed' });
    }

    dailyGoal.goals.splice(idx, 1);
    await dailyGoal.save();
    res.json(dailyGoal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/goals/today/:goalId/complete
router.put('/today/:goalId/complete', protect, async (req, res) => {
  try {
    const today = getToday();
    const dailyGoal = await DailyGoal.findOne({ user: req.user._id, date: today });
    if (!dailyGoal) return res.status(404).json({ message: 'No goals for today' });

    const goal = (dailyGoal.goals || []).find((g) => g._id === req.params.goalId);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    const applyDailyCompletionEffects = async (user, dailyGoalDoc) => {
      const lastActiveDate = toIsoDate(user.lastActiveDate);
      const previousDate = getPreviousDate(dailyGoalDoc.date);
      const previousDailyGoal = await DailyGoal.findOne({ user: req.user._id, date: previousDate });
      const previousDayCompleted = areAllGoalsCompleted(previousDailyGoal);

      if (lastActiveDate !== dailyGoalDoc.date) {
        if (previousDayCompleted) {
          if (lastActiveDate === previousDate) {
            user.streak += 1;
          } else {
            user.streak = 2;
          }
        } else {
          user.streak = 1;
        }
        user.lastActiveDate = new Date(`${dailyGoalDoc.date}T12:00:00.000Z`);
      }

      if (!dailyGoalDoc.streakMaintained) {
        user.xp += 25; // bonus XP for completing all goals
        user.notifications.push({
          message: 'All goals completed today. +25 bonus XP',
          type: 'achievement',
        });
        dailyGoalDoc.streakMaintained = true;
        await dailyGoalDoc.save();
      }
    };

    if (goal.completed) {
      const allDone = dailyGoal.goals.every((g) => g.completed);
      if (allDone) {
        const user = await User.findById(req.user._id);
        await applyDailyCompletionEffects(user, dailyGoal);
        await user.save();
      }
      return res.json({ dailyGoal, xpEarned: 0, allCompleted: allDone, message: 'Goal already completed' });
    }

    goal.completed = true;
    goal.completedAt = new Date();
    await dailyGoal.save();

    // Award XP
    const user = await User.findById(req.user._id);
    user.xp += goal.xpReward || 10;

    // Check if all goals done → streak reward
    const allDone = dailyGoal.goals.every((g) => g.completed);
    if (allDone) {
      await applyDailyCompletionEffects(user, dailyGoal);
    }

    await user.save();
    res.json({ dailyGoal, xpEarned: goal.xpReward, allCompleted: allDone });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/goals/history
router.get('/history', protect, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const from = new Date();
    from.setDate(from.getDate() - Number(days));
    const fromStr = from.toISOString().split('T')[0];

    const history = await DailyGoal.find(
      {
        user: req.user._id,
        dateGte: fromStr,
      },
      { orderBy: 'date DESC' }
    );

    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
