"""
DataMaturity/report_generator.py
==================================
KEY CHANGE — Per-Dimension Objects in PDF
==========================================
build_pdf_bytes now accepts objects_per_dim: {dim: [objects]}.
Each detail table section renders only the objects assigned to
that dimension, not the global union.
"""

from io import BytesIO
from datetime import datetime

import pandas as pd

from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


_PDF_FONT      = "Helvetica"
_PDF_FONT_BOLD = "Helvetica-Bold"

def _try_register_aptos():
    import os, glob
    global _PDF_FONT, _PDF_FONT_BOLD
    search_dirs = [
        "/usr/share/fonts", "/usr/local/share/fonts",
        os.path.expanduser("~/.fonts"),
        "C:/Windows/Fonts", "/Library/Fonts", "/System/Library/Fonts",
    ]
    candidates = []
    for d in search_dirs:
        candidates.extend(glob.glob(os.path.join(d, "**", "Aptos*.ttf"), recursive=True))
        candidates.extend(glob.glob(os.path.join(d, "**", "aptos*.ttf"), recursive=True))
    if candidates:
        try:
            regular = next((c for c in candidates if "bold" not in c.lower()), candidates[0])
            bold    = next((c for c in candidates if "bold"     in c.lower()), regular)
            pdfmetrics.registerFont(TTFont("Aptos",      regular))
            pdfmetrics.registerFont(TTFont("Aptos-Bold", bold))
            _PDF_FONT      = "Aptos"
            _PDF_FONT_BOLD = "Aptos-Bold"
        except Exception:
            pass

_try_register_aptos()


_PURPLE  = colors.HexColor("#5b2d90")
_MAGENTA = colors.HexColor("#b10f74")
_LIGHT   = colors.HexColor("#ede8f7")
_WHITE   = colors.white
_DARK    = colors.HexColor("#1a1a2e")


def _get_styles() -> dict:
    custom = {
        "Title": ParagraphStyle(
            "CustomTitle",
            fontName=_PDF_FONT_BOLD, fontSize=22,
            textColor=_PURPLE, spaceAfter=10, alignment=TA_CENTER,
        ),
        "Heading1": ParagraphStyle(
            "CustomH1",
            fontName=_PDF_FONT_BOLD, fontSize=15,
            textColor=_PURPLE, spaceBefore=14, spaceAfter=6,
        ),
        "Heading2": ParagraphStyle(
            "CustomH2",
            fontName=_PDF_FONT_BOLD, fontSize=12,
            textColor=_DARK, spaceBefore=8, spaceAfter=4,
        ),
        "Normal": ParagraphStyle(
            "CustomNormal",
            fontName=_PDF_FONT, fontSize=10,
            textColor=_DARK, spaceAfter=4,
        ),
        "Caption": ParagraphStyle(
            "CustomCaption",
            fontName=_PDF_FONT, fontSize=8,
            textColor=colors.HexColor("#6b7280"), spaceAfter=2,
            alignment=TA_CENTER,
        ),
    }
    return custom


