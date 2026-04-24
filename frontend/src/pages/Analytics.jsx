import React, { useState, useEffect } from 'react';
import { getAnalyticsOverview } from '../utils/api';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';
import './Analytics.css';

const COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{label}</p>
        <p className="tooltip-value">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalyticsOverview()
      .then(res => setData(res.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" style={{ marginTop: '4rem' }} />;
  if (!data) return null;

  const patternData = Object.entries(data.dsa.patternStats || {}).map(([name, value]) => ({ name: name.replace(' ', '\n'), value }));
  const conceptData = Object.entries(data.dbms.conceptStats || {}).map(([name, value]) => ({ name, value }));
  const diffData = [
    { name: 'Easy', value: data.dsa.difficultyStats?.Easy || 0 },
    { name: 'Medium', value: data.dsa.difficultyStats?.Medium || 0 },
    { name: 'Hard', value: data.dsa.difficultyStats?.Hard || 0 },
  ].filter(d => d.value > 0);

  const projectData = Object.entries(data.projects.statusStats || {}).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);

  return (
    <div className="analytics">
      <div className="page-header">
        <h1>📊 Analytics</h1>
        <p>Your learning journey in numbers</p>
      </div>

      {/* KPI Row */}
      <div className="grid-4 mb-3">
        <KpiCard icon="⚡" label="Total XP" value={data.user.xp} color="blue" />
        <KpiCard icon="🔥" label="Current Streak" value={`${data.user.streak}d`} color="orange" />
        <KpiCard icon="🧩" label="Problems Solved" value={data.dsa.total} color="purple" />
        <KpiCard icon="🗄️" label="DBMS Analyses" value={data.dbms.total} color="cyan" />
      </div>

      {/* Charts row */}
      <div className="analytics-grid">

        {/* DSA Pattern Radar */}
        <div className="card">
          <div className="chart-title">🧩 DSA Pattern Coverage</div>
          {patternData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={patternData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Radar name="Problems" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">Log problems to see pattern coverage</div>
          )}
        </div>

        {/* DSA Difficulty */}
        <div className="card">
          <div className="chart-title">🎯 Difficulty Breakdown</div>
          {diffData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={diffData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                    paddingAngle={4} dataKey="value">
                    {diffData.map((_, i) => <Cell key={i} fill={['#10b981', '#f59e0b', '#ef4444'][i]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-legend">
                {diffData.map((d, i) => (
                  <div key={d.name} className="pie-legend-item">
                    <span className="pie-dot" style={{ background: ['#10b981', '#f59e0b', '#ef4444'][i] }} />
                    <span>{d.name}</span>
                    <strong>{d.value}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="chart-empty">No problems logged yet</div>
          )}
        </div>

        {/* DBMS Concept Bar */}
        <div className="card">
          <div className="chart-title">🗄️ DBMS Concept Mastery</div>
          {conceptData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={conceptData} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#06b6d4" radius={[0, 6, 6, 0]}>
                  {conceptData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">Add DBMS analyses to see concept breakdown</div>
          )}
        </div>

        {/* Project Status */}
        <div className="card">
          <div className="chart-title">🚀 Project Status</div>
          {projectData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={projectData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    paddingAngle={4} dataKey="value">
                    {projectData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-legend">
                {projectData.map((d, i) => (
                  <div key={d.name} className="pie-legend-item">
                    <span className="pie-dot" style={{ background: COLORS[i] }} />
                    <span>{d.name}</span>
                    <strong>{d.value}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="chart-empty">No projects yet</div>
          )}
        </div>

      </div>

      {/* Badges section */}
      <div className="card mt-3">
        <div className="chart-title">🏆 Earned Badges</div>
        <div className="badges-grid">
          {data.user.badges?.map((b, i) => (
            <div key={i} className="badge-item">
              <div className="badge-icon">{b.icon}</div>
              <div className="badge-name">{b.name}</div>
            </div>
          ))}
          {(!data.user.badges?.length) && (
            <div className="empty-state" style={{ width: '100%' }}>
              <p>No badges yet. Keep solving to earn them! 🏆</p>
            </div>
          )}
        </div>
      </div>

      {/* Smart Suggestions */}
      {data.suggestions?.length > 0 && (
        <div className="card mt-3">
          <div className="chart-title">🧠 Personalized Suggestions</div>
          <div className="suggestions-grid">
            {data.suggestions.map((s, i) => (
              <div key={i} className="suggestion-card">
                <span className={`tag ${s.type === 'DSA' ? 'tag-purple' : s.type === 'DBMS' ? 'tag-cyan' : 'tag-green'}`}>{s.type}</span>
                <p>{s.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ icon, label, value, color }) {
  return (
    <div className={`stat-card kpi-${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
