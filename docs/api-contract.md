# API Contract — Excel Insight Backend

> **Catatan**: Untuk dokumentasi API komprehensif beserta contoh payload, validasi, dan integrasi frontend, silakan lihat [api-documentation.md](file:///d:/MAGANG%20POLRES%20MALANG/project-excelgenerate/docs/api-documentation.md).

## Base URL
`/api`

## Security & Authentication
All private routes require an `Authorization: Bearer <SUPABASE_JWT>` header. The token is validated for signature, expiration, and issuer. The backend extracts `sub` as the authenticated `user_id`.

---

## Endpoints

### 1. Health Check
- **`GET /health`**
  - **Auth**: Public
  - **Response**: `200 OK`
    ```json
    { "status": "healthy", "version": "1.0.0", "timestamp": "2026-10-13T12:00:00Z" }
    ```

### 2. File Upload & Ingestion
- **`POST /api/files/upload`**
  - **Auth**: Bearer Token
  - **Content-Type**: `multipart/form-data`
  - **Body**: `file: UploadFile`
  - **Response**: `201 Created`
    ```json
    {
      "id": "uuid",
      "original_filename": "sales_q3.xlsx",
      "file_size_bytes": 102400,
      "sheet_names": ["Summary", "Details"],
      "total_sheets": 2,
      "status": "uploaded",
      "created_at": "..."
    }
    ```

- **`GET /api/files`**
  - **Auth**: Bearer Token
  - **Response**: `200 OK`
    ```json
    [ { "id": "...", "original_filename": "...", "created_at": "..." } ]
    ```

- **`GET /api/files/{file_id}`**
  - **Auth**: Bearer Token
  - **Response**: `200 OK` or `404 Not Found`

- **`GET /api/files/{file_id}/preview?sheet_name=Summary&page=1&page_size=20`**
  - **Auth**: Bearer Token
  - **Response**: `200 OK`
    ```json
    {
      "file_id": "uuid",
      "sheet_name": "Summary",
      "page": 1,
      "page_size": 20,
      "total_rows": 500,
      "total_pages": 25,
      "columns": ["Date", "Category", "Revenue", "Units"],
      "data": [
        { "Date": "2026-01-01", "Category": "Electronics", "Revenue": 15000, "Units": 12 }
      ]
    }
    ```

### 3. Data Analysis & Chart Recommendations
- **`POST /api/analyses`**
  - **Auth**: Bearer Token
  - **Body**:
    ```json
    {
      "file_id": "uuid",
      "sheet_name": "Summary"
    }
    ```
  - **Response**: `200 OK`
    ```json
    {
      "id": "uuid",
      "file_id": "uuid",
      "sheet_name": "Summary",
      "row_count": 500,
      "column_count": 4,
      "columns_metadata": [
        { "name": "Category", "dtype": "string", "unique_count": 5, "null_count": 0, "type": "categorical" },
        { "name": "Revenue", "dtype": "float64", "unique_count": 420, "null_count": 0, "type": "numeric" }
      ],
      "quality_summary": {
        "missing_cells": 0,
        "duplicate_rows": 2,
        "completeness_score": 99.6
      },
      "statistical_summary": {
        "Revenue": { "mean": 12400.5, "median": 11000.0, "min": 500.0, "max": 54000.0, "sum": 6200250.0 }
      },
      "recommendations": [
        { "chart_type": "bar", "x_axis": "Category", "y_axis": "Revenue", "aggregation": "sum", "reason": "Categorical dimension with continuous metric" }
      ]
    }
    ```

- **`POST /api/analyses/{analysis_id}/compute-chart`**
  - **Auth**: Bearer Token
  - **Body**:
    ```json
    {
      "chart_type": "bar",
      "x_axis": "Category",
      "y_axis": "Revenue",
      "aggregation": "sum",
      "filters": {},
      "sort_order": "desc",
      "top_n": 10
    }
    ```
  - **Response**: `200 OK`
    ```json
    {
      "chart_data": [
        { "name": "Electronics", "value": 3400000 },
        { "name": "Office Supplies", "value": 1200000 }
      ]
    }
    ```

### 4. PDF Reports
- **`POST /api/reports`**
  - **Auth**: Bearer Token
  - **Body**:
    ```json
    {
      "analysis_id": "uuid",
      "title": "Q3 Revenue Performance Report",
      "executive_summary": "Strong quarterly performance driven by electronics sector.",
      "selected_charts": [
        {
          "title": "Revenue by Category",
          "chart_type": "bar",
          "x_axis": "Category",
          "y_axis": "Revenue",
          "aggregation": "sum"
        }
      ],
      "key_findings": ["Total revenue reached 6.2M", "Electronics accounted for 54%"]
    }
    ```
  - **Response**: `201 Created`
    ```json
    {
      "id": "uuid",
      "title": "Q3 Revenue Performance Report",
      "storage_path": "...",
      "status": "completed",
      "download_url": "/api/reports/{id}/download"
    }
    ```

- **`GET /api/reports`**
  - **Auth**: Bearer Token
  - **Response**: `200 OK`

- **`GET /api/reports/{report_id}/download`**
  - **Auth**: Bearer Token
  - **Response**: Stream `application/pdf` with `Content-Disposition: attachment; filename="report.pdf"`
