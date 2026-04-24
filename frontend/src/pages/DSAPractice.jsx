import React, { useState, useEffect } from 'react';
import { getDSAProblems, addDSAProblem, deleteDSAProblem, getDSAStats } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PATTERNS = ['Sliding Window','Two Pointer','Binary Search','Graph BFS/DFS','Dynamic Programming','Greedy','Backtracking','Divide and Conquer','Heap/Priority Queue','Trie','Union Find','Monotonic Stack','Prefix Sum','Bit Manipulation','Math'];
const TOPICS = ['Arrays','Strings','Linked List','Trees','Graphs','Stack/Queue','Hashing','Recursion','Sorting','Other'];
const DIFFICULTIES = ['Easy','Medium','Hard'];
const STATUS_OPTS = ['Solved','Attempted','To Review'];
const DIFF_COLOR = { Easy: 'tag-green', Medium: 'tag-orange', Hard: 'tag-red' };

const EMPTY_FORM = {
  title: '', link: '', difficulty: 'Medium', patternUsed: 'Dynamic Programming',
  topic: 'Arrays', learningInsight: '', mistakesMade: '', optimizationIdea: '',
  timeTaken: '', status: 'Solved',
};

export default function DSAPractice() {
  const { refreshUser } = useAuth();
  const [problems, setProblems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState({ pattern: '', difficulty: '' });

  useEffect(() => { loadData(); }, [filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([getDSAProblems(filter), getDSAStats()]);
      setProblems(pRes.data.problems);
      setStats(sRes.data);
    } catch (e) { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await addDSAProblem(form);
      await refreshUser();
      toast.success(`Problem logged! +${res.data.xpEarned} XP 🎯`);
      if (res.data.newBadges?.length) {
        res.data.newBadges.forEach(b => toast.success(`Badge earned: ${b.icon} ${b.name}!`));
      }
      setShowModal(false);
      setForm(EMPTY_FORM);
      loadData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error adding problem');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this problem?')) return;
    await deleteDSAProblem(id);
    toast.success('Deleted');
    loadData();
  };

  return (
    <div>
      <div className="page-header flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>🧩 DSA Practice</h1>
          <p>Log problems with pattern recognition and learning insights</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Log Problem</button>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid-4 mb-3">
          <StatMini label="Total Solved" value={stats.total} icon="🧩" />
          <StatMini label="Easy" value={stats.difficultyStats?.Easy || 0} icon="🟢" />
          <StatMini label="Medium" value={stats.difficultyStats?.Medium || 0} icon="🟡" />
          <StatMini label="Hard" value={stats.difficultyStats?.Hard || 0} icon="🔴" />
        </div>
      )}

      {/* Filters */}
      <div className="card mb-2" style={{ padding: '1rem' }}>
        <div className="flex gap-2 flex-wrap">
          <select className="form-select" style={{ width: 'auto' }} value={filter.pattern}
            onChange={e => setFilter({ ...filter, pattern: e.target.value })}>
            <option value="">All Patterns</option>
            {PATTERNS.map(p => <option key={p}>{p}</option>)}
          </select>
          <select className="form-select" style={{ width: 'auto' }} value={filter.difficulty}
            onChange={e => setFilter({ ...filter, difficulty: e.target.value })}>
            <option value="">All Difficulties</option>
            {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
          </select>
          {(filter.pattern || filter.difficulty) &&
            <button className="btn btn-outline btn-sm" onClick={() => setFilter({ pattern: '', difficulty: '' })}>Clear</button>
          }
        </div>
      </div>

      {/* Problems list */}
      {loading ? <div className="spinner" /> : (
        <div className="problems-grid">
          {problems.map(p => (
            <ProblemCard key={p._id} problem={p} onDelete={handleDelete} />
          ))}
          {problems.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
              <div className="empty-icon">🧩</div>
              <h3>No problems logged yet</h3>
              <p>Click "Log Problem" to start tracking your DSA journey</p>
            </div>
          )}
        </div>
      )}

      {/* Add Problem Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <span className="modal-title">🧩 Log New Problem</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Problem Title *</label>
                  <input className="form-input" placeholder="e.g. Two Sum" value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">LeetCode Link</label>
                  <input className="form-input" placeholder="https://leetcode.com/..." value={form.link}
                    onChange={e => setForm({ ...form, link: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Difficulty *</label>
                  <select className="form-select" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                    {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    {STATUS_OPTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Pattern Used *</label>
                  <select className="form-select" value={form.patternUsed} onChange={e => setForm({ ...form, patternUsed: e.target.value })}>
                    {PATTERNS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Topic</label>
                  <select className="form-select" value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })}>
                    {TOPICS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="insight-section">
                <div className="insight-header">💡 Learning Insights</div>
                <div className="form-group">
                  <label className="form-label">What did you learn?</label>
                  <textarea className="form-textarea" placeholder="Key takeaways from solving this problem..."
                    value={form.learningInsight} onChange={e => setForm({ ...form, learningInsight: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Mistakes Made</label>
                  <textarea className="form-textarea" placeholder="Edge cases missed, wrong approach..."
                    value={form.mistakesMade} onChange={e => setForm({ ...form, mistakesMade: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Optimization Idea</label>
                  <textarea className="form-textarea" placeholder="How could this be further optimized?"
                    value={form.optimizationIdea} onChange={e => setForm({ ...form, optimizationIdea: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Time Taken (minutes)</label>
                <input className="form-input" type="number" placeholder="30" value={form.timeTaken}
                  onChange={e => setForm({ ...form, timeTaken: e.target.value })} />
              </div>

              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : '💾 Save Problem'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ProblemCard({ problem, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="problem-card">
      <div className="problem-card-header" onClick={() => setExpanded(!expanded)}>
        <div className="problem-left">
          <span className={`tag ${DIFF_COLOR[problem.difficulty]}`}>{problem.difficulty}</span>
          <div>
            <div className="problem-title">
              {problem.link ? <a href={problem.link} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>{problem.title} ↗</a> : problem.title}
            </div>
            <div className="flex gap-1 mt-1 flex-wrap">
              <span className="tag tag-purple">{problem.patternUsed}</span>
              <span className="tag tag-blue">{problem.topic}</span>
              {problem.timeTaken > 0 && <span className="tag">⏱ {problem.timeTaken}m</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-1 align-items-center">
          <span className={`tag ${problem.status === 'Solved' ? 'tag-green' : problem.status === 'Attempted' ? 'tag-orange' : 'tag-red'}`}>{problem.status}</span>
          <span className="tag tag-orange">+{problem.xpEarned} XP</span>
          <button className="expand-btn">{expanded ? '▲' : '▼'}</button>
        </div>
      </div>
      {expanded && (
        <div className="problem-insights">
          {problem.learningInsight && <InsightBlock icon="💡" label="Learning" text={problem.learningInsight} />}
          {problem.mistakesMade && <InsightBlock icon="❌" label="Mistakes" text={problem.mistakesMade} />}
          {problem.optimizationIdea && <InsightBlock icon="⚡" label="Optimization" text={problem.optimizationIdea} />}
          <button className="btn btn-danger btn-sm mt-2" onClick={() => onDelete(problem._id)}>Delete</button>
        </div>
      )}
    </div>
  );
}

function InsightBlock({ icon, label, text }) {
  return (
    <div className="insight-block">
      <span className="insight-label">{icon} {label}</span>
      <p>{text}</p>
    </div>
  );
}

function StatMini({ label, value, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
