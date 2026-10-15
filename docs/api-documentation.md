# Dokumentasi Lengkap REST API — Excel Insight Backend

Dokumentasi resmi untuk **Excel Insight API Backend**, platform automasi inspeksi spreadsheet Excel, analisis statistik deskriptif & eksploratif (EDA), rekomendasi visualisasi interaktif, dan kompilasi laporan PDF eksekutif berbasis ReportLab.

---

## 1. Informasi Umum & Arsitektur

- **Base URL Server**: `http://localhost:8000` (Local Development) / `http://127.0.0.1:8000`
- **Prefix Endpoint API**: `/api` (kecuali Health Check di `/health`)
- **Versi API**: `v1.0.0`
- **Interactive Documentation**:
  - Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
  - ReDoc UI: [http://localhost:8000/redoc](http://localhost:8000/redoc)
  - OpenAPI JSON Spec: [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)
- **Response Format**: `application/json` (Kecuali download file laporan PDF: `application/pdf`)
- **Diagnostic Header**: Setiap HTTP response menyertakan header `X-Process-Time` yang menunjukkan durasi eksekusi request di server (contoh: `X-Process-Time: 0.0142s`).

---

## 2. Autentikasi & Keamanan (Authentication & Authorization)

Sistem menggunakan **JSON Web Token (JWT)** yang diterbitkan oleh Supabase Auth.

### Header Autentikasi
Kecuali endpoint publik seperti `/health`, semua endpoint privat mewajibkan header:
```http
Authorization: Bearer <SUPABASE_JWT_ACCESS_TOKEN>
```

### Mekanisme Verifikasi Token Backend:
1. **Lokal JWT Decode**: Diverifikasi menggunakan `JWT_SECRET` dengan algoritma `HS256`. Klaim `sub` pada payload digunakan sebagai `user_id`.
2. **Fallback Cloud Verification**: Jika token merupakan token asimetrik atau gagal pada decode lokal, backend melakukan validasi langsung ke endpoint Supabase GoTrue Auth:
   ```
   GET {SUPABASE_URL}/auth/v1/user
   Headers: 
     Authorization: Bearer <token>
     apikey: <SUPABASE_PUBLISHABLE_KEY>
   ```
3. **Row-Level Isolation**: Seluruh query database (`uploaded_files`, `analyses`, `reports`) diisolasi berdasarkan identitas pengguna (`user_id = current_user.id`), menjamin pengguna hanya dapat mengakses dan memodifikasi data miliknya sendiri.

---

## 3. Standar Format Error & Status Code

Format error standar yang dikembalikan oleh backend:

```json
{
  "detail": "Pesan deskripsi error yang terjadi"
}
```

Atau untuk error validasi skema input (HTTP 422 Unprocessable Entity):
```json
{
  "detail": [
    {
      "loc": ["body", "file_id"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

### Daftar HTTP Status Codes:
| Status Code | Arti | Keterangan |
| :--- | :--- | :--- |
| `200 OK` | Berhasil | Request berhasil diproses dan mengembalikan data yang diminta. |
| `201 Created` | Dibuat | Entitas berhasil dibuat (Upload file, create analysis, create report). |
| `204 No Content` | Berhasil Tanpa Konten | Entitas berhasil dihapus (`DELETE /api/files/{id}`). |
| `400 Bad Request` | Permintaan Tidak Valid | File bukan format Excel valid, worksheet kosong, atau parameter chart salah. |
| `401 Unauthorized` | Autentikasi Gagal | Token JWT tidak disertakan, kedaluwarsa, atau tidak valid. |
| `404 Not Found` | Tidak Ditemukan | File, sheet, atau ID analisis tidak ditemukan / bukan milik user. |
| `413 Payload Too Large` | Ukuran Melebihi Batas | Ukuran file melebihi batas 50 MB (`MAX_FILE_SIZE_BYTES`). |
| `422 Unprocessable Entity`| Validasi Parameter Gagal | Format JSON body atau query parameter tidak sesuai schema Pydantic. |
| `500 Internal Error` | Kesalahan Server | Kegagalan koneksi storage atau runtime error server. |

---

## 4. Ringkasan Endpoint

| No | Modul | HTTP Method | Endpoint | Akses | Deskripsi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **Health** | `GET` | `/health` | Public | Pemeriksaan status server & uptime |
| 2 | **Files** | `POST` | `/api/files/upload` | Private | Upload spreadsheet Excel (.xlsx / .xls) |
| 3 | **Files** | `GET` | `/api/files` | Private | List semua file milik user |
| 4 | **Files** | `GET` | `/api/files/{file_id}` | Private | Detail metadata file tertentu |
| 5 | **Files** | `GET` | `/api/files/{file_id}/preview` | Private | Preview data tabel tabular dengan paginasi |
| 6 | **Files** | `DELETE`| `/api/files/{file_id}` | Private | Hapus file dan cascade record terkait |
| 7 | **Analyses** | `POST` | `/api/analyses` | Private | Jalankan analisis data eksploratif (EDA) |
| 8 | **Analyses** | `GET` | `/api/analyses` | Private | List semua riwayat analisis milik user |
| 9 | **Analyses** | `GET` | `/api/analyses/{analysis_id}` | Private | Ambil detail hasil analisis spesifik |
| 10 | **Analyses** | `POST` | `/api/analyses/{analysis_id}/compute-chart` | Private | Komputasi agregasi data chart dinamis |
| 11 | **Reports** | `POST` | `/api/reports` | Private | Kompilasi laporan PDF eksekutif |
| 12 | **Reports** | `GET` | `/api/reports` | Private | List semua laporan PDF yang sudah dibuat |
| 13 | **Reports** | `GET` | `/api/reports/{report_id}` | Private | Detail laporan PDF & link unduhan |
| 14 | **Reports** | `GET` | `/api/reports/{report_id}/download` | Private | Unduh file PDF secara langsung (Streaming) |

---

## 5. Rincian Lengkap Setiap Endpoint

---

### Modul 1: Health Check

#### 1.1 `GET /health`
Mengecek apakah service backend aktif dan siap menerima request.

- **Autentikasi**: Tidak diperlukan (Public)
- **Response `200 OK`**:
```json
{
  "status": "healthy",
  "service": "Excel Insight API",
  "version": "1.0.0",
  "timestamp": "2026-10-13T06:38:57.423894Z"
}
```

---

### Modul 2: File Management (`/api/files`)

#### 2.1 `POST /api/files/upload`
Mengunggah file workbook Excel ke platform. Backend akan memvalidasi signature file (magic bytes `PK\x03\x04` untuk `.xlsx` atau OLE CF untuk `.xls`), memeriksa batasan ukuran maksimal 50 MB, membaca daftar worksheet/sheet yang ada, mengunggah file ke Supabase Storage bucket `excel-uploads`, dan mencatat metadata ke tabel `uploaded_files`.

- **Autentikasi**: `Bearer <token>`
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  - `file`: File biner spreadsheet (`.xlsx` atau `.xls`)
- **Validasi Keamanan**:
  - Validasi MIME type & Ekstensi (`xlsx`, `xls`).
  - Validasi Magic Bytes (mencegah penyamaran file executable/script berbahaya).
  - Formula/Makro dinonaktifkan (`data_only=True`).
  - Maksimal ukuran file: **50 MB**.
- **Response `201 Created`**:
```json
{
  "id": "e4b2d3c1-7a8f-4921-93bd-4776b9789012",
  "user_id": "834199da-78b1-4f11-8f55-156372549abc",
  "original_filename": "laporan_keuangan_q3.xlsx",
  "storage_path": "834199da-78b1-4f11-8f55-156372549abc/e4b2d3c1-7a8f-4921-93bd-4776b9789012.xlsx",
  "file_size_bytes": 1048576,
  "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "sheet_names": [
    "Ringkasan",
    "Transaksi_Harian",
    "Master_Kategori"
  ],
  "total_sheets": 3,
  "status": "uploaded",
  "created_at": "2026-10-13T06:40:12.124Z"
}
```
- **Error Responses**:
  - `400 Bad Request`: File bukan Excel atau tidak memiliki worksheet.
  - `413 Request Entity Too Large`: Ukuran file melebihi 50 MB.
  - `401 Unauthorized`: Token tidak sah.

---

#### 2.2 `GET /api/files`
Mengambil daftar seluruh file Excel yang telah diunggah oleh pengguna saat ini (diurutkan descending berdasarkan waktu pembuatan).

- **Autentikasi**: `Bearer <token>`
- **Response `200 OK`**:
```json
[
  {
    "id": "e4b2d3c1-7a8f-4921-93bd-4776b9789012",
    "user_id": "834199da-78b1-4f11-8f55-156372549abc",
    "original_filename": "laporan_keuangan_q3.xlsx",
    "storage_path": "834199da-78b1-4f11-8f55-156372549abc/e4b2d3c1-7a8f-4921-93bd-4776b9789012.xlsx",
    "file_size_bytes": 1048576,
    "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "sheet_names": ["Ringkasan", "Transaksi_Harian"],
    "total_sheets": 2,
    "status": "uploaded",
    "created_at": "2026-10-13T06:40:12.124Z"
  }
]
```

---

#### 2.3 `GET /api/files/{file_id}`
Mengambil detail metadata spesifik dari suatu file Excel.

- **Autentikasi**: `Bearer <token>`
- **Path Parameters**:
  - `file_id` (string, UUID): ID file yang dicari
- **Response `200 OK`**:
```json
{
  "id": "e4b2d3c1-7a8f-4921-93bd-4776b9789012",
  "user_id": "834199da-78b1-4f11-8f55-156372549abc",
  "original_filename": "laporan_keuangan_q3.xlsx",
  "storage_path": "834199da-78b1-4f11-8f55-156372549abc/e4b2d3c1-7a8f-4921-93bd-4776b9789012.xlsx",
  "file_size_bytes": 1048576,
  "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "sheet_names": ["Ringkasan", "Transaksi_Harian"],
  "total_sheets": 2,
  "status": "uploaded",
  "created_at": "2026-10-13T06:40:12.124Z"
}
```
- **Error Responses**:
  - `404 Not Found`: File ID tidak ditemukan atau milik user lain.

---

#### 2.4 `GET /api/files/{file_id}/preview`
Menampilkan preview data tabel dalam sheet tertentu dengan dukungan paginasi baris dan sanitasi tipe data (mencegah NaN, Inf, atau format tanggal invalid pada JSON).

- **Autentikasi**: `Bearer <token>`
- **Path Parameters**:
  - `file_id` (string, UUID): ID file yang ingin di-preview
- **Query Parameters**:
  | Parameter | Tipe | Default | Validasi | Deskripsi |
  | :--- | :--- | :--- | :--- | :--- |
  | `sheet_name` | string | null | Opsional | Nama sheet spesifik. Jika kosong, akan memakai sheet pertama. |
  | `page` | integer | `1` | `>= 1` | Nomor halaman data preview. |
  | `page_size` | integer | `20` | `1 <= page_size <= 100` | Jumlah baris yang ditampilkan per halaman. |
- **Response `200 OK`**:
```json
{
  "file_id": "e4b2d3c1-7a8f-4921-93bd-4776b9789012",
  "sheet_name": "Transaksi_Harian",
  "page": 1,
  "page_size": 20,
  "total_rows": 1540,
  "total_columns": 5,
  "total_pages": 77,
  "columns": [
    "Tanggal",
    "Wilayah",
    "Kategori",
    "Pendapatan",
    "Jumlah_Unit"
  ],
  "data": [
    {
      "Tanggal": "2026-03-01",
      "Wilayah": "Kepanjen",
      "Kategori": "Elektronik",
      "Pendapatan": 15250000,
      "Jumlah_Unit": 14
    },
    {
      "Tanggal": "2026-03-01",
      "Wilayah": "Singosari",
      "Kategori": "ATK",
      "Pendapatan": 3400000,
      "Jumlah_Unit": 85
    }
  ]
}
```

---

#### 2.5 `DELETE /api/files/{file_id}`
Menghapus file dan seluruh metadata terkait. Penghapusan pada database akan memicu pembersihan secara otomatis (*cascade*) terhadap data analisis dan laporan PDF turunan.

- **Autentikasi**: `Bearer <token>`
- **Path Parameters**:
  - `file_id` (string, UUID): ID file yang akan dihapus
- **Response `204 No Content`**
- **Error Responses**:
  - `404 Not Found`: File tidak ditemukan.

---

### Modul 3: Analisis Data & Visualisasi (`/api/analyses`)

#### 3.1 `POST /api/analyses`
Memulai proses Exploratory Data Analysis (EDA) terhadap sheet tertentu pada spreadsheet yang telah diunggah.

Backend akan:
1. Memuat dataframe dan membersihkan baris/kolom kosong.
2. Melakukan inferensi tipe data setiap kolom (`numeric`, `categorical`, `datetime`, `boolean`, `text`).
3. Mengukur indikator kualitas data: Skor kelengkapan (*completeness score*), jumlah duplikat, jumlah nilai null, serta predikat mutu data (`Excellent`, `Good`, `Fair`, `Poor`).
4. Menghitung ringkasan statistik deskriptif:
   - Kolom numerik: `count`, `mean`, `median`, `min`, `max`, `sum`, `std`.
   - Kolom kategorikal: `count`, `unique_count`, dan `top_categories` (5 frekuensi teratas).
5. Menghasilkan rekomendasi cerdas tipe grafik (Chart Recommendations) secara otomatis dengan scoring relevansi.

- **Autentikasi**: `Bearer <token>`
- **Content-Type**: `application/json`
- **Request Body**:
```json
{
  "file_id": "e4b2d3c1-7a8f-4921-93bd-4776b9789012",
  "sheet_name": "Transaksi_Harian"
}
```
- **Response `201 Created`**:
```json
{
  "id": "c7104b2a-19e3-4611-92b0-8f9f21390456",
  "file_id": "e4b2d3c1-7a8f-4921-93bd-4776b9789012",
  "user_id": "834199da-78b1-4f11-8f55-156372549abc",
  "sheet_name": "Transaksi_Harian",
  "row_count": 1540,
  "column_count": 5,
  "columns_metadata": [
    {
      "name": "Tanggal",
      "dtype": "object",
      "general_type": "datetime",
      "null_count": 0,
      "null_percentage": 0.0,
      "unique_count": 90,
      "sample_values": ["2026-01-01", "2026-01-02", "2026-01-03"]
    },
    {
      "name": "Wilayah",
      "dtype": "object",
      "general_type": "categorical",
      "null_count": 0,
      "null_percentage": 0.0,
      "unique_count": 5,
      "sample_values": ["Kepanjen", "Singosari", "Lawang", "Dampit", "Batu"]
    },
    {
      "name": "Pendapatan",
      "dtype": "float64",
      "general_type": "numeric",
      "null_count": 12,
      "null_percentage": 0.78,
      "unique_count": 980,
      "sample_values": [15250000, 3400000, 7800000]
    }
  ],
  "quality_summary": {
    "total_cells": 7700,
    "missing_cells": 12,
    "missing_percentage": 0.16,
    "duplicate_rows": 0,
    "duplicate_percentage": 0.0,
    "completeness_score": 99.84,
    "quality_grade": "Excellent"
  },
  "statistical_summary": {
    "Wilayah": {
      "type": "categorical",
      "count": 1540,
      "unique_count": 5,
      "top_categories": [
        { "category": "Kepanjen", "count": 450 },
        { "category": "Singosari", "count": 390 }
      ]
    },
    "Pendapatan": {
      "type": "numeric",
      "count": 1528,
      "mean": 8450000.5,
      "median": 7900000.0,
      "min": 500000.0,
      "max": 35000000.0,
      "sum": 12911600764.0,
      "std": 3210450.2
    }
  },
  "recommendations": [
    {
      "id": "e98e4d41-35b8-4c31-b855-98f98a3b8cd9",
      "chart_type": "line",
      "title": "Pendapatan Trend Over Time",
      "x_axis": "Tanggal",
      "y_axis": "Pendapatan",
      "aggregation": "sum",
      "score": 0.95,
      "reason": "Optimal for visualizing historical trends of Pendapatan across Tangal."
    },
    {
      "id": "22ff0678-838f-4ad1-a5bf-9eefd2087611",
      "chart_type": "bar",
      "title": "Total Pendapatan by Wilayah",
      "x_axis": "Wilayah",
      "y_axis": "Pendapatan",
      "aggregation": "sum",
      "score": 0.92,
      "reason": "Best for comparing performance and aggregations of Pendapatan across distinct Wilayah categories."
    },
    {
      "id": "d041e2f8-9a3c-4e89-b1d8-0b5c1f0e21a4",
      "chart_type": "donut",
      "title": "Pendapatan Share by Wilayah",
      "x_axis": "Wilayah",
      "y_axis": "Pendapatan",
      "aggregation": "sum",
      "score": 0.88,
      "reason": "Ideal for showing proportional contribution of each Wilayah segment (5 parts)."
    }
  ],
  "created_at": "2026-10-13T06:45:00.123Z"
}
```

---

#### 3.2 `GET /api/analyses`
Mengambil semua riwayat analisis data yang pernah dilakukan oleh user saat ini.

- **Autentikasi**: `Bearer <token>`
- **Response `200 OK`**: Array of `AnalysisResponse`.

---

#### 3.3 `GET /api/analyses/{analysis_id}`
Mengambil data detail hasil analisis tertentu berdasarkan ID.

- **Autentikasi**: `Bearer <token>`
- **Path Parameters**:
  - `analysis_id` (string, UUID): ID analisis
- **Response `200 OK`**: Objek `AnalysisResponse`
- **Error Responses**:
  - `404 Not Found`: Analisis tidak ditemukan.

---

#### 3.4 `POST /api/analyses/{analysis_id}/compute-chart`
Melakukan kalkulasi on-the-fly dari kumpulan data aktual untuk menghasilkan data grafik (Recharts ready) sesuai parameter dimensi sumbu X, metrik sumbu Y, fungsi agregasi, filter, dan limit Top-N.

- **Autentikasi**: `Bearer <token>`
- **Path Parameters**:
  - `analysis_id` (string, UUID): ID analisis yang dijadikan basis perhitungan
- **Content-Type**: `application/json`
- **Request Body**:
```json
{
  "chart_type": "bar",
  "x_axis": "Wilayah",
  "y_axis": "Pendapatan",
  "aggregation": "sum",
  "filters": {
    "Kategori": "Elektronik"
  },
  "sort_order": "desc",
  "top_n": 10
}
```
  - `chart_type`: `"bar"` | `"line"` | `"pie"` | `"donut"` | `"scatter"` | `"histogram"` | `"stacked_bar"` | `"table"`
  - `x_axis`: Nama kolom dimensi sumbu X (Wajib).
  - `y_axis`: Nama kolom metrik sumbu Y (Opsional, jika kosong untuk bar/pie akan menghitung frekuensi kejadian sumbu X).
  - `aggregation`: `"sum"` | `"avg"` (atau `"mean"`) | `"count"` | `"min"` | `"max"` (Default: `"sum"`).
  - `filters`: Objek filter key-value kolom (Opsional). Mendukung string matching atau list in matching.
  - `sort_order`: `"asc"` | `"desc"` | `"none"` (Default: `"desc"`).
  - `top_n`: Batas jumlah data teratas (Default: `10`).

- **Response `200 OK`**:
```json
{
  "chart_type": "bar",
  "x_axis": "Wilayah",
  "y_axis": "Pendapatan",
  "aggregation": "sum",
  "chart_data": [
    {
      "name": "Kepanjen",
      "value": 458000000.0,
      "Pendapatan": 458000000.0
    },
    {
      "name": "Singosari",
      "value": 312000000.0,
      "Pendapatan": 312000000.0
    },
    {
      "name": "Lawang",
      "value": 189000000.0,
      "Pendapatan": 189000000.0
    }
  ],
  "total_points": 3
}
```
- **Error Responses**:
  - `400 Bad Request`: Kolom sumbu X/Y tidak ditemukan atau tipe chart tidak valid.
  - `404 Not Found`: ID analisis atau file sumber tidak ditemukan.

---

### Modul 4: Laporan PDF Eksekutif (`/api/reports`)

#### 4.1 `POST /api/reports`
Menerbitkan dan mengompilasi laporan PDF resmi bergaya eksekutif. Backend menggunakan engine **ReportLab** dan **Matplotlib** untuk:
1. Memproses grafik yang dipilih (merender chart resolusi tinggi 200 DPI secara otomatis bila data chart tidak disertakan).
2. Membentuk halaman dengan canvas dua tahap (*two-pass canvas*) dengan header dinamis, garis pembatas, penomoran halaman otomatis (`Page X of Y`), dan watermark kerahasiaan.
3. Menyusun tabel audit kesehatan kualitas data.
4. Menyusun bullet point temuan analitis (*Key Findings*).
5. Mengunggah file PDF yang dihasilkan ke Supabase Storage bucket `pdf-reports` dan mencatat metadata di tabel `reports`.

- **Autentikasi**: `Bearer <token>`
- **Content-Type**: `application/json`
- **Request Body**:
```json
{
  "analysis_id": "c7104b2a-19e3-4611-92b0-8f9f21390456",
  "title": "Laporan Kinerja Penjualan Triwulan I 2026",
  "description": "Laporan berkala hasil audit dan distribusi pendapatan wilayah",
  "executive_summary": "Pertumbuhan pendapatan didominasi oleh wilayah Kepanjen dengan kontribusi total melebihi 458 juta rupiah.",
  "key_findings": [
    "Tingkat kelengkapan data mencapai 99.84% tanpa duplikasi baris.",
    "Kepanjen menyumbang 42% dari total pendapatan keseluruhan.",
    "Sektor elektronik menghasilkan rata-rata nilai transaksi tertinggi."
  ],
  "selected_charts": [
    {
      "title": "Pendapatan per Wilayah",
      "chart_type": "bar",
      "x_axis": "Wilayah",
      "y_axis": "Pendapatan",
      "aggregation": "sum",
      "insight": "Wilayah Kepanjen memimpin penjualan dengan margin tertinggi dibandingkan 4 wilayah lainnya."
    },
    {
      "title": "Tren Pendapatan Harian",
      "chart_type": "line",
      "x_axis": "Tanggal",
      "y_axis": "Pendapatan",
      "aggregation": "sum",
      "insight": "Terjadi lonjakan transaksi signifikan di akhir bulan."
    }
  ],
  "include_quality_summary": true
}
```
- **Response `201 Created`**:
```json
{
  "id": "7fa1bc82-5d9e-4a67-b501-c918ef9a4567",
  "analysis_id": "c7104b2a-19e3-4611-92b0-8f9f21390456",
  "user_id": "834199da-78b1-4f11-8f55-156372549abc",
  "title": "Laporan Kinerja Penjualan Triwulan I 2026",
  "description": "Laporan berkala hasil audit dan distribusi pendapatan wilayah",
  "selected_charts": [
    {
      "title": "Pendapatan per Wilayah",
      "chart_type": "bar",
      "x_axis": "Wilayah",
      "y_axis": "Pendapatan",
      "aggregation": "sum",
      "chart_data": [...]
    }
  ],
  "executive_summary": "Pertumbuhan pendapatan didominasi oleh wilayah Kepanjen...",
  "key_findings": [
    "Tingkat kelengkapan data mencapai 99.84% tanpa duplikasi baris.",
    "Kepanjen menyumbang 42% dari total pendapatan keseluruhan."
  ],
  "storage_path": "834199da-78b1-4f11-8f55-156372549abc/7fa1bc82-5d9e-4a67-b501-c918ef9a4567.pdf",
  "file_size_bytes": 184512,
  "status": "completed",
  "created_at": "2026-10-13T06:50:30.540Z",
  "download_url": "/api/reports/7fa1bc82-5d9e-4a67-b501-c918ef9a4567/download"
}
```

---

#### 4.2 `GET /api/reports`
Mengambil seluruh daftar laporan PDF yang telah diterbitkan oleh pengguna saat ini.

- **Autentikasi**: `Bearer <token>`
- **Response `200 OK`**: Array of `ReportResponse`.

---

#### 4.3 `GET /api/reports/{report_id}`
Mengambil metadata laporan PDF tertentu beserta URL endpoint unduhan.

- **Autentikasi**: `Bearer <token>`
- **Path Parameters**:
  - `report_id` (string, UUID): ID laporan PDF
- **Response `200 OK`**: Objek `ReportResponse`
- **Error Responses**:
  - `404 Not Found`: Laporan tidak ditemukan.

---

#### 4.4 `GET /api/reports/{report_id}/download`
Mengunduh file PDF secara langsung sebagai binary stream.

- **Autentikasi**: `Bearer <token>`
- **Path Parameters**:
  - `report_id` (string, UUID): ID laporan yang akan diunduh
- **Response Headers**:
  ```http
  Content-Type: application/pdf
  Content-Disposition: attachment; filename="Laporan_Kinerja_Penjualan_Triwulan_I_2026.pdf"
  ```
- **Response `200 OK`**: Binary PDF file payload.
- **Error Responses**:
  - `404 Not Found`: Laporan tidak ditemukan atau file storage tidak tersedia.

---

## 6. Contoh Implementasi Kode (Integration Code Snippets)

### Contoh A: cURL

#### 1. Upload File Excel
```bash
curl -X POST "http://localhost:8000/api/files/upload" \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN" \
  -F "file=@/path/to/data_sales.xlsx"
