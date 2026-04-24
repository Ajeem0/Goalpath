const { randomUUID } = require('crypto');
const connectDB = require('../config/db');

const pool = connectDB.pool;

const normalizeFeatures = (features = []) =>
  features.map((feature) => ({
    _id: feature._id || randomUUID(),
    name: feature.name || '',
    description: feature.description || '',
    status: feature.status || 'Not Started',
    completedAt: feature.completedAt || null,
  }));

const mapRow = (row) => {
  if (!row) return null;

  const project = {
    _id: row.id,
    user: row.user_id,
    name: row.name,
    description: row.description,
    techStack: row.tech_stack || [],
    status: row.status,
    progress: row.progress,
    features: normalizeFeatures(row.features || []),
    conceptsUsed: row.concepts_used || [],
    learningMapping: row.learning_mapping || [],
    githubLink: row.github_link,
    liveLink: row.live_link,
    xpEarned: row.xp_earned,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  project.save = async () => {
    project.features = normalizeFeatures(project.features || []);
    if (project.features.length > 0) {
      const done = project.features.filter((f) => f.status === 'Done').length;
      project.progress = Math.round((done / project.features.length) * 100);
    }

    const { rows } = await pool.query(
      `UPDATE projects
       SET name = $1,
           description = $2,
           tech_stack = $3::jsonb,
           status = $4,
           progress = $5,
           features = $6::jsonb,
           concepts_used = $7::jsonb,
           learning_mapping = $8::jsonb,
           github_link = $9,
           live_link = $10,
           xp_earned = $11,
           updated_at = NOW()
       WHERE id = $12
       RETURNING *`,
      [
        project.name,
        project.description,
        JSON.stringify(project.techStack || []),
        project.status || 'Planning',
        project.progress || 0,
        JSON.stringify(project.features || []),
        JSON.stringify(project.conceptsUsed || []),
        JSON.stringify(project.learningMapping || []),
        project.githubLink || '',
        project.liveLink || '',
        project.xpEarned || 0,
        project._id,
      ]
    );

    const updated = mapRow(rows[0]);
    Object.assign(project, updated);
    return project;
  };

  return project;
};

const buildWhere = (filter = {}) => {
  const clauses = [];
  const values = [];

  if (filter._id) {
    values.push(filter._id);
    clauses.push(`id = $${values.length}`);
  }
  if (filter.user) {
    values.push(filter.user);
    clauses.push(`user_id = $${values.length}`);
  }
  if (filter.status) {
    values.push(filter.status);
    clauses.push(`status = $${values.length}`);
  }

  return {
    whereSql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    values,
  };
};

class Project {
  static async find(filter = {}, options = {}) {
    const { whereSql, values } = buildWhere(filter);
    const orderBy = options.orderBy || 'created_at DESC';
    const { rows } = await pool.query(`SELECT * FROM projects ${whereSql} ORDER BY ${orderBy}`, values);
    return rows.map(mapRow);
  }

  static async findOne(filter = {}) {
    const { whereSql, values } = buildWhere(filter);
    const { rows } = await pool.query(`SELECT * FROM projects ${whereSql} ORDER BY created_at DESC LIMIT 1`, values);
    return mapRow(rows[0]);
  }

  static async create(data) {
    const id = randomUUID();
    const features = normalizeFeatures(data.features || []);
    const progress = features.length > 0
      ? Math.round((features.filter((f) => f.status === 'Done').length / features.length) * 100)
      : (data.progress || 0);

    const { rows } = await pool.query(
      `INSERT INTO projects (
        id, user_id, name, description, tech_stack, status, progress,
        features, concepts_used, learning_mapping, github_link, live_link,
        xp_earned, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5::jsonb, $6, $7,
        $8::jsonb, $9::jsonb, $10::jsonb, $11, $12,
        $13, NOW(), NOW()
      ) RETURNING *`,
      [
        id,
        data.user,
        data.name,
        data.description,
        JSON.stringify(data.techStack || []),
        data.status || 'Planning',
        progress,
        JSON.stringify(features),
        JSON.stringify(data.conceptsUsed || []),
        JSON.stringify(data.learningMapping || []),
        data.githubLink || '',
        data.liveLink || '',
        data.xpEarned || 0,
      ]
    );

    return mapRow(rows[0]);
  }

  static async findOneAndDelete(filter = {}) {
    const { whereSql, values } = buildWhere(filter);
    const { rows } = await pool.query(`DELETE FROM projects ${whereSql} RETURNING *`, values);
    return mapRow(rows[0]);
  }
}

module.exports = Project;
