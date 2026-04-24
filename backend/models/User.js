const { randomUUID } = require('crypto');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');

const pool = connectDB.pool;

const normalizeItems = (items, defaults = {}) =>
  (items || []).map((item) => ({ _id: item._id || randomUUID(), ...defaults, ...item }));

const hydrateUser = (row) => {
  if (!row) return null;

  const user = {
    _id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    skillLevel: row.skill_level,
    preferredLanguage: row.preferred_language,
    targetRole: row.target_role,
    xp: row.xp,
    streak: row.streak,
    lastActiveDate: row.last_active_date,
    badges: row.badges || [],
    weakAreas: row.weak_areas || [],
    notifications: row.notifications || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  user.matchPassword = async (enteredPassword) => bcrypt.compare(enteredPassword, user.password);

  user.save = async () => {
    user.badges = normalizeItems(user.badges, { earnedAt: new Date().toISOString() });
    user.notifications = normalizeItems(user.notifications, {
      read: false,
      createdAt: new Date().toISOString(),
    });

    const { rows } = await pool.query(
      `UPDATE users
       SET name = $1,
           email = $2,
           password = $3,
           skill_level = $4,
           preferred_language = $5,
           target_role = $6,
           xp = $7,
           streak = $8,
           last_active_date = $9,
           badges = $10::jsonb,
           weak_areas = $11::jsonb,
           notifications = $12::jsonb,
           updated_at = NOW()
       WHERE id = $13
       RETURNING *`,
      [
        user.name,
        user.email,
        user.password,
        user.skillLevel,
        user.preferredLanguage,
        user.targetRole,
        user.xp,
        user.streak,
        user.lastActiveDate,
        JSON.stringify(user.badges || []),
        JSON.stringify(user.weakAreas || []),
        JSON.stringify(user.notifications || []),
        user._id,
      ]
    );

    const updated = hydrateUser(rows[0]);
    Object.assign(user, updated);
    return user;
  };

  return user;
};

class User {
  static async findOne(filter) {
    if (!filter?.email) return null;
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [filter.email.toLowerCase()]);
    return hydrateUser(rows[0]);
  }

  static async findById(id) {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
    return hydrateUser(rows[0]);
  }

  static async create(data) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const now = new Date().toISOString();
    const id = randomUUID();
    const badges = normalizeItems(data.badges || []);
    const notifications = normalizeItems(data.notifications || []);

    const { rows } = await pool.query(
      `INSERT INTO users (
        id, name, email, password, skill_level, preferred_language, target_role,
        xp, streak, last_active_date, badges, weak_areas, notifications, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11::jsonb, $12::jsonb, $13::jsonb, $14, $14
      ) RETURNING *`,
      [
        id,
        data.name,
        data.email.toLowerCase(),
        hashedPassword,
        data.skillLevel || 'Beginner',
        data.preferredLanguage || 'C++',
        data.targetRole || 'SDE',
        data.xp || 0,
        data.streak || 0,
        data.lastActiveDate || null,
        JSON.stringify(badges),
        JSON.stringify(data.weakAreas || []),
        JSON.stringify(notifications),
        now,
      ]
    );

    return hydrateUser(rows[0]);
  }
}

module.exports = User;
