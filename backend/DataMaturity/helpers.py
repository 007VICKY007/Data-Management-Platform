"""
DataMaturity/helpers.py
========================
Flask-compatible — NO Streamlit dependency.

KEY CHANGE — Per-Dimension Master Objects
==========================================
compute_all_scores() now accepts objects_per_dim: {dim: [objects]}
so each Knowledge Area can have its own set of Master Data Objects.
The overall score is computed across the union of all objects.
"""

import numpy as np
import pandas as pd
from io import BytesIO

from DataMaturity.config import (
    RATING_LABELS, RATING_TO_SCORE, DQ_MATURITY_MAP,
    DEFAULT_MASTER_OBJECTS, MATURITY_DIMS, QUESTION_BANK,
)

MATURITY_COLOR_MAP = {
    "Adhoc":      "64748b",
    "Repeatable": "b45309",
    "Defined":    "1d4ed8",
    "Managed":    "5b2d90",
    "Optimised":  "0f766e",
}

SCORE_TO_RATING = {v: k for k, v in RATING_TO_SCORE.items()}
SCORE_TO_RATING.update({str(v): k for k, v in RATING_TO_SCORE.items()})


def dq_score_to_maturity_level(dq_score: float) -> str:
    for threshold, level in DQ_MATURITY_MAP:
        if dq_score >= threshold:
            return level
    return "Adhoc"


def init_maturity_state() -> None:    pass
def sync_response_tables() -> None:   pass
def autofill_dq_dimension(_) -> None: pass


def _coerce_rating(raw_val) -> str:
    if raw_val is None or raw_val == "":
        return RATING_LABELS[0]
    if raw_val in RATING_LABELS:
        return raw_val
    if raw_val in SCORE_TO_RATING:
        return SCORE_TO_RATING[raw_val]
    try:
        num = int(float(str(raw_val)))
        if 1 <= num <= 5:
            return RATING_LABELS[num - 1]
    except (ValueError, TypeError):
        pass
    return RATING_LABELS[0]


def build_question_df(dimension: str, objects: list) -> pd.DataFrame:
    qs = QUESTION_BANK.get(dimension, [])
    df = pd.DataFrame({
        "Question ID": [q["id"]           for q in qs],
        "Section":     [q["section"]       for q in qs],
        "Question":    [q["question"]      for q in qs],
        "Weight":      [q.get("weight", 1) for q in qs],
    })
    for obj in objects:
        df[obj] = RATING_LABELS[0]
    return df


def build_question_df_from_frontend(
    dimension: str,
    objects: list,
    response_rows: list,
) -> pd.DataFrame:
    rows = []
    for fr in response_rows:
        q_id     = str(fr.get("Question ID", "") or "").strip()
        section  = str(fr.get("Section",     "") or "").strip() or "Custom"
        question = str(fr.get("Question",    "") or "").strip()
        if not q_id and not question:
            continue
        try:
            weight = float(fr.get("Weight") or 1)
        except (ValueError, TypeError):
            weight = 1.0
        row = {
            "Question ID": q_id,
            "Section":     section,
            "Question":    question,
            "Weight":      weight,
        }
        for obj in objects:
            row[obj] = _coerce_rating(fr.get(obj, ""))
        rows.append(row)

    if not rows:
        cols = ["Question ID", "Section", "Question", "Weight"] + list(objects)
        return pd.DataFrame(columns=cols)
    return pd.DataFrame(rows)


def compute_weighted_scores(df: pd.DataFrame, objects: list) -> pd.DataFrame:
    s = df.copy()
    for obj in objects:
        if obj in s.columns:
            s[obj] = s[obj].map(RATING_TO_SCORE).astype(float)
    return s


