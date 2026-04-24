import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './AuthPage.css';

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const LANGUAGES = ['C++', 'Python', 'Java', 'JavaScript'];
const ROLES = ['SDE', 'Backend Engineer', 'Full Stack', 'Data Engineer'];

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', password: '',
    skillLevel: 'Beginner', preferredLanguage: 'C++', targetRole: 'SDE',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form);
      }
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Something went wrong';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Background grid */}
      <div className="auth-bg">
        <div className="bg-grid" />
        <div className="bg-glow" />
      </div>

      <div className="auth-container">
        {/* Left Panel */}
        <div className="auth-left">
          <div className="auth-logo">
            <span className="auth-logo-icon">🎯</span>
            <span className="auth-logo-text">GoalPath</span>
          </div>
          <h1 className="auth-tagline">
            Become<br/>
            <span className="gradient-text">Interview-Ready</span>
          </h1>
          <p className="auth-desc">
            Master DSA patterns, analyze DBMS problems, and build projects — all in one place.
          </p>
          <div className="auth-features">
            {['🧩 DSA Pattern Recognition', '🗄️ DBMS Analysis System', '🚀 Project-Based Learning', '📊 Smart Analytics', '🏆 Gamification + XP'].map((f) => (
              <div key={f} className="auth-feature-item">{f}</div>
            ))}
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="auth-right">
          <div className="auth-form-card">
            <div className="auth-tabs">
              <button
                className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                onClick={() => setMode('login')}
              >Login</button>
              <button
                className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
                onClick={() => setMode('register')}
              >Register</button>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {mode === 'register' && (
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    className="form-input"
                    name="name"
                    placeholder="Your name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  className="form-input"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>

              {mode === 'register' && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Skill Level</label>
                      <select className="form-select" name="skillLevel" value={form.skillLevel} onChange={handleChange}>
                        {SKILL_LEVELS.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Language</label>
                      <select className="form-select" name="preferredLanguage" value={form.preferredLanguage} onChange={handleChange}>
                        {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Target Role</label>
                    <select className="form-select" name="targetRole" value={form.targetRole} onChange={handleChange}>
                      {ROLES.map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                </>
              )}

              <button className="btn btn-primary w-full btn-lg" type="submit" disabled={loading}>
                {loading ? '...' : mode === 'login' ? '🚀 Login to GoalPath' : '🎯 Start My Journey'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
