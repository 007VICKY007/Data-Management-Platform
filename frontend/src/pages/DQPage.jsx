import React, { useState, useCallback, useEffect } from 'react';
import { PageBanner, NavPills, SectionHeader, ScoreCard, DataTable, Spinner, MetricCard } from '../components/UIComponents';
import { uploadDataset, runDQAssessment, downloadDQReport } from '../utils/api';

const DATASET_RULE_LIBRARY = {
  Customer: {
    completeness: ['Not Null', 'Not Empty', 'Mandatory Column', 'Minimum Length'],
    validity: ['Email Format', 'Phone Format', 'Numeric Range', 'Allowed Values', 'Custom Regex', 'Data Type Validation', 'Length Check', 'Format Check'],
    standardization: ['Special Characters Not Allowed', 'Convert to Uppercase', 'Convert to Lowercase', 'Date Format'],
  },
  Vendor: {
    completeness: ['Not Null', 'Not Empty', 'Mandatory Column', 'Minimum Length'],
    validity: ['Email Format', 'Phone Format', 'Numeric Range', 'Allowed Values', 'Custom Regex', 'Data Type Validation', 'PAN Format', 'Length Check', 'Format Check'],
    standardization: ['Special Characters Not Allowed', 'Convert to Uppercase', 'Convert to Lowercase', 'Date Format'],
  },
  General: {
    completeness: ['Not Null', 'Not Empty', 'Mandatory Column', 'Minimum Length'],
    validity: ['Email Format', 'Phone Format', 'Numeric Range', 'Allowed Values', 'Custom Regex', 'Data Type Validation', 'Length Check', 'Format Check'],
    standardization: ['Special Characters Not Allowed', 'Convert to Uppercase', 'Convert to Lowercase', 'Date Format'],
  },
};

const RULE_TOOLTIPS = {
  'Not Null': 'Checks that the value is not null/missing.',
  'Not Empty': 'Checks that the value is not an empty string after trimming.',
  'Mandatory Column': 'Marks the column as business-critical — failures flagged as HIGH severity.',
  'Minimum Length': 'Checks string length meets a minimum threshold.',
  'Email Format': 'Validates email format using standard regex.',
  'Phone Format': 'Validates phone numbers (international formats).',
  'Numeric Range': 'Checks numeric values fall within min–max range.',
  'Allowed Values': 'Checks value is one of a pre-defined list.',
  'Custom Regex': 'Validates against a custom regex pattern.',
  'Data Type Validation': 'Checks the value conforms to an expected data type.',
  'PAN Format': 'Validates Indian PAN format (AAAAA9999A).',
  'Length Check': 'Checks string does not exceed a maximum length.',
  'Format Check': 'Validates against a format regex pattern.',
  'Special Characters Not Allowed': 'Flags values containing special characters.',
  'Convert to Uppercase': 'Flags text not in UPPERCASE.',
  'Convert to Lowercase': 'Flags text not in lowercase.',
  'Date Format': 'Validates date string against a format pattern.',
};

/* ═══════════════════════════════════════════════════════════════
   CheckboxColumnPicker — replaces <select multiple>
   ═══════════════════════════════════════════════════════════════ */
