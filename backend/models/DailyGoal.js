const { randomUUID } = require('crypto');
const connectDB = require('../config/db');

const pool = connectDB.pool;

const normalizeGoals = (goals = []) =>
  goals.map((goal) => ({
    _id: goal._id || randomUUID(),
    type: goal.type || 'Custom',
    title: goal.title || '',
    description: goal.description || '',
    completed: !!goal.completed,
    completedAt: goal.completedAt || null,
    xpReward: goal.xpReward || 10,
    linkedItemId: goal.linkedItemId || null,
    linkedItemType: goal.linkedItemType || null,
  }));

const deriveStats = (goals = []) => {
  const totalGoals = goals.length;
  const completedGoals = goals.filter((g) => g.completed).length;
  const xpEarned = goals.filter((g) => g.completed).reduce((sum, g) => sum + (g.xpReward || 10), 0);
  return { totalGoals, completedGoals, xpEarned };
};

const mapRow = (row) => {
  if (!row) return null;

  const dailyGoal = {
    _id: row.id,
    user: row.user_id,
    date: row.date,
    goals: normalizeGoals(row.goals || []),
    totalGoals: row.total_goals,
    completedGoals: row.completed_goals,
    xpEarned: row.xp_earned,
    streakMaintained: row.streak_maintained,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  dailyGoal.save = async () => {
    dailyGoal.goals = normalizeGoals(dailyGoal.goals || []);
    const stats = deriveStats(dailyGoal.goals);
    dailyGoal.totalGoals = stats.totalGoals;
    dailyGoal.completedGoals = stats.completedGoals;
    dailyGoal.xpEarned = stats.xpEarned;

    const { rows } = await pool.query(
      `UPDATE daily_goals
       SET goals = $1::jsonb,
           total_goals = $2,
           completed_goals = $3,
           xp_earned = $4,
           streak_maintained = $5,
           notes = $6,
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [
        JSON.stringify(dailyGoal.goals || []),
        dailyGoal.totalGoals,
        dailyGoal.completedGoals,
        dailyGoal.xpEarned,
        !!dailyGoal.streakMaintained,
        dailyGoal.notes || '',
        dailyGoal._id,
      ]
    );

    const updated = mapRow(rows[0]);
    Object.assign(dailyGoal, updated);
    return dailyGoal;
  };

  return dailyGoal;
};

class DailyGoal {
  static async findOne(filter = {}) {
    const conditions = [];
    const values = [];
    if (filter.user) {
      values.push(filter.user);
      conditions.push(`user_id = $${values.length}`);
    }
    if (filter.date) {
      values.push(filter.date);
      conditions.push(`date = $${values.length}`);
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query(`SELECT * FROM daily_goals ${whereSql} ORDER BY date DESC LIMIT 1`, values);
    return mapRow(rows[0]);
  }

  static async find(filter = {}, options = {}) {
    const conditions = [];
    const values = [];

    if (filter.user) {
      values.push(filter.user);
      conditions.push(`user_id = $${values.length}`);
    }
    if (filter.dateGte) {
      values.push(filter.dateGte);
      conditions.push(`date >= $${values.length}`);
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderBy = options.orderBy || 'date DESC';
    const limit = Number(options.limit || 0);
    let sql = `SELECT * FROM daily_goals ${whereSql} ORDER BY ${orderBy}`;

    if (limit > 0) {
      values.push(limit);
      sql += ` LIMIT $${values.length}`;
    }

    const { rows } = await pool.query(sql, values);
    return rows.map(mapRow);
  }

  static async create(data) {
    const id = randomUUID();
    const goals = normalizeGoals(data.goals || []);
    const stats = deriveStats(goals);

    const { rows } = await pool.query(
      `INSERT INTO daily_goals (
        id, user_id, date, goals, total_goals, completed_goals,
        xp_earned, streak_maintained, notes, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4::jsonb, $5, $6,
        $7, $8, $9, NOW(), NOW()
      )
      ON CONFLICT (user_id, date) DO UPDATE SET updated_at = NOW()
      RETURNING *`,
      [
        id,
        data.user,
        data.date,
        JSON.stringify(goals),
        stats.totalGoals,
        stats.completedGoals,
        stats.xpEarned,
        !!data.streakMaintained,
        data.notes || '',
      ]
    );

    return mapRow(rows[0]);
  }
}

module.exports = DailyGoal;
