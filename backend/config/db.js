const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  require('dotenv').config();
}

const databaseUrl = process.env.DATABASE_URL;

const getSslConfig = () => {
  const mode = (process.env.PGSSLMODE || '').toLowerCase();
  const urlRequiresSsl = /sslmode=(require|verify-ca|verify-full)/i.test(databaseUrl || '');

  if (mode === 'disable') {
    return false;
  }

  if (mode === 'require' || urlRequiresSsl) {
    return { rejectUnauthorized: false };
  }

  return false;
};

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: getSslConfig(),
});

pool.on('error', (error) => {
  console.error(`❌ PostgreSQL Pool Error: ${error.message}`);
});

const createTablesSql = `
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  skill_level TEXT NOT NULL DEFAULT 'Beginner',
  preferred_language TEXT NOT NULL DEFAULT 'C++',
  target_role TEXT NOT NULL DEFAULT 'SDE',
  xp INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  last_active_date TIMESTAMPTZ NULL,
  badges JSONB NOT NULL DEFAULT '[]'::jsonb,
  weak_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
  notifications JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dsa_problems (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  link TEXT,
  difficulty TEXT NOT NULL,
  pattern_used TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT 'Arrays',
  learning_insight TEXT NOT NULL DEFAULT '',
  mistakes_made TEXT NOT NULL DEFAULT '',
  optimization_idea TEXT NOT NULL DEFAULT '',
  time_taken INTEGER NOT NULL DEFAULT 0,
  solved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'Solved',
  xp_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dbms_analyses (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  problem_type TEXT NOT NULL,
  problem_statement TEXT NOT NULL,
  concept_used JSONB NOT NULL DEFAULT '[]'::jsonb,
  approach_explanation TEXT NOT NULL DEFAULT '',
  alternative_approach TEXT NOT NULL DEFAULT '',
  optimization_insight TEXT NOT NULL DEFAULT '',
  index_used BOOLEAN NOT NULL DEFAULT false,
  real_world_mapping TEXT NOT NULL DEFAULT '',
  sql_query TEXT NOT NULL DEFAULT '',
  difficulty TEXT NOT NULL DEFAULT 'Medium',
  xp_earned INTEGER NOT NULL DEFAULT 0,
  solved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  tech_stack JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'Planning',
  progress INTEGER NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  concepts_used JSONB NOT NULL DEFAULT '[]'::jsonb,
  learning_mapping JSONB NOT NULL DEFAULT '[]'::jsonb,
  github_link TEXT NOT NULL DEFAULT '',
  live_link TEXT NOT NULL DEFAULT '',
  xp_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_goals (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  goals JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_goals INTEGER NOT NULL DEFAULT 0,
  completed_goals INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  streak_maintained BOOLEAN NOT NULL DEFAULT false,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS roadmaps (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  levels JSONB NOT NULL DEFAULT '[]'::jsonb,
  overall_progress INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reading_books (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT '',
  total_pages INTEGER NOT NULL DEFAULT 0,
  current_page INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Reading',
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS book_notes (
  id UUID PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES reading_books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL DEFAULT 0,
  note_type TEXT NOT NULL DEFAULT 'note',
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

const connectDB = async () => {
  try {
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is missing. Add it to backend/.env');
    }

    await pool.query('SELECT 1');
    await pool.query(createTablesSql);
    console.log('✅ PostgreSQL Connected');
  } catch (error) {
    console.error(`❌ PostgreSQL Error: ${error.message}`);
    process.exit(1);
  }
};

connectDB.pool = pool;

module.exports = connectDB;
