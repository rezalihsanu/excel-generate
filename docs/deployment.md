# Deployment Guide — Excel Insight

## 1. Prerequisites
- Docker Engine >= 24.0 and Docker Compose v2.
- Node.js >= 20.x, npm >= 10.x.
- Python >= 3.10.
- Supabase CLI installed.

## 2. Environment Variables Configuration

Copy `.env.example` to `.env` in the root, `frontend/.env.local`, and `backend/.env`.

### Frontend Environment (`frontend/.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
NEXT_PUBLIC_BACKEND_API_URL=http://127.0.0.1:8000
```

### Backend Environment (`backend/.env`)
```env
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
SUPABASE_SECRET_KEY=your-supabase-secret-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_STORAGE_BUCKET_EXCEL=excel-uploads
SUPABASE_STORAGE_BUCKET_PDF=pdf-reports
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long
PORT=8000
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Google OAuth Configuration (Supabase Auth)
Jika menggunakan login dengan akun Google (*Continue with Google*):
1. Buat OAuth 2.0 Client ID di [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Tambahkan **Authorized redirect URIs**:
   - Untuk Supabase Lokal: `http://127.0.0.1:54321/auth/v1/callback`
   - Untuk Supabase Cloud: `https://<project-id>.supabase.co/auth/v1/callback`
3. Tambahkan ke file `.env` root atau environment:
```env
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your_client_secret
```
4. Jika menggunakan Supabase Cloud Dashboard, buka menu **Authentication** > **Providers** > **Google**, aktifkan (*Enabled*), lalu tempel Client ID dan Client Secret.

### 2.2. Sistem Whitelist Langganan & Aktivasi Akun (Premium)
Untuk menjaga keamanan data instansi, sistem menggunakan proteksi langganan (*whitelist*):
- Setiap akun yang masuk via Google OAuth akan dicek apakah emailnya terdaftar di tabel `public.subscribed_emails` (atau berstatus `is_subscribed = true` di tabel `public.profiles`).
- **Jika belum terdaftar:** Pengguna langsung diarahkan ke laman `/premium` dengan tombol interaktif untuk menghubungi Admin via WhatsApp.
- **Cara Admin Menambahkan / Mengaktifkan Email Pengguna:**
  1. Buka Supabase Cloud Dashboard > **Table Editor** > tabel `subscribed_emails`.
  2. Klik **Insert row**, lalu masukkan:
     - `email`: `email_user@gmail.com`
     - `plan`: `Pro` atau `Enterprise`
     - `status`: `active`
  3. Atau jalankan query SQL di **SQL Editor**:
     ```sql
     INSERT INTO public.subscribed_emails (email, plan, status, notes)
     VALUES ('nama_user@gmail.com', 'Pro', 'active', 'Satuan Kerja')
     ON CONFLICT (email) DO UPDATE SET status = 'active';
     ```
  4. Database trigger secara otomatis akan mengaktifkan `is_subscribed = true` pada profil pengguna tersebut. Pengguna cukup menekan tombol **"Periksa Ulang Status Akun"** di laman `/premium` untuk langsung masuk ke dashboard.

---

## 3. Local Development Run Commands

### 1. Database & Migrations
```bash
# Push schema migrations and seed data
npx supabase db push
```

### 2. Backend (FastAPI)
```bash
cd backend
# Create virtual environment if needed:
# py -3 -m venv venv; .\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

---

## 4. Docker Production Deployment

Run with Docker Compose:
```bash
docker compose up -d --build
```

Healthchecks are baked into both frontend and backend Dockerfiles. Frontend will be accessible at port `3000` and backend at port `8000`.

---

## 5. Backup & Maintenance Procedures
- **Database Backup**:
  `npx supabase db dump -f supabase_backup.sql`
- **Storage Backup**: Use AWS S3 compatible tools (e.g., `aws cli` or S3 browser) pointing to the Supabase S3 storage endpoint.
