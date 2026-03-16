"""
Flask Backend — Enterprise Data Management Platform
Fixed: Maturity endpoints properly handle QUESTION_BANK structure
       and convert frontend numeric ratings to label strings.
"""

import os
import sys
import json
import traceback
import datetime
import zipfile
import tempfile
import base64
from io import BytesIO
from pathlib import Path

# CRITICAL: Set matplotlib to non-interactive backend BEFORE any import
# This prevents tkinter from loading, which causes Flask watchdog reloader
# to restart the server mid-request on Windows.
import matplotlib
matplotlib.use('Agg')

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
import numpy as np

# Ensure modules are importable
sys.path.insert(0, os.path.dirname(__file__))

from modules.dq import (
    APP_TITLE, APP_ICON, SUPPORTED_FORMATS, DIMENSIONS,
    load_dataset, get_excel_sheet_names,
    execute_completeness_rules, execute_validity_rules,
    execute_uniqueness_rules, execute_standardization_rules,
    compute_completeness_score, compute_validity_score,
    compute_uniqueness_score, compute_standardization_score,
    compute_overall_score, build_clean_dataset, generate_excel_report,
)
from modules.config import AppConfig

from DataMaturity.config import (
    RATING_LABELS, RATING_TO_SCORE, DEFAULT_MASTER_OBJECTS,
    MATURITY_DIMS, QUESTION_BANK,
)
from DataMaturity.helpers import (
    dq_score_to_maturity_level, build_question_df,
    build_question_df_from_frontend,
    compute_all_scores, validate_responses, to_excel_bytes,
)
from DataMaturity.visualizations import render_slide_png
from DataMaturity.report_generator import build_pdf_bytes

app = Flask(__name__)
CORS(app)

TEMP_DIR = Path(tempfile.gettempdir()) / "edmp_temp"
OUTPUT_DIR = Path(tempfile.gettempdir()) / "edmp_output"
TEMP_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# In-memory session store (use Redis/DB in production)
sessions = {}


def _np_safe(obj):
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return float(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, pd.DataFrame):
        return obj.to_dict(orient="records")
    if isinstance(obj, pd.Series):
        return obj.to_dict()
    if pd.isna(obj):
        return None
    return obj


def _serialize_dict(d):
    if isinstance(d, dict):
        return {k: _serialize_dict(v) for k, v in d.items()}
    if isinstance(d, list):
        return [_serialize_dict(v) for v in d]
    return _np_safe(d)


# ═══════════════════════════════════════════════════════════════
#  HEALTH CHECK
# ═══════════════════════════════════════════════════════════════
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "app": APP_TITLE, "version": AppConfig.VERSION})


# ═══════════════════════════════════════════════════════════════
#  CONFIG / METADATA
# ═══════════════════════════════════════════════════════════════
@app.route("/api/config", methods=["GET"])
def get_config():
    return jsonify({
        "dimensions": DIMENSIONS,
        "supported_formats": SUPPORTED_FORMATS,
        "maturity_dims": list(MATURITY_DIMS),
        "default_master_objects": list(DEFAULT_MASTER_OBJECTS),
        "rating_labels": RATING_LABELS,
        "dataset_types": ["Customer", "Vendor", "Product", "Employee", "Transaction", "General"],
    })


# ═══════════════════════════════════════════════════════════════
#  DQ: UPLOAD DATASET
# ═══════════════════════════════════════════════════════════════
@app.route("/api/dq/upload", methods=["POST"])
def dq_upload():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    sheet_name = request.form.get("sheet_name", None)
    session_id = request.form.get("session_id", "default")

    try:
        tmp_path = TEMP_DIR / file.filename
        file.save(str(tmp_path))

        sheets = []
        if file.filename.lower().endswith((".xlsx", ".xls", ".xlsm")):
            with open(tmp_path, "rb") as f:
                sheets = get_excel_sheet_names(f)

        with open(tmp_path, "rb") as f:
            df = load_dataset(f, sheet_name if sheet_name else None)

        sessions[session_id] = {
            "df": df,
            "filename": file.filename,
            "columns": list(df.columns),
            "shape": list(df.shape),
        }

        return jsonify({
            "success": True,
            "filename": file.filename,
            "rows": int(df.shape[0]),
            "columns": list(df.columns),
            "sheets": sheets,
            "preview": df.head(10).fillna("").to_dict(orient="records"),
            "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
        })

    except Exception as e:
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500


