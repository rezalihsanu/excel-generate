# Excel Insight — Automated Spreadsheet Analysis & PDF Reporting Platform

**Excel Insight** is an enterprise-grade web application designed to automatically ingest Excel files (.xlsx, .xls), audit data quality, generate heuristic-based chart recommendations, provide interactive dynamic visualizations, and compile publication-ready executive PDF reports with ReportLab.

---

## 1. System Architecture

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, Lucide React, Recharts, `@supabase/ssr`.
- **Backend**: Python 3.10+, FastAPI, Pandas, OpenPyXL, ReportLab, Matplotlib, Pydantic, Pytest.
- **Database & Storage**: Supabase PostgreSQL 17 (Row Level Security enabled) & Supabase Storage (private S3 buckets `excel-uploads` and `pdf-reports`).
- **DevOps**: Docker, Docker Compose, Supabase CLI.

---

## 2. Prerequisites

- **Node.js**: >= 20.x, npm >= 10.x
- **Python**: >= 3.10
- **Docker**: Docker Desktop or Docker Engine >= 24.x
- **Supabase CLI**: Installed (`npx supabase`)

---

## 3. Quick Start (Local Development)

### Step 1: Clone & Configure Environment

Copy `.env.example` into root, frontend, and backend environments:

```bash
# Frontend
cp .env.example frontend/.env.local

# Backend
cp .env.example backend/.env
```

Ensure `frontend/.env.local` contains:
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
NEXT_PUBLIC_BACKEND_API_URL=http://127.0.0.1:8000
```

And `backend/.env` contains:
```env
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
SUPABASE_SECRET_KEY=your-supabase-secret-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
SUPABASE_STORAGE_BUCKET_EXCEL=excel-uploads
SUPABASE_STORAGE_BUCKET_PDF=pdf-reports
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

---

### Step 2: Supabase Local Database & Migrations

If Supabase local containers are not already running:
```bash
npx supabase start
```

Apply database migrations:
```bash
npx supabase migration up --local
```

Access Supabase Studio at: [http://127.0.0.1:54323](http://127.0.0.1:54323)  
Access Mailpit (Inbucket) at: [http://127.0.0.1:54324](http://127.0.0.1:54324)

---

### Step 3: Run Backend (FastAPI)

```bash
cd backend
# Create virtual environment if needed:
# py -3 -m venv .venv; .\.venv\Scripts\activate
.\.venv\Scripts\pip.exe install -r requirements.txt
.\.venv\Scripts\uvicorn.exe app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend API Swagger Docs will be available at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)  
Comprehensive API Documentation is available in [api-documentation.md](file:///d:/MAGANG%20POLRES%20MALANG/project-excelgenerate/docs/api-documentation.md).

---

### Step 4: Run Frontend (Next.js)

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

Frontend application will be available at: [http://localhost:3000](http://localhost:3000)

---

## 4. Running Automated Tests

Run backend test suite with Pytest:
```bash
cd backend
.\.venv\Scripts\pytest.exe -v
```
All unit and security tests cover:
- Ingestion and sanitization of Excel sheets.
- Deduplication of headers and formula/macro shielding.
- Data completeness scoring and missing value audits.
- Heuristic chart recommendations.
- Multi-page ReportLab PDF generation with dynamic page numbering.
- Security authorization and unauthenticated route protection.

---

## 5. Docker Deployment

Launch both frontend and backend in unified containers:
```bash
docker compose up -d --build
```

---

## 6. Linking Supabase Cloud

The repository is linked to the Supabase Cloud project ref:
```
zroxqehaovqrpdmvobbo (excel-insight-polres)
```

To deploy migrations to Supabase Cloud:
```bash
npx supabase db push
```

---

## 7. Troubleshooting

- **CORS Errors**: Verify that `ALLOWED_ORIGINS` in `backend/.env` includes your frontend origin.
- **401 Unauthorized**: Ensure user is logged in via Supabase Auth so `Authorization: Bearer <JWT>` header is attached to backend requests.
- **Missing Lucide or Recharts dependencies**: Re-run `npm install --legacy-peer-deps` inside `frontend/`.
