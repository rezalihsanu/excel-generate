"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { formatBytes, formatDate } from "@/lib/utils";
import { UploadedFileRecord, AnalysisRecord, ReportRecord } from "@/types";
import {
  FileSpreadsheet,
  BarChart3,
  FileText,
  UploadCloud,
  ArrowRight,
  Sparkles,
  Loader2,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

export default function DashboardOverview() {
  const [files, setFiles] = useState<UploadedFileRecord[]>([]);
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [f, a, r] = await Promise.all([
          apiClient.listFiles().catch(() => []),
          apiClient.listAnalyses().catch(() => []),
          apiClient.listReports().catch(() => []),
        ]);
        setFiles(f);
        setAnalyses(a);
        setReports(r);
      } catch (err: any) {
        setError(err.message || "Gagal memuat metrik dashboard");
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium">Memuat analitik ruang kerja...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Ringkasan Ruang Kerja
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pemrosesan spreadsheet real-time, audit kualitas data, dan laporan eksekutif PDF.
          </p>
        </div>
        <Link
          href="/dashboard/upload"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Unggah File Excel</span>
        </Link>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-center gap-3 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Buku Kerja
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-3">
            {files.length}
          </p>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-blue-600 font-semibold">{files.reduce((acc, f) => acc + f.total_sheets, 0)} sheet</span> tersimpan
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Analisis Dijalankan
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-3">
            {analyses.length}
          </p>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-600" />
            <span>Rekomendasi grafik otomatis</span>
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Laporan PDF Diekspor
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-3">
            {reports.length}
          </p>
          <p className="text-xs text-slate-500 mt-1 text-emerald-600 font-medium">
            ReportLab PDF selesai
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Rata-rata Kualitas
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-3">
            {analyses.length > 0
              ? `${Math.round(
                  analyses.reduce((acc, a) => acc + (a.quality_summary?.completeness_score || 100), 0) /
                    analyses.length
                )}%`
              : "100%"}
          </p>
          <p className="text-xs text-slate-500 mt-1 text-slate-500">
            Dari seluruh lembar kerja
          </p>
        </div>
      </div>

      {/* RECENT FILES & EMPTY STATE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Unggahan Spreadsheet Terbaru
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Data riil dari Supabase PostgreSQL & Penyimpanan Objek
            </p>
          </div>
          {files.length > 0 && (
            <Link
              href="/dashboard/files"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Lihat Semua ({files.length})
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {files.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-1">
              Belum ada file Excel yang diunggah
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mb-6">
              Unggah file XLSX atau XLS pertama Anda untuk melihat ringkasan otomatis, audit kualitas data, dan visualisasi interaktif.
            </p>
            <Link
              href="/dashboard/upload"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Unggah File Sekarang</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-6">Nama File</th>
                  <th className="py-3 px-6">Ukuran</th>
                  <th className="py-3 px-6">Jumlah Sheet</th>
                  <th className="py-3 px-6">Waktu Unggah</th>
                  <th className="py-3 px-6 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {files.slice(0, 5).map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-6 font-medium text-slate-900 flex items-center gap-2.5">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate max-w-xs">{f.original_filename}</span>
                    </td>
                    <td className="py-3.5 px-6 text-slate-500">
                      {formatBytes(f.file_size_bytes)}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        {f.total_sheets} sheet
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-slate-500">
                      {formatDate(f.created_at)}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <Link
                        href={`/dashboard/files?fileId=${f.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Periksa & Analisis
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