def _dim_score_series(dim: str, df: pd.DataFrame, objects: list) -> pd.Series:
    """Weighted average score per object for one dimension.
    Only scores objects that actually have columns in the dataframe."""
    s = compute_weighted_scores(df, objects)
    w = s["Weight"].astype(float).values
    row = {}
    for obj in objects:
        if obj in s.columns:
            vals = s[obj].astype(float).values
            mask = np.isfinite(vals) & np.isfinite(w) & (w > 0)
            row[obj] = float(np.average(vals[mask], weights=w[mask])) if mask.sum() > 0 else np.nan
        else:
            row[obj] = np.nan
    return pd.Series(row, name=dim)


def compute_all_scores(
    objects: list,
    dims: list,
    responses: dict,
    objects_per_dim: dict = None,
) -> tuple:
    """
    Compute all maturity scores.

    Parameters
    ----------
    objects : list
        Union of all objects across dimensions (used for overall aggregation).
    dims : list
        Active dimension names.
    responses : {dim_name: DataFrame}
    objects_per_dim : {dim_name: [objects]} or None
        Per-dimension object lists. If None, falls back to `objects` for all dims.

    Returns
    -------
    dim_table : pd.DataFrame   rows=dims, cols=all_objects, values=weighted-avg 1-5
    overall   : pd.Series      mean across dims per object (NaN-aware)
    """
    dim_rows = []
    for dim in dims:
        dim_objects = (objects_per_dim or {}).get(dim, objects)
        series = _dim_score_series(dim, responses[dim], dim_objects)
        dim_rows.append(series)

    dim_table = pd.DataFrame(dim_rows)
    # Overall = mean across dimensions, ignoring NaN (dims that don't have that object)
    overall = dim_table.mean(axis=0, numeric_only=True)
    overall.name = "Overall"
    return dim_table, overall


def validate_responses(responses: dict, dims: list, objects: list,
                       objects_per_dim: dict = None) -> tuple:
    for dim in dims:
        if dim not in responses:
            return False, f"Missing dimension '{dim}' in responses."
        df = responses[dim]
        dim_objects = (objects_per_dim or {}).get(dim, objects)
        for obj in dim_objects:
            if obj not in df.columns:
                return False, f"Missing column '{obj}' in dimension '{dim}'."
            bad = df[obj][~df[obj].isin(RATING_LABELS)]
            if len(bad):
                return False, f"Invalid rating values in {dim} / {obj}: {bad.tolist()[:3]}"
    return True, ""


def safe_float(v) -> float:
    try:
        return float(v)
    except Exception:
        return np.nan


def safe_rating(v, default: int = 0) -> int:
    fv = safe_float(v)
    return int(np.clip(round(fv), 0, 5)) if np.isfinite(fv) else default


def to_excel_bytes(
    dim_table:     pd.DataFrame,
    overall:       pd.Series,
    detail_tables: dict,
    low_thr:       float = 2.0,
    objects:       list  = None,
    objects_per_dim: dict = None,
) -> bytes:
    objects = objects or list(overall.index)
    out = BytesIO()

    with pd.ExcelWriter(out, engine="openpyxl") as writer:
        dim_table.to_excel(writer, sheet_name="Summary - Dimension Scores")
        pd.DataFrame(overall).to_excel(writer, sheet_name="Summary - Overall Scores")

        for dim, df in detail_tables.items():
            d = df.copy()
            d.insert(0, "Dimension", dim)
            d.to_excel(writer, sheet_name=f"Detail - {dim[:20]}", index=False)

        for dim, df in detail_tables.items():
            dim_objects = (objects_per_dim or {}).get(dim, objects)
            s = compute_weighted_scores(df, dim_objects)
            existing_objects = [obj for obj in dim_objects if obj in s.columns]
            for obj in existing_objects:
                exc = s[s[obj] <= low_thr][
                    ["Question ID", "Section", "Question", "Weight", obj]
                ].copy()
                if len(exc) > 0:
                    sheet_name = f"Exc-{obj[:10]}-{dim[:8]}"[:31]
                    exc.to_excel(writer, sheet_name=sheet_name, index=False)

    return out.getvalue()