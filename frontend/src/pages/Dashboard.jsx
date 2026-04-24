import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAnalyticsOverview, getTodayGoals, completeGoal } from '../utils/api';
import toast from 'react-hot-toast';
import {
  FiBarChart2,
  FiCalendar,
  FiCheckSquare,
  FiGrid,
  FiSquare,
  FiTarget,
  FiTrendingUp,
  FiZap,
} from 'react-icons/fi';
import { BsFire } from 'react-icons/bs';
import './Dashboard.css';

const DIFF_COLOR = { Easy: 'tag-green', Medium: 'tag-orange', Hard: 'tag-red' };

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [overview, setOverview] = useState(null);
  const [goals, setGoals] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [ovRes, goalRes] = await Promise.all([getAnalyticsOverview(), getTodayGoals()]);
        setOverview(ovRes.data);
        setGoals(goalRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleCompleteGoal = async (goalId) => {
    try {
      const res = await completeGoal(goalId);
      setGoals(res.data.dailyGoal);
      await refreshUser();
      toast.success(`+${res.data.xpEarned} XP earned.`);
      if (res.data.allCompleted) toast.success('All goals done. +25 bonus XP.');
    } catch (e) {
      toast.error('Could not complete goal');
    }
  };

  if (loading) return (
    <div className="dashboard-loading">
      <div className="spinner" />
      <p>Loading your dashboard...</p>
    </div>
  );

  const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const completedGoals = goals?.goals?.filter((g) => g.completed).length || 0;
  const totalGoals = goals?.goals?.length || 0;
  const goalProgress = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Good {getGreeting()}, {user?.name?.split(' ')[0]}.</h1>
          <p>{todayDate}</p>
        </div>
        <div className="header-badges">
          {overview?.user?.badges?.slice(-3).map((b, i) => (
            <span key={i} className="badge-chip">{b.name}</span>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid-4 mb-3">
        <StatCard icon={<FiZap />} label="Total XP" value={user?.xp || 0} color="blue" />
        <StatCard icon={<BsFire />} label="Day Streak" value={user?.streak || 0} color="orange" />
        <StatCard icon={<FiTarget />} label="DSA Solved" value={overview?.dsa?.total || 0} color="purple" />
        <StatCard icon={<FiGrid />} label="DBMS Done" value={overview?.dbms?.total || 0} color="cyan" />
      </div>

      <div className="dashboard-grid">
        {/* Daily Goals */}
        <div className="card dash-goals">
          <div className="flex-between mb-2">
            <h2 className="section-title"><FiCalendar className="inline-icon" /> Today's Goals</h2>
            <Link to="/goals" className="btn btn-outline btn-sm">View All</Link>
          </div>
          <div className="goal-progress-row">
            <span className="text-sm text-muted">{completedGoals}/{totalGoals} completed</span>
            <span className="text-sm font-mono" style={{ color: 'var(--accent-green)' }}>{goalProgress}%</span>
          </div>
          <div className="progress-bar-container mb-2">
            <div className="progress-bar-fill progress-bar-green" style={{ width: `${goalProgress}%` }} />
          </div>
          <div className="goals-list">
            {goals?.goals?.slice(0, 4).map((g) => (
              <div
                key={g._id}
                className={`goal-item ${g.completed ? 'done' : ''}`}
                onClick={() => !g.completed && handleCompleteGoal(g._id)}
              >
                <span className="goal-check">{g.completed ? <FiCheckSquare /> : <FiSquare />}</span>
                <div className="goal-content">
                  <span className="goal-title">{g.title}</span>
                  <span className={`tag ${getGoalTypeColor(g.type)}`}>{g.type}</span>
                </div>
                <span className="goal-xp">+{g.xpReward} XP</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weak Areas / Suggestions */}
        <div className="card dash-suggestions">
          <h2 className="section-title mb-2"><FiTrendingUp className="inline-icon" /> Smart Suggestions</h2>
          {overview?.suggestions?.length > 0 ? (
            <div className="suggestions-list">
              {overview.suggestions.map((s, i) => (
                <div key={i} className="suggestion-item">
                  <span className={`tag ${s.type === 'DSA' ? 'tag-purple' : s.type === 'DBMS' ? 'tag-cyan' : 'tag-green'}`}>
                    {s.type}
                  </span>
                  <p>{s.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><FiTarget /></div>
              <p>Great work! No weak areas detected.</p>
            </div>
          )}
        </div>

        {/* DSA Pattern Distribution */}
        <div className="card dash-dsa">
          <div className="flex-between mb-2">
            <h2 className="section-title"><FiTarget className="inline-icon" /> DSA Patterns</h2>
            <Link to="/dsa" className="btn btn-outline btn-sm">Practice</Link>
          </div>
          <div className="pattern-grid">
            {overview?.dsa?.patternStats && Object.entries(overview.dsa.patternStats)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 6)
              .map(([pattern, count]) => (
                <PatternBar key={pattern} label={pattern} count={count}
                  max={Math.max(...Object.values(overview.dsa.patternStats))} />
              ))
            }
          </div>
          {!overview?.dsa?.patternStats || Object.keys(overview.dsa.patternStats).length === 0 ? (
            <Link to="/dsa" className="btn btn-primary w-full mt-2">Log First Problem →</Link>
          ) : null}
        </div>

        {/* Recent Activity */}
        <div className="card dash-recent">
          <h2 className="section-title mb-2"><FiZap className="inline-icon" /> Recent Problems</h2>
          <div className="recent-list">
            {overview?.dsa?.recentProblems?.map((p, i) => (
              <div key={i} className="recent-item">
                <span className={`tag ${DIFF_COLOR[p.difficulty]}`}>{p.difficulty}</span>
                <span className="recent-title">{p.title}</span>
                <span className="recent-pattern">{p.patternUsed}</span>
              </div>
            ))}
            {(!overview?.dsa?.recentProblems?.length) && (
              <div className="empty-state">
                <p>No problems logged yet. Start solving.</p>
              </div>
            )}
          </div>
        </div>

        {/* Projects */}
        <div className="card dash-projects">
          <div className="flex-between mb-2">
            <h2 className="section-title"><FiTrendingUp className="inline-icon" /> Projects</h2>
            <Link to="/projects" className="btn btn-outline btn-sm">Manage</Link>
          </div>
          <div className="project-list">
            {overview?.projects?.list?.slice(0, 3).map((p, i) => (
              <div key={i} className="project-mini">
                <div className="flex-between">
                  <span className="project-mini-name">{p.name}</span>
                  <span className={`tag ${getStatusColor(p.status)}`}>{p.status}</span>
                </div>
                <div className="progress-bar-container mt-1">
                  <div className="progress-bar-fill" style={{ width: `${p.progress}%` }} />
                </div>
                <div className="text-xs text-muted mt-1">{p.progress}% complete</div>
              </div>
            ))}
            {!overview?.projects?.list?.length && (
              <Link to="/projects" className="btn btn-primary w-full">Create First Project →</Link>
            )}
          </div>
        </div>

        {/* DBMS Quick Stats */}
        <div className="card dash-dbms">
          <div className="flex-between mb-2">
            <h2 className="section-title"><FiBarChart2 className="inline-icon" /> DBMS Mastery</h2>
            <Link to="/dbms" className="btn btn-outline btn-sm">Analyze</Link>
          </div>
          <div className="concept-chips">
            {overview?.dbms?.conceptStats && Object.entries(overview.dbms.conceptStats).map(([c, n]) => (
              <div key={c} className="concept-chip">
                <span>{c}</span>
                <span className="chip-count">{n}</span>
              </div>
            ))}
          </div>
          {!overview?.dbms?.conceptStats || Object.keys(overview.dbms.conceptStats).length === 0 ? (
            <Link to="/dbms" className="btn btn-primary w-full mt-2">Log First Analysis →</Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function PatternBar({ label, count, max }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="pattern-bar-item">
      <div className="flex-between text-xs mb-1">
        <span className="text-muted" style={{ fontSize: '0.7rem' }}>{label}</span>
        <span className="font-mono" style={{ color: 'var(--accent-blue)', fontSize: '0.7rem' }}>{count}</span>
      </div>
      <div className="progress-bar-container" style={{ height: '5px' }}>
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function getGoalTypeColor(type) {
  const map = { DSA: 'tag-purple', DBMS: 'tag-cyan', Project: 'tag-green', Reading: 'tag-blue', Revision: 'tag-orange', Custom: 'tag' };
  return map[type] || 'tag';
}

function getStatusColor(status) {
  const map = { Planning: 'tag-blue', 'In Progress': 'tag-orange', Completed: 'tag-green', 'On Hold': 'tag-red' };
  return map[status] || 'tag';
}
