const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const DSAProblem = require('../models/DSAProblem');
const DBMSAnalysis = require('../models/DBMSAnalysis');
const Project = require('../models/Project');
const DailyGoal = require('../models/DailyGoal');
const User = require('../models/User');

// @route   GET /api/analytics/overview
router.get('/overview', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const [user, dsaProblems, dbmsAnalyses, projects, last30Goals] = await Promise.all([
      User.findById(userId),
      DSAProblem.find({ user: userId }),
      DBMSAnalysis.find({ user: userId }),
      Project.find({ user: userId }),
      DailyGoal.find({ user: userId }, { orderBy: 'date DESC', limit: 30 }),
    ]);

    // DSA stats
    const patternStats = {};
    const difficultyStats = { Easy: 0, Medium: 0, Hard: 0 };
    dsaProblems.forEach((p) => {
      patternStats[p.patternUsed] = (patternStats[p.patternUsed] || 0) + 1;
      difficultyStats[p.difficulty]++;
    });

    // DBMS stats
    const conceptStats = {};
    dbmsAnalyses.forEach((a) => {
      a.conceptUsed.forEach((c) => {
        conceptStats[c] = (conceptStats[c] || 0) + 1;
      });
    });

    // Project stats
    const projectConceptCoverage = {};
    const projectStatusStats = { Planning: 0, 'In Progress': 0, Completed: 0, 'On Hold': 0 };
    projects.forEach((p) => {
      projectStatusStats[p.status]++;
      p.conceptsUsed.forEach((c) => {
        projectConceptCoverage[c.subject] = (projectConceptCoverage[c.subject] || 0) + 1;
      });
    });

    // Streak / activity heatmap
    const activityMap = {};
    last30Goals.forEach((g) => {
      activityMap[g.date] = {
        total: g.totalGoals,
        completed: g.completedGoals,
        xp: g.xpEarned,
      };
    });

    // Suggestions / weak areas
    const allPatterns = ['Dynamic Programming', 'Graph BFS/DFS', 'Binary Search', 'Sliding Window', 'Two Pointer', 'Greedy'];
    const suggestions = [];
    allPatterns.forEach((p) => {
      const count = patternStats[p] || 0;
      if (count < 3) suggestions.push({ type: 'DSA', message: `Practice more ${p} problems (only ${count} solved)` });
    });

    const dbmsConcepts = ['Normalization', 'Indexing', 'Transactions (ACID)', 'Joins'];
    dbmsConcepts.forEach((c) => {
      const count = conceptStats[c] || 0;
      if (count < 2) suggestions.push({ type: 'DBMS', message: `Learn more about ${c} (only ${count} analyses)` });
    });

    if (projects.length === 0) {
      suggestions.push({ type: 'Project', message: 'Start a project to apply your learning!' });
    }

    res.json({
      user: {
        name: user.name,
        xp: user.xp,
        streak: user.streak,
        skillLevel: user.skillLevel,
        badges: user.badges,
        weakAreas: user.weakAreas,
      },
      dsa: {
        total: dsaProblems.length,
        patternStats,
        difficultyStats,
        recentProblems: dsaProblems.slice(-5).reverse().map((p) => ({
          title: p.title,
          difficulty: p.difficulty,
          patternUsed: p.patternUsed,
          solvedAt: p.createdAt,
        })),
      },
      dbms: {
        total: dbmsAnalyses.length,
        conceptStats,
        recentAnalyses: dbmsAnalyses.slice(-5).reverse().map((a) => ({
          title: a.title,
          problemType: a.problemType,
          conceptUsed: a.conceptUsed,
          solvedAt: a.createdAt,
        })),
      },
      projects: {
        total: projects.length,
        statusStats: projectStatusStats,
        conceptCoverage: projectConceptCoverage,
        list: projects.map((p) => ({
          name: p.name,
          status: p.status,
          progress: p.progress,
          techStack: p.techStack,
        })),
      },
      activity: {
        last30Days: activityMap,
        totalGoalsCompleted: last30Goals.reduce((s, g) => s + g.completedGoals, 0),
        totalXpLast30Days: last30Goals.reduce((s, g) => s + g.xpEarned, 0),
      },
      suggestions: suggestions.slice(0, 5),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
