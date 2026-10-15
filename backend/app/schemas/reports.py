from typing import Any, Dict, List, Optional
from pydantic import BaseModel

class SelectedChartItem(BaseModel):
    title: str
    chart_type: str
    x_axis: str
    y_axis: Optional[str] = None
    aggregation: Optional[str] = "sum"
    chart_data: Optional[List[Dict[str, Any]]] = None
    insight: Optional[str] = None

class ReportCreateRequest(BaseModel):
    analysis_id: str
    title: str
    description: Optional[str] = ""
    executive_summary: Optional[str] = ""
    selected_charts: List[SelectedChartItem]
    key_findings: Optional[List[str]] = []
    include_quality_summary: Optional[bool] = True

class ReportResponse(BaseModel):
    id: str
    analysis_id: str
    user_id: str
    title: str
    description: Optional[str] = None
    selected_charts: List[Dict[str, Any]]
    executive_summary: Optional[str] = None
    key_findings: List[str]
    storage_path: str
    file_size_bytes: int
    status: str
    created_at: Optional[str] = None
    download_url: Optional[str] = None
