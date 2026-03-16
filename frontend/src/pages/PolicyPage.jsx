import React, { useState } from 'react';
import { PageBanner, NavPills } from '../components/UIComponents';

const PHASES = [
  {
    num: 1, title: 'Document Management', gradient: '135deg,#3d1d63 0%,#5b2d90 55%,#b10f74 100%',
    features: [
      { title: 'Central Secure Repository', desc: 'Central, secure repository for all policies, procedures and supporting documents with English as the master language.' },
      { title: 'Rich Authoring', desc: 'Create, edit and format content and paste from Word with original formatting, headers and footers preserved.' },
      { title: 'Strong Version Control', desc: 'Automatic versioning, complete history, comparison of versions and controlled rollback based on role.' },
      { title: 'Structured Hierarchy (L1–L6)', desc: 'Folders/sections, metadata and tags to organize policies logically and enable drill-down navigation.' },
      { title: 'Lifecycle States', desc: 'Draft, in-review, approved, published, archived and restored, with retention rules and soft delete for recovery.' },
    ],
    deliverables: 'Centralized, audit-ready policy management with full version history and lifecycle states. Reduced regulatory risk through controlled versioning and approval states. Improved compliance visibility with structured hierarchies, metadata, and tagging.',
  },
  {
    num: 2, title: 'Collaboration', gradient: '135deg,#3d1d63 0%,#5b2d90 55%,#b10f74 100%',
    features: [
      { title: 'Real-Time Co-Authoring', desc: 'Real-time co-authoring for editors with presence indicators, conflict handling and auto-save, similar to Microsoft 365 behaviour.' },
      { title: 'Inline Comments & @Mentions', desc: 'Inline comments on specific sections, threaded conversations and @mentions to involve subject-matter experts and approvers.' },
      { title: 'Shared Workspaces', desc: 'Shared workspaces for departments/projects with configurable access (e.g., HR policy workspace, Credit policy workspace).' },
      { title: 'Discussion Panels & Activity Feed', desc: 'Discussion panels / activity feed on each policy showing comments, decisions and history to keep context in one place.' },
      { title: 'Email & In-App Alerts', desc: 'Email and in-app alerts when content is shared, commented on or moved between workflow stages.' },
    ],
    deliverables: 'Faster approvals and content finalization through real-time co-authoring and inline comments. Improved stakeholder engagement with shared workspaces. Stronger governance transparency with all discussions, decisions, and changes recorded in context.',
  },
  {
    num: 3, title: 'Search', gradient: '135deg,#3d1d63 0%,#5b2d90 55%,#b10f74 100%',
    features: [
      { title: 'Enterprise Search', desc: 'Enterprise search across SharePoint sites, libraries and Microsoft Lists, indexing policy titles, body text, metadata, tags and attachments.' },
      { title: 'Multilingual Search', desc: 'Search in both English and (where applicable) Arabic content; linked language versions surfaced together.' },
      { title: 'Advanced Filters', desc: 'Filter by department, policy type, status (draft/published/archived), last updated date, owner, labels/tags and classification.' },
      { title: 'Relevance-Ranked Results', desc: 'Relevance-ranked results with highlighted keywords, content snippets and clear indication if the hit is in the page or in an attachment.' },
      { title: 'Saved Searches & Views', desc: 'Saved searches / views (e.g., "My department\'s published policies", "Policies updated in last 30 days").' },
    ],
    deliverables: 'Faster access to critical policies with enterprise-wide search across documents, metadata, and attachments. Improved compliance adherence with advanced filters and relevance-ranked results. Operational efficiency through saved searches and smart views.',
  },
  {
    num: 4, title: 'Personalization', gradient: '135deg,#3d1d63 0%,#5b2d90 55%,#b10f74 100%',
    features: [
      { title: 'White-Labelled Portal', desc: 'White-labelled portal aligned with the bank\'s branding (logo, colours, fonts, layouts, favicon and email templates).' },
      { title: 'Role-Based Home Pages', desc: 'Role-based home pages and personalized dashboards showing relevant policies, tasks, approvals and frequently used links.' },
      { title: 'Configurable Widgets', desc: 'Configurable widgets (e.g., "Recently viewed", "Policies due for review", "My drafts") that users can add, remove and reorder.' },
      { title: 'User Preferences', desc: 'User preferences for language, time zone, theme (light/dark) and default landing view (by department, by policy type, etc.).' },
      { title: 'Personal Collections', desc: 'Favourites, pinned documents and saved filters so power-users can build their own "workspace" on top of the portal.' },
    ],
    deliverables: 'Higher user adoption with role-based home pages and personalized dashboards. Faster task completion with configurable widgets and instant pending action visibility. Consistent brand experience with white-labelled portal.',
  },
  {
    num: 5, title: 'Approval Workflow', gradient: '135deg,#3d1d63 0%,#5b2d90 55%,#b10f74 100%',
    features: [
      { title: 'DOA-Based Configurable Workflows', desc: 'Configurable policy workflows based on the Delegation of Authority (DOA) matrix, with different routes per department or policy type.' },
      { title: 'Sequential & Parallel Approvals', desc: 'Support for sequential and parallel approvals with due dates at each step.' },
      { title: 'Email-Based Approvals', desc: 'Approvers receive branded emails with summary and can approve/reject via secure links without complex navigation.' },
      { title: 'Mandatory Comments & Audit Trail', desc: 'Mandatory comments on rejection or major change requests, captured in the audit trail alongside decisions and timestamps.' },
      { title: 'Escalation & Dashboards', desc: 'Escalation rules and reminders for overdue approvals, plus dashboards showing bottlenecks, average cycle time and pending items.' },
    ],
    deliverables: 'Faster approvals and renewals with DOA-aligned workflows and email approvals. Reduced regulatory risk through mandatory comments, escalations, and audit trails. Improved visibility with dashboards showing bottlenecks and pending items.',
  },
  {
    num: 6, title: 'Access Management', gradient: '135deg,#3d1d63 0%,#5b2d90 55%,#b10f74 100%',
    features: [
      { title: 'SSO & MFA Integration', desc: 'SSO via Microsoft 365 / Azure AD, using existing corporate credentials and security policies (including optional MFA).' },
      { title: 'Role-Based Access Model', desc: 'Role-based access model (Admin, Editor, Viewer, plus optional custom roles) controlling create/edit/publish/archive permissions.' },
      { title: 'Department & Policy-Wise Access', desc: 'Each policy mapped to departments and policy groups; users only see content they are authorized for.' },
      { title: 'Document & Section-Level Permissions', desc: 'Document- and section-level permissions for confidential content, with ability to restrict certain annexures or clauses to small groups.' },
      { title: 'Comprehensive Access Logs', desc: 'Comprehensive access logs, real-time monitoring of suspicious activity and exportable reports for internal audit and regulators.' },
    ],
    deliverables: 'Stronger data protection with SSO, MFA, and role-based access restricting sensitive content to authorized users. Audit-ready access controls with comprehensive logs and exportable reports. Better information governance with department-wise and document-level permissions.',
  },
  {
    num: 7, title: 'Notifications & Audit Trails', gradient: '135deg,#3d1d63 0%,#5b2d90 55%,#b10f74 100%',
    features: [
      { title: 'Event-Based Notifications', desc: 'Event-based notifications for created/updated/deleted/published policies, new comments, @mentions, workflow transitions and overdue tasks.' },
      { title: 'Configurable Frequency & Channels', desc: 'Configurable frequency (immediate, daily digest, weekly summary) and channels.' },
      { title: 'Full Audit Trail', desc: 'Full audit trail capturing authentication events, content changes, approvals, permission changes, version restores and deletions with user, time and IP/device.' },
      { title: 'Tamper-Resistant Logging', desc: 'Tamper-resistant logging aligned to banking/audit expectations, with long-term retention and export for external auditors.' },
      { title: 'Activity Dashboards & Reports', desc: 'Dashboards and reports on activity (who changed what, when; policy review history; access to sensitive policies).' },
    ],
    deliverables: 'Audit-ready governance with full audit trail capturing all events with user, time and IP/device. Improved compliance oversight with dashboards showing policy history and access patterns. Faster issue resolution with event-based notifications and configurable alerts.',
  },
  {
    num: 8, title: 'Security', gradient: '135deg,#3d1d63 0%,#5b2d90 55%,#b10f74 100%',
    features: [
      { title: 'Microsoft 365 Security Stack', desc: 'Built on Microsoft 365 security stack: encryption in transit (TLS) and at rest, secure tenant configuration and hardening.' },
      { title: 'Bank & Central Bank Alignment', desc: 'Alignment with bank and central-bank cybersecurity policies (RBAC, least-privilege, change control, periodic access reviews, segregation of duties).' },
      { title: 'Field-Level Protection & DLP', desc: 'Optional field-level protection for highly sensitive information (e.g., pricing, limits, internal codes) using SharePoint sensitivity labels / DLP.' },
      { title: 'Vulnerability Management & SIEM', desc: 'Regular vulnerability management (patching, configuration checks) and support for integration with SIEM/SOC monitoring for security events.' },
      { title: 'Backup & Business Continuity', desc: 'Backup, recovery and business-continuity features consistent with Microsoft 365 SLAs, plus bank-defined retention for content.' },
    ],
    deliverables: 'Reduced cyber and regulatory risk with enterprise-grade encryption, RBAC, and DLP. Business continuity assurance with backup, recovery and Microsoft 365 SLAs. Regulatory confidence with security controls supporting forensic and audit reviews.',
  },
  {
    num: 9, title: 'Task Management', gradient: '135deg,#3d1d63 0%,#5b2d90 55%,#b10f74 100%',
    features: [
      { title: 'Integrated Task List', desc: 'Integrated task list for policy-related work: drafting, reviews, approvals, periodic reviews, attestation follow-ups and remediation actions.' },
      { title: 'Task Assignment & Tracking', desc: 'Assign tasks to individuals or groups with due dates, priority, status (not started / in progress / on hold / completed) and links to the relevant policy.' },
      { title: 'Reminders & Escalation', desc: 'Reminders and escalation for overdue tasks; dashboard views for managers to see workload, bottlenecks and completion rates.' },
      { title: 'Templates & Automation Rules', desc: 'Templates and automation rules to auto-create tasks on specific events (e.g., "policy due for annual review", "policy rejected – rework required").' },
      { title: 'Task SLA Reporting', desc: 'Reporting on task SLAs, completion trends and open items by department to support governance committees.' },
    ],
    deliverables: 'Stronger compliance execution with automated tasks ensuring timely reviews and attestations. Faster turnaround with reminders, escalation, and manager dashboards. Actionable governance insights with reporting on task SLAs and completion trends.',
  },
];

export default function PolicyPage({ onNavigate }) {
  const [openPhase, setOpenPhase] = useState(null);

  return (
    <div className="page-policy">
      <PageBanner icon="📋" badge="Policy Lifecycle" title="Policy Hub"
        subtitle="Centralized policy lifecycle management — from AI-assisted drafting to multi-stage approval, version control, compliance monitoring, and retirement." />
      <NavPills current="policy" onChange={onNavigate} />

      <div className="policy-phases">
        {PHASES.map((phase) => (
          <details key={phase.num} className="phase-accordion"
            open={openPhase === phase.num}
            onClick={(e) => { e.preventDefault(); setOpenPhase(openPhase === phase.num ? null : phase.num); }}>
            <summary className="phase-summary" style={{ background: `linear-gradient(${phase.gradient})` }}>
              <span className="phase-badge">{phase.num}</span>
              {phase.title}
            </summary>
            <div className="phase-body" onClick={(e) => e.stopPropagation()}>
              {phase.features.map((f, i) => (
                <div key={i} className="phase-feature">
                  <div className="feat-title">{f.title}</div>
                  <div className="feat-desc">{f.desc}</div>
                </div>
              ))}
              <div className="phase-deliverables">
                <div className="deliv-label">Key Deliverables</div>
                <div className="deliv-text">{phase.deliverables}</div>
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}