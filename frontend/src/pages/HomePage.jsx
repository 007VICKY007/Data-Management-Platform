import React from 'react';
import { SectionHeader, Footer } from '../components/UIComponents';

/* ── Accent colour map per card ── */
const accentMap = {
  magenta: { blob: 'rgba(236, 170, 193, 0.35)' },
  purple:  { blob: 'rgba(186, 170, 236, 0.30)' },
  teal:    { blob: 'rgba(170, 220, 210, 0.35)' },
  amber:   { blob: 'rgba(240, 210, 170, 0.40)' },
};

/* ── SolutionCard (matches screenshot) ── */
function SolutionCard({ icon, title, desc, accent = 'purple', btnLabel, onClick }) {
  const colors = accentMap[accent] || accentMap.purple;

  return (
    <div className="sol-card-wrapper">
      {/* Card body */}
      <div className="sol-card-body">
        <div className="sol-card-blob" style={{ background: colors.blob }} />
        <div className="sol-card-icon">{icon}</div>
        <h3 className="sol-card-title">{title}</h3>
        <p className="sol-card-desc">{desc}</p>
        <span className="sol-card-arrow">→</span>
      </div>
      {/* Button — separate from card */}
      <button className="sol-card-btn" onClick={onClick}>{btnLabel}</button>
    </div>
  );
}

/* ── HomePage ── */
export default function HomePage({ onNavigate }) {
  return (
    <div className="page-home">
      {/* Hero Banner */}
      <div className="page-banner">
        <div className="banner-row">
          <span className="banner-icon">🏛️</span>
          <div>
            <h1 className="banner-title">Enterprise Data Management Platform</h1>
          </div>
        </div>
        <p className="banner-subtitle">
          Empowering organizations to transform data governance from policy to practice through
          automated maturity assessment, quality monitoring, and intelligent issue resolution.
        </p>
      </div>

      <SectionHeader>Our Solutions</SectionHeader>

      <div className="solutions-grid">
        <SolutionCard
          icon="📈" title="Data Maturity Assessment"
          desc="Evaluate DAMA maturity dimensions across governance, quality, architecture, integration & privacy."
          accent="magenta"
          btnLabel="Start Maturity Assessment →"
          onClick={() => onNavigate('maturity')}
        />
        <SolutionCard
          icon="🔍" title="Data Quality Assessment"
          desc="Upload dataset, select dimensions & rules, generate automated DQ scores with annexure reports."
          accent="purple"
          btnLabel="Start DQ Assessment →"
          onClick={() => onNavigate('dq')}
        />
        <SolutionCard
          icon="📋" title="Policy Hub"
          desc="Centralized policy lifecycle management — from drafting to approval, with version control and compliance tracking."
          accent="teal"
          btnLabel="Open Policy Hub →"
          onClick={() => onNavigate('policy')}
        />
        <SolutionCard
          icon="📁" title="Case Management"
          desc="Track, manage and resolve data quality issues with full audit trail, escalation workflows and SLA monitoring."
          accent="amber"
          btnLabel="Open Case Management →"
          onClick={() => onNavigate('case')}
        />
      </div>

      {/* About Section */}
      <div className="about-section">
        <div className="about-header">
          <div className="about-logo">🏛️</div>
          <div>
            <div className="about-name">Uniqus Consultech</div>
            <div className="about-tagline-text">Change the way consulting is done</div>
          </div>
        </div>

        <p className="about-intro">
          <strong>Uniqus Consultech</strong> is a tech-enabled global consulting company founded in
          September 2022. Uniqus specialises in Accounting & Reporting, Governance Risk & Compliance,
          Sustainability & Climate, and Tech Consulting — delivering best-in-class solutions through
          proprietary technology platforms and a cloud-native global delivery model.
        </p>

        <div className="about-stats">
          {[
            ['700+', 'Professionals'], ['400+', 'Clients Served'], ['85+', 'Partners & Directors'],
            ['11', 'Global Offices'], ['$250M', 'Valuation'], ['2022', 'Year Founded'],
          ].map(([num, lbl]) => (
            <div key={lbl} className="about-stat">
              <div className="about-stat-num">{num}</div>
              <div className="about-stat-lbl">{lbl}</div>
            </div>
          ))}
        </div>

        <div className="about-section-lbl">Our Practice Areas</div>
        <div className="about-pillars">
          {[
            { icon: '📊', title: 'Accounting & Reporting (ARC)', badge: 'Reporting UniVerse',
              desc: 'US GAAP, IFRS, SEC advisory, financial close automation, IPO readiness.' },
            { icon: '🛡️', title: 'Governance, Risk & Compliance (GRC)', badge: 'Risk UniVerse',
              desc: 'SOX / ICOFR compliance, internal audit co-sourcing, ERM.' },
            { icon: '🌱', title: 'Sustainability & Climate (SCC)', badge: 'ESG UniVerse',
              desc: 'ESG strategy, CSRD / BRSR / ISSB reporting, carbon accounting.' },
            { icon: '🤖', title: 'Tech Consulting & AI', badge: 'Uniqus AI',
              desc: 'GenAI-powered solutions, finance automation, AI risk management.' },
          ].map((p) => (
            <div key={p.title} className="about-pillar">
              <div className="pillar-icon">{p.icon}</div>
              <div className="pillar-title">{p.title}</div>
              <div className="pillar-desc">{p.desc}</div>
              <span className="pillar-badge">{p.badge}</span>
            </div>
          ))}
        </div>

        <div className="about-section-lbl">Proprietary Technology Platforms</div>
        <div className="about-chips">
          {['🔵 Reporting UniVerse', '🔴 Risk UniVerse', '🟢 ESG UniVerse', '🟣 UniQuest (AI Research)', '✨ Uniqus AI (GenAI Engine)'].map((c) => (
            <span key={c} className="platform-chip">{c}</span>
          ))}
        </div>

        <div className="about-section-lbl">Backed By</div>
        <div className="about-chips">
          {['🏦 Nexus Venture Partners', '💼 Sorin Investments', '🌐 UST Global', '$42.5M Raised', 'Series C — April 2025'].map((c) => (
            <span key={c} className="investor-chip">{c}</span>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}