import uuid
from typing import Any, Dict, List
from app.schemas.analyses import ChartRecommendation

class ChartRecommender:
    @staticmethod
    def recommend(columns_meta: List[Dict[str, Any]]) -> List[ChartRecommendation]:
        recommendations: List[ChartRecommendation] = []
        
        numeric_cols = [c["name"] for c in columns_meta if c.get("general_type") == "numeric"]
        categorical_cols = [c["name"] for c in columns_meta if c.get("general_type") == "categorical"]
        datetime_cols = [c["name"] for c in columns_meta if c.get("general_type") == "datetime"]
        
        # 1. Line Chart for Datetime + Numeric (Trend Analysis)
        if datetime_cols and numeric_cols:
            recommendations.append(ChartRecommendation(
                id=str(uuid.uuid4()),
                chart_type="line",
                title=f"Tren {numeric_cols[0]} Berdasarkan Waktu",
                x_axis=datetime_cols[0],
                y_axis=numeric_cols[0],
                aggregation="sum",
                score=0.95,
                reason=f"Optimal untuk memantau tren historis perkembangan {numeric_cols[0]} sepanjang linimasa {datetime_cols[0]}."
            ))

        # 2. Bar Chart for Categorical + Numeric (Comparison Analysis)
        if categorical_cols and numeric_cols:
            cat_col = categorical_cols[0]
            num_col = numeric_cols[0]
            recommendations.append(ChartRecommendation(
                id=str(uuid.uuid4()),
                chart_type="bar",
                title=f"Total {num_col} berdasarkan {cat_col}",
                x_axis=cat_col,
                y_axis=num_col,
                aggregation="sum",
                score=0.92,
                reason=f"Sangat ideal untuk membandingkan akumulasi {num_col} antar domain kategori {cat_col}."
            ))

        # 3. Pie/Donut Chart for low-cardinality Categorical + Numeric (Composition)
        for cat in categorical_cols:
            meta = next((c for c in columns_meta if c["name"] == cat), None)
            if meta and 2 <= meta.get("unique_count", 0) <= 7 and numeric_cols:
                recommendations.append(ChartRecommendation(
                    id=str(uuid.uuid4()),
                    chart_type="donut",
                    title=f"Proporsi Komposisi {numeric_cols[0]} per {cat}",
                    x_axis=cat,
                    y_axis=numeric_cols[0],
                    aggregation="sum",
                    score=0.88,
                    reason=f"Tepat untuk menampilkan persentase distribusi dari masing-masing segmen {cat} ({meta.get('unique_count')} bagian unik)."
                ))
                break

        # 4. Scatter Plot for 2 Numeric columns (Correlation Analysis)
        if len(numeric_cols) >= 2:
            recommendations.append(ChartRecommendation(
                id=str(uuid.uuid4()),
                chart_type="scatter",
                title=f"Korelasi Nilai {numeric_cols[0]} vs {numeric_cols[1]}",
                x_axis=numeric_cols[0],
                y_axis=numeric_cols[1],
                aggregation="none",
                score=0.84,
                reason=f"Menganalisis hubungan korelasi statistik, sebaran klaster, dan titik anomali antara {numeric_cols[0]} dan {numeric_cols[1]}."
            ))

        # 5. Histogram for Numeric distribution
        if numeric_cols:
            recommendations.append(ChartRecommendation(
                id=str(uuid.uuid4()),
                chart_type="histogram",
                title=f"Distribusi Frekuensi Rentang {numeric_cols[0]}",
                x_axis=numeric_cols[0],
                y_axis=None,
                aggregation="count",
                score=0.80,
                reason=f"Menampilkan densitas frekuensi, varians rentang nilai, dan pola persebaran {numeric_cols[0]}."
            ))

        # 6. Fallback Table View
        first_col = columns_meta[0]["name"] if columns_meta else "Index"
        recommendations.append(ChartRecommendation(
            id=str(uuid.uuid4()),
            chart_type="table",
            title="Ringkasan Data Tabel Spreadsheet",
            x_axis=first_col,
            y_axis=None,
            aggregation=None,
            score=0.70,
            reason="Tinjauan tabulasi matriks data terstruktur untuk pengecekan detail baris dan kolom."
        ))

        # Sort recommendations by heuristic score descending
        recommendations.sort(key=lambda r: r.score, reverse=True)
        return recommendations

chart_recommender = ChartRecommender()
