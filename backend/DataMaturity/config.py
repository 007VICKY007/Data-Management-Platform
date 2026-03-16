# ──────────────────────────────────────────────────────────────
#  DATA MATURITY CONFIGURATION — Uniqus Light Corporate Theme
# ──────────────────────────────────────────────────────────────

# ═══════════════════════════════════════════════════════════════
#  BRAND COLOURS
# ═══════════════════════════════════════════════════════════════

UNIQU_PURPLE       = "#5b2d90"
UNIQU_MAGENTA      = "#b10f74"
UNIQU_LAVENDER     = "#ede8f7"
UNIQU_LIGHT_BG     = "#ffffff"
UNIQU_TEXT         = "#1a1a2e"
UNIQU_GREY         = "#d9cef0"
UNIQU_PURPLE_DARK  = "#3d1d63"
UNIQU_PURPLE_MID   = "#7c4dbb"
UNIQU_PURPLE_LIGHT = "#ede8f7"
UNIQU_PURPLE_PALE  = "#f5f0fc"
UNIQU_SURFACE      = "#f9f8fc"

# ═══════════════════════════════════════════════════════════════
#  RATING SYSTEM
# ═══════════════════════════════════════════════════════════════

RATING_LABELS    = ["Adhoc", "Repeatable", "Defined", "Managed", "Optimised"]
RATING_TO_SCORE  = {"Adhoc": 1, "Repeatable": 2, "Defined": 3, "Managed": 4, "Optimised": 5}

DQ_MATURITY_MAP  = [(95, "Optimised"), (80, "Managed"), (60, "Defined"), (40, "Repeatable"), (0, "Adhoc")]

# ═══════════════════════════════════════════════════════════════
#  MASTER DATA OBJECTS & DIMENSIONS
# ═══════════════════════════════════════════════════════════════

DEFAULT_MASTER_OBJECTS = ["Customer", "Vendor Master", "Item Master", "Price", "Finance"]

MATURITY_DIMS = [
    "Data Governance",
    "Data Quality",
    "Data Architecture",
    "Data Modeling & Design",
    "Data Storage & Operations",
    "Data Security",
    "Data Integration & Interoperability",
    "Document & Content Management",
    "Reference & Master Data",
    "DW & Business Intelligence",
    "Metadata Management",
]

# ═══════════════════════════════════════════════════════════════
#  PER-DIMENSION DEFAULT MASTER DATA OBJECTS
# ═══════════════════════════════════════════════════════════════
#
#  Each Knowledge Area can have its own set of Master Data Objects.
#  The frontend allows the user to customize which objects are
#  enabled per dimension at runtime via checkboxes.
#  If a dimension is not listed here, it falls back to
#  DEFAULT_MASTER_OBJECTS.
# ═══════════════════════════════════════════════════════════════

DEFAULT_OBJECTS_PER_DIM = {
    "Data Governance":                     ["Customer", "Vendor Master", "Item Master", "Price", "Finance"],
    "Data Quality":                        ["Customer", "Vendor Master", "Item Master", "Price", "Finance"],
    "Data Architecture":                   ["Customer", "Vendor Master", "Item Master", "Price", "Finance"],
    "Data Modeling & Design":              ["Customer", "Vendor Master", "Item Master", "Price", "Finance"],
    "Data Storage & Operations":           ["Customer", "Vendor Master", "Item Master", "Price", "Finance"],
    "Data Security":                       ["Customer", "Vendor Master", "Item Master", "Price", "Finance"],
    "Data Integration & Interoperability": ["Customer", "Vendor Master", "Item Master", "Price", "Finance"],
    "Document & Content Management":       ["Customer", "Vendor Master", "Item Master", "Price", "Finance"],
    "Reference & Master Data":             ["Customer", "Vendor Master", "Item Master", "Price", "Finance"],
    "DW & Business Intelligence":          ["Customer", "Vendor Master", "Item Master", "Price", "Finance"],
    "Metadata Management":                 ["Customer", "Vendor Master", "Item Master", "Price", "Finance"],
}

