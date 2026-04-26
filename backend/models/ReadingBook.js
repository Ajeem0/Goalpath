const { randomUUID } = require('crypto');
const connectDB = require('../config/db');

const pool = connectDB.pool;

const mapRow = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    user: row.user_id,
    title: row.title,
    author: row.author,
    totalPages: row.total_pages,
    currentPage: row.current_page,
    status: row.status,
    color: row.color,
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
  if (filter.status) {
    values.push(filter.status);
    clauses.push(`status = $${values.length}`);
  }

  return {
    whereSql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    values,
  };
};

class ReadingBook {
  static async countDocuments(filter = {}) {
    const { whereSql, values } = buildWhere(filter);
    const { rows } = await pool.query(`SELECT COUNT(*)::int AS count FROM reading_books ${whereSql}`, values);
    return rows[0]?.count || 0;
  }

  static async find(filter = {}, options = {}) {
    const { whereSql, values } = buildWhere(filter);
    const orderBy = options.orderBy || 'created_at DESC';
    const limit = Number(options.limit || 0);
    const offset = Number(options.offset || 0);
    let sql = `SELECT * FROM reading_books ${whereSql} ORDER BY ${orderBy}`;

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
      `INSERT INTO reading_books (
        id, user_id, title, author, total_pages, current_page, status, color,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        NOW(), NOW()
      ) RETURNING *`,
      [
        id,
        data.user,
        data.title,
        data.author || '',
        data.totalPages || 0,
        data.currentPage || 0,
        data.status || 'Reading',
        data.color || '#3b82f6',
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
      `UPDATE reading_books
       SET title = $1,
           author = $2,
           total_pages = $3,
           current_page = $4,
           status = $5,
           color = $6,
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [
        merged.title,
        merged.author || '',
        merged.totalPages || 0,
        merged.currentPage || 0,
        merged.status || 'Reading',
        merged.color || '#3b82f6',
        existing._id,
      ]
    );

    return options.new ? mapRow(rows[0]) : existing;
  }

  static async findOneAndDelete(filter = {}) {
    const { whereSql, values } = buildWhere(filter);
    const { rows } = await pool.query(`DELETE FROM reading_books ${whereSql} RETURNING *`, values);
    return mapRow(rows[0]);
  }
}

module.exports = ReadingBook;

