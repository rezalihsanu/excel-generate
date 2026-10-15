# Architecture Document — Excel Insight

## 1. High-Level System Architecture

Excel Insight follows a decoupled client-server architecture backed by Supabase Cloud / Local infrastructure.

```
+-------------------------------------------------------------------+
|                        Client Layer (Next.js 15)                  |
| - React 19 / TypeScript / Tailwind CSS / Lucide Icons             |
| - Recharts Dynamic Visualizations                                 |
| - @supabase/ssr Session Management                                |
+---------------------------------+---------------------------------+
                                  |
            REST API & Files      | Auth Session & Direct DB
                                  v
+---------------------------------+---------------------------------+
|                   Backend API (FastAPI / Python 3.10)             |
| - JWT Signature & Claims Validation                               |
| - Excel Engine (openpyxl, pandas, xlrd)                           |
| - Data Quality & Analytics Engine                                 |
| - Smart Chart Recommender Engine                                  |
| - Multi-page PDF Report Generator (ReportLab)                     |
+---------------------------------+---------------------------------+
                                  |
       Postgres & Storage Client  |
                                  v
+-------------------------------------------------------------------+
|               Infrastructure Layer (Supabase)                     |
| - Auth (Gotrue, JWT, OAuth, Cookie sessions)                      |
| - PostgreSQL with Row Level Security (RLS)                        |
| - Storage (Private buckets: excel-uploads, pdf-reports)           |
+-------------------------------------------------------------------+
```

## 2. Component Responsibilities

### Frontend (`/frontend`)
- **App Router**: Dynamic routing (`/`, `/auth/login`, `/auth/register`, `/dashboard`, `/dashboard/upload`, `/dashboard/files`, `/dashboard/analysis/[id]`, `/dashboard/reports`, `/dashboard/settings`).
- **SSR & Route Middleware**: Protects private routes using `@supabase/ssr` cookies. Unauthenticated visitors are routed to `/auth/login`.
- **Visualization Component**: Dynamic Recharts container supporting Bar, Line, Pie, Donut, Scatter, Histogram, Stacked Bar, and TanStack Table.
- **Report Composer**: Interactive drag-and-order preview for selecting which charts and narratives appear in the final PDF.

### Backend (`/backend`)
- **FastAPI Core**: Async REST API with OpenAPI documentation at `/docs`.
- **Security Middleware**: Verifies Supabase Bearer JWT tokens, ensuring claims match `sub` (user_id).
- **Excel Ingestion Service**:
  - Validates MIME types, extensions, magic numbers, and workbook headers.
  - Parses sheets into sanitized Pandas DataFrames without code execution.
  - Computes missing-value ratios, duplicate rows, column data-types, and summary stats.
- **Chart Recommendation Service**:
  - Categorizes columns into dimensions (nominal, ordinal, datetime) and metrics (numeric, continuous).
  - Employs heuristic scoring to rank the top 3-4 chart types best suited for the data shape.
- **ReportLab PDF Generator**:
  - Draws custom canvas headers, footers with page numbers `X of Y`.
  - Embeds high-resolution matplotlib/reportlab charts, executive summary typography, data summary tables, and quality alerts.
  - Streams or uploads output directly to Supabase Storage `pdf-reports` bucket.

### Database & Storage (`/supabase`)
- **PostgreSQL**: Stores relational metadata (`profiles`, `uploaded_files`, `analyses`, `chart_configurations`, `reports`).
- **RLS Policies**: Restricts all rows strictly to `auth.uid() = user_id`.
- **Buckets**: `excel-uploads` and `pdf-reports` are private with storage RLS policies granting access only to file owners.
