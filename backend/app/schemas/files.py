from typing import Any, Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel

class FileUploadResponse(BaseModel):
    id: str
    user_id: str
    original_filename: str
    storage_path: str
    file_size_bytes: int
    mime_type: str
    sheet_names: List[str]
    total_sheets: int
    status: str
    created_at: Optional[str] = None

class FilePreviewRequest(BaseModel):
    sheet_name: Optional[str] = None
    page: int = 1
    page_size: int = 20

class FilePreviewResponse(BaseModel):
    file_id: str
    sheet_name: str
    page: int
    page_size: int
    total_rows: int
    total_columns: int
    total_pages: int
    columns: List[str]
    data: List[Dict[str, Any]]
