const { randomUUID } = require('crypto');
const connectDB = require('../config/db');

const pool = connectDB.pool;

const mapRow = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    user: row.user_id,
    type: row.type,
    levels: row.levels || [],
    overallProgress: row.overall_progress,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

class Roadmap {
  static async findOne(filter = {}) {
    const conditions = [];
    const values = [];
    if (filter.user) {
      values.push(filter.user);
      conditions.push(`user_id = $${values.length}`);
    }
    if (filter.type) {
      values.push(filter.type);
      conditions.push(`type = $${values.length}`);
    }
    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query(`SELECT * FROM roadmaps ${whereSql} ORDER BY created_at DESC LIMIT 1`, values);
    return mapRow(rows[0]);
  }

  static async create(data) {
    const id = randomUUID();
    const { rows } = await pool.query(
      `INSERT INTO roadmaps (
        id, user_id, type, levels, overall_progress, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4::jsonb, $5, NOW(), NOW()
      ) RETURNING *`,
      [id, data.user, data.type, JSON.stringify(data.levels || []), data.overallProgress || 0]
    );
    return mapRow(rows[0]);
  }
}

module.exports = Roadmap;
