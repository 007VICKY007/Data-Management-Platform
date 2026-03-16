import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PageBanner, NavPills, SectionHeader, Spinner } from '../components/UIComponents';
import { getMaturityQuestions, submitMaturity, downloadMaturityExcel, downloadMaturityPDF } from '../utils/api';
import * as XLSX from 'xlsx';

/* ═══════════════════════════════════════════════════════════════
   UNIQUS BRAND COLOURS  (from config.py)
   ═══════════════════════════════════════════════════════════════ */
const UNIQU_PURPLE       = "#5b2d90";
const UNIQU_MAGENTA      = "#b10f74";
const UNIQU_LAVENDER     = "#ede8f7";
const UNIQU_LIGHT_BG     = "#ffffff";
const UNIQU_TEXT          = "#1a1a2e";
const UNIQU_GREY          = "#d9cef0";
const UNIQU_PURPLE_DARK   = "#3d1d63";
const UNIQU_PURPLE_MID    = "#7c4dbb";
const UNIQU_PURPLE_LIGHT  = "#ede8f7";
const UNIQU_PURPLE_PALE   = "#f5f0fc";
const UNIQU_SURFACE       = "#f9f8fc";

/* ═══════════════════════════════════════════════════════════════
   QUESTION BANK  — mirrors config.py QUESTION_BANK exactly
   ═══════════════════════════════════════════════════════════════ */
const QUESTION_BANK = {
  "Data Governance": [
    { id: "DG-1",  section: "Data Management Strategy (DMS)", question: "Documented Data Management Strategy exists (vision, scope, objectives).", weight: 2 },
    { id: "DG-2",  section: "Data Management Strategy (DMS)", question: "Stakeholders are involved in strategy creation and review.", weight: 1 },
    { id: "DG-3",  section: "Data Management Strategy (DMS)", question: "Strategy is approved, published, and communicated to relevant stakeholders.", weight: 1 },
    { id: "DG-4",  section: "Roles & Responsibilities",       question: "Data roles (Owner, Steward, Custodian) are defined for the object.", weight: 2 },
    { id: "DG-5",  section: "Roles & Responsibilities",       question: "Roles and responsibilities are documented and communicated.", weight: 1 },
    { id: "DG-6",  section: "Policies & Standards",           question: "Governance policies/standards exist (naming, definitions, approvals).", weight: 2 },
    { id: "DG-7",  section: "Policies & Standards",           question: "Policies are periodically reviewed and updated.", weight: 1 },
    { id: "DG-8",  section: "DMO",                            question: "Data Management Office (DMO) / governance forum exists.", weight: 2 },
    { id: "DG-9",  section: "DMO",                            question: "Operating model & governance cadence are defined (RACI, forums, KPIs).", weight: 1 },
    { id: "DG-10", section: "Change Management",              question: "Change control process exists for master data requests/updates.", weight: 2 },
    { id: "DG-11", section: "Change Management",              question: "Training / enablement exists for users and data stewards.", weight: 1 },
    { id: "DG-12", section: "Issue Management",               question: "Issue logging, triage, and resolution workflow exists.", weight: 1 },
    { id: "DG-13", section: "Issue Management",               question: "Root-cause analysis and lessons learned are captured.", weight: 1 },
    { id: "DG-14", section: "Metadata",                       question: "Metadata (definitions, owners, rules) is managed in a repository/catalog.", weight: 1 },
    { id: "DG-15", section: "Metadata",                       question: "Data lineage is tracked and documented end-to-end across systems.", weight: 1 },
  ],
  "Data Quality": [
    { id: "DQ-1",  section: "Assessment & Rules", question: "Data quality assessment policy exists (what, how often, ownership).", weight: 2 },
    { id: "DQ-2",  section: "Assessment & Rules", question: "DQ rules are defined (completeness, validity, uniqueness, consistency).", weight: 2 },
    { id: "DQ-3",  section: "Assessment & Rules", question: "DQ rules cover critical fields and are documented with thresholds.", weight: 2 },
    { id: "DQ-4",  section: "Monitoring",         question: "DQ monitoring is periodic and tracked (dashboards/scorecards).", weight: 2 },
    { id: "DQ-5",  section: "Monitoring",         question: "Automated validation exists (API checks, format checks, reference checks).", weight: 1 },
    { id: "DQ-6",  section: "Duplicates",         question: "Duplicate detection & golden record process exists.", weight: 2 },
    { id: "DQ-7",  section: "Profiling",          question: "Data profiling is performed using tools/standard techniques.", weight: 1 },
    { id: "DQ-8",  section: "Profiling",          question: "Anomalies/inconsistencies are identified and resolved consistently.", weight: 1 },
    { id: "DQ-9",  section: "Standardization",    question: "Standardization rules exist (formats, naming conventions, codes).", weight: 2 },
    { id: "DQ-10", section: "Standardization",    question: "Uniform definitions and formatting are applied across datasets/systems.", weight: 1 },
    { id: "DQ-11", section: "Cleansing",          question: "Cleansing workflow/tools exist (issue queues, approvals, audit trail).", weight: 2 },
    { id: "DQ-12", section: "Cleansing",          question: "Recurring cleansing is planned (not only ad-hoc one-time fixes).", weight: 1 },
  ],
  "Data Architecture": [
    { id: "DA-1", section: "Enterprise Data Model",  question: "An enterprise or conceptual data model exists and is maintained.", weight: 2 },
    { id: "DA-2", section: "Enterprise Data Model",  question: "Logical/physical data models are documented per domain.", weight: 1 },
    { id: "DA-3", section: "Standards & Guidelines",  question: "Data architecture standards (naming, modelling conventions) are defined.", weight: 2 },
    { id: "DA-4", section: "Standards & Guidelines",  question: "Technology standards and platform guidelines are documented.", weight: 1 },
    { id: "DA-5", section: "Alignment",               question: "Data architecture is aligned to enterprise/business architecture.", weight: 2 },
  ],
  "Data Modeling & Design": [
    { id: "DM-1", section: "Modeling Standards",   question: "Data modeling standards and naming conventions exist.", weight: 2 },
    { id: "DM-2", section: "Modeling Standards",   question: "Conceptual, logical, and physical models are maintained per domain.", weight: 1 },
    { id: "DM-3", section: "Design Governance",    question: "Model reviews and approval processes exist before deployment.", weight: 2 },
    { id: "DM-4", section: "Design Governance",    question: "Data design changes follow a change management process.", weight: 1 },
    { id: "DM-5", section: "Tools",                question: "Data modeling tools are standardized and used consistently.", weight: 1 },
  ],
  "Data Storage & Operations": [
    { id: "DS-1", section: "Storage Management", question: "Data storage standards exist (retention, archival, purge policies).", weight: 2 },
    { id: "DS-2", section: "Storage Management", question: "Storage capacity planning and monitoring are in place.", weight: 1 },
    { id: "DS-3", section: "Operations",         question: "Database administration processes are documented and followed.", weight: 2 },
    { id: "DS-4", section: "Operations",         question: "Backup and recovery procedures are tested periodically.", weight: 2 },
    { id: "DS-5", section: "Performance",        question: "Performance tuning and optimization are performed regularly.", weight: 1 },
  ],
  "Data Security": [
    { id: "DSC-1", section: "Access Control",       question: "Data access policies are defined (RBAC, least privilege).", weight: 2 },
    { id: "DSC-2", section: "Access Control",       question: "Data classification (public, internal, confidential, restricted) is applied.", weight: 2 },
    { id: "DSC-3", section: "Privacy & Compliance", question: "Privacy policies comply with applicable regulations (GDPR, PDPA, etc.).", weight: 2 },
    { id: "DSC-4", section: "Privacy & Compliance", question: "Data masking, encryption, and anonymization are used for sensitive data.", weight: 1 },
    { id: "DSC-5", section: "Audit & Monitoring",   question: "Security audit trails and access monitoring are active.", weight: 2 },
  ],
  "Data Integration & Interoperability": [
    { id: "DI-1", section: "Integration Strategy & Architecture", question: "Enterprise-wide integration strategy exists (APIs/ETL/events), aligned to target state.", weight: 2 },
    { id: "DI-2", section: "Integration Strategy & Architecture", question: "System of Record (SoR) / System of Entry is clearly defined per object.", weight: 2 },
    { id: "DI-3", section: "Integration Strategy & Architecture", question: "Integration flows and interfaces are documented (source-to-target mapping).", weight: 2 },
    { id: "DI-4", section: "Integration Technology & Tools",      question: "Integration platform/tooling supports scalability & performance requirements.", weight: 1 },
    { id: "DI-5", section: "Integration Technology & Tools",      question: "Logging, monitoring, reconciliation, and audit trails exist for data movement.", weight: 2 },
  ],
  "Document & Content Management": [
    { id: "DC-1", section: "Content Standards",    question: "Document/content management standards and taxonomy are defined.", weight: 2 },
    { id: "DC-2", section: "Content Standards",    question: "Lifecycle management (creation, review, archive, disposal) is documented.", weight: 1 },
    { id: "DC-3", section: "Tools & Repositories", question: "Document management system/platform is in place and adopted.", weight: 2 },
    { id: "DC-4", section: "Tools & Repositories", question: "Version control and access permissions are enforced.", weight: 1 },
    { id: "DC-5", section: "Compliance",           question: "Records retention policies comply with regulatory requirements.", weight: 2 },
  ],
  "Reference & Master Data": [
    { id: "RM-1", section: "Master Data Management", question: "Master data objects are identified with clear ownership.", weight: 2 },
    { id: "RM-2", section: "Master Data Management", question: "Golden record / single source of truth process exists per object.", weight: 2 },
    { id: "RM-3", section: "Reference Data",         question: "Reference data (code lists, lookups) is centrally managed.", weight: 2 },
    { id: "RM-4", section: "Reference Data",         question: "Reference data change management and distribution process exists.", weight: 1 },
    { id: "RM-5", section: "Governance",              question: "MDM governance body reviews and approves master data changes.", weight: 1 },
  ],
  "DW & Business Intelligence": [
    { id: "DW-1", section: "DW Architecture", question: "Data warehouse / data lake architecture is documented.", weight: 2 },
    { id: "DW-2", section: "DW Architecture", question: "ETL/ELT pipelines are monitored with SLA tracking.", weight: 1 },
    { id: "DW-3", section: "BI & Analytics",  question: "BI/reporting standards and semantic layer are defined.", weight: 2 },
    { id: "DW-4", section: "BI & Analytics",  question: "Self-service analytics capabilities exist with governance guardrails.", weight: 1 },
    { id: "DW-5", section: "Data Delivery",   question: "Data consumption patterns (batch, real-time, API) are documented.", weight: 1 },
  ],
  "Metadata Management": [
    { id: "MM-1", section: "Metadata Strategy", question: "Metadata management strategy and policy exist.", weight: 2 },
    { id: "MM-2", section: "Metadata Strategy", question: "Business glossary / data dictionary is maintained and accessible.", weight: 2 },
    { id: "MM-3", section: "Lineage & Catalog", question: "Data lineage is captured across key systems.", weight: 2 },
    { id: "MM-4", section: "Lineage & Catalog", question: "Data catalog tool is implemented and adopted by users.", weight: 1 },
    { id: "MM-5", section: "Automation",         question: "Metadata harvesting/ingestion is automated from source systems.", weight: 1 },
  ],
};

