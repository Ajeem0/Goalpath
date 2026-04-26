import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiBarChart2,
  FiBook,
  FiCalendar,
  FiGrid,
  FiLogOut,
  FiTarget,
  FiTrendingUp,
  FiUser,
  FiZap,
} from 'react-icons/fi';
import { BsFire } from 'react-icons/bs';
import './Sidebar.css';

const NAV_ITEMS = [
  { to: '/', icon: FiGrid, label: 'Dashboard' },
  { to: '/goals', icon: FiCalendar, label: 'Daily Goals' },
  { to: '/dsa', icon: FiTarget, label: 'DSA Practice' },
  { to: '/dbms', icon: FiZap, label: 'DBMS Analysis' },
  { to: '/projects', icon: FiTrendingUp, label: 'Projects' },
  { to: '/books', icon: FiBook, label: 'Book Reading' },
  { to: '/analytics', icon: FiBarChart2, label: 'Analytics' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const xpLevel = Math.floor((user?.xp || 0) / 100) + 1;
  const xpProgress = (user?.xp || 0) % 100;

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon"><FiTarget /></div>
        {!collapsed && (
          <div className="logo-text">
            <span className="logo-title">GoalPath</span>
            <span className="logo-sub">Interview Prep</span>
          </div>
        )}
        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* User info */}
      {!collapsed && user && (
        <div className="sidebar-user">
          <div className="user-avatar">{user.name?.charAt(0).toUpperCase()}</div>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-role">{user.targetRole}</div>
            <div className="user-xp-bar">
              <div className="xp-text">
                <span>Lvl {xpLevel}</span>
                <span>{user.xp} XP</span>
              </div>
              <div className="xp-track">
                <div className="xp-fill" style={{ width: `${xpProgress}%` }} />
              </div>
            </div>
            <div className="user-streak">
              <BsFire style={{ marginRight: 6, verticalAlign: '-0.1em' }} /> {user.streak || 0} day streak
            </div>
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon"><item.icon /></span>
            {!collapsed && <span className="nav-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: profile + logout */}
      <div className="sidebar-bottom">
        {!collapsed && (
          <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon"><FiUser /></span>
            <span className="nav-label">Profile</span>
          </NavLink>
        )}
        <button className="nav-item logout-btn" onClick={handleLogout}>
          <span className="nav-icon"><FiLogOut /></span>
          {!collapsed && <span className="nav-label">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
