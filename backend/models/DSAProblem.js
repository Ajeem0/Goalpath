const { randomUUID } = require('crypto');
const connectDB = require('../config/db');

const pool = connectDB.pool;

const mapRow = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    user: row.user_id,
    title: row.title,
    link: row.link,
    difficulty: row.difficulty,
    patternUsed: row.pattern_used,
    topic: row.topic,
    learningInsight: row.learning_insight,
    mistakesMade: row.mistakes_made,
    optimizationIdea: row.optimization_idea,
    timeTaken: row.time_taken,
    solvedAt: row.solved_at,
    status: row.status,
    xpEarned: row.xp_earned,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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
  if (filter.patternUsed) {
    values.push(filter.patternUsed);
    clauses.push(`pattern_used = $${values.length}`);
  }
  if (filter.difficulty) {
    values.push(filter.difficulty);
    clauses.push(`difficulty = $${values.length}`);
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

class DSAProblem {
  static async countDocuments(filter = {}) {
    const { whereSql, values } = buildWhere(filter);
    const { rows } = await pool.query(`SELECT COUNT(*)::int AS count FROM dsa_problems ${whereSql}`, values);
    return rows[0]?.count || 0;
  }

  static async find(filter = {}, options = {}) {
    const { whereSql, values } = buildWhere(filter);
    const orderBy = options.orderBy || 'created_at DESC';
    const limit = Number(options.limit || 0);
    const offset = Number(options.offset || 0);
    let sql = `SELECT * FROM dsa_problems ${whereSql} ORDER BY ${orderBy}`;

    if (limit > 0) {
      values.push(limit);
      sql += ` LIMIT $${values.length}`;
    }
    if (offset > 0) {
      values.push(offset);
      sql += ` OFFSET $${values.length}`;
    }

    const { rows } = await pool.query(sql, values);
    return rows.map(mapRow);
  }

  static async findOne(filter = {}) {
    const rows = await this.find(filter, { limit: 1 });
    return rows[0] || null;
  }

  static async create(data) {
    const id = randomUUID();
    const { rows } = await pool.query(
      `INSERT INTO dsa_problems (
        id, user_id, title, link, difficulty, pattern_used, topic, learning_insight,
        mistakes_made, optimization_idea, time_taken, solved_at, status, xp_earned,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, COALESCE($12, NOW()), $13, $14,
        NOW(), NOW()
      ) RETURNING *`,
      [
        id,
        data.user,
        data.title,
        data.link || '',
        data.difficulty,
        data.patternUsed,
        data.topic || 'Arrays',
        data.learningInsight || '',
        data.mistakesMade || '',
        data.optimizationIdea || '',
        data.timeTaken || 0,
        data.solvedAt || null,
        data.status || 'Solved',
        data.xpEarned || 0,
      ]
    );

    return mapRow(rows[0]);
  }

  static async findOneAndUpdate(filter = {}, data = {}, options = {}) {
    const existing = await this.findOne(filter);
    if (!existing) return null;

    const merged = {
      ...existing,
      ...data,
      _id: existing._id,
      user: existing.user,
    };

    const { rows } = await pool.query(
      `UPDATE dsa_problems
       SET title = $1,
           link = $2,
           difficulty = $3,
           pattern_used = $4,
           topic = $5,
           learning_insight = $6,
           mistakes_made = $7,
           optimization_idea = $8,
           time_taken = $9,
           solved_at = $10,
           status = $11,
           xp_earned = $12,
           updated_at = NOW()
       WHERE id = $13
       RETURNING *`,
      [
        merged.title,
        merged.link || '',
        merged.difficulty,
        merged.patternUsed,
        merged.topic || 'Arrays',
        merged.learningInsight || '',
        merged.mistakesMade || '',
        merged.optimizationIdea || '',
        merged.timeTaken || 0,
        merged.solvedAt || new Date(),
        merged.status || 'Solved',
        merged.xpEarned || 0,
        existing._id,
      ]
    );

    return options.new ? mapRow(rows[0]) : existing;
  }

  static async findOneAndDelete(filter = {}) {
    const { whereSql, values } = buildWhere(filter);
    const { rows } = await pool.query(`DELETE FROM dsa_problems ${whereSql} RETURNING *`, values);
    return mapRow(rows[0]);
  }
}

module.exports = DSAProblem;
