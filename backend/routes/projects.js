const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Project = require('../models/Project');
const User = require('../models/User');

// Helper: check project badges
const checkProjectBadges = async (user, projects) => {
  const badges = [];
  const existingBadgeNames = user.badges.map((b) => b.name);
  const completed = projects.filter((p) => p.status === 'Completed').length;

  if (projects.length >= 1 && !existingBadgeNames.includes('Project Starter')) {
    badges.push({ name: 'Project Starter', icon: '🚀' });
  }
  if (completed >= 1 && !existingBadgeNames.includes('Project Builder')) {
    badges.push({ name: 'Project Builder', icon: '🏗️' });
  }
  if (completed >= 3 && !existingBadgeNames.includes('Project Master')) {
    badges.push({ name: 'Project Master', icon: '🌟' });
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

// @route   GET /api/projects
router.get('/', protect, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;
    const projects = await Project.find(filter).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/projects
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, techStack, features, conceptsUsed, learningMapping, githubLink, liveLink } = req.body;

    if (!name || !description) {
      return res.status(400).json({ message: 'Name and description are required' });
    }

    const project = await Project.create({
      user: req.user._id,
      name, description,
      techStack: techStack || [],
      features: features || [],
      conceptsUsed: conceptsUsed || [],
      learningMapping: learningMapping || [],
      githubLink, liveLink,
      xpEarned: 50,
    });

    const user = await User.findById(req.user._id);
    user.xp += 50;

    const allProjects = await Project.find({ user: req.user._id });
    const newBadges = await checkProjectBadges(user, allProjects);
    await user.save();

    res.status(201).json({ project, xpEarned: 50, newBadges });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/projects/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, user: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/projects/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, user: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const previousStatus = project.status;

    Object.assign(project, req.body);

    // If newly completed, award extra XP
    if (req.body.status === 'Completed' && previousStatus !== 'Completed') {
      const user = await User.findById(req.user._id);
      user.xp += 100;
      user.notifications.push({
        message: `🎉 Project "${project.name}" completed! +100 XP`,
        type: 'achievement',
      });
      await user.save();
    }

    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/projects/:id/feature/:featureId
router.put('/:id/feature/:featureId', protect, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, user: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const feature = (project.features || []).find((f) => f._id === req.params.featureId);
    if (!feature) return res.status(404).json({ message: 'Feature not found' });

    feature.status = req.body.status || feature.status;
    if (req.body.status === 'Done') feature.completedAt = new Date();

    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   DELETE /api/projects/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
