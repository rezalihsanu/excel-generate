# AGENTS.md — Development Guidelines for AI Agents & Engineers

## 1. Project Mission & Tenets
**Excel Insight** is a production-grade web application for automatic Excel sheet inspection, exploratory data analysis, dynamic chart generation, and ReportLab PDF report exporting.

## 2. Engineering Standards
- **Zero Mock Data in Main Flows**: All analysis and chart generation must derive from actual uploaded Excel sheets.
- **Strict Separation of Concerns**: Frontend (`/frontend`) communicates strictly via HTTP REST to Backend (`/backend`) or via Supabase client with PostgreSQL RLS.
- **Safety First**:
  - Never execute macros or formulas from Excel files.
  - Never print or leak user secrets, tokens, or raw credentials in logs or chat responses.
  - Validate file signatures, MIME types, and sizes (< 50MB) on the backend.
- **Windows / PowerShell Compatibility**: Always verify path separators and shell commands when interacting with the system.

## 3. Technology Stack Reference
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide React, Recharts, `@supabase/ssr`, `@supabase/supabase-js`.
- **Backend**: Python 3.10+, FastAPI, Pydantic, Pandas, OpenPyXL, ReportLab, Pytest, Uvicorn.
- **Infrastructure**: Supabase (Auth, Postgres, Storage with RLS), Docker Compose.