function CheckboxColumnPicker({ columns, selected, onChange, label, maxHeight = 200 }) {
  const allSelected = columns.length > 0 && selected.length === columns.length;
  const noneSelected = selected.length === 0;

  const toggleCol = (col) => {
    if (selected.includes(col)) {
      onChange(selected.filter((c) => c !== col));
    } else {
      onChange([...selected, col]);
    }
  };

  const toggleAll = () => {
    if (allSelected) {
      onChange([]);
    } else {
      onChange([...columns]);
    }
  };

  return (
    <div>
      {label && <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#3b1f72', marginBottom: '0.35rem' }}>{label}</div>}

      {/* Select All / Clear All */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.35rem' }}>
        <button
          type="button"
          onClick={toggleAll}
          style={{
            fontSize: '0.72rem', fontWeight: 600, color: '#5b2d90',
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 0, textDecoration: 'underline',
          }}
        >
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
        {!noneSelected && !allSelected && (
          <button
            type="button"
            onClick={() => onChange([])}
            style={{
              fontSize: '0.72rem', fontWeight: 600, color: '#9580b8',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 0, textDecoration: 'underline',
            }}
          >
            Clear
          </button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#9580b8', fontWeight: 600 }}>
          {selected.length}/{columns.length}
        </span>
      </div>

      {/* Checkbox list */}
      <div style={{
        maxHeight, overflowY: 'auto',
        border: '1.5px solid #e8e2f5', borderRadius: 10,
        background: '#faf8ff', padding: '0.35rem 0.2rem',
      }}>
        {columns.length === 0 && (
          <div style={{ padding: '0.8rem', textAlign: 'center', color: '#9580b8', fontSize: '0.82rem' }}>
            No columns available
          </div>
        )}
        {columns.map((col) => {
          const isChecked = selected.includes(col);
          return (
            <label
              key={col}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.35rem 0.6rem', margin: '0.1rem 0',
                borderRadius: 8, cursor: 'pointer',
                background: isChecked ? '#f0eaff' : 'transparent',
                transition: 'background 0.12s',
              }}
              onMouseEnter={(e) => { if (!isChecked) e.currentTarget.style.background = '#f5f0fc'; }}
              onMouseLeave={(e) => { if (!isChecked) e.currentTarget.style.background = 'transparent'; }}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleCol(col)}
                style={{
                  accentColor: '#5b2d90', width: 16, height: 16,
                  cursor: 'pointer', flexShrink: 0,
                }}
              />
              <span style={{
                fontSize: '0.84rem', fontWeight: isChecked ? 700 : 500,
                color: isChecked ? '#3b1f72' : '#1a1a2e',
              }}>
                {col}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}


export default function DQPage({ onNavigate, sessionId }) {
  const [file, setFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState('');
  const [datasetType, setDatasetType] = useState('Customer');
  const [ruleEntries, setRuleEntries] = useState([]);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('single');
  const [activeResultTab, setActiveResultTab] = useState(null);

  // Single rule form
  const [srCol, setSrCol] = useState('');
  const [srDim, setSrDim] = useState('Completeness');
  const [srRule, setSrRule] = useState('');
  const [srConfig, setSrConfig] = useState({});
  const [srMandatory, setSrMandatory] = useState(false);

  // Bulk form
  const [bulkCols, setBulkCols] = useState([]);
  const [bulkDim, setBulkDim] = useState('Completeness');
  const [bulkRule, setBulkRule] = useState('');

  // Uniqueness
  const [exactRules, setExactRules] = useState([]);
  const [fuzzyRules, setFuzzyRules] = useState([]);
  const [exactCols, setExactCols] = useState([]);
  const [fuzzyCols, setFuzzyCols] = useState([]);
  const [fuzzyThreshold, setFuzzyThreshold] = useState(85);
  const [fuzzyMaxPairs, setFuzzyMaxPairs] = useState(20000);
  const [fuzzyIgnoreNulls, setFuzzyIgnoreNulls] = useState(true);
  const [fuzzyWeights, setFuzzyWeights] = useState({});
  const [fuzzyRuleName, setFuzzyRuleName] = useState('');
  const [dupTab, setDupTab] = useState('exact');

  const columns = uploadResult?.columns || [];
  const library = DATASET_RULE_LIBRARY[datasetType] || DATASET_RULE_LIBRARY.General;

  const dimRuleMap = {
    Completeness: library.completeness,
    Validity: library.validity,
    Standardization: library.standardization,
  };

  // File upload handler
  const handleUpload = useCallback(async (selectedFile) => {
    if (!selectedFile) return;
    setLoading(true);
    setLoadingMsg('Uploading dataset...');
    setError('');
    setResults(null);
    try {
      const resp = await uploadDataset(selectedFile, null, sessionId);
      setUploadResult(resp.data);
      setSrCol(resp.data.columns[0] || '');
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Run assessment
  const handleRun = async () => {
    setLoading(true);
    setLoadingMsg('Running DQ Assessment...');
    setError('');
    try {
      const resp = await runDQAssessment({
        session_id: sessionId,
        rule_entries: ruleEntries,
        selected_dims: { Completeness: true, Validity: true, Uniqueness: true, Standardization: true },
        obj_name: datasetType,
        uniqueness_config: { exact_rules: exactRules, fuzzy_rules: fuzzyRules },
      });
      setResults(resp.data);
      setActiveResultTab(Object.keys(resp.data.dim_scores || {})[0] || null);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  // Add single rule
  const addRule = () => {
    if (!srCol || !srRule) return;
    setRuleEntries((prev) => [...prev, {
      column: srCol, dimension: srDim, rule: srRule,
      config: { ...srConfig }, mandatory: srMandatory,
    }]);
    setSrConfig({});
    setSrMandatory(false);
  };

  // Bulk add
  const bulkAdd = () => {
    if (!bulkCols.length || !bulkRule) return;
    const newRules = bulkCols.map((col) => ({
      column: col, dimension: bulkDim, rule: bulkRule, config: {}, mandatory: false,
    }));
    setRuleEntries((prev) => [...prev, ...newRules]);
    setBulkCols([]);
  };

  // Add exact rule
  const addExactRule = () => {
    if (!exactCols.length) return;
    const type = exactCols.length === 1 ? 'Single Column Exact Match' : 'Combination Column Exact Match';
    setExactRules((prev) => [...prev, {
      name: `EXACT: ${exactCols.join(' + ')}`, cols: [...exactCols], type, ignore_nulls: true,
    }]);
    setExactCols([]);
  };

  // Add fuzzy rule
  const addFuzzyRule = () => {
    if (!fuzzyCols.length) return;
    const weights = fuzzyCols.map((c) => fuzzyWeights[c] ?? 1.0);
    const name = fuzzyRuleName.trim() || `FUZZY: ${fuzzyCols.join(' + ')}`;
    setFuzzyRules((prev) => [...prev, {
      name, cols: [...fuzzyCols],
      weights, threshold: fuzzyThreshold,
      max_pairs: fuzzyMaxPairs, ignore_nulls: fuzzyIgnoreNulls,
    }]);
    setFuzzyCols([]);
    setFuzzyWeights({});
    setFuzzyRuleName('');
  };

  // Config inputs renderer
  const renderConfigInputs = (ruleName, config, setConfig, prefix = 'sr') => {
    switch (ruleName) {
      case 'Numeric Range':
        return (
          <div className="config-row">
            <label>Min <input type="number" value={config.range_min ?? 0} onChange={(e) => setConfig({ ...config, range_min: parseFloat(e.target.value) })} /></label>
            <label>Max <input type="number" value={config.range_max ?? 999999} onChange={(e) => setConfig({ ...config, range_max: parseFloat(e.target.value) })} /></label>
          </div>
        );
      case 'Allowed Values':
        return (
          <label className="config-full">Comma-separated values
            <input type="text" placeholder="e.g. Male,Female,Other" value={config.allowed_values_str || ''}
              onChange={(e) => setConfig({ ...config, allowed_values_str: e.target.value })} />
          </label>
        );
      case 'Custom Regex':
        return (
          <label className="config-full">Regex Pattern
            <input type="text" placeholder="e.g. ^[A-Z]{5}[0-9]{4}[A-Z]$" value={config.custom_regex || ''}
              onChange={(e) => setConfig({ ...config, custom_regex: e.target.value })} />
          </label>
        );
      case 'Minimum Length':
        return (
          <label>Min Length
            <input type="number" min="1" value={config.min_length_val ?? 2}
              onChange={(e) => setConfig({ ...config, min_length_val: parseInt(e.target.value) })} />
          </label>
        );
      case 'Date Format':
        return (
          <label className="config-full">Date Format (empty = auto-detect)
            <input type="text" placeholder="%Y-%m-%d" value={config.date_fmt || ''}
              onChange={(e) => setConfig({ ...config, date_fmt: e.target.value })} />
          </label>
        );
      case 'Data Type Validation':
        return (
          <label>Expected Type
            <select value={config.data_type || 'string'} onChange={(e) => setConfig({ ...config, data_type: e.target.value })}>
              {['string', 'numeric', 'integer', 'float', 'date'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
        );
      default: return null;
    }
  };

  // Severity badge color
  const sevColor = (sev) => sev === 'HIGH' ? '#dc2626' : sev === 'MEDIUM' ? '#d97706' : '#059669';

  /* ─── RENDER ──────────────────────────────────────── */
  return (
    <div className="page-dq">
      <PageBanner icon="🔍" badge="Enterprise DQ Engine" title="Data Quality Assessment"
        subtitle="Upload your dataset, configure business rules across all dimensions, and generate comprehensive DQ scores with annexure-based reporting." />
      <NavPills current="dq" onChange={onNavigate} />

      {/* RESULTS VIEW */}
      {results && !loading && (
        <div className="dq-results">
          <div className={`results-header ${results.overall_score >= 80 ? 'excellent' : results.overall_score >= 60 ? 'good' : results.overall_score >= 40 ? 'fair' : 'poor'}`}>
            <h2>{results.overall_score >= 80 ? '🏆 Excellent' : results.overall_score >= 60 ? '✅ Good' : results.overall_score >= 40 ? '⚠️ Fair' : '❌ Poor'} — {results.overall_score?.toFixed(1)}%</h2>
          </div>

          <div className="scores-row">
            <ScoreCard value={results.overall_score} label="Overall DQ Score" />
            {Object.entries(results.dim_scores || {}).map(([dim, score]) => (
              <ScoreCard key={dim} value={score} label={dim} />
            ))}
          </div>

          <div className="metrics-row">
            <MetricCard value={results.total_records?.toLocaleString()} label="Total Records" />
            <MetricCard value={results.total_issues?.toLocaleString()} label="Total Issues" />
            <MetricCard value={results.duplicate_count?.toLocaleString()} label="Duplicate Records" />
          </div>

          {/* Issue Classification */}
          {results.issue_classes && Object.keys(results.issue_classes).length > 0 && (
            <>
              <h3 className="subsection-title">🏷️ Issue Classification</h3>
              <div className="issue-class-row">
                {Object.entries(results.issue_classes).map(([cat, info]) => (
                  <div key={cat} className="issue-class-card">
                    <div className="ic-count">{info.count?.toLocaleString()}</div>
                    <div className="ic-cat">{cat}</div>
                    <div className="ic-sev" style={{ color: sevColor(info.severity) }}>{info.severity}</div>
                    <div className="ic-rows">{info.unique_rows?.toLocaleString()} unique rows</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Dimension Breakdown */}
          {results.dim_breakdown && (
            <>
              <h3 className="subsection-title">📊 Dimension-wise Breakdown</h3>
              <DataTable data={results.dim_breakdown} columns={['dimension', 'score', 'total_issues', 'unique_rows']} maxHeight={250} />
            </>
          )}

          {/* Annexures by Dimension */}
          {results.annexure_by_dim && (
            <>
              <h3 className="subsection-title">📋 Issue Annexures</h3>
              <div className="tab-bar">
                {Object.keys(results.annexure_by_dim).map((dim) => (
                  <button key={dim} className={`tab-btn ${activeResultTab === dim ? 'active' : ''}`}
                    onClick={() => setActiveResultTab(dim)}>{dim}</button>
                ))}
              </div>
              {activeResultTab && results.annexure_by_dim[activeResultTab] && (
                <DataTable data={results.annexure_by_dim[activeResultTab]} maxHeight={350} />
              )}
            </>
          )}

          {/* Download */}
          <SectionHeader>Download Reports</SectionHeader>
          <div className="download-card">
            <div className="dl-icon">📊</div>
            <div className="dl-title">Excel DQ Report</div>
            <div className="dl-desc">Multi-sheet enterprise DQ report with executive summary, dimension scorecard, column profiling, rule failures, and row annexures.</div>
            <a href={downloadDQReport(sessionId)} className="btn-primary" download>⬇ Download Excel Report</a>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <button className="btn-primary" onClick={() => onNavigate('maturity')}>📈 Continue to Maturity Assessment →</button>
          </div>
        </div>
      )}

      {/* LOADING */}
      {loading && <Spinner message={loadingMsg} />}

      {/* ERROR */}
      {error && <div className="error-banner">❌ {error}</div>}

      {/* UPLOAD + CONFIG (when no results) */}
      {!results && !loading && (
        <>
          <SectionHeader>📂 Step 1 — Upload Dataset</SectionHeader>

          <div className="file-upload-zone"
            onClick={() => document.getElementById('dq-file-input').click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { setFile(f); handleUpload(f); } }}>
            <input id="dq-file-input" type="file" accept=".csv,.xlsx,.xls,.xlsm" hidden
              onChange={(e) => { const f = e.target.files[0]; if (f) { setFile(f); handleUpload(f); } }} />
            <div className="upload-icon">📤</div>
            <p className="upload-text">{file ? file.name : 'Click or drag a CSV/Excel file here'}</p>
            <p className="upload-hint">Supports CSV, XLSX, XLS, XLSM</p>
          </div>

          {!uploadResult && (
            <div className="dq-steps-row">
              <div className="dq-step active"><div className="dq-step-num">01</div><div className="dq-step-icon">📤</div><div className="dq-step-title">Upload Dataset</div><div className="dq-step-desc">CSV or Excel file</div></div>
              <div className="dq-step-line" />
              <div className="dq-step"><div className="dq-step-num">02</div><div className="dq-step-icon">⚙️</div><div className="dq-step-title">Configure Rules</div><div className="dq-step-desc">Business rules & duplicates</div></div>
              <div className="dq-step-line" />
              <div className="dq-step"><div className="dq-step-num">03</div><div className="dq-step-icon">📊</div><div className="dq-step-title">Download Report</div><div className="dq-step-desc">Excel with annexures</div></div>
            </div>
          )}

          {/* DATASET LOADED */}
          {uploadResult && (
            <>
              <div className="success-banner">
                ✅ Loaded <strong>{uploadResult.rows?.toLocaleString()}</strong> rows × <strong>{uploadResult.columns?.length}</strong> columns
              </div>

              {/* Preview */}
              <details className="preview-expander">
                <summary>🔍 Preview Data (first 10 rows)</summary>
                <DataTable data={uploadResult.preview} maxHeight={200} />
              </details>

              {/* Active Dimensions Banner */}
              <div className="active-dims-banner">
                <span className="dim-label">Active Dimensions:</span>
                {['Completeness', 'Validity', 'Uniqueness', 'Standardization'].map((d) => (
                  <span key={d} className="dim-pill">✓ {d}</span>
                ))}
              </div>

              {/* Step 2: Rule Builder */}
              <SectionHeader color="magenta">⚙️ Step 2 — Dynamic Business Rule Criteria Builder</SectionHeader>


              {/* Tabs */}
              <div className="tab-bar">
                {[['single', '➕ Add Single Rule'], ['bulk', '⚡ Bulk Apply'], ['summary', '📋 Rule Summary']].map(([k, l]) => (
                  <button key={k} className={`tab-btn ${activeTab === k ? 'active' : ''}`} onClick={() => setActiveTab(k)}>{l}</button>
                ))}
              </div>

              {/* Tab: Single Rule */}
              {activeTab === 'single' && (
                <div className="tab-content">
                  <p className="tab-desc">Map one rule to one column with full configuration.</p>
                  <div className="form-row-3">
                    <label>Column
                      <select value={srCol} onChange={(e) => setSrCol(e.target.value)}>
                        {columns.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </label>
                    <label>Dimension
                      <select value={srDim} onChange={(e) => { setSrDim(e.target.value); setSrRule(''); }}>
                        {Object.keys(dimRuleMap).map((d) => <option key={d}>{d}</option>)}
                      </select>
                    </label>
                    <label>Rule
                      <select value={srRule} onChange={(e) => setSrRule(e.target.value)}>
                        <option value="">— Select —</option>
                        {(dimRuleMap[srDim] || []).map((r) => <option key={r}>{r}</option>)}
                      </select>
                    </label>
                  </div>
                  {srRule && RULE_TOOLTIPS[srRule] && <p className="tooltip-text">ℹ️ {RULE_TOOLTIPS[srRule]}</p>}
                  <div className="config-inputs">{renderConfigInputs(srRule, srConfig, setSrConfig)}</div>
                  {srDim === 'Completeness' && (
                    <label className="checkbox-label">
                      <input type="checkbox" checked={srMandatory} onChange={(e) => setSrMandatory(e.target.checked)} />
                      Mark as Mandatory
                    </label>
                  )}
                  <button className="btn-primary" onClick={addRule} disabled={!srCol || !srRule}>➕ Add Rule Mapping</button>
                </div>
              )}

              {/* Tab: Bulk Apply — CHECKBOX PICKER */}
              {activeTab === 'bulk' && (
                <div className="tab-content">
                  <p className="tab-desc">Select multiple columns and apply the same rule to all.</p>
                  <div className="form-row-2">
                    <CheckboxColumnPicker
                      columns={columns}
                      selected={bulkCols}
                      onChange={setBulkCols}
                      label="Columns"
                    />
                    <div>
                      <label>Dimension
                        <select value={bulkDim} onChange={(e) => setBulkDim(e.target.value)}>
                          {Object.keys(dimRuleMap).map((d) => <option key={d}>{d}</option>)}
                        </select>
                      </label>
                      <label>Rule
                        <select value={bulkRule} onChange={(e) => setBulkRule(e.target.value)}>
                          <option value="">— Select —</option>
                          {(dimRuleMap[bulkDim] || []).map((r) => <option key={r}>{r}</option>)}
                        </select>
                      </label>
                    </div>
                  </div>
                  <button className="btn-primary" onClick={bulkAdd} disabled={!bulkCols.length || !bulkRule}>⚡ Bulk Add Rules</button>
                </div>
              )}

              {/* Tab: Summary */}
              {activeTab === 'summary' && (
                <div className="tab-content">
                  {ruleEntries.length === 0 ? (
                    <p className="empty-state">No rule mappings configured yet. Use the other tabs to add rules.</p>
                  ) : (
                    <>
                      <DataTable
                        data={ruleEntries.map((r, i) => ({
                          '#': i + 1, Column: r.column, Dimension: r.dimension,
                          Rule: r.rule, Mandatory: r.mandatory ? '⭐ Yes' : 'No',
                        }))}
                        maxHeight={350}
                      />
                      <div className="summary-bar">
                        <strong>Active rules:</strong> {ruleEntries.length} across {new Set(ruleEntries.map((r) => r.column)).size} column(s)
                        <button className="btn-danger-sm" onClick={() => setRuleEntries([])}>🗑 Clear All</button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Uniqueness Builder */}
              <div className="dim-header-bar">🔑 Uniqueness — Duplicate Criteria Builder (Exact + RapidFuzz Hybrid)</div>

              <div className="tab-bar">
                <button className={`tab-btn ${dupTab === 'exact' ? 'active' : ''}`} onClick={() => setDupTab('exact')}>🎯 Exact Match</button>
                <button className={`tab-btn ${dupTab === 'fuzzy' ? 'active' : ''}`} onClick={() => setDupTab('fuzzy')}>🔮 Fuzzy Match (RapidFuzz)</button>
                <button className={`tab-btn ${dupTab === 'summary' ? 'active' : ''}`} onClick={() => setDupTab('summary')}>
                  📋 Rules Summary
                  {(exactRules.length + fuzzyRules.length) > 0 && (
                    <span style={{ marginLeft: 5, fontSize: '0.65rem', fontWeight: 700,
                      background: '#5b2d90', color: '#fff', borderRadius: 999, padding: '1px 6px' }}>
                      {exactRules.length + fuzzyRules.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Tab: Exact Match — CHECKBOX PICKER */}
              {dupTab === 'exact' && (
                <div className="tab-content">
                  <p className="tab-desc">
                    Detect exact duplicate records based on one or more columns.
                    Single column = each column checked independently. Multi-column = combination match.
                  </p>
                  <div className="form-row-2">
                    <CheckboxColumnPicker
                      columns={columns}
                      selected={exactCols}
                      onChange={setExactCols}
                      label="Columns"
                    />
                    <div>
                      <div style={{ background: '#f9f8fc', border: '1.5px solid #e8e2f5', borderRadius: 10, padding: '0.7rem 0.9rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#3b1f72', marginBottom: '0.3rem' }}>Match Type</div>
                        <div style={{ fontSize: '0.78rem', color: '#555', lineHeight: 1.5 }}>
                          {exactCols.length === 0 && '← Select columns to see match type'}
                          {exactCols.length === 1 && '🎯 Single Column Exact Match — each value must be unique'}
                          {exactCols.length > 1 && `🔗 Combination Exact Match — ${exactCols.join(' + ')} combined must be unique`}
                        </div>
                      </div>
                      <div style={{ marginTop: '0.6rem', fontSize: '0.76rem', color: '#9580b8' }}>
                        Selected: <strong>{exactCols.length}</strong> column(s)
                      </div>
                    </div>
                  </div>
                  <button className="btn-primary" onClick={addExactRule} disabled={!exactCols.length} style={{ marginTop: '0.5rem' }}>
                    ➕ Add Exact Rule ({exactCols.length === 1 ? 'Single' : 'Combination'})
                  </button>
                </div>
              )}

              {/* Tab: Fuzzy Match — CHECKBOX PICKER */}
              {dupTab === 'fuzzy' && (
                <div className="tab-content">
                  <p className="tab-desc">
                    Hybrid Fuzzy Match using <strong>RapidFuzz</strong> 4-scorer ensemble: ratio (15%), partial_ratio (20%),
                    token_sort_ratio (30%), token_set_ratio (35%). Ideal for names, addresses, and text fields with typos or variations.
                  </p>

                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '0.5rem 0.8rem', marginBottom: '0.8rem', fontSize: '0.78rem', color: '#166534' }}>
                    💡 <strong>Tip:</strong> Select columns like Name, Address, City — the engine uses blocking (first 2 chars) + Union-Find grouping for fast, accurate detection.
                  </div>

                  <label>Rule Name (optional)
                    <input type="text" value={fuzzyRuleName} onChange={(e) => setFuzzyRuleName(e.target.value)}
                      placeholder="e.g. FUZZY: Name + Address" />
                  </label>

                  <div className="form-row-2" style={{ marginTop: '0.5rem' }}>
                    <CheckboxColumnPicker
                      columns={columns}
                      selected={fuzzyCols}
                      onChange={(sel) => {
                        setFuzzyCols(sel);
                        const newW = { ...fuzzyWeights };
                        sel.forEach((c) => { if (!(c in newW)) newW[c] = 1.0; });
                        setFuzzyWeights(newW);
                      }}
                      label="Fuzzy Columns"
                    />
                    <div>
                      <label>Similarity Threshold (%)
                        <input type="range" min="50" max="99" value={fuzzyThreshold}
                          onChange={(e) => setFuzzyThreshold(parseInt(e.target.value))} />
                        <span style={{ fontWeight: 700, color: fuzzyThreshold >= 90 ? '#059669' : fuzzyThreshold >= 75 ? '#d97706' : '#dc2626' }}>
                          {fuzzyThreshold}%
                          {fuzzyThreshold >= 90 ? ' (Strict)' : fuzzyThreshold >= 75 ? ' (Balanced)' : ' (Loose)'}
                        </span>
                      </label>

                      <label style={{ marginTop: '0.5rem' }}>Max Pairs per Block
                        <select value={fuzzyMaxPairs} onChange={(e) => setFuzzyMaxPairs(parseInt(e.target.value))}>
                          <option value={5000}>5,000 (Fast)</option>
                          <option value={10000}>10,000</option>
                          <option value={20000}>20,000 (Default)</option>
                          <option value={50000}>50,000 (Thorough)</option>
                          <option value={100000}>100,000 (Exhaustive)</option>
                        </select>
                      </label>

                      <label className="checkbox-label" style={{ marginTop: '0.5rem' }}>
                        <input type="checkbox" checked={fuzzyIgnoreNulls}
                          onChange={(e) => setFuzzyIgnoreNulls(e.target.checked)} />
                        Ignore null/blank rows in fuzzy comparison
                      </label>
                    </div>
                  </div>

                  {/* Per-column weights */}
                  {fuzzyCols.length > 0 && (
                    <div style={{ background: '#f9f8fc', border: '1.5px solid #e8e2f5', borderRadius: 10, padding: '0.8rem 1rem', marginTop: '0.6rem' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#3b1f72', marginBottom: '0.5rem' }}>
                        ⚖️ Column Weights (higher = more influence on similarity score)
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.4rem' }}>
                        {fuzzyCols.map((c) => (
                          <div key={c} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                            <span style={{ fontWeight: 600, color: '#5b2d90', minWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c}</span>
                            <input type="range" min="0.1" max="3.0" step="0.1"
                              value={fuzzyWeights[c] ?? 1.0}
                              onChange={(e) => setFuzzyWeights({ ...fuzzyWeights, [c]: parseFloat(e.target.value) })}
                              style={{ flex: 1 }} />
                            <span style={{ fontWeight: 700, color: '#3b1f72', minWidth: 30 }}>{(fuzzyWeights[c] ?? 1.0).toFixed(1)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button className="btn-primary" onClick={addFuzzyRule} disabled={!fuzzyCols.length} style={{ marginTop: '0.8rem' }}>
                    🔮 Add Fuzzy Rule
                  </button>

                  {/* Scoring explainer */}
                  <details style={{ marginTop: '0.8rem' }}>
                    <summary style={{ fontSize: '0.82rem', fontWeight: 600, color: '#5b2d90', cursor: 'pointer' }}>
                      ℹ️ How RapidFuzz Hybrid Scoring Works
                    </summary>
                    <div style={{ fontSize: '0.78rem', color: '#555', lineHeight: 1.6, padding: '0.6rem 0', borderTop: '1px solid #e8e2f5', marginTop: '0.3rem' }}>
                      <strong>4-Scorer Ensemble (per column):</strong><br />
                      • <strong>ratio</strong> (15%) — character-level overlap<br />
                      • <strong>partial_ratio</strong> (20%) — best substring match<br />
                      • <strong>token_sort_ratio</strong> (30%) — order-independent word matching<br />
                      • <strong>token_set_ratio</strong> (35%) — handles extra/duplicate words<br /><br />
                      <strong>Blocking:</strong> First 2 characters of primary column + geo columns (City/Country/State) to reduce O(n²).<br />
                      <strong>Grouping:</strong> Union-Find with path compression for transitive group membership (A~B, B~C → A,B,C grouped).
                    </div>
                  </details>
                </div>
              )}

              {/* Tab: Rules Summary */}
              {dupTab === 'summary' && (
                <div className="tab-content">
                  {exactRules.length === 0 && fuzzyRules.length === 0 ? (
                    <p className="empty-state">No duplicate rules configured yet. Use the Exact or Fuzzy tabs to add rules.</p>
                  ) : (
                    <>
                      {exactRules.length > 0 && (
                        <>
                          <h4 style={{ margin: '0 0 0.5rem', color: '#3b1f72', fontSize: '0.9rem' }}>🎯 Exact Rules ({exactRules.length})</h4>
                          <DataTable
                            data={exactRules.map((r, i) => ({
                              '#': `E${i + 1}`, Name: r.name, Type: r.type,
                              Columns: r.cols.join(' + '),
                            }))}
                            maxHeight={180}
                          />
                          <div style={{ textAlign: 'right', marginTop: '0.3rem' }}>
                            <button className="btn-danger-sm" onClick={() => setExactRules([])}>🗑 Clear Exact Rules</button>
                          </div>
                        </>
                      )}

                      {fuzzyRules.length > 0 && (
                        <>
                          <h4 style={{ margin: '0.8rem 0 0.5rem', color: '#3b1f72', fontSize: '0.9rem' }}>🔮 Fuzzy Rules ({fuzzyRules.length})</h4>
                          <DataTable
                            data={fuzzyRules.map((r, i) => ({
                              '#': `F${i + 1}`, Name: r.name,
                              Columns: r.cols.join(' + '),
                              Threshold: `${r.threshold}%`,
                              Weights: r.weights.map((w) => w.toFixed(1)).join(', '),
                              'Max Pairs': r.max_pairs?.toLocaleString() || '20,000',
                              'Ignore Nulls': r.ignore_nulls ? 'Yes' : 'No',
                            }))}
                            maxHeight={180}
                          />
                          <div style={{ textAlign: 'right', marginTop: '0.3rem' }}>
                            <button className="btn-danger-sm" onClick={() => setFuzzyRules([])}>🗑 Clear Fuzzy Rules</button>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Active Rules Count */}
              {ruleEntries.length > 0 && (
                <div className="active-rules-bar">
                  <strong>Active rules:</strong> {ruleEntries.length} across {new Set(ruleEntries.map((r) => r.column)).size} column(s)
                  {' · '}
                  {Object.entries(ruleEntries.reduce((acc, r) => { acc[r.dimension] = (acc[r.dimension] || 0) + 1; return acc; }, {}))
                    .map(([d, c]) => <span key={d} className="dim-count">{c} {d}</span>)}
                </div>
              )}

              {/* RUN BUTTON */}
              <div className="run-section">
                <button className="btn-run" onClick={handleRun} disabled={loading}>
                  🚀 Run Data Quality Assessment
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}