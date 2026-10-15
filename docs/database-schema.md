# Database Schema & Storage Policies — Excel Insight

## 1. Tables Overview

All tables reside in the `public` schema and enforce PostgreSQL Row Level Security (RLS).

### `public.profiles`
Stores supplemental profile details for authenticated users.
- `id`: `UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`
- `full_name`: `TEXT`
- `organization`: `TEXT`
- `avatar_url`: `TEXT`
- `created_at`: `TIMESTAMPTZ DEFAULT now()`
- `updated_at`: `TIMESTAMPTZ DEFAULT now()`

### `public.uploaded_files`
Tracks user spreadsheet uploads and storage location.
- `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `user_id`: `UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
- `original_filename`: `TEXT NOT NULL`
- `storage_path`: `TEXT NOT NULL`
- `file_size_bytes`: `BIGINT NOT NULL`
- `mime_type`: `TEXT NOT NULL`
- `sheet_names`: `JSONB NOT NULL DEFAULT '[]'::jsonb`
- `total_sheets`: `INTEGER NOT NULL DEFAULT 1`
- `status`: `TEXT NOT NULL DEFAULT 'uploaded'` -- ('uploaded', 'processed', 'error')
- `created_at`: `TIMESTAMPTZ DEFAULT now()`

### `public.analyses`
Stores sheet-level data processing, schema detection, quality audit, and statistical metrics.
- `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `file_id`: `UUID NOT NULL REFERENCES public.uploaded_files(id) ON DELETE CASCADE`
- `user_id`: `UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
- `sheet_name`: `TEXT NOT NULL`
- `row_count`: `INTEGER NOT NULL DEFAULT 0`
- `column_count`: `INTEGER NOT NULL DEFAULT 0`
- `columns_metadata`: `JSONB NOT NULL DEFAULT '[]'::jsonb`
- `quality_summary`: `JSONB NOT NULL DEFAULT '{}'::jsonb`
- `statistical_summary`: `JSONB NOT NULL DEFAULT '{}'::jsonb`
- `recommendations`: `JSONB NOT NULL DEFAULT '[]'::jsonb`
- `created_at`: `TIMESTAMPTZ DEFAULT now()`

### `public.chart_configurations`
Stores customized charts generated for an analysis.
- `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `analysis_id`: `UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE`
- `user_id`: `UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
- `title`: `TEXT NOT NULL`
- `chart_type`: `TEXT NOT NULL` -- ('bar', 'line', 'pie', 'donut', 'scatter', 'histogram', 'stacked_bar', 'table')
- `x_axis`: `TEXT NOT NULL`
- `y_axis`: `TEXT NOT NULL`
- `aggregation`: `TEXT NOT NULL DEFAULT 'sum'` -- ('sum', 'avg', 'count', 'min', 'max', 'none')
- `filters`: `JSONB DEFAULT '{}'::jsonb`
- `sort_order`: `TEXT DEFAULT 'desc'`
- `top_n`: `INTEGER DEFAULT 10`
- `chart_data`: `JSONB DEFAULT '[]'::jsonb`
- `created_at`: `TIMESTAMPTZ DEFAULT now()`

### `public.reports`
Records metadata for compiled ReportLab PDF reports.
- `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `analysis_id`: `UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE`
- `user_id`: `UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
- `title`: `TEXT NOT NULL`
- `description`: `TEXT`
- `selected_charts`: `JSONB NOT NULL DEFAULT '[]'::jsonb`
- `executive_summary`: `TEXT`
- `key_findings`: `JSONB DEFAULT '[]'::jsonb`
- `storage_path`: `TEXT NOT NULL`
- `file_size_bytes`: `BIGINT DEFAULT 0`
- `status`: `TEXT NOT NULL DEFAULT 'completed'`
- `created_at`: `TIMESTAMPTZ DEFAULT now()`

---

## 2. Row Level Security (RLS) Policies

Every table enables RLS:
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chart_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
```

Policies enforce:
- `SELECT`, `INSERT`, `UPDATE`, `DELETE` are permitted ONLY where `auth.uid() = user_id` (or `auth.uid() = id` for `profiles`).

---

## 3. Storage Buckets & Policies

- **`excel-uploads`**: Private bucket.
  - Path pattern: `{user_id}/{file_id}.xlsx`
  - Policy: `(bucket_id = 'excel-uploads' AND (storage.foldername(name))[1] = auth.uid()::text)`
- **`pdf-reports`**: Private bucket.
  - Path pattern: `{user_id}/{report_id}.pdf`
  - Policy: `(bucket_id = 'pdf-reports' AND (storage.foldername(name))[1] = auth.uid()::text)`
