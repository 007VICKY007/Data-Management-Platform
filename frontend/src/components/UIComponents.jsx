import React from 'react';

/* ─── Page Banner ───────────────────────────────────── */
export function PageBanner({ icon, badge, title, subtitle }) {
  return (
    <div className="page-banner">
      <div className="banner-row">
        <span className="banner-icon">{icon}</span>
        <div>
          {badge && <div className="banner-badge">{badge}</div>}
          <h1 className="banner-title">{title}</h1>
        </div>
      </div>
      {subtitle && <p className="banner-subtitle">{subtitle}</p>}
    </div>
  );
}

/* ─── Navigation Pills ──────────────────────────────── */
export function NavPills({ current, onChange }) {
  const pages = [
    { key: 'home', label: '🏠 Home' },
    { key: 'maturity', label: '📈 Maturity' },
    { key: 'dq', label: '🔍 Data Quality' },
    { key: 'policy', label: '📋 Policies' },
    { key: 'case', label: '📁 Case Mgmt' },
  ];

  return (
    <div className="nav-pills">
      {pages.map((p) => (
        <button
          key={p.key}
          className={`nav-pill ${current === p.key ? 'active' : ''}`}
          onClick={() => onChange(p.key)}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Score Card ────────────────────────────────────── */
export function ScoreCard({ value, label, size = 'normal' }) {
  const cls =
    value >= 80 ? 'excellent' : value >= 60 ? 'good' : value >= 40 ? 'fair' : 'poor';
  return (
    <div className={`score-card ${size}`}>
      <div className={`score-val ${cls}`}>
        {typeof value === 'number' ? `${value.toFixed(1)}%` : value}
      </div>
      <div className="score-lbl">{label}</div>
    </div>
  );
}

/* ─── SVG Gauge ─────────────────────────────────────── */
export function SvgGauge({ score, label }) {
  const r = 45;
  const circ = Math.PI * r;
  const dash = (score / 100) * circ;
  const gap = circ - dash;
  const col =
    score >= 80 ? '#5b2d90' : score >= 60 ? '#b10f74' : score >= 40 ? '#d97706' : '#dc2626';

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width="120" height="70" viewBox="0 0 120 70">
        <path d={`M 15 55 A ${r} ${r} 0 0 1 105 55`} fill="none" stroke="#e9e4f5" strokeWidth="10" strokeLinecap="round" />
        <path d={`M 15 55 A ${r} ${r} 0 0 1 105 55`} fill="none" stroke={col} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${dash.toFixed(1)} ${gap.toFixed(1)}`} />
        <text x="60" y="50" textAnchor="middle" fontSize="15" fontWeight="800" fill={col}>{score.toFixed(0)}%</text>
      </svg>
      <div className="gauge-label">{label}</div>
    </div>
  );
}

/* ─── Section Header ────────────────────────────────── */
export function SectionHeader({ children, color }) {
  return (
    <div className="section-header">
      <div className={`section-dot ${color || ''}`} />
      <h3>{children}</h3>
      <div className="section-accent" />
    </div>
  );
}

/* ─── Metric Card ───────────────────────────────────── */
export function MetricCard({ value, label, icon }) {
  return (
    <div className="metric-card">
      {icon && <span className="metric-icon">{icon}</span>}
      <div className="metric-val">{value}</div>
      <div className="metric-lbl">{label}</div>
    </div>
  );
}

/* ─── Solution Card ─────────────────────────────────── */
export function SolutionCard({ icon, title, desc, accent, onClick, btnLabel }) {
  return (
    <div className="solution-card">
      <div className={`card-accent ${accent || ''}`} />
      <div className="card-icon">{icon}</div>
      <div className="card-title">{title}</div>
      <div className="card-desc">{desc}</div>
      <span className="card-arrow">→</span>
      {btnLabel && (
        <button className="card-btn" onClick={onClick}>
          {btnLabel}
        </button>
      )}
    </div>
  );
}

/* ─── Data Table ────────────────────────────────────── */
export function DataTable({ data, columns, maxHeight = 400 }) {
  if (!data || data.length === 0) return <div className="empty-state">No data available</div>;

  const cols = columns || Object.keys(data[0]);

  return (
    <div className="data-table-wrap" style={{ maxHeight }}>
      <table className="data-table">
        <thead>
          <tr>{cols.map((c) => <th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>{cols.map((c) => <td key={c}>{String(row[c] ?? '')}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Loading Spinner ───────────────────────────────── */
export function Spinner({ message }) {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
      {message && <p className="spinner-msg">{message}</p>}
    </div>
  );
}

/* ─── Footer ────────────────────────────────────────── */
export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="app-footer">
      <div className="footer-top">
        <div className="footer-brand">
          <div className="footer-logo">🏛️</div>
          <div>
            <div className="footer-name">Uniqus Consultech</div>
            <div className="footer-tagline">Change the way consulting is done</div>
          </div>
        </div>
        <div className="footer-links">
          <a href="https://uniqus.com" target="_blank" rel="noreferrer">🌐 uniqus.com</a>
          <a href="https://uniqus.com/about-us/" target="_blank" rel="noreferrer">About Us</a>
          <a href="https://uniqus.com/our-services/" target="_blank" rel="noreferrer">Services</a>
          <a href="https://uniqus.com/contact-us/" target="_blank" rel="noreferrer">Contact</a>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="footer-copy">
          <strong>© {year} Uniqus Consultech Inc.</strong> All rights reserved. · Enterprise Data Management Platform
        </div>
        <div className="footer-pills">
          <span className="footer-pill">🇺🇸 USA</span>
          <span className="footer-pill">🇮🇳 India</span>
          <span className="footer-pill">🌍 Middle East</span>
          <span className="footer-pill">700+ Professionals</span>
        </div>
      </div>
    </footer>
  );
}
