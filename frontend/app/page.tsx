"use client";

import Link from "next/link";
import {
  FileSpreadsheet,
  BarChart3,
  FileText,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Layers,
  Download,
  Database,
  PieChart,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col selection:bg-blue-100 selection:text-blue-700">
      {/* 1. NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-slate-900 tracking-tight leading-none">
                Excel Insight
              </span>
              <span className="text-[10px] uppercase font-semibold text-blue-600 tracking-wider mt-0.5">
                Platform Analisis Data
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#fitur" className="hover:text-blue-600 transition">
              Fitur Utama
            </a>
            <a href="#cara-kerja" className="hover:text-blue-600 transition">
              Cara Kerja
            </a>
            <a href="#penggunaan" className="hover:text-blue-600 transition">
              Kasus Penggunaan
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-sm hover:shadow transition flex items-center gap-1.5"
            >
              Masuk ke Ruang Kerja
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-20 pb-24 overflow-hidden bg-gradient-to-b from-blue-50/50 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-8 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Audit Kualitas Data & Pembuatan Laporan PDF Eksekutif Otomatis</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Ubah Data Excel Menjadi{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Wawasan yang Jelas.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Unggah file XLSX atau XLS, periksa kualitas data secara otomatis, dapatkan
            rekomendasi grafik yang cerdas, dan susun laporan PDF berstandar eksekutif tanpa rumus manual.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/login"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-lg shadow-blue-600/25 transition flex items-center justify-center gap-2 group"
            >
              Masuk & Mulai Analisis
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </Link>
            <Link
              href="/auth/login"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-base border border-slate-200 shadow-sm transition flex items-center justify-center gap-2"
            >
              Masuk ke Dashboard
            </Link>
          </div>

          {/* Interactive Preview Showcase Card */}
          <div className="mt-16 max-w-5xl mx-auto rounded-2xl border border-slate-200 bg-white shadow-2xl p-4 sm:p-6 text-left">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-2 text-xs font-mono font-medium text-slate-400">
                  ringkasan_operasional_triwulan.xlsx (Mesin Analisis Aktif)
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> 99.4% Kelengkapan Data
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Data Table Snippet */}
              <div className="lg:col-span-2 rounded-xl bg-slate-50 border border-slate-200/80 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Lembar Kerja: Kinerja_Bulanan
                  </span>
                  <span className="text-xs text-blue-600 font-medium">
                    2.450 baris &bull; 6 kolom
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase font-semibold">
                        <th className="py-2 px-3">Divisi / Satuan</th>
                        <th className="py-2 px-3">Indikator</th>
                        <th className="py-2 px-3">Volume</th>
                        <th className="py-2 px-3">Efisiensi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60 font-mono text-slate-700">
                      <tr>
                        <td className="py-2.5 px-3 font-sans font-medium text-slate-900">Satuan Lalu Lintas</td>
                        <td className="py-2.5 px-3">Insiden Ditangani</td>
                        <td className="py-2.5 px-3 text-blue-600 font-semibold">1.420</td>
                        <td className="py-2.5 px-3">94,2%</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-sans font-medium text-slate-900">Sat Reskrim</td>
                        <td className="py-2.5 px-3">Berkas Selesai</td>
                        <td className="py-2.5 px-3 text-blue-600 font-semibold">890</td>
                        <td className="py-2.5 px-3">91,8%</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-sans font-medium text-slate-900">Binmas / Bhabinkamtibmas</td>
                        <td className="py-2.5 px-3">Kegiatan Sambang</td>
                        <td className="py-2.5 px-3 text-blue-600 font-semibold">2.110</td>
                        <td className="py-2.5 px-3">98,5%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recommended Visualization Preview */}
              <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-blue-700 mb-2">
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Grafik Rekomendasi
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm text-slate-900">
                    Volume Berdasarkan Divisi
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Terpilih otomatis: Diagram batang untuk membandingkan capaian volume antar satuan kerja.
                  </p>

                  <div className="mt-4 space-y-2">
                    <div>
                      <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                        <span>Binmas</span>
                        <span>2.110</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-blue-200">
                        <div className="h-full rounded-full bg-blue-600 w-[95%]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                        <span>Lalu Lintas</span>
                        <span>1.420</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-blue-200">
                        <div className="h-full rounded-full bg-blue-600 w-[64%]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                        <span>Reskrim</span>
                        <span>890</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-blue-200">
                        <div className="h-full rounded-full bg-blue-600 w-[40%]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-blue-200/60 flex items-center justify-between text-xs text-blue-700 font-medium">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> Laporan PDF Siap Ekspor
                  </span>
                  <span className="underline cursor-pointer">Lihat</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. KEY FEATURES */}
      <section id="fitur" className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3">
              Fitur Utama
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Dirancang untuk Akurasi, Keandalan, dan Kecepatan
            </h3>
            <p className="mt-4 text-base text-slate-600">
              Semua yang dibutuhkan untuk mengubah tabel Excel mentah menjadi dokumen ringkasan eksekutif siap presentasi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
                <Database className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">
                Dukungan Multi-Sheet
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Membaca file XLSX dan format legacy XLS. Mendeteksi seluruh tab lembar kerja secara otomatis dengan deduplikasi header cerdas.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">
                Audit Kualitas Data
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Diagnostik komprehensif mendeteksi sel kosong, baris duplikat, serta menghitung skor kelengkapan data secara matematis.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
                <PieChart className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">
                Rekomendasi Grafik Cerdas
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Mesin inferensi yang merekomendasikan diagram batang, garis, donat, sebaran (scatter), atau histogram sesuai karakteristik kolom.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">
                Mesin PDF ReportLab
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Menghasilkan dokumen PDF multi-halaman beresolusi tinggi dengan penomoran halaman dinamis dan visual grafik tajam.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CARA KERJA (4 LANGKAH) */}
      <section id="cara-kerja" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3">
              Alur Kerja
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Empat Langkah dari File ke Laporan PDF Eksekutif
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-lg mb-4 shadow-md shadow-blue-500/20">
                1
              </div>
              <h4 className="font-bold text-base text-slate-900 mb-1">
                Unggah Buku Kerja
              </h4>
              <p className="text-xs text-slate-600">
                Tarik dan letakkan file Excel Anda. Sistem memvalidasi struktur workbook secara aman tanpa menjalankan macro berbahaya.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-lg mb-4 shadow-md shadow-blue-500/20">
                2
              </div>
              <h4 className="font-bold text-base text-slate-900 mb-1">
                Pilih & Audit Lembar Kerja
              </h4>
              <p className="text-xs text-slate-600">
                Pilih tab sheet yang ingin diperiksa. Tinjau pratinjau tabel dan metrik kelengkapan data.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-lg mb-4 shadow-md shadow-blue-500/20">
                3
              </div>
              <h4 className="font-bold text-base text-slate-900 mb-1">
                Eksplorasi Visualisasi
              </h4>
              <p className="text-xs text-slate-600">
                Gunakan grafik rekomendasi atau sesuaikan sumbu, metode agregasi, dan filter dengan pratinjau interaktif langsung.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-lg mb-4 shadow-md shadow-blue-500/20">
                4
              </div>
              <h4 className="font-bold text-base text-slate-900 mb-1">
                Ekspor Laporan PDF
              </h4>
              <p className="text-xs text-slate-600">
                Kompilasi grafik pilihan dan ringkasan eksekutif menjadi dokumen PDF profesional yang siap dicetak dan dibagikan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. KASUS PENGGUNAAN */}
      <section id="penggunaan" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3">
              Penerapan Fleksibel
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Dirancang untuk Pelayanan Publik, Operasional, dan Korporasi
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Instansi Kepolisian & Publik
              </span>
              <h4 className="text-lg font-bold text-slate-900 mt-2 mb-2">
                Laporan Insiden & Operasional
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Ringkas log penanganan kasus, patroli rutin, dan capaian target satuan kerja ke dalam laporan pimpinan yang ringkas dan padat.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Keuangan & Manajemen
              </span>
              <h4 className="text-lg font-bold text-slate-900 mt-2 mb-2">
                Evaluasi Anggaran & Penjualan
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Pantau realisasi pendapatan per unit, tren bulanan, dan pertumbuhan triwulan tanpa perlu membuat rumus pivot rumit.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Logistik & Inventaris
              </span>
              <h4 className="text-lg font-bold text-slate-900 mt-2 mb-2">
                Audit Stok & Distribusi Barang
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Deteksi risiko kehabisan barang, analisis perputaran persediaan, dan susun laporan audit pengadaan barang dengan mudah.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION BANNER */}
      <section className="py-20 bg-blue-600 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Siap Mengubah Spreadsheet Excel Anda?
          </h2>
          <p className="mt-4 text-blue-100 text-base sm:text-lg max-w-2xl mx-auto">
            Nikmati kemudahan audit data otomatis, visualisasi grafik interaktif, dan pembuatan laporan PDF eksekutif bersama Excel Insight.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/auth/login"
              className="px-8 py-3.5 rounded-xl bg-white text-blue-600 hover:bg-blue-50 font-bold text-base shadow-lg transition flex items-center gap-2"
            >
              Masuk ke Ruang Kerja
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <span className="font-bold text-base text-white">Excel Insight</span>
          </div>
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} Excel Insight. Hak cipta dilindungi undang-undang. Platform analisis data siap produksi.
          </p>
          <div className="flex items-center gap-6 text-xs">
            <span className="inline-flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Supabase & FastAPI Terhubung
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
