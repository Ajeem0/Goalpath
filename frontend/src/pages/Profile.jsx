import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';
import './Profile.css';

const ALL_BADGES = [
  { id: 'problem_solver', icon: '🎯', name: 'Problem Solver', desc: 'Solved 10 DSA problems' },
  { id: 'dp_warrior', icon: '⚔️', name: 'DP Warrior', desc: 'Solved 5 DP problems' },
  { id: 'dp_master', icon: '🧠', name: 'DP Master', desc: 'Solved 15 DP problems' },
  { id: 'graph_explorer', icon: '🕸️', name: 'Graph Explorer', desc: 'Solved 5 Graph problems' },
  { id: 'dsa_champion', icon: '🏆', name: 'DSA Champion', desc: 'Solved 50 DSA problems' },
  { id: 'dbms_starter', icon: '🗄️', name: 'DBMS Starter', desc: 'Added 3 DBMS analyses' },
  { id: 'dbms_expert', icon: '💎', name: 'DBMS Expert', desc: 'Added 10 DBMS analyses' },
  { id: 'transaction_master', icon: '🔐', name: 'Transaction Master', desc: 'Mastered ACID concepts' },
  { id: 'index_optimizer', icon: '⚡', name: 'Index Optimizer', desc: 'Used indexing 5 times' },
  { id: 'project_starter', icon: '🚀', name: 'Project Starter', desc: 'Created first project' },
  { id: 'project_builder', icon: '🏗️', name: 'Project Builder', desc: 'Completed 3 projects' },
  { id: 'project_master', icon: '👑', name: 'Project Master', desc: 'Completed 5 projects' },
  { id: 'streak_7', icon: '🔥', name: '7-Day Streak', desc: 'Maintained 7-day streak' },
  { id: 'streak_30', icon: '💫', name: '30-Day Streak', desc: 'Maintained 30-day streak' },
  { id: 'goal_crusher', icon: '✅', name: 'Goal Crusher', desc: 'Completed 50 daily goals' },
];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    skillLevel: '',
    preferredLanguage: '',
    targetRole: '',
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        skillLevel: user.skillLevel || 'beginner',
        preferredLanguage: user.preferredLanguage || 'C++',
        targetRole: user.targetRole || 'SDE',
      });
    }
    loadNotifications();
  }, [user]);

  const loadNotifications = async () => {
    setLoadingNotifs(true);
    try {
      const res = await authAPI.getNotifications();
      setNotifications(res.data.notifications || []);
    } catch {
      // silent fail
    } finally {
      setLoadingNotifs(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await authAPI.updateProfile(form);
      updateUser(res.data.user);
      toast.success('Profile updated!');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const markNotifRead = async (notifId) => {
    try {
      await authAPI.markNotificationRead(notifId);
      setNotifications(prev =>
        prev.map(n => n._id === notifId ? { ...n, read: true } : n)
      );
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  if (!user) return null;

  const userBadges = user.badges || [];
  const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="profile-page">

      {/* Hero */}
      <div className="profile-hero">
        <div className="profile-avatar-large">{initial}</div>

        <div className="profile-hero-info">
          <h1>{user.name}</h1>
          <p>{user.email}</p>
          <div className="profile-meta-tags">
            <span className="profile-meta-tag level">
              {user.skillLevel?.charAt(0).toUpperCase() + user.skillLevel?.slice(1) || 'Beginner'}
            </span>
            <span className="profile-meta-tag lang">{user.preferredLanguage || 'C++'}</span>
            <span className="profile-meta-tag role">{user.targetRole || 'SDE'}</span>
          </div>
        </div>

        <div className="profile-xp-section">
          <div className="profile-xp-big">{(user.xp || 0).toLocaleString()}</div>
          <div className="profile-xp-label">Total XP</div>
          <div className="profile-streak-badge">
            🔥 {user.streak || 0} Day Streak
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="profile-stats-row">
        <div className="profile-stat-card">
          <div className="profile-stat-icon">🏅</div>
          <div className="profile-stat-value">{userBadges.length}</div>
          <div className="profile-stat-label">Badges Earned</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-icon">💡</div>
          <div className="profile-stat-value">{user.xp || 0}</div>
          <div className="profile-stat-label">XP Points</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-icon">📅</div>
          <div className="profile-stat-value">{user.streak || 0}</div>
          <div className="profile-stat-label">Day Streak</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-icon">🔔</div>
          <div className="profile-stat-value">{unreadCount}</div>
          <div className="profile-stat-label">Unread Alerts</div>
        </div>
      </div>

      {/* Edit Profile */}
      <div className="profile-section">
        <div className="profile-section-title">
          <span>✏️</span>
          Edit Profile
          {!editing && (
            <button
              className="btn-outline"
              style={{ marginLeft: 'auto', padding: '0.4rem 1rem', fontSize: '0.8rem' }}
              onClick={() => setEditing(true)}
            >
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <>
            <div className="edit-form-grid">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Skill Level</label>
                <select
                  className="form-select"
                  value={form.skillLevel}
                  onChange={e => setForm({ ...form, skillLevel: e.target.value })}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Preferred Language</label>
                <select
                  className="form-select"
                  value={form.preferredLanguage}
                  onChange={e => setForm({ ...form, preferredLanguage: e.target.value })}
                >
                  <option value="C++">C++</option>
                  <option value="Python">Python</option>
                  <option value="Java">Java</option>
                  <option value="JavaScript">JavaScript</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Target Role</label>
                <select
                  className="form-select"
                  value={form.targetRole}
                  onChange={e => setForm({ ...form, targetRole: e.target.value })}
                >
                  <option value="SDE">SDE (Software Dev Engineer)</option>
                  <option value="Backend">Backend Engineer</option>
                  <option value="Frontend">Frontend Engineer</option>
                  <option value="Fullstack">Full Stack Engineer</option>
                  <option value="DevOps">DevOps Engineer</option>
                </select>
              </div>
            </div>

            <div className="edit-form-actions">
              <button
                className="btn-outline"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </>
        ) : (
          <div className="edit-form-grid">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="form-input" style={{ opacity: 0.8 }}>{user.name}</div>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="form-input" style={{ opacity: 0.8 }}>{user.email}</div>
            </div>
            <div className="form-group">
              <label className="form-label">Skill Level</label>
              <div className="form-input" style={{ opacity: 0.8, textTransform: 'capitalize' }}>{user.skillLevel}</div>
            </div>
            <div className="form-group">
              <label className="form-label">Preferred Language</label>
              <div className="form-input" style={{ opacity: 0.8 }}>{user.preferredLanguage}</div>
            </div>
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="profile-section">
        <div className="profile-section-title">
          <span>🏆</span>
          Badges & Achievements ({userBadges.length} / {ALL_BADGES.length})
        </div>
        <div className="badges-grid-profile">
          {ALL_BADGES.map(badge => {
            const earned = userBadges.includes(badge.id);
            return (
              <div key={badge.id} className={`badge-card-profile ${earned ? 'earned' : 'locked'}`}>
                <div className="badge-icon-profile">{badge.icon}</div>
                <div className="badge-name-profile">{badge.name}</div>
                <div className="badge-desc-profile">{badge.desc}</div>
                {!earned && (
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    🔒 Locked
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Notifications */}
      <div className="profile-section">
        <div className="profile-section-title">
          <span>🔔</span>
          Notifications
          {unreadCount > 0 && (
            <span style={{
              background: 'var(--accent-blue)',
              color: 'white',
              borderRadius: '10px',
              padding: '0.1rem 0.5rem',
              fontSize: '0.7rem',
              marginLeft: '0.5rem',
            }}>
              {unreadCount} new
            </span>
          )}
        </div>

        {loadingNotifs ? (
          <div className="no-notifications">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="no-notifications">
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔕</div>
            No notifications yet
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.slice(0, 10).map(notif => (
              <div
                key={notif._id}
                className={`notification-item ${notif.read ? 'read' : 'unread'}`}
              >
                <span className="notification-icon">
                  {notif.type === 'goal' ? '🎯' :
                    notif.type === 'badge' ? '🏆' :
                    notif.type === 'streak' ? '🔥' : '💡'}
                </span>
                <div className="notification-content">
                  <div className="notification-message">{notif.message}</div>
                  <div className="notification-time">
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </div>
                </div>
                {!notif.read && (
                  <button
                    className="mark-read-btn"
                    onClick={() => markNotifRead(notif._id)}
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weak Areas */}
      {user.weakAreas && user.weakAreas.length > 0 && (
        <div className="profile-section">
          <div className="profile-section-title">
            <span>⚠️</span>
            Areas to Improve
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {user.weakAreas.map(area => (
              <span key={area} style={{
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                background: 'rgba(252, 129, 129, 0.1)',
                color: 'var(--accent-red)',
                border: '1px solid rgba(252, 129, 129, 0.25)',
                fontSize: '0.85rem',
                fontWeight: '600',
              }}>
                ⚠️ {area}
              </span>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