# ═══════════════════════════════════════════════════════════════
#  DIMENSION COLOUR DOTS  (sidebar toggle indicators)
# ═══════════════════════════════════════════════════════════════

DIM_COLORS = {
    "Data Governance":                     "#5b2d90",
    "Data Quality":                        "#3d1d63",
    "Data Architecture":                   "#9333ea",
    "Data Modeling & Design":              "#7c3aed",
    "Data Storage & Operations":           "#d97706",
    "Data Security":                       "#dc2626",
    "Data Integration & Interoperability": "#059669",
    "Document & Content Management":       "#84cc16",
    "Reference & Master Data":             "#ea580c",
    "DW & Business Intelligence":          "#2563eb",
    "Metadata Management":                 "#0d9488",
}

# ═══════════════════════════════════════════════════════════════
#  FULL QUESTION BANK — ALL 11 DAMA DIMENSIONS
# ═══════════════════════════════════════════════════════════════

QUESTION_BANK = {
    "Data Governance": [
        {"id": "DG-1",  "section": "Data Management Strategy (DMS)", "question": "Documented Data Management Strategy exists (vision, scope, objectives).", "weight": 2},
        {"id": "DG-2",  "section": "Data Management Strategy (DMS)", "question": "Stakeholders are involved in strategy creation and review.", "weight": 1},
        {"id": "DG-3",  "section": "Data Management Strategy (DMS)", "question": "Strategy is approved, published, and communicated to relevant stakeholders.", "weight": 1},
        {"id": "DG-4",  "section": "Roles & Responsibilities", "question": "Data roles (Owner, Steward, Custodian) are defined for the object.", "weight": 2},
        {"id": "DG-5",  "section": "Roles & Responsibilities", "question": "Roles and responsibilities are documented and communicated.", "weight": 1},
        {"id": "DG-6",  "section": "Policies & Standards", "question": "Governance policies/standards exist (naming, definitions, approvals).", "weight": 2},
        {"id": "DG-7",  "section": "Policies & Standards", "question": "Policies are periodically reviewed and updated.", "weight": 1},
        {"id": "DG-8",  "section": "DMO", "question": "Data Management Office (DMO) / governance forum exists.", "weight": 2},
        {"id": "DG-9",  "section": "DMO", "question": "Operating model & governance cadence are defined (RACI, forums, KPIs).", "weight": 1},
        {"id": "DG-10", "section": "Change Management", "question": "Change control process exists for master data requests/updates.", "weight": 2},
        {"id": "DG-11", "section": "Change Management", "question": "Training / enablement exists for users and data stewards.", "weight": 1},
        {"id": "DG-12", "section": "Issue Management", "question": "Issue logging, triage, and resolution workflow exists.", "weight": 1},
        {"id": "DG-13", "section": "Issue Management", "question": "Root-cause analysis and lessons learned are captured.", "weight": 1},
        {"id": "DG-14", "section": "Metadata", "question": "Metadata (definitions, owners, rules) is managed in a repository/catalog.", "weight": 1},
        {"id": "DG-15", "section": "Metadata", "question": "Data lineage is tracked and documented end-to-end across systems.", "weight": 1},
    ],
    "Data Quality": [
        {"id": "DQ-1",  "section": "Assessment & Rules", "question": "Data quality assessment policy exists (what, how often, ownership).", "weight": 2},
        {"id": "DQ-2",  "section": "Assessment & Rules", "question": "DQ rules are defined (completeness, validity, uniqueness, consistency).", "weight": 2},
        {"id": "DQ-3",  "section": "Assessment & Rules", "question": "DQ rules cover critical fields and are documented with thresholds.", "weight": 2},
        {"id": "DQ-4",  "section": "Monitoring", "question": "DQ monitoring is periodic and tracked (dashboards/scorecards).", "weight": 2},
        {"id": "DQ-5",  "section": "Monitoring", "question": "Automated validation exists (API checks, format checks, reference checks).", "weight": 1},
        {"id": "DQ-6",  "section": "Duplicates", "question": "Duplicate detection & golden record process exists.", "weight": 2},
        {"id": "DQ-7",  "section": "Profiling", "question": "Data profiling is performed using tools/standard techniques.", "weight": 1},
        {"id": "DQ-8",  "section": "Profiling", "question": "Anomalies/inconsistencies are identified and resolved consistently.", "weight": 1},
        {"id": "DQ-9",  "section": "Standardization", "question": "Standardization rules exist (formats, naming conventions, codes).", "weight": 2},
        {"id": "DQ-10", "section": "Standardization", "question": "Uniform definitions and formatting are applied across datasets/systems.", "weight": 1},
        {"id": "DQ-11", "section": "Cleansing", "question": "Cleansing workflow/tools exist (issue queues, approvals, audit trail).", "weight": 2},
        {"id": "DQ-12", "section": "Cleansing", "question": "Recurring cleansing is planned (not only ad-hoc one-time fixes).", "weight": 1},
    ],
    "Data Architecture": [
        {"id": "DA-1", "section": "Enterprise Data Model", "question": "An enterprise or conceptual data model exists and is maintained.", "weight": 2},
        {"id": "DA-2", "section": "Enterprise Data Model", "question": "Logical/physical data models are documented per domain.", "weight": 1},
        {"id": "DA-3", "section": "Standards & Guidelines", "question": "Data architecture standards (naming, modelling conventions) are defined.", "weight": 2},
        {"id": "DA-4", "section": "Standards & Guidelines", "question": "Technology standards and platform guidelines are documented.", "weight": 1},
        {"id": "DA-5", "section": "Alignment", "question": "Data architecture is aligned to enterprise/business architecture.", "weight": 2},
    ],
    "Data Modeling & Design": [
        {"id": "DM-1", "section": "Modeling Standards", "question": "Data modeling standards and naming conventions exist.", "weight": 2},
        {"id": "DM-2", "section": "Modeling Standards", "question": "Conceptual, logical, and physical models are maintained per domain.", "weight": 1},
        {"id": "DM-3", "section": "Design Governance", "question": "Model reviews and approval processes exist before deployment.", "weight": 2},
        {"id": "DM-4", "section": "Design Governance", "question": "Data design changes follow a change management process.", "weight": 1},
        {"id": "DM-5", "section": "Tools", "question": "Data modeling tools are standardized and used consistently.", "weight": 1},
    ],
    "Data Storage & Operations": [
        {"id": "DS-1", "section": "Storage Management", "question": "Data storage standards exist (retention, archival, purge policies).", "weight": 2},
        {"id": "DS-2", "section": "Storage Management", "question": "Storage capacity planning and monitoring are in place.", "weight": 1},
        {"id": "DS-3", "section": "Operations", "question": "Database administration processes are documented and followed.", "weight": 2},
        {"id": "DS-4", "section": "Operations", "question": "Backup and recovery procedures are tested periodically.", "weight": 2},
        {"id": "DS-5", "section": "Performance", "question": "Performance tuning and optimization are performed regularly.", "weight": 1},
    ],
    "Data Security": [
        {"id": "DSC-1", "section": "Access Control", "question": "Data access policies are defined (RBAC, least privilege).", "weight": 2},
        {"id": "DSC-2", "section": "Access Control", "question": "Data classification (public, internal, confidential, restricted) is applied.", "weight": 2},
        {"id": "DSC-3", "section": "Privacy & Compliance", "question": "Privacy policies comply with applicable regulations (GDPR, PDPA, etc.).", "weight": 2},
        {"id": "DSC-4", "section": "Privacy & Compliance", "question": "Data masking, encryption, and anonymization are used for sensitive data.", "weight": 1},
        {"id": "DSC-5", "section": "Audit & Monitoring", "question": "Security audit trails and access monitoring are active.", "weight": 2},
    ],
    "Data Integration & Interoperability": [
        {"id": "DI-1", "section": "Integration Strategy & Architecture", "question": "Enterprise-wide integration strategy exists (APIs/ETL/events), aligned to target state.", "weight": 2},
        {"id": "DI-2", "section": "Integration Strategy & Architecture", "question": "System of Record (SoR) / System of Entry is clearly defined per object.", "weight": 2},
        {"id": "DI-3", "section": "Integration Strategy & Architecture", "question": "Integration flows and interfaces are documented (source-to-target mapping).", "weight": 2},
        {"id": "DI-4", "section": "Integration Technology & Tools", "question": "Integration platform/tooling supports scalability & performance requirements.", "weight": 1},
        {"id": "DI-5", "section": "Integration Technology & Tools", "question": "Logging, monitoring, reconciliation, and audit trails exist for data movement.", "weight": 2},
    ],
    "Document & Content Management": [
        {"id": "DC-1", "section": "Content Standards", "question": "Document/content management standards and taxonomy are defined.", "weight": 2},
        {"id": "DC-2", "section": "Content Standards", "question": "Lifecycle management (creation, review, archive, disposal) is documented.", "weight": 1},
        {"id": "DC-3", "section": "Tools & Repositories", "question": "Document management system/platform is in place and adopted.", "weight": 2},
        {"id": "DC-4", "section": "Tools & Repositories", "question": "Version control and access permissions are enforced.", "weight": 1},
        {"id": "DC-5", "section": "Compliance", "question": "Records retention policies comply with regulatory requirements.", "weight": 2},
    ],
    "Reference & Master Data": [
        {"id": "RM-1", "section": "Master Data Management", "question": "Master data objects are identified with clear ownership.", "weight": 2},
        {"id": "RM-2", "section": "Master Data Management", "question": "Golden record / single source of truth process exists per object.", "weight": 2},
        {"id": "RM-3", "section": "Reference Data", "question": "Reference data (code lists, lookups) is centrally managed.", "weight": 2},
        {"id": "RM-4", "section": "Reference Data", "question": "Reference data change management and distribution process exists.", "weight": 1},
        {"id": "RM-5", "section": "Governance", "question": "MDM governance body reviews and approves master data changes.", "weight": 1},
    ],
    "DW & Business Intelligence": [
        {"id": "DW-1", "section": "DW Architecture", "question": "Data warehouse / data lake architecture is documented.", "weight": 2},
        {"id": "DW-2", "section": "DW Architecture", "question": "ETL/ELT pipelines are monitored with SLA tracking.", "weight": 1},
        {"id": "DW-3", "section": "BI & Analytics", "question": "BI/reporting standards and semantic layer are defined.", "weight": 2},
        {"id": "DW-4", "section": "BI & Analytics", "question": "Self-service analytics capabilities exist with governance guardrails.", "weight": 1},
        {"id": "DW-5", "section": "Data Delivery", "question": "Data consumption patterns (batch, real-time, API) are documented.", "weight": 1},
    ],
    "Metadata Management": [
        {"id": "MM-1", "section": "Metadata Strategy", "question": "Metadata management strategy and policy exist.", "weight": 2},
        {"id": "MM-2", "section": "Metadata Strategy", "question": "Business glossary / data dictionary is maintained and accessible.", "weight": 2},
        {"id": "MM-3", "section": "Lineage & Catalog", "question": "Data lineage is captured across key systems.", "weight": 2},
        {"id": "MM-4", "section": "Lineage & Catalog", "question": "Data catalog tool is implemented and adopted by users.", "weight": 1},
        {"id": "MM-5", "section": "Automation", "question": "Metadata harvesting/ingestion is automated from source systems.", "weight": 1},
    ],
}