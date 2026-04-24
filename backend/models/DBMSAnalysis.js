const { randomUUID } = require('crypto');
const connectDB = require('../config/db');

const pool = connectDB.pool;

const mapRow = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    user: row.user_id,
    title: row.title,
    problemType: row.problem_type,
    problemStatement: row.problem_statement,
    conceptUsed: row.concept_used || [],
    approachExplanation: row.approach_explanation,
    alternativeApproach: row.alternative_approach,
    optimizationInsight: row.optimization_insight,
    indexUsed: row.index_used,
    realWorldMapping: row.real_world_mapping,
    sqlQuery: row.sql_query,
    difficulty: row.difficulty,
    xpEarned: row.xp_earned,
    solvedAt: row.solved_at,
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
  if (filter.problemType) {
    values.push(filter.problemType);
    clauses.push(`problem_type = $${values.length}`);
  }
  if (filter.difficulty) {
    values.push(filter.difficulty);
    clauses.push(`difficulty = $${values.length}`);
  }
  if (filter.conceptUsedIn) {
    values.push(filter.conceptUsedIn);
    clauses.push(`concept_used ? $${values.length}`);
  }

  return {
    whereSql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    values,
  };
};

class DBMSAnalysis {
  static async countDocuments(filter = {}) {
    const { whereSql, values } = buildWhere(filter);
    const { rows } = await pool.query(`SELECT COUNT(*)::int AS count FROM dbms_analyses ${whereSql}`, values);
    return rows[0]?.count || 0;
  }

  static async find(filter = {}, options = {}) {
    const { whereSql, values } = buildWhere(filter);
    const orderBy = options.orderBy || 'created_at DESC';
    const limit = Number(options.limit || 0);
    const offset = Number(options.offset || 0);
    let sql = `SELECT * FROM dbms_analyses ${whereSql} ORDER BY ${orderBy}`;

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
      `INSERT INTO dbms_analyses (
        id, user_id, title, problem_type, problem_statement, concept_used,
        approach_explanation, alternative_approach, optimization_insight, index_used,
        real_world_mapping, sql_query, difficulty, xp_earned, solved_at, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6::jsonb,
        $7, $8, $9, $10,
        $11, $12, $13, $14, COALESCE($15, NOW()), NOW(), NOW()
      ) RETURNING *`,
      [
        id,
        data.user,
        data.title,
        data.problemType,
        data.problemStatement,
        JSON.stringify(data.conceptUsed || []),
        data.approachExplanation || '',
        data.alternativeApproach || '',
        data.optimizationInsight || '',
        !!data.indexUsed,
        data.realWorldMapping || '',
        data.sqlQuery || '',
        data.difficulty || 'Medium',
        data.xpEarned || 0,
        data.solvedAt || null,
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
      `UPDATE dbms_analyses
       SET title = $1,
           problem_type = $2,
           problem_statement = $3,
           concept_used = $4::jsonb,
           approach_explanation = $5,
           alternative_approach = $6,
           optimization_insight = $7,
           index_used = $8,
           real_world_mapping = $9,
           sql_query = $10,
           difficulty = $11,
           xp_earned = $12,
           solved_at = $13,
           updated_at = NOW()
       WHERE id = $14
       RETURNING *`,
      [
        merged.title,
        merged.problemType,
        merged.problemStatement,
        JSON.stringify(merged.conceptUsed || []),
        merged.approachExplanation || '',
        merged.alternativeApproach || '',
        merged.optimizationInsight || '',
        !!merged.indexUsed,
        merged.realWorldMapping || '',
        merged.sqlQuery || '',
        merged.difficulty || 'Medium',
        merged.xpEarned || 0,
        merged.solvedAt || new Date(),
        existing._id,
      ]
    );

    return options.new ? mapRow(rows[0]) : existing;
  }

  static async findOneAndDelete(filter = {}) {
    const { whereSql, values } = buildWhere(filter);
    const { rows } = await pool.query(`DELETE FROM dbms_analyses ${whereSql} RETURNING *`, values);
    return mapRow(rows[0]);
  }
}

module.exports = DBMSAnalysis;
