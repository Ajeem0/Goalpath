import React, { useState, useEffect } from 'react';
import { getDBMSAnalyses, addDBMSAnalysis, deleteDBMSAnalysis, getDBMSStats } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PROBLEM_TYPES = ['Query-based (SQL)', 'Design-based', 'Transaction-based', 'Optimization', 'Normalization'];
const CONCEPTS = ['Normalization','Indexing','Joins','Transactions (ACID)','Locking / Concurrency','Aggregation','Subqueries','Views','Stored Procedures','Triggers','ER Modeling','Partitioning','Replication','Sharding'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const EMPTY_FORM = {
  title: '', problemType: 'Query-based (SQL)', problemStatement: '',
  conceptUsed: [], approachExplanation: '', alternativeApproach: '',
  optimizationInsight: '', indexUsed: false, realWorldMapping: '',
  sqlQuery: '', difficulty: 'Medium',
};

const DIFF_COLOR = { Easy: 'tag-green', Medium: 'tag-orange', Hard: 'tag-red' };
const CONCEPT_COLORS = ['tag-blue','tag-cyan','tag-purple','tag-green','tag-orange'];

export default function DBMSAnalysis() {
  const { refreshUser } = useAuth();
  const [analyses, setAnalyses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [aRes, sRes] = await Promise.all([getDBMSAnalyses(), getDBMSStats()]);
      setAnalyses(aRes.data.analyses);
      setStats(sRes.data);
    } catch (e) { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const toggleConcept = (c) => {
    setForm(prev => ({
      ...prev,
      conceptUsed: prev.conceptUsed.includes(c)
        ? prev.conceptUsed.filter(x => x !== c)
        : [...prev.conceptUsed, c]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await addDBMSAnalysis(form);
      await refreshUser();
      toast.success(`Analysis saved! +${res.data.xpEarned} XP 🗄️`);
      if (res.data.newBadges?.length) {
        res.data.newBadges.forEach(b => toast.success(`Badge: ${b.icon} ${b.name}!`));
      }
      setShowModal(false);
      setForm(EMPTY_FORM);
      loadData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error saving');
    } finally { setSubmitting(false); }
  };

  return (
    <div>
      <div className="page-header flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>🗄️ DBMS Analysis</h1>
          <p>Analyze database problems with concept mapping and real-world connections</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Analysis</button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid-4 mb-3">
          <div className="stat-card">
            <div className="stat-icon">🗄️</div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Analyses</div>
          </div>
          {Object.entries(stats.conceptStats || {}).slice(0, 3).map(([c, n]) => (
            <div key={c} className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-value">{n}</div>
              <div className="stat-label">{c}</div>
            </div>
          ))}
        </div>
      )}

      {/* Analyses */}
      {loading ? <div className="spinner" /> : (
        <div className="analyses-list">
          {analyses.map((a, idx) => <AnalysisCard key={a._id} analysis={a} idx={idx} onDelete={async (id) => {
            if (!window.confirm('Delete?')) return;
            await deleteDBMSAnalysis(id);
            toast.success('Deleted');
            loadData();
          }} />)}
          {analyses.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🗄️</div>
              <h3>No analyses yet</h3>
              <p>Start analyzing DBMS problems to build mastery</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <span className="modal-title">🗄️ New DBMS Analysis</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input className="form-input" placeholder="e.g. Find Top Customers" value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Problem Type *</label>
                  <select className="form-select" value={form.problemType} onChange={e => setForm({ ...form, problemType: e.target.value })}>
                    {PROBLEM_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Problem Statement *</label>
                <textarea className="form-textarea" style={{ minHeight: '100px' }} placeholder="Describe the problem clearly..."
                  value={form.problemStatement} onChange={e => setForm({ ...form, problemStatement: e.target.value })} required />
              </div>

              {/* Concept multi-select */}
              <div className="form-group">
                <label className="form-label">Concepts Used</label>
                <div className="concept-picker">
                  {CONCEPTS.map((c, i) => (
                    <button type="button" key={c}
                      className={`concept-pick-btn ${form.conceptUsed.includes(c) ? 'selected' : ''}`}
                      onClick={() => toggleConcept(c)}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">SQL Query (if applicable)</label>
                <textarea className="form-textarea" style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.8rem' }}
                  placeholder="SELECT c.name, COUNT(o.id)&#10;FROM customers c JOIN orders o ON c.id = o.customer_id&#10;GROUP BY c.id ORDER BY COUNT DESC"
                  value={form.sqlQuery} onChange={e => setForm({ ...form, sqlQuery: e.target.value })} />
              </div>

              <div className="dbms-analysis-grid">
                <div className="form-group">
                  <label className="form-label">Approach Explanation</label>
                  <textarea className="form-textarea" placeholder="Why this query/design? Step-by-step thinking..."
                    value={form.approachExplanation} onChange={e => setForm({ ...form, approachExplanation: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Alternative Approach</label>
                  <textarea className="form-textarea" placeholder="Another way to solve this..."
                    value={form.alternativeApproach} onChange={e => setForm({ ...form, alternativeApproach: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Optimization Insight</label>
                  <textarea className="form-textarea" placeholder="How to improve performance? Indexes used?"
                    value={form.optimizationInsight} onChange={e => setForm({ ...form, optimizationInsight: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Real-World Mapping 🌍</label>
                  <textarea className="form-textarea" placeholder="Where is this used? e.g. Joins → E-commerce orders system"
                    value={form.realWorldMapping} onChange={e => setForm({ ...form, realWorldMapping: e.target.value })} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Difficulty</label>
                  <select className="form-select" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                    {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <input type="checkbox" checked={form.indexUsed} onChange={e => setForm({ ...form, indexUsed: e.target.checked })} />
                    Index Used in Solution
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : '💾 Save Analysis'}
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

function AnalysisCard({ analysis, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="analysis-card">
      <div className="analysis-header" onClick={() => setExpanded(!expanded)}>
        <div className="analysis-main">
          <span className={`tag ${DIFF_COLOR[analysis.difficulty]}`}>{analysis.difficulty}</span>
          <div>
            <div className="analysis-title">{analysis.title}</div>
            <div className="flex gap-1 mt-1 flex-wrap">
              <span className="tag tag-cyan">{analysis.problemType}</span>
              {analysis.conceptUsed?.slice(0, 3).map((c, i) => (
                <span key={c} className={`tag ${CONCEPT_COLORS[i % CONCEPT_COLORS.length]}`}>{c}</span>
              ))}
              {analysis.indexUsed && <span className="tag tag-green">⚡ Indexed</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-1 align-items-center">
          <span className="tag tag-orange">+{analysis.xpEarned} XP</span>
          <button className="expand-btn">{expanded ? '▲' : '▼'}</button>
        </div>
      </div>

      {expanded && (
        <div className="analysis-details">
          <AnalysisSection icon="📋" label="Problem Statement" text={analysis.problemStatement} />
          {analysis.sqlQuery && (
            <div className="analysis-section">
              <div className="analysis-section-label">🗃️ SQL Query</div>
              <pre className="sql-block">{analysis.sqlQuery}</pre>
            </div>
          )}
          {analysis.approachExplanation && <AnalysisSection icon="🔍" label="Approach" text={analysis.approachExplanation} />}
          {analysis.alternativeApproach && <AnalysisSection icon="🔄" label="Alternative" text={analysis.alternativeApproach} />}
          {analysis.optimizationInsight && <AnalysisSection icon="⚡" label="Optimization" text={analysis.optimizationInsight} />}
          {analysis.realWorldMapping && (
            <div className="analysis-section real-world">
              <div className="analysis-section-label">🌍 Real-World Mapping</div>
              <p>{analysis.realWorldMapping}</p>
            </div>
          )}
          <button className="btn btn-danger btn-sm mt-2" onClick={() => onDelete(analysis._id)}>Delete</button>
        </div>
      )}
    </div>
  );
}

function AnalysisSection({ icon, label, text }) {
  return (
    <div className="analysis-section">
      <div className="analysis-section-label">{icon} {label}</div>
      <p>{text}</p>
    </div>
  );
}
