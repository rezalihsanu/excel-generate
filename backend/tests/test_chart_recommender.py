from app.services.chart_recommender import chart_recommender

def test_chart_recommendations():
    columns_meta = [
        {"name": "Date", "general_type": "datetime", "unique_count": 30},
        {"name": "Category", "general_type": "categorical", "unique_count": 4},
        {"name": "Revenue", "general_type": "numeric", "unique_count": 100},
        {"name": "Profit", "general_type": "numeric", "unique_count": 95},
    ]

    recs = chart_recommender.recommend(columns_meta)
    assert len(recs) >= 3

    types = [r.chart_type for r in recs]
    assert "line" in types  # Date + Revenue
    assert "bar" in types   # Category + Revenue
    assert "donut" in types # Category with 4 unique items
    assert "scatter" in types # Revenue vs Profit
