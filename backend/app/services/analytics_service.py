import math
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd
from app.schemas.analyses import (
    ColumnMetadata,
    QualitySummary,
    ComputeChartRequest,
    ComputeChartResponse,
)

class AnalyticsService:
    @staticmethod
    def _infer_type(series: pd.Series) -> str:
        if pd.api.types.is_numeric_dtype(series) and not pd.api.types.is_bool_dtype(series):
            return "numeric"
        if pd.api.types.is_datetime64_any_dtype(series):
            return "datetime"
        if pd.api.types.is_bool_dtype(series):
            return "boolean"
        
        # Try converting string to datetime if consistent
        non_null = series.dropna()
        if len(non_null) > 0 and len(non_null) <= 500:
            try:
                pd.to_datetime(non_null.iloc[:20], format="mixed", errors="raise")
                return "datetime"
            except Exception:
                pass
            
        unique_cnt = series.nunique()
        if unique_cnt <= 30 or (len(series) > 0 and (unique_cnt / len(series)) < 0.2):
            return "categorical"
            
        return "text"

    @classmethod
    def analyze_dataframe(cls, df: pd.DataFrame) -> Dict[str, Any]:
        row_count, col_count = df.shape
        total_cells = row_count * col_count if col_count > 0 else 0
        
        if row_count == 0 or col_count == 0:
            return {
                "row_count": 0,
                "column_count": 0,
                "columns_metadata": [],
                "quality_summary": {
                    "total_cells": 0,
                    "missing_cells": 0,
                    "missing_percentage": 0.0,
                    "duplicate_rows": 0,
                    "duplicate_percentage": 0.0,
                    "completeness_score": 100.0,
                    "quality_grade": "Fair"
                },
                "statistical_summary": {},
            }

        missing_cells = int(df.isna().sum().sum())
        missing_pct = round((missing_cells / total_cells) * 100, 2) if total_cells > 0 else 0.0
        
        dupe_rows = int(df.duplicated().sum())
        dupe_pct = round((dupe_rows / row_count) * 100, 2) if row_count > 0 else 0.0
        
        completeness = max(0.0, min(100.0, round(100.0 - missing_pct, 2)))
        if completeness >= 95.0:
            grade = "Excellent"
        elif completeness >= 85.0:
            grade = "Good"
        elif completeness >= 70.0:
            grade = "Fair"
        else:
            grade = "Poor"

        quality_summary = {
            "total_cells": total_cells,
            "missing_cells": missing_cells,
            "missing_percentage": missing_pct,
            "duplicate_rows": dupe_rows,
            "duplicate_percentage": dupe_pct,
            "completeness_score": completeness,
            "quality_grade": grade,
        }

        columns_meta: List[Dict[str, Any]] = []
        statistical_summary: Dict[str, Any] = {}

        for col in df.columns:
            s = df[col]
            inferred_type = cls._infer_type(s)
            null_cnt = int(s.isna().sum())
            null_pct = round((null_cnt / row_count) * 100, 2)
            unique_cnt = int(s.nunique())
            
            sample_vals = [
                x if not (pd.isna(x) or (isinstance(x, float) and (math.isnan(x) or math.isinf(x)))) else None
                for x in s.dropna().unique()[:5].tolist()
            ]

            meta = {
                "name": str(col),
                "dtype": str(s.dtype),
                "general_type": inferred_type,
                "null_count": null_cnt,
                "null_percentage": null_pct,
                "unique_count": unique_cnt,
                "sample_values": sample_vals
            }
            columns_meta.append(meta)

            if inferred_type == "numeric":
                num_s = pd.to_numeric(s, errors="coerce").dropna()
                if not num_s.empty:
                    mean_val = float(num_s.mean())
                    median_val = float(num_s.median())
                    min_val = float(num_s.min())
                    max_val = float(num_s.max())
                    sum_val = float(num_s.sum())
                    std_val = float(num_s.std()) if len(num_s) > 1 else 0.0

                    statistical_summary[str(col)] = {
                        "type": "numeric",
                        "count": len(num_s),
                        "mean": round(mean_val, 2) if not math.isnan(mean_val) else None,
                        "median": round(median_val, 2) if not math.isnan(median_val) else None,
                        "min": round(min_val, 2) if not math.isnan(min_val) else None,
                        "max": round(max_val, 2) if not math.isnan(max_val) else None,
                        "sum": round(sum_val, 2) if not math.isnan(sum_val) else None,
                        "std": round(std_val, 2) if not math.isnan(std_val) else None,
                    }
            else:
                top_counts = s.value_counts().head(5).to_dict()
                top_items = [{"category": str(k), "count": int(v)} for k, v in top_counts.items()]
                statistical_summary[str(col)] = {
                    "type": "categorical",
                    "count": int(s.count()),
                    "unique_count": unique_cnt,
                    "top_categories": top_items,
                }

        return {
            "row_count": row_count,
            "column_count": col_count,
            "columns_metadata": columns_meta,
            "quality_summary": quality_summary,
            "statistical_summary": statistical_summary,
        }

    @classmethod
    def compute_chart(cls, df: pd.DataFrame, req: ComputeChartRequest) -> ComputeChartResponse:
        filtered_df = df.copy()

        # Apply basic filters if provided
        if req.filters:
            for k, v in req.filters.items():
                if k in filtered_df.columns and v is not None:
                    if isinstance(v, list) and len(v) > 0:
                        filtered_df = filtered_df[filtered_df[k].isin(v)]
                    elif isinstance(v, (str, int, float, bool)):
                        filtered_df = filtered_df[filtered_df[k] == v]

        x_col = req.x_axis
        y_col = req.y_axis
        chart_type = req.chart_type.lower()
        agg = (req.aggregation or "sum").lower()
        top_n = req.top_n or 10

        if x_col not in filtered_df.columns:
            raise ValueError(f"X-Axis column '{x_col}' does not exist in dataframe")

        chart_data: List[Dict[str, Any]] = []

        if chart_type in ["bar", "pie", "donut", "stacked_bar"]:
            if y_col and y_col in filtered_df.columns:
                # Group by X and aggregate Y
                numeric_y = pd.to_numeric(filtered_df[y_col], errors="coerce")
                temp_df = pd.DataFrame({"x": filtered_df[x_col], "y": numeric_y}).dropna()

                if agg == "avg" or agg == "mean":
                    grouped = temp_df.groupby("x")["y"].mean().reset_index()
                elif agg == "count":
                    grouped = temp_df.groupby("x")["y"].count().reset_index()
                elif agg == "min":
                    grouped = temp_df.groupby("x")["y"].min().reset_index()
                elif agg == "max":
                    grouped = temp_df.groupby("x")["y"].max().reset_index()
                else: # sum
                    grouped = temp_df.groupby("x")["y"].sum().reset_index()
                
                # Sorting
                if req.sort_order == "asc":
                    grouped = grouped.sort_values(by="y", ascending=True)
                elif req.sort_order == "desc":
                    grouped = grouped.sort_values(by="y", ascending=False)

                if top_n and top_n > 0:
                    grouped = grouped.head(top_n)

                for _, row in grouped.iterrows():
                    val = row["y"]
                    val_clean = round(float(val), 2) if not math.isnan(val) else 0.0
                    chart_data.append({
                        "name": str(row["x"]),
                        "value": val_clean,
                        req.y_axis: val_clean
                    })
            else:
                # Frequency count of X
                val_counts = filtered_df[x_col].value_counts()
                if req.sort_order == "asc":
                    val_counts = val_counts.sort_values(ascending=True)
                elif req.sort_order == "desc":
                    val_counts = val_counts.sort_values(ascending=False)

                if top_n and top_n > 0:
                    val_counts = val_counts.head(top_n)

                for cat, cnt in val_counts.items():
                    chart_data.append({"name": str(cat), "value": int(cnt), "count": int(cnt)})

        elif chart_type == "line":
            if y_col and y_col in filtered_df.columns:
                numeric_y = pd.to_numeric(filtered_df[y_col], errors="coerce")
                temp_df = pd.DataFrame({"x": filtered_df[x_col], "y": numeric_y}).dropna()
                
                # Try sorting by date or X
                try:
                    temp_df["parsed_x"] = pd.to_datetime(temp_df["x"], format="mixed", errors="coerce")
                    temp_df = temp_df.sort_values(by="parsed_x")
                except Exception:
                    temp_df = temp_df.sort_values(by="x")

                if agg == "avg" or agg == "mean":
                    grouped = temp_df.groupby("x", sort=False)["y"].mean().reset_index()
                else:
                    grouped = temp_df.groupby("x", sort=False)["y"].sum().reset_index()

                if top_n and top_n > 0:
                    grouped = grouped.head(top_n)

                for _, row in grouped.iterrows():
                    val = float(row["y"]) if not math.isnan(row["y"]) else 0.0
                    chart_data.append({"name": str(row["x"]), "value": round(val, 2), req.y_axis: round(val, 2)})
            else:
                val_counts = filtered_df[x_col].value_counts().head(top_n)
                for cat, cnt in val_counts.items():
                    chart_data.append({"name": str(cat), "value": int(cnt)})

        elif chart_type == "scatter":
            if not y_col or y_col not in filtered_df.columns:
                raise ValueError("Scatter plot requires both X and Y axis columns")
            numeric_x = pd.to_numeric(filtered_df[x_col], errors="coerce")
            numeric_y = pd.to_numeric(filtered_df[y_col], errors="coerce")
            temp_df = pd.DataFrame({"x": numeric_x, "y": numeric_y}).dropna().head(top_n or 500)
            for _, row in temp_df.iterrows():
                chart_data.append({
                    "x": round(float(row["x"]), 2),
                    "y": round(float(row["y"]), 2),
                    "name": f"({round(float(row['x']), 2)}, {round(float(row['y']), 2)})"
                })

        elif chart_type == "histogram":
            target_col = y_col if (y_col and y_col in filtered_df.columns) else x_col
            num_series = pd.to_numeric(filtered_df[target_col], errors="coerce").dropna()
            if not num_series.empty:
                counts, bin_edges = np.histogram(num_series, bins=min(10, max(3, len(num_series) // 5)))
                for i in range(len(counts)):
                    bin_label = f"{round(bin_edges[i], 1)} - {round(bin_edges[i+1], 1)}"
                    chart_data.append({"name": bin_label, "value": int(counts[i]), "count": int(counts[i])})

        elif chart_type == "table":
            sub_df = filtered_df.head(top_n or 20)
            for _, row in sub_df.iterrows():
                chart_data.append({str(col): cls._sanitize_table_cell(row[col]) for col in filtered_df.columns})

        return ComputeChartResponse(
            chart_type=req.chart_type,
            x_axis=x_col,
            y_axis=y_col,
            aggregation=req.aggregation,
            chart_data=chart_data,
            total_points=len(chart_data)
        )

    @staticmethod
    def _sanitize_table_cell(val: Any) -> Any:
        if pd.isna(val) or val is None:
            return ""
        if isinstance(val, (int, float)):
            if math.isnan(val) or math.isinf(val):
                return ""
            return round(val, 2)
        return str(val)

analytics_service = AnalyticsService()