# ═══════════════════════════════════════════════════════════════
#  DQ: RUN ASSESSMENT
# ═══════════════════════════════════════════════════════════════
@app.route("/api/dq/run", methods=["POST"])
def dq_run():
    data = request.get_json()
    session_id = data.get("session_id", "default")

    if session_id not in sessions:
        return jsonify({"error": "No dataset uploaded. Please upload first."}), 400

    df = sessions[session_id]["df"]
    all_columns = list(df.columns)

    rule_entries = data.get("rule_entries", [])
    selected_dims = data.get("selected_dims", {dim: True for dim in DIMENSIONS})
    obj_name = data.get("obj_name", "Customer")

    rules_by_dim = {}
    merged_cfg = {}

    comp_entries = [r for r in rule_entries if r.get("dimension") == "Completeness"]
    val_entries = [r for r in rule_entries if r.get("dimension") == "Validity"]
    std_entries = [r for r in rule_entries if r.get("dimension") == "Standardization"]

    if comp_entries:
        rules_by_dim["Completeness"] = list(dict.fromkeys(r["rule"] for r in comp_entries))
        merged_cfg["comp_columns"] = list(dict.fromkeys(r["column"] for r in comp_entries))
        for r in comp_entries:
            cfg = r.get("config", {})
            if "min_length_val" in cfg:
                merged_cfg["min_length_val"] = cfg["min_length_val"]
                break
        mandatory_cols = [r["column"] for r in comp_entries if r.get("mandatory")]
        if mandatory_cols:
            merged_cfg["mandatory_cols"] = mandatory_cols

    if val_entries:
        rules_by_dim["Validity"] = list(dict.fromkeys(r["rule"] for r in val_entries))
        merged_cfg["val_columns"] = list(dict.fromkeys(r["column"] for r in val_entries))
        for r in val_entries:
            cfg = r.get("config", {})
            for key in ["range_min", "range_max", "allowed_values_str", "custom_regex", "date_fmt"]:
                if key in cfg:
                    merged_cfg[key] = cfg[key]

    if std_entries:
        rules_by_dim["Standardization"] = list(dict.fromkeys(r["rule"] for r in std_entries))
        merged_cfg["std_columns"] = list(dict.fromkeys(r["column"] for r in std_entries))

    uniq_config = data.get("uniqueness_config", {})
    exact_rules = uniq_config.get("exact_rules", [])
    fuzzy_rules = uniq_config.get("fuzzy_rules", [])

    uniq_rule_names = []
    single_cols = []
    combo_cols = None

    for r in exact_rules:
        if r.get("type") == "Single Column Exact Match":
            single_cols.extend(r.get("cols", []))
            if "Single Column Exact Match" not in uniq_rule_names:
                uniq_rule_names.append("Single Column Exact Match")
        else:
            combo_cols = r.get("cols", [])
            if "Combination Column Exact Match" not in uniq_rule_names:
                uniq_rule_names.append("Combination Column Exact Match")

    if fuzzy_rules:
        uniq_rule_names.append("Hybrid Fuzzy Match")
        fr = fuzzy_rules[0]
        merged_cfg["fuzzy_cols"] = fr.get("cols", [])
        merged_cfg["fuzzy_threshold"] = fr.get("threshold", 80)
        merged_cfg["fuzzy_weights"] = fr.get("weights", [])
        merged_cfg["fuzzy_max_pairs"] = fr.get("max_pairs", 20000)
        merged_cfg["fuzzy_ignore_nulls"] = fr.get("ignore_nulls", True)

    if uniq_rule_names:
        rules_by_dim["Uniqueness"] = uniq_rule_names

    try:
        all_annexure = []
        dim_scores = {}
        dup_records = pd.DataFrame()
        standardized_df = None

        if selected_dims.get("Completeness") and rules_by_dim.get("Completeness"):
            ca = execute_completeness_rules(
                df, rules_by_dim["Completeness"],
                merged_cfg.get("comp_columns", all_columns),
                min_length_val=merged_cfg.get("min_length_val", 3),
                mandatory_cols=merged_cfg.get("mandatory_cols")
            )
            all_annexure.extend(ca)
            dim_scores["Completeness"] = compute_completeness_score(
                df, ca, merged_cfg.get("comp_columns", all_columns), rules_by_dim["Completeness"]
            )

        if selected_dims.get("Validity") and rules_by_dim.get("Validity"):
            val_column_rule_map = [
                {"column": r["column"], "rule": r["rule"], "config": r.get("config", {})}
                for r in val_entries
            ] if val_entries else None
            va = execute_validity_rules(
                df, rules_by_dim["Validity"],
                merged_cfg.get("val_columns", all_columns),
                range_min=merged_cfg.get("range_min", 0),
                range_max=merged_cfg.get("range_max", 100),
                allowed_values_str=merged_cfg.get("allowed_values_str", ""),
                custom_regex=merged_cfg.get("custom_regex", ""),
                date_fmt=merged_cfg.get("date_fmt", ""),
                column_rule_map=val_column_rule_map,
            )
            all_annexure.extend(va)
            dim_scores["Validity"] = compute_validity_score(
                df, va, merged_cfg.get("val_columns", all_columns), rules_by_dim["Validity"]
            )

        if selected_dims.get("Uniqueness") and rules_by_dim.get("Uniqueness"):
            dup_records, ua, warnings = execute_uniqueness_rules(
                df, rules_by_dim["Uniqueness"],
                single_cols=single_cols or [],
                combo_cols=combo_cols,
                fuzzy_cols=merged_cfg.get("fuzzy_cols"),
                fuzzy_threshold=merged_cfg.get("fuzzy_threshold", 80),
                fuzzy_weights=merged_cfg.get("fuzzy_weights"),
                fuzzy_max_pairs=merged_cfg.get("fuzzy_max_pairs", 20000),
                fuzzy_ignore_nulls=merged_cfg.get("fuzzy_ignore_nulls", True),
            )
            if not dup_records.empty:
                dup_records = dup_records.loc[~dup_records.index.duplicated(keep='first')]
            all_annexure.extend(ua)
            dim_scores["Uniqueness"] = compute_uniqueness_score(df, dup_records)

        if selected_dims.get("Standardization") and rules_by_dim.get("Standardization"):
            std_column_rule_map = [
                {"column": r["column"], "rule": r["rule"], "config": r.get("config", {})}
                for r in std_entries
            ] if std_entries else None
            standardized_df, sa = execute_standardization_rules(
                df, rules_by_dim["Standardization"],
                merged_cfg.get("std_columns", all_columns),
                date_target_fmt=merged_cfg.get("date_target_fmt", "%Y-%m-%d"),
                null_default=merged_cfg.get("null_default", "N/A"),
                column_rule_map=std_column_rule_map,
            )
            all_annexure.extend(sa)
            dim_scores["Standardization"] = compute_standardization_score(
                df, sa, merged_cfg.get("std_columns", all_columns), rules_by_dim["Standardization"]
            )

        overall = compute_overall_score(dim_scores)
        clean_df = build_clean_dataset(df, standardized_df, dup_records, all_annexure)

        ucfg = {"fuzzy_threshold": merged_cfg.get("fuzzy_threshold", "N/A")}
        if rule_entries:
            ucfg["rule_entries"] = rule_entries
        excel_bytes = generate_excel_report(
            df, clean_df, dup_records, all_annexure,
            dim_scores, overall,
            [d for d in selected_dims if selected_dims[d]],
            ucfg
        )

        sessions[session_id]["dq_results"] = {
            "overall": float(overall),
            "dim_scores": {k: float(v) for k, v in dim_scores.items()},
            "total_records": len(df),
            "excel_bytes": excel_bytes,
        }

        issue_classes = _classify_issues(all_annexure)

        dim_breakdown = []
        annex_df = pd.DataFrame(all_annexure) if all_annexure else pd.DataFrame()
        for dim in dim_scores:
            ddf = annex_df[annex_df["Dimension"] == dim] if not annex_df.empty and "Dimension" in annex_df.columns else pd.DataFrame()
            dim_issues = len(ddf)
            dim_unique = len(set(int(r) for r in ddf["Row_Number"].dropna())) if not ddf.empty and "Row_Number" in ddf.columns else 0
            dim_breakdown.append({
                "dimension": dim,
                "score": float(dim_scores[dim]),
                "total_issues": dim_issues,
                "unique_rows": dim_unique,
            })

        annexure_by_dim = {}
        for dim in dim_scores:
            ddf = annex_df[annex_df["Dimension"] == dim] if not annex_df.empty and "Dimension" in annex_df.columns else pd.DataFrame()
            annexure_by_dim[dim] = ddf.head(500).fillna("").to_dict(orient="records") if not ddf.empty else []

        return jsonify(_serialize_dict({
            "success": True,
            "overall_score": float(overall),
            "dim_scores": {k: float(v) for k, v in dim_scores.items()},
            "total_records": len(df),
            "total_issues": len(all_annexure),
            "duplicate_count": len(dup_records),
            "issue_classes": issue_classes,
            "dim_breakdown": dim_breakdown,
            "annexure_by_dim": annexure_by_dim,
        }))

    except Exception as e:
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500


