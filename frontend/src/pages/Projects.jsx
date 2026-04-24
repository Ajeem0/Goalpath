import React, { useState, useEffect } from 'react';
import { getProjects, addProject, updateProject, deleteProject, updateFeature } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const TECH_STACKS = ['React', 'Node.js', 'MongoDB', 'PostgreSQL', 'Express', 'Python', 'Django', 'Spring Boot', 'Redis', 'Docker', 'AWS', 'GraphQL', 'TypeScript', 'Next.js', 'Flutter'];
const SUBJECTS = ['DBMS', 'OS', 'CN', 'DSA', 'System Design', 'Other'];
const STATUS_OPTS = ['Planning', 'In Progress', 'Completed', 'On Hold'];
const STATUS_COLORS = { Planning: 'tag-blue', 'In Progress': 'tag-orange', Completed: 'tag-green', 'On Hold': 'tag-red' };

export default function Projects() {
  const { refreshUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [form, setForm] = useState({
    name: '', description: '', techStack: [],
    features: [{ name: '', description: '', status: 'Not Started' }],
    conceptsUsed: [{ subject: 'DBMS', concept: '', description: '' }],
    learningMapping: [{ concept: '', whatLearned: '', appliedWhere: '' }],
    githubLink: '', liveLink: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await getProjects();
      setProjects(res.data);
    } catch (e) { toast.error('Failed to load projects'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await addProject(form);
      await refreshUser();
      toast.success(`Project created! +${res.data.xpEarned} XP 🚀`);
      setShowModal(false);
      resetForm();
      loadProjects();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error creating project');
    } finally { setSubmitting(false); }
  };

  const resetForm = () => {
    setForm({
      name: '', description: '', techStack: [],
      features: [{ name: '', description: '', status: 'Not Started' }],
      conceptsUsed: [{ subject: 'DBMS', concept: '', description: '' }],
      learningMapping: [{ concept: '', whatLearned: '', appliedWhere: '' }],
      githubLink: '', liveLink: '',
    });
  };

  const toggleTech = (t) => {
    setForm(prev => ({
      ...prev,
      techStack: prev.techStack.includes(t) ? prev.techStack.filter(x => x !== t) : [...prev.techStack, t]
    }));
  };

  const updateFeatureField = (idx, field, value) => {
    const features = [...form.features];
    features[idx] = { ...features[idx], [field]: value };
    setForm({ ...form, features });
  };

  const addFeatureRow = () => setForm({ ...form, features: [...form.features, { name: '', description: '', status: 'Not Started' }] });
  const removeFeatureRow = (idx) => setForm({ ...form, features: form.features.filter((_, i) => i !== idx) });

  const addConceptRow = () => setForm({ ...form, conceptsUsed: [...form.conceptsUsed, { subject: 'DBMS', concept: '', description: '' }] });
  const updateConceptField = (idx, field, value) => {
    const conceptsUsed = [...form.conceptsUsed];
    conceptsUsed[idx] = { ...conceptsUsed[idx], [field]: value };
    setForm({ ...form, conceptsUsed });
  };

  const addLearningRow = () => setForm({ ...form, learningMapping: [...form.learningMapping, { concept: '', whatLearned: '', appliedWhere: '' }] });
  const updateLearningField = (idx, field, value) => {
    const learningMapping = [...form.learningMapping];
    learningMapping[idx] = { ...learningMapping[idx], [field]: value };
    setForm({ ...form, learningMapping });
  };

  const handleStatusUpdate = async (projectId, status) => {
    try {
      await updateProject(projectId, { status });
      await refreshUser();
      toast.success('Status updated!');
      loadProjects();
    } catch (e) { toast.error('Failed to update'); }
  };

  return (
    <div>
      <div className="page-header flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>🚀 Projects</h1>
          <p>Build real projects and map concepts to real-world applications</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
      </div>

      {loading ? <div className="spinner" /> : (
        <div className="projects-grid">
          {projects.map(p => (
            <ProjectCard key={p._id} project={p} onStatusUpdate={handleStatusUpdate}
              onDelete={async (id) => {
                if (!window.confirm('Delete this project?')) return;
                await deleteProject(id);
                toast.success('Project deleted');
                loadProjects();
              }}
              onFeatureToggle={async (projectId, featureId, newStatus) => {
                await updateFeature(projectId, featureId, { status: newStatus });
                toast.success(newStatus === 'Done' ? '✅ Feature completed!' : 'Updated');
                loadProjects();
              }}
            />
          ))}
          {projects.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
              <div className="empty-icon">🚀</div>
              <h3>No projects yet</h3>
              <p>Create a project to start applying your concepts</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '760px' }}>
            <div className="modal-header">
              <span className="modal-title">🚀 New Project</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Project Name *</label>
                  <input className="form-input" placeholder="e.g. Online Class Booking System"
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">GitHub Link</label>
                  <input className="form-input" placeholder="https://github.com/..."
                    value={form.githubLink} onChange={e => setForm({ ...form, githubLink: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea className="form-textarea" placeholder="What does this project do?"
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
              </div>

              {/* Tech Stack */}
              <div className="form-group">
                <label className="form-label">Tech Stack</label>
                <div className="tech-picker">
                  {TECH_STACKS.map(t => (
                    <button type="button" key={t}
                      className={`concept-pick-btn ${form.techStack.includes(t) ? 'selected' : ''}`}
                      onClick={() => toggleTech(t)}>{t}</button>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="form-group">
                <label className="form-label">Features Breakdown</label>
                {form.features.map((f, idx) => (
                  <div key={idx} className="array-row">
                    <input className="form-input" placeholder="Feature name (e.g. Authentication)" style={{ flex: 2 }}
                      value={f.name} onChange={e => updateFeatureField(idx, 'name', e.target.value)} />
                    <input className="form-input" placeholder="Description" style={{ flex: 3 }}
                      value={f.description} onChange={e => updateFeatureField(idx, 'description', e.target.value)} />
                    {form.features.length > 1 &&
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => removeFeatureRow(idx)}>×</button>
                    }
                  </div>
                ))}
                <button type="button" className="btn btn-outline btn-sm mt-1" onClick={addFeatureRow}>+ Add Feature</button>
              </div>

              {/* Concepts Used */}
              <div className="form-group">
                <label className="form-label">Concepts Used</label>
                {form.conceptsUsed.map((c, idx) => (
                  <div key={idx} className="array-row">
                    <select className="form-select" style={{ flex: 1 }}
                      value={c.subject} onChange={e => updateConceptField(idx, 'subject', e.target.value)}>
                      {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <input className="form-input" placeholder="Concept (e.g. Indexing)" style={{ flex: 2 }}
                      value={c.concept} onChange={e => updateConceptField(idx, 'concept', e.target.value)} />
                    <input className="form-input" placeholder="How it's used" style={{ flex: 3 }}
                      value={c.description} onChange={e => updateConceptField(idx, 'description', e.target.value)} />
                  </div>
                ))}
                <button type="button" className="btn btn-outline btn-sm mt-1" onClick={addConceptRow}>+ Add Concept</button>
              </div>

              {/* Learning Mapping */}
              <div className="form-group">
                <label className="form-label">Learning Mapping</label>
                {form.learningMapping.map((l, idx) => (
                  <div key={idx} className="array-row">
                    <input className="form-input" placeholder="Concept" style={{ flex: 1 }}
                      value={l.concept} onChange={e => updateLearningField(idx, 'concept', e.target.value)} />
                    <input className="form-input" placeholder="What I learned" style={{ flex: 2 }}
                      value={l.whatLearned} onChange={e => updateLearningField(idx, 'whatLearned', e.target.value)} />
                    <input className="form-input" placeholder="Applied where" style={{ flex: 2 }}
                      value={l.appliedWhere} onChange={e => updateLearningField(idx, 'appliedWhere', e.target.value)} />
                  </div>
                ))}
                <button type="button" className="btn btn-outline btn-sm mt-1" onClick={addLearningRow}>+ Add Learning</button>
              </div>

              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : '🚀 Create Project'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project, onStatusUpdate, onDelete, onFeatureToggle }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="project-card">
      <div className="project-card-header">
        <div className="project-card-top">
          <div>
            <div className="project-name">{project.name}</div>
            <div className="project-desc">{project.description}</div>
          </div>
          <div className="flex gap-1">
            <select className={`status-select ${STATUS_COLORS[project.status]}`} value={project.status}
              onChange={e => onStatusUpdate(project._id, e.target.value)}>
              {STATUS_OPTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Tech stack */}
        <div className="flex gap-1 flex-wrap mt-2">
          {project.techStack?.map(t => <span key={t} className="tag">{t}</span>)}
        </div>

        {/* Progress */}
        <div className="project-progress-row">
          <span className="text-xs text-muted">Progress</span>
          <span className="text-xs font-mono" style={{ color: 'var(--accent-green)' }}>{project.progress}%</span>
        </div>
        <div className="progress-bar-container progress-bar-green" style={{ height: '6px' }}>
          <div className="progress-bar-fill" style={{ width: `${project.progress}%` }} />
        </div>

        <div className="project-card-actions">
          <button className="btn btn-outline btn-sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? '▲ Less' : '▼ Details'}
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => onDelete(project._id)}>Delete</button>
          {project.githubLink && <a href={project.githubLink} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">GitHub ↗</a>}
        </div>
      </div>

      {expanded && (
        <div className="project-details">
          {/* Features */}
          {project.features?.length > 0 && (
            <div className="project-section">
              <div className="project-section-title">📋 Features</div>
              {project.features.map(f => (
                <div key={f._id} className={`feature-item ${f.status === 'Done' ? 'done' : ''}`}
                  onClick={() => onFeatureToggle(project._id, f._id, f.status === 'Done' ? 'In Progress' : 'Done')}>
                  <span>{f.status === 'Done' ? '✅' : '⬜'}</span>
                  <div>
                    <div className="feature-name">{f.name}</div>
                    {f.description && <div className="text-xs text-muted">{f.description}</div>}
                  </div>
                  <span className={`tag ${f.status === 'Done' ? 'tag-green' : f.status === 'In Progress' ? 'tag-orange' : ''}`}>
                    {f.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Concepts Used */}
          {project.conceptsUsed?.length > 0 && (
            <div className="project-section">
              <div className="project-section-title">🧠 Concepts Mapped</div>
              {project.conceptsUsed.map((c, i) => (
                <div key={i} className="concept-row">
                  <span className="tag tag-cyan">{c.subject}</span>
                  <span className="concept-name">{c.concept}</span>
                  {c.description && <span className="text-xs text-muted">→ {c.description}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Learning mapping */}
          {project.learningMapping?.length > 0 && (
            <div className="project-section">
              <div className="project-section-title">💡 Learning Mapping</div>
              {project.learningMapping.map((l, i) => (
                <div key={i} className="learning-row">
                  <strong>{l.concept}</strong>
                  {l.whatLearned && <p>{l.whatLearned}</p>}
                  {l.appliedWhere && <span className="tag tag-green">Applied: {l.appliedWhere}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