def _header_table_style() -> TableStyle:
    return TableStyle([
        ("BACKGROUND",     (0, 0), (-1,  0), _PURPLE),
        ("TEXTCOLOR",      (0, 0), (-1,  0), _WHITE),
        ("FONTNAME",       (0, 0), (-1,  0), _PDF_FONT_BOLD),
        ("FONTSIZE",       (0, 0), (-1,  0), 10),
        ("FONTNAME",       (0, 1), (-1, -1), _PDF_FONT),
        ("FONTSIZE",       (0, 1), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [_WHITE, _LIGHT]),
        ("GRID",           (0, 0), (-1, -1), 0.3, colors.HexColor("#d9cef0")),
        ("ALIGN",          (0, 0), (-1, -1), "CENTER"),
        ("VALIGN",         (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",     (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING",  (0, 0), (-1, -1), 5),
    ])


def build_pdf_bytes(
    client_name:     str,
    slide_png:       bytes,
    dim_table:       pd.DataFrame,
    overall:         pd.Series,
    detail_tables:   dict,
    dq_score:        float = None,
    objects_per_dim: dict  = None,
) -> bytes:
    """
    Build the complete PDF report.

    objects_per_dim : {dim_name: [objects]}
        If provided, each detail section only shows that dimension's objects.
        If None, all columns in the detail DataFrame are shown (legacy behavior).
    """
    buffer = BytesIO()
    styles = _get_styles()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        leftMargin=40, rightMargin=40, topMargin=40, bottomMargin=30,
    )
    story = []

    # ── Title Page
    story.append(Paragraph("Data Maturity Assessment Report", styles["Title"]))
    story.append(Spacer(1, 6))
    story.append(Paragraph(f"Client: <b>{client_name}</b>", styles["Heading2"]))
    story.append(Paragraph(
        f"Generated on: {datetime.now().strftime('%d %b %Y, %H:%M')}",
        styles["Normal"],
    ))
    story.append(Spacer(1, 18))

    # ── Summary Slide Image
    story.append(Image(BytesIO(slide_png), width=720, height=405))
    story.append(PageBreak())

    # ── DQ Linkage
    if dq_score is not None:
        story.append(Paragraph("DQ Engine Linkage", styles["Heading1"]))
        dq_data = [
            ["Metric",           "Value"],
            ["DQ Overall Score", f"{dq_score:.2f}%"],
            ["Mapping Note",     "Mapped via DQ → Maturity Model"],
        ]
        t = Table(dq_data, colWidths=[300, 300])
        t.setStyle(_header_table_style())
        story.append(t)
        story.append(PageBreak())

    # ── Dimension Summary
    story.append(Paragraph("Dimension-wise Maturity Scores", styles["Heading1"]))
    dim_df       = dim_table.reset_index()
    dim_cols     = list(dim_df.columns)
    num_dim_cols = len(dim_cols)

    _dc = ParagraphStyle("DimCell",    fontName=_PDF_FONT,      fontSize=8, textColor=_DARK,  leading=10)
    _dh = ParagraphStyle("DimCellHdr", fontName=_PDF_FONT_BOLD, fontSize=8, textColor=_WHITE, leading=10)

    dim_col_widths = [180] + [
        max(60, (760 - 180) / max(num_dim_cols - 1, 1))
    ] * (num_dim_cols - 1)

    dim_data = [
        [Paragraph(str(c), _dh) for c in dim_cols]
    ] + [
        [Paragraph(f"{v:.2f}" if isinstance(v, float) else str(v), _dc) for v in row]
        for row in dim_df.values.tolist()
    ]
    t = Table(dim_data, repeatRows=1, colWidths=dim_col_widths)
    t.setStyle(_header_table_style())
    story.append(t)
    story.append(Spacer(1, 18))

    # ── Overall Scores
    story.append(Paragraph("Overall Maturity Scores", styles["Heading1"]))
    if isinstance(overall, dict):
        overall = pd.Series(overall, name="Overall")
    ov_df = pd.DataFrame({
        "Master Data Object": list(overall.index),
        "Score":              list(overall.values),
    })
    ov_data = [list(ov_df.columns)] + [
        [str(v) if not isinstance(v, float) else f"{v:.2f}" for v in row]
        for row in ov_df.values.tolist()
    ]
    t = Table(ov_data, repeatRows=1)
    t.setStyle(_header_table_style())
    story.append(t)
    story.append(PageBreak())

    # ── Detail Tables — one per dimension, with per-dim objects
    _cs = ParagraphStyle("CellStyle",     fontName=_PDF_FONT,      fontSize=7.5, textColor=_DARK,  leading=9)
    _cb = ParagraphStyle("CellStyleBold", fontName=_PDF_FONT_BOLD, fontSize=7.5, textColor=_WHITE, leading=9)

    for dim, df in detail_tables.items():
        story.append(Paragraph(f"Detailed Responses – {dim}", styles["Heading1"]))

        # If objects_per_dim provided, show only that dim's objects + fixed cols
        fixed_cols_ordered = ["Question ID", "Section", "Question", "Weight"]
        if objects_per_dim and dim in objects_per_dim:
            dim_objects = objects_per_dim[dim]
            cols_show = [c for c in fixed_cols_ordered if c in df.columns] + \
                        [c for c in dim_objects if c in df.columns]
        else:
            cols_show = list(df.columns)

        fixed_cols_set = {"Question ID", "Section", "Question", "Weight"}
        obj_cols   = [c for c in cols_show if c not in fixed_cols_set]
        num_obj    = len(obj_cols)

        total_w    = 760
        fixed_used = 48 + 80 + 200 + 35
        obj_w      = max(50, (total_w - fixed_used) / max(num_obj, 1))

        col_widths = []
        for c in cols_show:
            if   c == "Question ID": col_widths.append(48)
            elif c == "Section":     col_widths.append(80)
            elif c == "Question":    col_widths.append(200)
            elif c == "Weight":      col_widths.append(35)
            else:                    col_widths.append(obj_w)

        header_row = [Paragraph(str(c), _cb) for c in cols_show]
        data_rows = [
            [Paragraph(str(row[c]) if c in row.index else "—", _cs) for c in cols_show]
            for _, row in df.iterrows()
        ]

        data = [header_row] + data_rows
        t    = Table(data, repeatRows=1, colWidths=col_widths)
        t.setStyle(_header_table_style())
        story.append(t)
        story.append(PageBreak())

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes