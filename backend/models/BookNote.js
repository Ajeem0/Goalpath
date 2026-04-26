const { randomUUID } = require('crypto');
const connectDB = require('../config/db');

const pool = connectDB.pool;

const mapRow = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    bookId: row.book_id,
    user: row.user_id,
    pageNumber: row.page_number,
    noteType: row.note_type,
    title: row.title,
    content: row.content,
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
  if (filter.bookId) {
    values.push(filter.bookId);
    clauses.push(`book_id = $${values.length}`);
  }
  if (filter.user) {
    values.push(filter.user);
    clauses.push(`user_id = $${values.length}`);
  }
  if (filter.noteType) {
    values.push(filter.noteType);
    clauses.push(`note_type = $${values.length}`);
  }

  return {
    whereSql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    values,
  };
};

class BookNote {
  static async countDocuments(filter = {}) {
    const { whereSql, values } = buildWhere(filter);
    const { rows } = await pool.query(`SELECT COUNT(*)::int AS count FROM book_notes ${whereSql}`, values);
    return rows[0]?.count || 0;
  }

  static async find(filter = {}, options = {}) {
    const { whereSql, values } = buildWhere(filter);
    const orderBy = options.orderBy || 'created_at DESC';
    const limit = Number(options.limit || 0);
    const offset = Number(options.offset || 0);
    let sql = `SELECT * FROM book_notes ${whereSql} ORDER BY ${orderBy}`;

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
      `INSERT INTO book_notes (
        id, book_id, user_id, page_number, note_type, title, content,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        NOW(), NOW()
      ) RETURNING *`,
      [
        id,
        data.bookId,
        data.user,
        data.pageNumber || 0,
        data.noteType || 'note',
        data.title || '',
        data.content || '',
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
      bookId: existing.bookId,
      user: existing.user,
    };

    const { rows } = await pool.query(
      `UPDATE book_notes
       SET page_number = $1,
           note_type = $2,
           title = $3,
           content = $4,
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [
        merged.pageNumber || 0,
        merged.noteType || 'note',
        merged.title || '',
        merged.content || '',
        existing._id,
      ]
    );

    return options.new ? mapRow(rows[0]) : existing;
  }

  static async findOneAndDelete(filter = {}) {
    const { whereSql, values } = buildWhere(filter);
    const { rows } = await pool.query(`DELETE FROM book_notes ${whereSql} RETURNING *`, values);
    return mapRow(rows[0]);
  }
}

module.exports = BookNote;

