import React from 'react';
import { PageBanner, NavPills } from '../components/UIComponents';

export default function CasePage({ onNavigate }) {
  return (
    <div className="page-case">
      <PageBanner icon="📁" badge="Issue Resolution Centre" title="Case Management"
        subtitle="Track, manage and resolve data quality issues and governance cases with full audit trail, escalation workflows and SLA monitoring." />
      <NavPills current="case" onChange={onNavigate} />

      <div className="coming-soon">
        <div className="cs-icon">🚧</div>
        <h2 className="cs-title">Coming Soon</h2>
        <p className="cs-subtitle">Case Management is currently under development.</p>
        <p className="cs-desc">
          This module will allow you to raise, track, escalate and resolve data quality issues
          and governance cases — with SLA monitoring, role-based assignments and a full audit trail.
        </p>
        <div className="cs-features">
          {[
            { icon: '🎫', label: 'Case Ticketing' },
            { icon: '⏱️', label: 'SLA Monitoring' },
            { icon: '📊', label: 'Audit Trail' },
            { icon: '🔔', label: 'Escalation Alerts' },
          ].map((f) => (
            <div key={f.label} className="cs-feature-card">
              <div className="cs-feat-icon">{f.icon}</div>
              <div className="cs-feat-label">{f.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <button className="btn-secondary" onClick={() => onNavigate('home')}>← Back to Home</button>
      </div>
    </div>
  );
}