def _classify_issues(all_annexure):
    categories = {
        "Missing Values": {"count": 0, "rows": set(), "rules": set()},
        "Invalid Format": {"count": 0, "rows": set(), "rules": set()},
        "Domain Violations": {"count": 0, "rows": set(), "rules": set()},
        "Duplicate Records": {"count": 0, "rows": set(), "rules": set()},
        "Non-Standard Values": {"count": 0, "rows": set(), "rules": set()},
    }
    rule_map = {
        "Not Null": "Missing Values", "Not Empty": "Missing Values",
        "Mandatory Column": "Missing Values",
        "Email Format": "Invalid Format", "Phone Format": "Invalid Format",
        "PAN Format": "Invalid Format", "Custom Regex": "Invalid Format",
        "Data Type Validation": "Invalid Format", "Length Check": "Invalid Format",
        "Format Check": "Invalid Format",
        "Numeric Range": "Domain Violations", "Allowed Values": "Domain Violations",
        "Minimum Length": "Domain Violations",
        "Single Column Exact Match": "Duplicate Records",
        "Combination Column Exact Match": "Duplicate Records",
        "Hybrid Fuzzy Match": "Duplicate Records",
        "Convert to Lowercase": "Non-Standard Values",
        "Convert to Uppercase": "Non-Standard Values",
        "Special Characters Not Allowed": "Non-Standard Values",
        "Date Format": "Non-Standard Values",
    }
    for r in all_annexure:
        rule = r.get("Rule", r.get("Check", ""))
        cat = rule_map.get(rule, "Invalid Format")
        try:
            row_id = int(r.get("Row_Number", -1))
        except (ValueError, TypeError):
            row_id = -1
        categories[cat]["count"] += 1
        categories[cat]["rules"].add(rule)
        if row_id >= 0:
            categories[cat]["rows"].add(row_id)

    result = {}
    for cat, data in categories.items():
        if data["count"] == 0:
            continue
        unique_rows = len(data["rows"])
        if unique_rows > 500:
            severity = "HIGH"
        elif unique_rows > 100:
            severity = "MEDIUM"
        else:
            severity = "LOW"
        result[cat] = {
            "count": data["count"],
            "unique_rows": unique_rows,
            "severity": severity,
            "rules": list(data["rules"]),
        }
    return result