const DIM_COLORS = {
  "Data Governance":                     UNIQU_PURPLE,
  "Data Quality":                        UNIQU_PURPLE_DARK,
  "Data Architecture":                   "#9333ea",
  "Data Modeling & Design":              "#7c3aed",
  "Data Storage & Operations":           "#d97706",
  "Data Security":                       "#dc2626",
  "Data Integration & Interoperability": "#059669",
  "Document & Content Management":       "#84cc16",
  "Reference & Master Data":             "#ea580c",
  "DW & Business Intelligence":          "#2563eb",
  "Metadata Management":                 "#0d9488",
};

const RATING_LABELS   = ["Adhoc", "Repeatable", "Defined", "Managed", "Optimised"];
const ALL_OBJECTS     = ['Customer', 'Vendor Master', 'Item Master', 'Price', 'Finance'];
const DEFAULT_OBJECTS = [...ALL_OBJECTS];
const DIMS_LIST       = Object.keys(QUESTION_BANK);

/* ── Per-dimension default objects (user can customize per dim) ── */
function buildDefaultObjectsPerDim() {
  const m = {};
  DIMS_LIST.forEach(d => { m[d] = [...DEFAULT_OBJECTS]; });
  return m;
}

/* ─────────────────────────────────────────────────────────────
   SHEET-NAME MATCHING
   ───────────────────────────────────────────────────────────── */
function findSheetForDim(sheetNames, dim) {
  const dimTrunc = dim.slice(0, 31);
  return sheetNames.find(n =>
    n === dim || n === dimTrunc || dim.startsWith(n) || n.startsWith(dim)
  ) || null;
}

/* ─────────────────────────────────────────────────────────────
   RATING NORMALISER
   ───────────────────────────────────────────────────────────── */
function normaliseRating(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  const s = String(raw).trim();
  const exact = RATING_LABELS.find(r => r.toLowerCase() === s.toLowerCase());
  if (exact) return exact;
  const n = parseInt(s, 10);
  if (!isNaN(n) && n >= 1 && n <= 5) return RATING_LABELS[n - 1];
  return null;
}

/* ─────────────────────────────────────────────────────────────
   PARSE UPLOADED EXCEL — uses per-dim objects
   ───────────────────────────────────────────────────────────── */
