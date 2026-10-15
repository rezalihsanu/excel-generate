import io
from app.services.report_service import report_service

def test_generate_pdf_report():
    report_meta = {
        "title": "Quarterly Operations Report",
        "executive_summary": "Strong operational metrics observed across all departments.",
        "selected_charts": [
            {
                "title": "Revenue by Department",
                "chart_type": "bar",
                "x_axis": "Department",
                "y_axis": "Revenue",
                "chart_data": [
                    {"name": "Patrol", "value": 45000},
                    {"name": "Investigation", "value": 62000},
                    {"name": "Traffic", "value": 38000}
                ]
            }
        ],
        "key_findings": [
            "Investigation division recorded highest allocation.",
            "All divisions achieved target benchmarks."
        ]
    }

    analysis_data = {
        "sheet_name": "Operations_Q3",
        "row_count": 1200,
        "column_count": 8,
        "quality_summary": {
            "completeness_score": 98.5,
            "duplicate_rows": 0,
            "missing_cells": 18,
            "quality_grade": "Excellent"
        }
    }

    buf = io.BytesIO()
    report_service.generate_pdf_report(report_meta, analysis_data, buf)
    pdf_bytes = buf.getvalue()

    # Valid PDF always starts with %PDF-
    assert len(pdf_bytes) > 1000
    assert pdf_bytes.startswith(b"%PDF-")