# ═══════════════════════════════════════════════════════════════
#  DQ: DOWNLOAD EXCEL REPORT
# ═══════════════════════════════════════════════════════════════
@app.route("/api/dq/download-report", methods=["GET"])
def dq_download_report():
    session_id = request.args.get("session_id", "default")
    if session_id not in sessions or "dq_results" not in sessions.get(session_id, {}):
        return jsonify({"error": "No results available"}), 404

    excel_bytes = sessions[session_id]["dq_results"]["excel_bytes"]
    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    return send_file(
        BytesIO(excel_bytes),
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name=f"DQ_Report_{ts}.xlsx"
    )


# ═══════════════════════════════════════════════════════════════
#  MATURITY: GET QUESTIONS
#  FIX: Send structured question data (id, section, question, weight)
#       so the frontend can render the full grid with sections.
# ═══════════════════════════════════════════════════════════════
@app.route("/api/maturity/questions", methods=["POST"])
def maturity_questions():
    data = request.get_json()
    dims = data.get("dims", list(MATURITY_DIMS))
    objects = data.get("objects", list(DEFAULT_MASTER_OBJECTS))

    questions = {}
    for dim in dims:
        if dim in QUESTION_BANK:
            q_list = QUESTION_BANK[dim]
            # Send full structured question objects to frontend
            questions[dim] = [
                {
                    "id": q["id"],
                    "section": q["section"],
                    "question": q["question"],
                    "weight": q.get("weight", 1),
                }
                for q in q_list
            ]

    return jsonify({
        "questions": questions,
        "rating_labels": RATING_LABELS,
        "dims": dims,
        "objects": objects,
    })


# ═══════════════════════════════════════════════════════════════
#  MATURITY: SUBMIT ASSESSMENT
#  FIX: Properly converts frontend numeric ratings ("1","2",...)
#       to rating label strings ("Adhoc","Repeatable",...) before
#       calling compute_all_scores / validate_responses.
# ═══════════════════════════════════════════════════════════════
@app.route("/api/maturity/submit", methods=["POST"])
def maturity_submit():
    data = request.get_json()
    client_name = data.get("client_name", "")
    dims = data.get("dims", [])
    objects = data.get("objects", [])
    responses_data = data.get("responses", {})
    benchmark = float(data.get("benchmark", 3.0))
    target = float(data.get("target", 3.0))
    low_thr = float(data.get("low_thr", 2.0))
    dq_score = data.get("dq_score")

    if not client_name.strip():
        return jsonify({"error": "Client name is required"}), 400

    try:
        # ── KEY FIX: Convert frontend responses to proper DataFrames ──
        # Frontend sends: { "Data Governance": [ {Question: "...", Customer: "3", ...}, ... ] }
        # Backend needs: DataFrame with columns [Question ID, Section, Question, Weight, Customer, ...]
        #                where object columns contain RATING LABELS ("Adhoc", "Defined", etc.)
        responses = {}
        for dim, rows in responses_data.items():
            responses[dim] = build_question_df_from_frontend(dim, objects, rows)

        # Validate (now all values should be proper rating labels)
        ok, msg = validate_responses(responses, dims, objects)
        if not ok:
            return jsonify({"error": f"Validation failed: {msg}"}), 400

        # Compute scores
        dim_table, overall = compute_all_scores(objects, dims, responses)
        domain_display = {dim: float(np.nanmean(dim_table.loc[dim].values)) for dim in dims}
        # overall is a pd.Series — .values is a numpy array (property, NOT a method)
        exec_score = float(np.nanmean(overall.values)) if len(overall) else 0.0
        if not np.isfinite(exec_score):
            exec_score = 0.0

        # Generate slide PNG
        slide_png = render_slide_png(
            client_name=client_name,
            domain_scores=domain_display,
            exec_score=exec_score,
            benchmark=benchmark,
            target=target
        )

        # Generate PDF
        pdf_detail_tables = {}
        for d_key, d_df in responses.items():
            safe_df = d_df.copy()
            for col in safe_df.columns:
                safe_df[col] = safe_df[col].astype(str).str.slice(0, 120)
            pdf_detail_tables[d_key] = safe_df

        pdf_dim_table = dim_table.copy()
        for col in pdf_dim_table.columns:
            pdf_dim_table[col] = pdf_dim_table[col].apply(lambda v: str(v)[:60] if pd.notna(v) else "")

        pdf_bytes = build_pdf_bytes(
            client_name=client_name,
            slide_png=slide_png,
            dim_table=pdf_dim_table,
            overall=overall.to_dict(),
            detail_tables=pdf_detail_tables,
            dq_score=dq_score
        )

        # Generate Excel
        mat_excel = to_excel_bytes(
            dim_table=dim_table, overall=overall,
            detail_tables=responses, low_thr=low_thr, objects=objects
        )

        slide_b64 = base64.b64encode(slide_png).decode() if slide_png else ""

        # Store for download
        session_id = data.get("session_id", "default")
        if session_id not in sessions:
            sessions[session_id] = {}
        sessions[session_id]["maturity_results"] = {
            "mat_excel": mat_excel,
            "pdf_bytes": pdf_bytes,
        }

        # Prepare dim_table for JSON
        dim_table_json = {}
        for dim in dim_table.index:
            dim_table_json[dim] = {}
            for obj in dim_table.columns:
                val = dim_table.loc[dim, obj]
                dim_table_json[dim][obj] = float(val) if pd.notna(val) else 0.0

        overall_dict = overall.to_dict() if hasattr(overall, 'to_dict') else dict(overall)
        overall_json = {k: float(v) if not (isinstance(v, float) and np.isnan(v)) else 0.0 for k, v in overall_dict.items()}

        return jsonify({
            "success": True,
            "exec_score": exec_score,
            "domain_scores": {k: float(v) for k, v in domain_display.items()},
            "dim_table": dim_table_json,
            "overall": overall_json,
            "slide_png_b64": slide_b64,
            "client_name": client_name,
            "dq_maturity_level": dq_score_to_maturity_level(dq_score) if dq_score else None,
        })

    except Exception as e:
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500


@app.route("/api/maturity/download-excel", methods=["GET"])
def maturity_download_excel():
    session_id = request.args.get("session_id", "default")
    if session_id not in sessions or "maturity_results" not in sessions.get(session_id, {}):
        return jsonify({"error": "No results"}), 404
    excel = sessions[session_id]["maturity_results"]["mat_excel"]
    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    return send_file(BytesIO(excel), mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                     as_attachment=True, download_name=f"Maturity_Report_{ts}.xlsx")


@app.route("/api/maturity/download-pdf", methods=["GET"])
def maturity_download_pdf():
    session_id = request.args.get("session_id", "default")
    if session_id not in sessions or "maturity_results" not in sessions.get(session_id, {}):
        return jsonify({"error": "No results"}), 404
    pdf = sessions[session_id]["maturity_results"]["pdf_bytes"]
    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    return send_file(BytesIO(pdf), mimetype="application/pdf",
                     as_attachment=True, download_name=f"Maturity_Report_{ts}.pdf")


if __name__ == "__main__":
    app.run(
        debug=True,
        port=5000,
        host="0.0.0.0",
        use_reloader=True,
        exclude_patterns=["*tkinter*", "*__pycache__*"],
    )