function parseUploadedExcel(file, objectsPerDim, existingGridData) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb   = XLSX.read(data, { type: 'array', cellDates: false });

        const updatedGrid = JSON.parse(JSON.stringify(existingGridData));
        const warnings    = [];
        let   totalImported = 0;
        let   totalAdded    = 0;

        DIMS_LIST.forEach(dim => {
          const dimObjects = objectsPerDim[dim] || DEFAULT_OBJECTS;
          const sheetName = findSheetForDim(wb.SheetNames, dim);
          if (!sheetName) {
            warnings.push(`Sheet not found for dimension "${dim}" — skipped.`);
            return;
          }

          const ws   = wb.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
          if (rows.length === 0) {
            warnings.push(`Sheet "${sheetName}" is empty — skipped.`);
            return;
          }

          const fixedCols     = new Set(['Question ID', 'Section', 'Question', 'Weight']);
          const headerKeys    = Object.keys(rows[0]);
          const objColsInFile = headerKeys.filter(k => !fixedCols.has(k));
          const targetObjects = dimObjects.length > 0
            ? objColsInFile.filter(c => dimObjects.includes(c))
            : objColsInFile;

          if (targetObjects.length === 0) {
            warnings.push(
              `Sheet "${sheetName}": no matching object columns. ` +
              `File has [${objColsInFile.join(', ')}], expected [${dimObjects.join(', ')}].`
            );
          }

          rows.forEach(row => {
            const qId      = String(row['Question ID'] || '').trim();
            const section  = String(row['Section']     || '').trim();
            const question = String(row['Question']    || '').trim();
            const weight   = parseFloat(row['Weight'])  || 1;

            if (!qId || !question) return;

            const gridRowIdx = (updatedGrid[dim] || []).findIndex(r => r.id === qId);

            if (gridRowIdx !== -1) {
              targetObjects.forEach(obj => {
                const rated = normaliseRating(row[obj]);
                if (rated) {
                  updatedGrid[dim][gridRowIdx][obj] = rated;
                  totalImported++;
                } else if (row[obj] !== '') {
                  warnings.push(`Invalid rating "${row[obj]}" for ${qId} / ${obj} — kept original.`);
                }
              });
              dimObjects.forEach(obj => {
                if (!(obj in updatedGrid[dim][gridRowIdx])) {
                  updatedGrid[dim][gridRowIdx][obj] = RATING_LABELS[0];
                }
              });
            } else {
              const newRow = { id: qId, section: section || 'Custom', question, weight };
              dimObjects.forEach(obj => {
                const rated = normaliseRating(row[obj]);
                newRow[obj] = rated || RATING_LABELS[0];
              });
              if (!updatedGrid[dim]) updatedGrid[dim] = [];
              updatedGrid[dim].push(newRow);
              totalAdded++;
            }
          });
        });

        resolve({ updatedGrid, warnings, totalImported, totalAdded });
      } catch (err) {
        reject(new Error('Failed to parse Excel file: ' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.readAsArrayBuffer(file);
  });
}

/* ─────────────────────────────────────────────────────────────
   DOWNLOAD EXCEL TEMPLATE — per-dim objects
   ───────────────────────────────────────────────────────────── */
function downloadTemplate(gridData, objectsPerDim) {
  const wb = XLSX.utils.book_new();

  // Collect all unique objects for the instruction sheet
  const allObjects = [...new Set(Object.values(objectsPerDim).flat())];

  const instrData = [
    ['DATA MATURITY ASSESSMENT — RESPONSE TEMPLATE'],
    [''],
    ['Instructions:'],
    ['1. Each sheet = one maturity dimension (each may have different Master Data Object columns).'],
    ['2. Fill rating columns (after Weight) with one of: Adhoc | Repeatable | Defined | Managed | Optimised  (or 1–5).'],
    ['3. You may ADD new rows — give them a unique Question ID, Section, Question and Weight.'],
    ['   New rows will appear in the grid AND in the generated PDF & Excel report.'],
    ['4. Do NOT rename sheet tabs or the first 4 column headers.'],
    ['5. Save, then upload back via the "Upload Template" button.'],
    [''],
    ['All Master Data Objects:', ...allObjects],
  ];
  const instrWs = XLSX.utils.aoa_to_sheet(instrData);
  instrWs['!cols'] = [{ wch: 72 }, ...allObjects.map(() => ({ wch: 18 }))];
  XLSX.utils.book_append_sheet(wb, instrWs, 'Instructions');

  DIMS_LIST.forEach(dim => {
    const dimObjects = objectsPerDim[dim] || DEFAULT_OBJECTS;
    const rows    = gridData[dim] || [];
    const headers = ['Question ID', 'Section', 'Question', 'Weight', ...dimObjects];
    const data    = rows.map(r => [
      r.id, r.section, r.question, r.weight,
      ...dimObjects.map(obj => r[obj] || RATING_LABELS[0]),
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    ws['!cols'] = [
      { wch: 12 }, { wch: 28 }, { wch: 58 }, { wch: 8 },
      ...dimObjects.map(() => ({ wch: 15 })),
    ];
    XLSX.utils.book_append_sheet(wb, ws, dim.slice(0, 31));
  });

  XLSX.writeFile(wb, 'Maturity_Assessment_Template.xlsx');
}

/* ═══════════════════════════════════════════════════════════
   MaturityGauge — arc gauge, raw 1-5 score
   ═══════════════════════════════════════════════════════════ */
function MaturityGauge({ score = 0, label = '' }) {
  const SIZE = 120, CX = 60, CY = 68, R = 42, SW = 10;
  const START_DEG = 200, SWEEP = 220;
  const toRad = d => (d * Math.PI) / 180;
  const arcPath = (sDeg, eDeg) => {
    const s = toRad(sDeg), e = toRad(eDeg);
    const x1 = CX + R * Math.cos(s), y1 = CY + R * Math.sin(s);
    const x2 = CX + R * Math.cos(e), y2 = CY + R * Math.sin(e);
    const diff = ((eDeg - sDeg) + 360) % 360;
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 ${diff > 180 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  };
  const COLOR_MAP = { 1: '#64748b', 2: '#b45309', 3: '#1d4ed8', 4: UNIQU_PURPLE, 5: '#0f766e' };
  const clamped  = Math.max(0, Math.min(5, score));
  const level    = Math.max(1, Math.min(5, Math.round(clamped)));
  const arcColor = clamped > 0 ? (COLOR_MAP[level] ?? UNIQU_PURPLE) : UNIQU_GREY;
  const fillEnd  = START_DEG + (clamped / 5) * SWEEP;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', minWidth: 130 }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} overflow="visible">
        <path d={arcPath(START_DEG, START_DEG + SWEEP)} fill="none" stroke={UNIQU_LAVENDER} strokeWidth={SW} strokeLinecap="round" />
        {clamped > 0 && <path d={arcPath(START_DEG, fillEnd)} fill="none" stroke={arcColor} strokeWidth={SW} strokeLinecap="round" />}
        <text x={CX} y={CY + 2} textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize: '13px', fontWeight: '700', fontFamily: "'Plus Jakarta Sans',sans-serif", fill: UNIQU_PURPLE_DARK }}>
          {clamped.toFixed(2)}
        </text>
        <text x={CX} y={CY + 16} textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize: '9px', fontWeight: '600', fontFamily: "'Plus Jakarta Sans',sans-serif", fill: '#9580b8' }}>
          / 5
        </text>
      </svg>
      <div style={{ fontSize: '0.66rem', fontWeight: 700, color: UNIQU_PURPLE, textAlign: 'center',
        textTransform: 'uppercase', letterSpacing: '0.04em', maxWidth: 130, lineHeight: 1.3 }}>
        {label}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Build grid from question bank — uses per-dim objects
   ═══════════════════════════════════════════════════════════ */
function buildGridData(qBank, objectsPerDim) {
  const data = {};
  Object.entries(qBank).forEach(([dim, qList]) => {
    const dimObjects = objectsPerDim[dim] || DEFAULT_OBJECTS;
    data[dim] = qList.map(q => {
      const row = {
        id:       q.id       || q['Question ID'] || '',
        section:  q.section  || q['Section']      || '',
        question: q.question || q['Question']     || '',
        weight:   q.weight   || q['Weight']       || 1,
      };
      dimObjects.forEach(obj => { row[obj] = RATING_LABELS[0]; });
      return row;
    });
  });
  return data;
}

/* ═══════════════════════════════════════════════════════════
   Editable Grid Table
   ═══════════════════════════════════════════════════════════ */