```

#### 2. Jalankan Analisis Data Sheet
```bash
curl -X POST "http://localhost:8000/api/analyses" \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "file_id": "YOUR_FILE_UUID",
    "sheet_name": "Sheet1"
  }'
```

#### 3. Unduh Laporan PDF
```bash
curl -X GET "http://localhost:8000/api/reports/YOUR_REPORT_UUID/download" \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN" \
  --output report.pdf
```

---

### Contoh B: TypeScript / Next.js (Fetch API)

```typescript
// lib/api.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function uploadExcelFile(file: File, token: string) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE_URL}/api/files/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Gagal mengunggah file.');
  }

  return res.json();
}

export async function computeChartData(
  analysisId: string,
  params: {
    chart_type: string;
    x_axis: string;
    y_axis?: string;
    aggregation?: string;
    top_n?: number;
  },
  token: string
) {
  const res = await fetch(`${BASE_URL}/api/analyses/${analysisId}/compute-chart`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Gagal menghitung data chart.');
  }

  return res.json();
}
```

---

### Contoh C: Python (`httpx` / `requests`)

```python
import httpx

API_URL = "http://localhost:8000"
TOKEN = "YOUR_SUPABASE_ACCESS_TOKEN"
headers = {"Authorization": f"Bearer {TOKEN}"}

# 1. Preview data sheet dengan paginasi
with httpx.Client(base_url=API_URL, headers=headers) as client:
    resp = client.get(
        "/api/files/e4b2d3c1-7a8f-4921-93bd-4776b9789012/preview",
        params={"sheet_name": "Sheet1", "page": 1, "page_size": 25}
    )
    preview = resp.json()
    print(f"Total Rows: {preview['total_rows']}, Kolom: {preview['columns']}")
```

---

## 7. Catatan Keamanan & Praktik Terbaik (Security & Best Practices)

1. **Token Refresh**: Token Supabase JWT memiliki masa aktif (biasanya 1 jam). Frontend disarankan memperbarui token secara otomatis melalui `@supabase/supabase-js` sebelum mengirimkan request ke backend.
2. **Streaming & Memory**: File berukuran besar diproses secara *read-only stream* dan didownload langsung via buffer memory untuk meminimalkan latensi I/O disk.
3. **Pembersihan Cache**: File lokal temporer di folder `backend/storage/` dibersihkan secara berkala dan diisolasi per request.
4. **CORS Configuration**: CORS di backend telah dikonfigurasi untuk mengizinkan request dari frontend Next.js (`http://localhost:3000` dan `http://127.0.0.1:3000`).
