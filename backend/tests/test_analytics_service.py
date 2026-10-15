import pandas as pd
import pytest
from app.schemas.analyses import ComputeChartRequest
from app.services.analytics_service import analytics_service

@pytest.fixture
def sample_df():
    return pd.DataFrame({
        "Category": ["Electronics", "Furniture", "Office", "Electronics", "Furniture"],
        "Revenue": [12000.0, 8500.0, 3200.0, 9800.0, 4100.0],
        "Units": [10, 5, 20, 8, 4],
        "Date": ["2026-01-01", "2026-01-02", "2026-01-03", "2026-01-04", "2026-01-05"]
    })

def test_analyze_dataframe(sample_df):
    res = analytics_service.analyze_dataframe(sample_df)
    assert res["row_count"] == 5
    assert res["column_count"] == 4
    assert res["quality_summary"]["completeness_score"] == 100.0
    assert res["quality_summary"]["missing_cells"] == 0

    rev_stats = res["statistical_summary"]["Revenue"]
    assert rev_stats["type"] == "numeric"
    assert rev_stats["sum"] == 37600.0
    assert rev_stats["count"] == 5
    assert rev_stats["min"] == 3200.0
    assert rev_stats["max"] == 12000.0

def test_compute_chart_bar_aggregation(sample_df):
    req = ComputeChartRequest(
        chart_type="bar",
        x_axis="Category",
        y_axis="Revenue",
        aggregation="sum",
        top_n=5
    )
    chart = analytics_service.compute_chart(sample_df, req)
    assert chart.chart_type == "bar"
    assert len(chart.chart_data) == 3
    # Electronics total: 12000 + 9800 = 21800
    electronics = next(item for item in chart.chart_data if item["name"] == "Electronics")
    assert electronics["value"] == 21800.0

def test_compute_chart_line(sample_df):
    req = ComputeChartRequest(
        chart_type="line",
        x_axis="Date",
        y_axis="Revenue",
        aggregation="sum"
    )
    chart = analytics_service.compute_chart(sample_df, req)
    assert chart.chart_type == "line"
    assert len(chart.chart_data) == 5