function EditableGrid({ rows, objects, onChange, fullView }) {
  const colorMap = { Adhoc: '#64748b', Repeatable: '#b45309', Defined: '#1d4ed8', Managed: UNIQU_PURPLE, Optimised: '#0f766e' };
  return (
    <div style={{ overflowX: 'auto', overflowY: fullView ? 'visible' : 'auto',
      maxHeight: fullView ? 'none' : '520px',
      border: `1.5px solid ${UNIQU_GREY}`, borderRadius: 10, background: UNIQU_LIGHT_BG }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem',
        fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
        <thead>
          <tr style={{ position: 'sticky', top: 0, zIndex: 2 }}>
            {['Question ID', 'Section', 'Question', 'Weight', ...objects].map((col, ci) => (
              <th key={col + ci} style={{
                background: UNIQU_LAVENDER, color: UNIQU_PURPLE_DARK, fontWeight: 700, fontSize: '0.78rem',
                padding: '0.55rem 0.6rem', textAlign: ci === 2 ? 'left' : 'center',
                borderBottom: `2px solid ${UNIQU_GREY}`, borderRight: '1px solid #e8e2f5',
                whiteSpace: 'nowrap', position: 'sticky', top: 0,
                minWidth: ci === 0 ? 85 : ci === 1 ? 160 : ci === 2 ? 320 : ci === 3 ? 55 : 105,
              }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={4 + objects.length} style={{ padding: '2rem', textAlign: 'center', color: '#9580b8', fontSize: '0.85rem' }}>
                No questions yet. Upload a template or add questions manually.
              </td>
            </tr>
          )}
          {rows.map((row, ri) => (
            <tr key={row.id + '-' + ri}
              style={{ borderBottom: '1px solid #f0ebfa' }}
              onMouseEnter={e => e.currentTarget.style.background = '#faf8ff'}
              onMouseLeave={e => e.currentTarget.style.background = ''}>
              <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', fontWeight: 600,
                color: UNIQU_PURPLE, fontSize: '0.78rem', borderRight: '1px solid #f0ebfa', whiteSpace: 'nowrap' }}>
                {row.id}
              </td>
              <td style={{ padding: '0.45rem 0.5rem', color: '#555', fontSize: '0.78rem', borderRight: '1px solid #f0ebfa' }}>
                {row.section}
              </td>
              <td style={{ padding: '0.45rem 0.6rem', color: UNIQU_TEXT, lineHeight: 1.4, borderRight: '1px solid #f0ebfa' }}>
                {row.question}
              </td>
              <td style={{ padding: '0.45rem 0.4rem', textAlign: 'center', fontWeight: 600,
                color: '#7a7a9a', fontSize: '0.8rem', borderRight: '1px solid #f0ebfa' }}>
                {typeof row.weight === 'number' ? row.weight.toFixed(1) : row.weight}
              </td>
              {objects.map(obj => {
                const val = row[obj] || RATING_LABELS[0];
                return (
                  <td key={obj} style={{ padding: '0.3rem 0.25rem', textAlign: 'center', borderRight: '1px solid #f0ebfa' }}>
                    <select value={val} onChange={e => onChange(ri, obj, e.target.value)} style={{
                      width: '100%', padding: '0.3rem 0.2rem', border: `1.5px solid ${UNIQU_GREY}`,
                      borderRadius: 6, fontSize: '0.76rem', fontWeight: 600, fontFamily: 'inherit',
                      color: colorMap[val] || UNIQU_PURPLE, background: val === 'Adhoc' ? '#fff' : '#f8f6ff',
                      cursor: 'pointer', outline: 'none',
                    }}>
                      {RATING_LABELS.map(r => <option key={r} value={r} style={{ color: colorMap[r] }}>{r}</option>)}
                    </select>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Upload Template Tab — uses per-dim objects
   ═══════════════════════════════════════════════════════════ */
function UploadTemplateTab({ objectsPerDim, gridData, onGridImported }) {
  const fileInputRef                    = useRef(null);
  const [dragging, setDragging]         = useState(false);
  const [uploading, setUploading]       = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError]   = useState('');

  const allObjects = [...new Set(Object.values(objectsPerDim).flat())];

  const handleFile = async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls'].includes(ext)) {
      setUploadError('Please upload an .xlsx or .xls file.');
      return;
    }
    setUploading(true); setUploadError(''); setUploadResult(null);
    try {
      const result = await parseUploadedExcel(file, objectsPerDim, gridData);
      onGridImported(result.updatedGrid);
      setUploadResult({ success: true, ...result, fileName: file.name });
    } catch (err) {
      setUploadError(err.message);
    } finally { setUploading(false); }
  };

  const onDrop = (e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); };
  const ratingColors = ['#64748b', '#b45309', '#1d4ed8', UNIQU_PURPLE, '#0f766e'];

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ background: UNIQU_SURFACE, border: '1.5px solid #e8e2f5', borderRadius: 10,
        padding: '0.8rem 1.1rem', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: UNIQU_PURPLE_DARK }}>Step 1: </span>
        <span style={{ fontSize: '0.85rem', color: '#555' }}>
          Download the template — each dimension sheet has its own object columns.
          You can <strong>add new rows</strong> to any sheet tab.
        </span>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '1.6rem' }}>
        <button onClick={() => downloadTemplate(gridData, objectsPerDim)} style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.65rem 1.8rem', borderRadius: 999, border: `2px solid ${UNIQU_PURPLE}`,
          background: '#fff', color: UNIQU_PURPLE, fontWeight: 700, fontSize: '0.9rem',
          cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = UNIQU_PURPLE; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = UNIQU_PURPLE; }}>
          ⬇ Download Excel Template
        </button>
        <p style={{ fontSize: '0.76rem', color: '#9580b8', marginTop: '0.4rem', marginBottom: 0 }}>
          Each dimension has its own objects. Total unique: <strong>{allObjects.join(', ')}</strong>
        </p>
      </div>

      <div style={{ background: UNIQU_SURFACE, border: '1.5px solid #e8e2f5', borderRadius: 10,
        padding: '0.8rem 1.1rem', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: UNIQU_PURPLE_DARK }}>Step 2: </span>
        <span style={{ fontSize: '0.85rem', color: '#555' }}>
          Fill ratings and optionally add new rows, then upload the file.
        </span>
      </div>

      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          border: `2.5px dashed ${dragging ? UNIQU_PURPLE : UNIQU_GREY}`,
          borderRadius: 16, padding: '2.5rem 1.5rem',
          background: dragging
            ? `linear-gradient(135deg,${UNIQU_LAVENDER},${UNIQU_PURPLE_PALE})`
            : `linear-gradient(135deg,${UNIQU_PURPLE_PALE},#fdf2f8)`,
          cursor: uploading ? 'default' : 'pointer',
          textAlign: 'center', transition: 'all 0.2s', userSelect: 'none',
        }}>
        {uploading ? (
          <><div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
            <p style={{ color: UNIQU_PURPLE, fontWeight: 600, margin: 0 }}>Parsing file and updating grid…</p></>
        ) : (
          <><div style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>📤</div>
            <p style={{ fontSize: '0.92rem', color: UNIQU_PURPLE, fontWeight: 700, margin: '0 0 0.3rem' }}>
              Click to upload or drag &amp; drop .xlsx here
            </p>
            <p style={{ fontSize: '0.78rem', color: '#9580b8', margin: 0 }}>Supports .xlsx and .xls</p></>
        )}
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls"
          onChange={e => { handleFile(e.target.files?.[0]); e.target.value = ''; }}
          style={{ display: 'none' }} />
      </div>

      {uploadError && (
        <div style={{ marginTop: '1rem', background: '#fef2f2', border: '1.5px solid #fca5a5',
          borderRadius: 10, padding: '0.75rem 1rem', color: '#dc2626', fontSize: '0.84rem', fontWeight: 600 }}>
          ⚠️ {uploadError}
          <button onClick={() => setUploadError('')}
            style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: 700, fontSize: '1rem' }}>✕</button>
        </div>
      )}

      {uploadResult?.success && (
        <div style={{ marginTop: '1rem', background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 10, padding: '0.85rem 1rem' }}>
          <div style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.3rem' }}>
            ✅ Imported: <em>{uploadResult.fileName}</em>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
            <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.8rem', fontWeight: 700, padding: '2px 10px', borderRadius: 999 }}>
              {uploadResult.totalImported} ratings updated
            </span>
            {uploadResult.totalAdded > 0 && (
              <span style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: '0.8rem', fontWeight: 700, padding: '2px 10px', borderRadius: 999 }}>
                {uploadResult.totalAdded} new row{uploadResult.totalAdded !== 1 ? 's' : ''} added
              </span>
            )}
          </div>
          <div style={{ color: '#15803d', fontSize: '0.82rem', marginBottom: '0.3rem' }}>
            Grid updated — switching to <strong>Manual Entry</strong> tab to review.
          </div>
          {uploadResult.warnings?.length > 0 && (
            <div style={{ marginTop: '0.5rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '0.5rem 0.8rem' }}>
              <div style={{ color: '#92400e', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                ⚠ {uploadResult.warnings.length} warning{uploadResult.warnings.length !== 1 ? 's' : ''}:
              </div>
              {uploadResult.warnings.map((w, i) => (
                <div key={i} style={{ color: '#92400e', fontSize: '0.78rem' }}>• {w}</div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '1.2rem', background: UNIQU_SURFACE, border: '1px solid #e8e2f5', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.78rem', color: '#7a7a9a' }}>
        <strong style={{ color: UNIQU_PURPLE_DARK, display: 'block', marginBottom: '0.3rem' }}>Valid rating values (case-insensitive):</strong>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {RATING_LABELS.map((r, i) => (
            <span key={r} style={{ background: '#fff', border: `1.5px solid ${ratingColors[i]}`, color: ratingColors[i], fontWeight: 700, padding: '2px 10px', borderRadius: 999, fontSize: '0.78rem' }}>
              {i + 1} = {r}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function MaturityPage({ onNavigate, sessionId, dqScore }) {
  const [clientName, setClientName]               = useState('');
  const [mastersApplicable, setMastersApplicable] = useState(true);
  const [benchmark, setBenchmark]                 = useState(3.0);
  const [target, setTarget]                       = useState(3.0);
  const [lowThr, setLowThr]                       = useState(2.0);

  /* ★ Per-dimension objects — each dim has its own list */
  const [objectsPerDim, setObjectsPerDim] = useState(buildDefaultObjectsPerDim);

  /* ★ Grid initialised with per-dim objects */
  const [gridData, setGridData] = useState(() => buildGridData(QUESTION_BANK, buildDefaultObjectsPerDim()));

  const [enabledDims, setEnabledDims] = useState(() => {
    const init = {};
    DIMS_LIST.forEach(d => { init[d] = true; });
    return init;
  });
  const [activeDim, setActiveDim] = useState(DIMS_LIST[0]);
  const [fullView, setFullView]   = useState({});
  const [entryTab, setEntryTab]   = useState('manual');

  const [loading, setLoading]     = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults]     = useState(null);
  const [error, setError]         = useState('');
  const [apiStatus, setApiStatus] = useState('offline');

  /* Current dimension's objects */
  const currentDimObjects = mastersApplicable
    ? (objectsPerDim[activeDim] || DEFAULT_OBJECTS)
    : [clientName || 'Overall'];

  /* Union of all objects across all dims (for overall scoring) */
  const allObjectsUnion = mastersApplicable
    ? [...new Set(Object.values(objectsPerDim).flat())]
    : [clientName || 'Overall'];

  const activeDimsList = DIMS_LIST.filter(d => enabledDims[d]);

  /* Toggle a specific object for a specific dimension */
  const toggleDimObject = (dim, obj) => {
    setObjectsPerDim(prev => {
      const current = prev[dim] || [...DEFAULT_OBJECTS];
      const next = current.includes(obj)
        ? current.filter(x => x !== obj)
        : [...current, obj];
      // Ensure at least one object remains
      if (next.length === 0) return prev;
      return { ...prev, [dim]: next };
    });
  };

  const toggleDim = (dim) => {
    setEnabledDims(prev => {
      const next = { ...prev, [dim]: !prev[dim] };
      if (activeDim === dim && !next[dim]) {
        const firstEnabled = DIMS_LIST.find(d => next[d]);
        if (firstEnabled) setActiveDim(firstEnabled);
      }
      return next;
    });
  };

  /* ─── Try to fetch from backend ─── */
  useEffect(() => {
    (async () => {
      try {
        const resp = await getMaturityQuestions([], []);
        const qBank = resp.data.questions;
        if (qBank && Object.keys(qBank).length > 0) {
          setApiStatus('connected');
          setGridData(prev => {
            const apiGrid = buildGridData(qBank, objectsPerDim);
            const merged  = { ...prev };
            Object.keys(apiGrid).forEach(dim => {
              if (apiGrid[dim] && apiGrid[dim].length > 0) {
                const existingIds = new Set((merged[dim] || []).map(r => r.id));
                const existing    = [...(merged[dim] || [])];
                apiGrid[dim].forEach(apiRow => {
                  if (!existingIds.has(apiRow.id)) {
                    existing.push(apiRow);
                  }
                });
                merged[dim] = existing;
              }
            });
            return merged;
          });
        }
      } catch { setApiStatus('offline'); }
    })();
  }, []);

  /* When objectsPerDim changes, ensure every row has all dim-specific object columns */
  useEffect(() => {
    setGridData(prev => {
      const u = { ...prev };
      Object.keys(u).forEach(dim => {
        const dimObjects = mastersApplicable
          ? (objectsPerDim[dim] || DEFAULT_OBJECTS)
          : [clientName || 'Overall'];
        u[dim] = u[dim].map(row => {
          const nr = { ...row };
          dimObjects.forEach(obj => { if (!(obj in nr)) nr[obj] = RATING_LABELS[0]; });
          return nr;
        });
      });
      return u;
    });
  }, [JSON.stringify(objectsPerDim), mastersApplicable, clientName]);

  const handleCellChange = useCallback((dim, rowIdx, obj, value) => {
    setGridData(prev => {
      const u    = { ...prev };
      const rows = [...u[dim]];
      rows[rowIdx] = { ...rows[rowIdx], [obj]: value };
      u[dim] = rows;
      return u;
    });
  }, []);

  const addQuestion = (dim) => {
    setGridData(prev => {
      const u  = { ...prev };
      const dimObjects = objectsPerDim[dim] || DEFAULT_OBJECTS;
      const nr = { id: `CQ-${(u[dim] || []).length + 1}`, section: 'Custom', question: 'Enter question text…', weight: 1 };
      dimObjects.forEach(obj => { nr[obj] = RATING_LABELS[0]; });
      u[dim] = [...(u[dim] || []), nr];
      return u;
    });
  };

  const removeLast = (dim) => {
    setGridData(prev => {
      const u = { ...prev };
      if ((u[dim] || []).length > 1) u[dim] = u[dim].slice(0, -1);
      return u;
    });
  };

  const countFilled = (dim) => {
    const dimObjects = mastersApplicable
      ? (objectsPerDim[dim] || DEFAULT_OBJECTS)
      : [clientName || 'Overall'];
    let filled = 0, total = 0;
    (gridData[dim] || []).forEach(r => {
      dimObjects.forEach(obj => {
        total++;
        if (r[obj] && r[obj] !== RATING_LABELS[0]) filled++;
      });
    });
    return { filled, total };
  };

  const buildResponsePayload = () => {
    const payload = {};
    activeDimsList.forEach(dim => {
      const dimObjects = mastersApplicable
        ? (objectsPerDim[dim] || DEFAULT_OBJECTS)
        : [clientName || 'Overall'];
      payload[dim] = (gridData[dim] || []).map(row => {
        const r = {
          Question:      row.question,
          'Question ID': row.id,
          Section:       row.section,
          Weight:        row.weight,
        };
        dimObjects.forEach(obj => {
          const idx = RATING_LABELS.indexOf(row[obj] || RATING_LABELS[0]);
          r[obj] = String(idx >= 0 ? idx + 1 : 1);
        });
        return r;
      });
    });
    return payload;
  };

  const handleSubmit = async () => {
    if (!clientName.trim()) { setError('Please enter a Client Name.'); return; }
    setLoading(true); setError('');
    try {
      const activeDims = activeDimsList.filter(d => (gridData[d] || []).length > 0);
      const resp = await submitMaturity({
        session_id:      sessionId,
        client_name:     clientName,
        dims:            activeDims,
        objects:         allObjectsUnion,
        objects_per_dim: objectsPerDim,
        responses:       buildResponsePayload(),
        benchmark,
        target,
        low_thr:         lowThr,
        dq_score:        dqScore,
      });
      setResults(resp.data); setSubmitted(true);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally { setLoading(false); }
  };

  const handleGridImported = useCallback((updatedGrid) => {
    setGridData(updatedGrid);
    setTimeout(() => setEntryTab('manual'), 1200);
  }, []);

  const tp = activeDimsList.reduce(
    (a, d) => { const c = countFilled(d); return { filled: a.filled + c.filled, total: a.total + c.total }; },
    { filled: 0, total: 0 }
  );

  /* ─── RENDER ─── */
  return (
    <div className="page-maturity">
      <PageBanner icon="📈" badge="DAMA Framework" title="Data Maturity Assessment"
        subtitle="Evaluate maturity across DAMA dimensions — governance, quality, architecture, integration & privacy — with weighted scoring and benchmarking." />
      <NavPills current="maturity" onChange={onNavigate} />

      {loading && <Spinner message="Computing scores and building reports..." />}
      {error && (
        <div className="error-banner" onClick={() => setError('')} style={{ cursor: 'pointer' }}>
          ⚠️ {error} <span style={{ float: 'right', fontWeight: 700 }}>✕</span>
        </div>
      )}

      {/* ════════ RESULTS ════════ */}
      {submitted && results && !loading && (
        <div className="maturity-results">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
            <button className="btn-primary" onClick={() => { setSubmitted(false); setResults(null); }}>✏️ Edit Responses</button>
          </div>

          {dqScore != null && (
            <div className="dq-score-banner">
              <strong>DQ Score:</strong> {dqScore.toFixed(1)}% → <strong>Level:</strong> {results.dq_maturity_level}
            </div>
          )}

          <h3 className="subsection-title">📊 Summary Slide</h3>
          {results.slide_png_b64 && (
            <div className="slide-wrap">
              <img src={`data:image/png;base64,${results.slide_png_b64}`} alt="Summary" style={{ width: '100%', borderRadius: 14 }} />
            </div>
          )}

          {results.dim_table && (
            <div style={{ background: '#fff', border: `1.5px solid ${UNIQU_GREY}`, borderRadius: 16,
              padding: '1.2rem 1.4rem 1rem', margin: '1.2rem 0', boxShadow: '0 2px 12px rgba(91,45,144,0.07)' }}>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: UNIQU_PURPLE_DARK, marginBottom: '0.75rem',
                paddingBottom: '0.5rem', borderBottom: `2px solid ${UNIQU_LAVENDER}` }}>📐 Dimension-wise Maturity</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                  <thead>
                    <tr>
                      <th style={{ background: UNIQU_PURPLE, color: '#fff', padding: '0.6rem 1rem', textAlign: 'left', fontSize: '0.82rem', fontWeight: 700 }}>Dimension</th>
                      <th style={{ background: UNIQU_PURPLE, color: '#fff', padding: '0.6rem 0.8rem', textAlign: 'center', fontSize: '0.82rem', fontWeight: 700 }}>Objects</th>
                      {allObjectsUnion.map(obj => (
                        <th key={obj} style={{ background: UNIQU_PURPLE, color: '#fff', padding: '0.6rem 0.8rem', textAlign: 'center', fontSize: '0.82rem', fontWeight: 700 }}>{obj}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(results.dim_table).map(([dim, vals], ri) => {
                      const dimObjs = objectsPerDim[dim] || DEFAULT_OBJECTS;
                      return (
                        <tr key={dim} style={{ background: ri % 2 === 0 ? '#fff' : UNIQU_LAVENDER }}>
                          <td style={{ padding: '0.55rem 1rem', fontWeight: 600, color: UNIQU_TEXT, fontSize: '0.84rem' }}>{dim}</td>
                          <td style={{ padding: '0.55rem 0.5rem', textAlign: 'center', fontSize: '0.7rem', color: '#9580b8' }}>
                            {dimObjs.length}
                          </td>
                          {allObjectsUnion.map(obj => {
                            const isActive = dimObjs.includes(obj);
                            if (!isActive) {
                              return <td key={obj} style={{ padding: '0.55rem 0.8rem', textAlign: 'center', color: '#ccc', fontSize: '0.8rem' }}>—</td>;
                            }
                            const num = typeof vals[obj] === 'number' ? vals[obj] : parseFloat(vals[obj]) || 0;
                            const bg  = num >= 4 ? '#dcfce7' : num >= 3 ? '#dbeafe' : num >= 2 ? '#fef3c7' : '#fff';
                            return <td key={obj} style={{ padding: '0.55rem 0.8rem', textAlign: 'center', fontWeight: 700, fontSize: '0.9rem', color: UNIQU_TEXT, background: bg }}>{num.toFixed(2)}</td>;
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {results.overall && (
            <div style={{ background: '#fff', border: `1.5px solid ${UNIQU_GREY}`, borderRadius: 16,
              padding: '1.2rem 1.4rem 1rem', margin: '1.2rem 0', boxShadow: '0 2px 12px rgba(91,45,144,0.07)' }}>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: UNIQU_PURPLE_DARK, marginBottom: '0.75rem',
                paddingBottom: '0.5rem', borderBottom: `2px solid ${UNIQU_LAVENDER}` }}>🏆 Overall Maturity Score</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                  <thead>
                    <tr>
                      <th style={{ background: UNIQU_PURPLE, color: '#fff', padding: '0.6rem 1rem', textAlign: 'center', fontSize: '0.82rem', fontWeight: 700 }}>Master Data Object</th>
                      <th style={{ background: UNIQU_PURPLE, color: '#fff', padding: '0.6rem 1rem', textAlign: 'center', fontSize: '0.82rem', fontWeight: 700 }}>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(results.overall).map(([obj, score], ri) => {
                      const num = typeof score === 'number' ? score : parseFloat(score) || 0;
                      return (
                        <tr key={obj} style={{ background: ri % 2 === 0 ? '#fff' : UNIQU_LAVENDER }}>
                          <td style={{ padding: '0.55rem 1rem', textAlign: 'center', fontWeight: 600, color: UNIQU_TEXT, fontSize: '0.84rem' }}>{obj}</td>
                          <td style={{ padding: '0.55rem 1rem', textAlign: 'center', fontWeight: 700, color: UNIQU_TEXT, fontSize: '0.9rem' }}>{num.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {results.domain_scores && (
            <div style={{ background: UNIQU_PURPLE_PALE, border: `1.5px solid ${UNIQU_GREY}`, borderRadius: 16, padding: '1.4rem 1.6rem', margin: '1.2rem 0' }}>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: UNIQU_PURPLE_DARK, marginBottom: '1rem' }}>📊 Maturity Bar Chart</div>
              {(() => {
                const barColors = { 1: '#64748b', 2: '#b45309', 3: '#1d4ed8', 4: UNIQU_PURPLE, 5: '#0f766e' };
                const getColor  = s => barColors[Math.max(1, Math.min(5, Math.round(s)))] || UNIQU_PURPLE;
                return (
                  <div>
                    {Object.entries(results.domain_scores).map(([dim, score]) => {
                      const s = typeof score === 'number' ? score : parseFloat(score) || 1;
                      return (
                        <div key={dim} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.8rem', gap: '0.8rem' }}>
                          <div style={{ width: 250, textAlign: 'right', fontSize: '0.84rem', fontWeight: 600, color: '#0c4a6e', flexShrink: 0 }}>{dim}</div>
                          <div style={{ flex: 1, position: 'relative', height: 28, background: '#e9e4f5', borderRadius: 6, overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min((s / 5) * 100, 100)}%`, height: '100%', background: getColor(s), borderRadius: 6, transition: 'width 0.5s' }} />
                          </div>
                          <div style={{ width: 50, fontWeight: 800, fontSize: '0.95rem', color: UNIQU_PURPLE_DARK }}>{s.toFixed(2)}</div>
                        </div>
                      );
                    })}
                    <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end', marginTop: '0.8rem', flexWrap: 'wrap' }}>
                      {[['#64748b','1-Adhoc'],['#b45309','2-Repeatable'],['#1d4ed8','3-Defined'],[UNIQU_PURPLE,'4-Managed'],['#0f766e','5-Optimised']].map(([c, l]) => (
                        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div style={{ width: 14, height: 14, borderRadius: 3, background: c }} />
                          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#555' }}>{l}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          <div className="gauges-row">
            {Object.entries(results.domain_scores || {}).map(([d, s]) => {
              const num = typeof s === 'number' ? s : parseFloat(s) || 0;
              return <MaturityGauge key={d} score={num} label={d} />;
            })}
          </div>

          <SectionHeader>📥 Download Reports</SectionHeader>
          <div className="download-row">
            <div className="download-card">
              <div className="dl-icon">📄</div>
              <div className="dl-title">PDF Maturity Report</div>
              <div className="dl-desc">Executive summary, dimension scores, and full detail — each dimension shows its own objects.</div>
              <a href={downloadMaturityPDF(sessionId)} className="btn-primary" download>⬇ Download PDF</a>
            </div>
            <div className="download-card">
              <div className="dl-icon">📊</div>
              <div className="dl-title">Excel Workbook</div>
              <div className="dl-desc">Multi-sheet: dimension summary, overall scores, question responses per dimension's objects.</div>
              <a href={downloadMaturityExcel(sessionId)} className="btn-primary" download>⬇ Download Excel</a>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <button className="btn-secondary" onClick={() => { setSubmitted(false); setResults(null); }}>✏️ Edit Responses</button>
          </div>
        </div>
      )}

      {/* ════════ FORM ════════ */}
      {!submitted && !loading && (
        <div className="maturity-form">
          {/* Sidebar */}
          <div className="mat-sidebar">
            <div className="sidebar-section">
              <h4>⚙️ Configuration</h4>
              <label className="form-label">Client Name <span className="required">*</span>
                <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Organisation name (required)" />
              </label>
              {!clientName.trim() && <p className="field-error">⚠ Required</p>}
            </div>

            <div className="sidebar-section">
              <div style={{ background: `linear-gradient(135deg,${UNIQU_PURPLE_PALE},#fdf2f8)`, border: '2px solid #b09dd6', borderRadius: 12, padding: '0.65rem 0.8rem', boxShadow: '0 2px 10px rgba(91,45,144,0.12)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>📋</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: UNIQU_PURPLE_DARK }}>Masters Applicable</span>
                </div>
                <p style={{ fontSize: '0.76rem', color: UNIQU_PURPLE, margin: '0 0 0.4rem', lineHeight: 1.4 }}>
                  Enable to evaluate maturity per Master Data Object
                </p>
                <label className="checkbox-label" style={{ marginBottom: 0 }}>
                  <input type="checkbox" checked={mastersApplicable} onChange={e => setMastersApplicable(e.target.checked)} />
                  Include Master Data Objects in assessment
                </label>
              </div>
            </div>

            {/* ★ PER-DIMENSION OBJECT SELECTION */}
            {mastersApplicable && (
              <div className="sidebar-section">
                <label className="form-label" style={{ marginBottom: '0.3rem' }}>
                  Master Data Objects
                  <span style={{ fontSize: '0.72rem', color: '#9580b8', fontWeight: 400, display: 'block', marginTop: 2 }}>
                    for: <strong style={{ color: UNIQU_PURPLE }}>{activeDim}</strong>
                  </span>
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem',
                  background: UNIQU_SURFACE, border: `1.5px solid #e8e2f5`, borderRadius: 10, padding: '0.5rem 0.6rem' }}>
                  {ALL_OBJECTS.map(o => {
                    const isChecked = (objectsPerDim[activeDim] || DEFAULT_OBJECTS).includes(o);
                    return (
                      <label key={o} className="checkbox-label" style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.35rem 0.4rem', borderRadius: 8, cursor: 'pointer',
                        background: isChecked ? UNIQU_PURPLE_PALE : 'transparent',
                        transition: 'background 0.15s',
                        margin: 0
                      }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleDimObject(activeDim, o)}
                        />
                        <span style={{ fontSize: '0.84rem', fontWeight: 600, color: isChecked ? UNIQU_PURPLE_DARK : UNIQU_TEXT }}>
                          {o}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#9580b8', marginTop: '0.3rem' }}>
                  {(objectsPerDim[activeDim] || []).length} of {ALL_OBJECTS.length} objects selected for this dimension
                </div>
              </div>
            )}

            <div className="sidebar-section">
              <label className="form-label" style={{ marginBottom: '0.5rem' }}>Knowledge Areas</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: 360, overflowY: 'auto',
                background: UNIQU_SURFACE, border: '1.5px solid #e8e2f5', borderRadius: 10, padding: '0.5rem 0.6rem' }}>
                {DIMS_LIST.map(d => {
                  const on = enabledDims[d];
                  const color = DIM_COLORS[d] || UNIQU_PURPLE;
                  const shortName = d.length > 22 ? d.slice(0, 20) + '…' : d;
                  const dimObjCount = (objectsPerDim[d] || []).length;
                  return (
                    <div key={d}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.4rem 0.5rem', borderRadius: 8, cursor: 'pointer',
                        background: d === activeDim
                          ? `linear-gradient(135deg,${UNIQU_LAVENDER},${UNIQU_PURPLE_PALE})`
                          : on ? `linear-gradient(135deg,${UNIQU_LAVENDER}40,${UNIQU_PURPLE_PALE}40)` : 'transparent',
                        border: d === activeDim ? `2px solid ${UNIQU_PURPLE}` : on ? `1.5px solid ${UNIQU_GREY}` : '1.5px solid transparent',
                        transition: 'all 0.15s',
                      }}>
                      {/* Toggle switch */}
                      <div onClick={(e) => { e.stopPropagation(); toggleDim(d); }} style={{
                        width: 36, height: 20, borderRadius: 10, flexShrink: 0,
                        background: on
                          ? `linear-gradient(135deg, ${UNIQU_PURPLE}, ${UNIQU_PURPLE_MID})`
                          : '#d1d5db',
                        position: 'relative', transition: 'background 0.2s',
                        boxShadow: on ? `0 2px 8px ${UNIQU_PURPLE}40` : 'none',
                      }}>
                        <div style={{
                          width: 16, height: 16, borderRadius: '50%', background: '#fff',
                          position: 'absolute', top: 2,
                          left: on ? 18 : 2,
                          transition: 'left 0.2s',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }} />
                      </div>
                      {/* Color dot */}
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                      {/* Label — clicking selects as activeDim */}
                      <div onClick={() => { if (on) setActiveDim(d); }}
                        style={{ flex: 1, cursor: on ? 'pointer' : 'default', overflow: 'hidden' }}>
                        <span style={{
                          fontSize: '0.78rem', fontWeight: on ? 700 : 500,
                          color: on ? UNIQU_TEXT : '#7a7a9a',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          display: 'block',
                        }} title={d}>
                          {shortName}
                        </span>
                        {mastersApplicable && on && (
                          <span style={{ fontSize: '0.65rem', color: '#9580b8' }}>
                            {dimObjCount} obj{dimObjCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#9580b8', marginTop: '0.3rem' }}>
                {activeDimsList.length} of {DIMS_LIST.length} dimensions active
              </div>
            </div>


          </div>

          {/* Main */}
          <div className="mat-main">
            <div style={{ background: `linear-gradient(135deg,${UNIQU_PURPLE_PALE},#fdf2f8)`, border: `1.5px solid ${UNIQU_GREY}`,
              borderRadius: 14, padding: '1rem 1.4rem 0.8rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '1.3rem' }}>✏️</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: UNIQU_PURPLE_DARK }}>Assessment Entry</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: UNIQU_PURPLE, margin: 0, lineHeight: 1.5 }}>
                Rate each question using the dropdowns, or use <strong>Upload Template</strong> to fill offline.
                Each Knowledge Area has its own set of Master Data Objects.
              </p>
            </div>

            <div className="tab-bar">
              <button className={`tab-btn ${entryTab === 'manual' ? 'active' : ''}`} onClick={() => setEntryTab('manual')}>✏️ Manual Entry</button>
              <button className={`tab-btn ${entryTab === 'upload' ? 'active' : ''}`} onClick={() => setEntryTab('upload')}>📤 Upload Template</button>
            </div>

            {entryTab === 'manual' && (
              <>
                {activeDimsList.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
                    <p style={{ color: UNIQU_PURPLE, fontWeight: 600 }}>No dimensions enabled</p>
                    <p style={{ color: '#7a7a9a', fontSize: '0.85rem' }}>Toggle on at least one Knowledge Area in the sidebar to start the assessment.</p>
                  </div>
                ) : (
                <>
                <div className="tab-bar" style={{ marginTop: 0, borderBottom: `2px solid ${UNIQU_GREY}` }}>
                  {activeDimsList.map(d => {
                    const { filled, total } = countFilled(d);
                    const dimObjCount = (objectsPerDim[d] || []).length;
                    return (
                      <button key={d} className={`tab-btn ${activeDim === d ? 'active' : ''}`}
                        onClick={() => setActiveDim(d)} style={{ fontSize: '0.82rem' }}>
                        {d}
                        <span style={{ marginLeft: 5, fontSize: '0.65rem', fontWeight: 700,
                          background: filled > 0 ? UNIQU_PURPLE : '#e8e2f5',
                          color: filled > 0 ? '#fff' : '#7a7a9a', borderRadius: 999, padding: '1px 5px' }}>
                          {filled}/{total}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Show which objects are active for this dimension */}
                {mastersApplicable && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', margin: '0.5rem 0', padding: '0.4rem 0.6rem',
                    background: UNIQU_SURFACE, border: `1px solid #e8e2f5`, borderRadius: 8 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: UNIQU_PURPLE_DARK, marginRight: '0.3rem' }}>Objects:</span>
                    {currentDimObjects.map(o => (
                      <span key={o} style={{ fontSize: '0.72rem', fontWeight: 600, color: UNIQU_PURPLE, background: UNIQU_PURPLE_PALE,
                        padding: '1px 8px', borderRadius: 999, border: `1px solid ${UNIQU_GREY}` }}>{o}</span>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', margin: '0.6rem 0' }}>
                  {[
                    ['➕ Add Question', () => addQuestion(activeDim)],
                    ['➖ Remove Last',  () => removeLast(activeDim)],
                    [fullView[activeDim] ? '◱ Compact' : '⛶ Full View',
                      () => setFullView(p => ({ ...p, [activeDim]: !p[activeDim] }))],
                  ].map(([label, fn]) => (
                    <button key={label} onClick={fn} style={{ flex: 1, padding: '0.45rem 0.8rem',
                      border: `1.5px solid ${UNIQU_GREY}`, borderRadius: 8, background: '#fff',
                      color: UNIQU_PURPLE_DARK, fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
                      {label}
                    </button>
                  ))}
                </div>

                <EditableGrid
                  rows={gridData[activeDim] || []}
                  objects={currentDimObjects}
                  onChange={(ri, obj, val) => handleCellChange(activeDim, ri, obj, val)}
                  fullView={!!fullView[activeDim]}
                />
                </>
                )}
              </>
            )}

            {entryTab === 'upload' && (
              <UploadTemplateTab
                objectsPerDim={objectsPerDim}
                gridData={gridData}
                onGridImported={handleGridImported}
              />
            )}

            <div style={{ background: `linear-gradient(135deg,${UNIQU_PURPLE_PALE},#fdf2f8)`, border: `1.5px solid ${UNIQU_GREY}`,
              borderRadius: 10, padding: '0.6rem 1rem', margin: '0.8rem 0', fontSize: '0.82rem', color: UNIQU_PURPLE_DARK }}>
              <strong>Overall progress:</strong> {tp.filled} / {tp.total} cells rated
              ({tp.total > 0 ? Math.round(tp.filled / tp.total * 100) : 0}%)
              <div style={{ marginTop: 4, height: 6, background: '#e8e2f5', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${tp.total > 0 ? (tp.filled / tp.total * 100) : 0}%`, height: '100%',
                  borderRadius: 999, background: `linear-gradient(90deg,${UNIQU_PURPLE},${UNIQU_MAGENTA})`, transition: 'width 0.3s' }} />
              </div>
            </div>

            <div className="submit-section">
              <div className="submit-btn-wrap">
                <button className="btn-run" onClick={handleSubmit} disabled={!clientName.trim() || loading || activeDimsList.length === 0}>
                  ✅ Submit &amp; Generate Report
                </button>
                {!clientName.trim() && (
                  <div className="submit-tooltip">
                    <span className="submit-tooltip-arrow" />
                    ⚠️ Please enter the <strong>Company Name</strong> in the Configuration panel to proceed
                  </div>
                )}
                {clientName.trim() && activeDimsList.length === 0 && (
                  <div className="submit-tooltip">
                    <span className="submit-tooltip-arrow" />
                    ⚠️ Please enable at least one <strong>Knowledge Area</strong> to proceed
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}