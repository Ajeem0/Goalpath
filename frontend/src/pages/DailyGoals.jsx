import React, { useState, useEffect } from 'react';
import { getTodayGoals, addGoal, completeGoal, deleteGoal, getGoalHistory } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './DailyGoals.css';
import {
  FiActivity,
  FiBarChart2,
  FiCalendar,
  FiCheckCircle,
  FiCheckSquare,
  FiPlus,
  FiSquare,
  FiTarget,
  FiTrash2,
  FiTrendingUp,
  FiZap,
} from 'react-icons/fi';
import { BsFire } from 'react-icons/bs';

const GOAL_TYPES = ['DSA', 'DBMS', 'Project', 'Reading', 'Revision', 'Custom'];
const TYPE_COLORS = { DSA: 'tag-purple', DBMS: 'tag-cyan', Project: 'tag-green', Reading: 'tag-blue', Revision: 'tag-orange', Custom: 'tag' };

export default function DailyGoals() {
  const { refreshUser } = useAuth();
  const [goals, setGoals] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [newGoal, setNewGoal] = useState({ type: 'DSA', title: '', description: '', xpReward: 10 });

  useEffect(() => {
    const load = async () => {
      try {
        const [gRes, hRes] = await Promise.all([getTodayGoals(), getGoalHistory(14)]);
        setGoals(gRes.data);
        setHistory(hRes.data);
      } catch (e) { toast.error('Failed to load'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleComplete = async (goalId) => {
    try {
      const res = await completeGoal(goalId);
      setGoals(res.data.dailyGoal);
      await refreshUser();
      toast.success(`+${res.data.xpEarned} XP! Goal completed.`);
      if (res.data.allCompleted) toast.success('All goals done! +25 bonus XP.', { duration: 4000 });
    } catch (e) { toast.error('Failed to complete goal'); }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    try {
      const res = await addGoal(newGoal);
      setGoals(res.data);
      setShowAdd(false);
      setNewGoal({ type: 'DSA', title: '', description: '', xpReward: 10 });
      toast.success('Goal added!');
    } catch (e) {
      const message = e.response?.data?.message || 'Failed to add goal';
      toast.error(message);
    }
  };

  const handleRemoveGoal = async (goalId) => {
    if (!window.confirm('Remove this goal from today?')) return;
    try {
      const res = await deleteGoal(goalId);
      setGoals(res.data);
      toast.success('Goal removed');
    } catch (e) {
      const message = e.response?.data?.message || 'Failed to remove goal';
      toast.error(message);
    }
  };

  if (loading) return <div className="spinner" />;

  const completed = goals?.goals?.filter(g => g.completed).length || 0;
  const total = goals?.goals?.length || 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const historyByDate = history.reduce((acc, day) => {
    acc[day.date] = day;
    return acc;
  }, {});

  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const dateStr = d.toISOString().split('T')[0];
    const day = historyByDate[dateStr];
    const completedGoals = day?.completedGoals || 0;
    const totalGoals = day?.totalGoals || 0;
    const dayPct = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

    return {
      date: dateStr,
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      completedGoals,
      totalGoals,
      xpEarned: day?.xpEarned || 0,
      pct: dayPct,
      status: dayPct === 100 ? 'full' : dayPct > 0 ? 'partial' : 'empty',
    };
  });

  const selectedDay = last14Days.find((d) => d.date === selectedDate) || last14Days[last14Days.length - 1];

  let currentStreak = 0;
  for (let i = last14Days.length - 1; i >= 0; i -= 1) {
    if (last14Days[i].status === 'full') currentStreak += 1;
    else break;
  }

  let bestStreak = 0;
  let running = 0;
  last14Days.forEach((day) => {
    if (day.status === 'full') {
      running += 1;
      if (running > bestStreak) bestStreak = running;
    } else {
      running = 0;
    }
  });

  const activeDays = last14Days.filter((d) => d.totalGoals > 0).length;
  const fullyCompletedDays = last14Days.filter((d) => d.status === 'full').length;
  const completionRate = Math.round((fullyCompletedDays / last14Days.length) * 100);
  const totalXp14 = last14Days.reduce((sum, d) => sum + d.xpEarned, 0);

  return (
    <div>
      <div className="page-header">
        <h1><FiCalendar className="inline-icon" /> Daily Goals</h1>
        <p>Track your daily learning progress and maintain your streak</p>
      </div>

      {/* Today's summary */}
      <div className="goals-summary-card card mb-3">
        <div className="goals-summary-header">
          <div>
            <div className="goals-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
            <div className="goals-progress-text">{completed} of {total} goals completed</div>
          </div>
          <div className="goals-circle">
            <svg viewBox="0 0 44 44" className="progress-ring">
              <circle cx="22" cy="22" r="18" className="ring-bg" />
              <circle cx="22" cy="22" r="18" className="ring-fill" strokeDasharray={`${pct * 1.131} 113.1`} />
            </svg>
            <span className="circle-pct">{pct}%</span>
          </div>
        </div>
        <div className="goals-xp-badge">
          <span><FiZap className="inline-icon" /> {goals?.xpEarned || 0} XP earned today</span>
          {pct === 100 && <span className="all-done-badge"><BsFire className="inline-icon" /> All Done! +25 Bonus</span>}
        </div>
      </div>

      {/* Goal list */}
      <div className="flex-between mb-2">
        <h2 style={{ fontSize: '1rem', fontWeight: 700 }}><FiTarget className="inline-icon" /> Today's Tasks</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}><FiPlus className="inline-icon" /> Add Goal</button>
      </div>

      <div className="goals-full-list mb-3">
        {goals?.goals?.map(g => (
          <div key={g._id} className={`goal-full-item ${g.completed ? 'done' : ''}`}>
            <button className="goal-check-btn" onClick={() => !g.completed && handleComplete(g._id)}>
              {g.completed ? <FiCheckSquare /> : <FiSquare />}
            </button>
            <div className="goal-full-content">
              <div className="goal-full-title" style={{ textDecoration: g.completed ? 'line-through' : 'none' }}>
                {g.title}
              </div>
              {g.description && <div className="goal-full-desc">{g.description}</div>}
              <span className={`tag ${TYPE_COLORS[g.type]}`}>{g.type}</span>
            </div>
            <div className="goal-full-xp">+{g.xpReward} XP</div>
            <button
              className="goal-remove-btn"
              onClick={() => handleRemoveGoal(g._id)}
              disabled={g.completed}
              title={g.completed ? 'Completed goals cannot be removed' : 'Remove goal'}
            >
              <FiTrash2 />
            </button>
          </div>
        ))}
        {total === 0 && (
          <div className="empty-state">
            <div className="empty-icon"><FiCalendar /></div>
            <p>No goals for today yet. Add some!</p>
          </div>
        )}
      </div>

      {/* 14-day Activity */}
      <div className="card">
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}><FiTrendingUp className="inline-icon" /> Last 14 Days</h2>

        <div className="history-stats-row">
          <div className="history-stat-chip">
            <span className="history-stat-label">Current Run</span>
            <span className="history-stat-value"><BsFire className="inline-icon" /> {currentStreak} days</span>
          </div>
          <div className="history-stat-chip">
            <span className="history-stat-label">Best Run</span>
            <span className="history-stat-value"><FiCheckCircle className="inline-icon" /> {bestStreak} days</span>
          </div>
          <div className="history-stat-chip">
            <span className="history-stat-label">Completion</span>
            <span className="history-stat-value"><FiBarChart2 className="inline-icon" /> {completionRate}%</span>
          </div>
          <div className="history-stat-chip">
            <span className="history-stat-label">XP Gained</span>
            <span className="history-stat-value"><FiZap className="inline-icon" /> {totalXp14}</span>
          </div>
        </div>

        <div className="history-grid">
          {last14Days.map((day) => (
            <button
              key={day.date}
              type="button"
              className={`history-day ${day.status} ${selectedDay?.date === day.date ? 'active' : ''}`}
              title={`${day.date}: ${day.completedGoals}/${day.totalGoals} goals, ${day.xpEarned} XP`}
              onClick={() => setSelectedDate(day.date)}
            >
              <div className="history-day-week">{day.label}</div>
              <div className="history-day-bar">
                <div className="history-bar-fill" style={{ height: `${day.pct}%` }} />
              </div>
              <div className="history-day-date">{day.dayNumber}</div>
            </button>
          ))}
        </div>

        <div className="history-detail-card">
          <div className="history-detail-header">
            <div className="history-detail-date">
              {new Date(`${selectedDay.date}T00:00:00`).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </div>
            <span className={`history-detail-status ${selectedDay.status}`}>
              {selectedDay.status === 'full' ? 'All Goals Completed' : selectedDay.status === 'partial' ? 'Partial Progress' : 'No Progress'}
            </span>
          </div>
          <div className="history-detail-metrics">
            <span><FiCheckCircle className="inline-icon" /> {selectedDay.completedGoals}/{selectedDay.totalGoals} goals</span>
            <span><FiZap className="inline-icon" /> {selectedDay.xpEarned} XP</span>
            <span><FiActivity className="inline-icon" /> {selectedDay.pct}% completion</span>
          </div>
          <div className="history-detail-note">
            {selectedDay.status === 'full' && 'Great consistency. Keep this rhythm and your streak will compound quickly.'}
            {selectedDay.status === 'partial' && 'Solid effort. One more push on similar days can convert them into streak days.'}
            {selectedDay.status === 'empty' && 'Treat this as a reset point. One strong day today starts momentum again.'}
          </div>
        </div>

        <div className="history-legend">
          <span className="legend-full">■ All done</span>
          <span className="legend-partial">■ Partial</span>
          <span className="legend-empty">■ Missed</span>
          <span className="legend-meta">Active Days: {activeDays}/14</span>
        </div>
      </div>

      {/* Add Goal Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="modal" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <span className="modal-title"><FiCalendar className="inline-icon" /> Add Goal</span>
              <button className="modal-close" onClick={() => setShowAdd(false)}>×</button>
            </div>
            <form onSubmit={handleAddGoal}>
              <div className="form-group">
                <label className="form-label">Goal Type</label>
                <select className="form-select" value={newGoal.type} onChange={e => setNewGoal({ ...newGoal, type: e.target.value })}>
                  {GOAL_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" placeholder="e.g. Solve 2 DP problems"
                  value={newGoal.title} onChange={e => setNewGoal({ ...newGoal, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" placeholder="Optional details..."
                  value={newGoal.description} onChange={e => setNewGoal({ ...newGoal, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">XP Reward</label>
                <input className="form-input" type="number" min="5" max="100"
                  value={newGoal.xpReward} onChange={e => setNewGoal({ ...newGoal, xpReward: Number(e.target.value) })} />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary">Add Goal</button>
                <button type="button" className="btn btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
