from typing import Any, Dict, List, Optional
from pydantic import BaseModel

class ColumnMetadata(BaseModel):
    name: str
    dtype: str
    general_type: str # 'numeric', 'categorical', 'datetime', 'boolean', 'text'
    null_count: int
    null_percentage: float
    unique_count: int
    sample_values: List[Any]

class QualitySummary(BaseModel):
    total_cells: int
    missing_cells: int
    missing_percentage: float
    duplicate_rows: int
    duplicate_percentage: float
    completeness_score: float # 0 to 100
    quality_grade: str # 'Excellent', 'Good', 'Fair', 'Poor'

class NumericStat(BaseModel):
    count: int
    mean: Optional[float] = None
    median: Optional[float] = None
    min: Optional[float] = None
    max: Optional[float] = None
    sum: Optional[float] = None
    std: Optional[float] = None

class CategoricalStat(BaseModel):
    count: int
    unique_count: int
    top_categories: List[Dict[str, Any]]

class ChartRecommendation(BaseModel):
    id: str
    chart_type: str # 'bar', 'line', 'pie', 'donut', 'scatter', 'histogram', 'stacked_bar', 'table'
    title: str
    x_axis: str
    y_axis: Optional[str] = None
    aggregation: Optional[str] = "sum" # 'sum', 'avg', 'count', 'min', 'max'
    score: float
    reason: str

class AnalysisCreateRequest(BaseModel):
    file_id: str
    sheet_name: str

class AnalysisResponse(BaseModel):
    id: str
    file_id: str
    user_id: str
    sheet_name: str
    row_count: int
    column_count: int
    columns_metadata: List[ColumnMetadata]
    quality_summary: QualitySummary
    statistical_summary: Dict[str, Any]
    recommendations: List[ChartRecommendation]
    created_at: Optional[str] = None

class ComputeChartRequest(BaseModel):
    chart_type: str
    x_axis: str
    y_axis: Optional[str] = None
    aggregation: Optional[str] = "sum" # 'sum', 'avg', 'count', 'min', 'max'
    filters: Optional[Dict[str, Any]] = None
    sort_order: Optional[str] = "desc" # 'asc', 'desc', 'none'
    top_n: Optional[int] = 10

class ComputeChartResponse(BaseModel):
    chart_type: str
    x_axis: str
    y_axis: Optional[str] = None
    aggregation: Optional[str] = "sum"
    chart_data: List[Dict[str, Any]]
    total_points: int
