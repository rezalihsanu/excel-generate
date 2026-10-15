"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { formatBytes, formatDate } from "@/lib/utils";
import { ReportRecord } from "@/types";
import {
  FileText,
  Download,
  Calendar,
  Layers,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
} from "lucide-react";

export default function ReportsHistoryPage() {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        const data = await apiClient.listReports();
        setReports(data);
      } catch (err: any) {
        setErrorMsg(err.message || "Gagal memuat riwayat arsip laporan");
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const handleDownload = async (report: ReportRecord) => {
    setDownloadingId(report.id);
    try {
      await apiClient.downloadReport(report.id, report.title);
    } catch (err: any) {
      alert(err.message || "Gagal mengunduh berkas laporan PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium">Memuat arsip laporan PDF...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Arsip Laporan PDF
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Dokumentasi arsip laporan PDF eksekutif resmi yang dihasilkan dari hasil analisis data Anda.
          </p>
        </div>

        <Link
          href="/dashboard/files"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition self-start sm:self-auto cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Buat Laporan Baru dari Spreadsheet</span>
        </Link>
      </div>

      {errorMsg && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-center gap-3 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {reports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Belum Ada Laporan PDF yang Dihasilkan
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            Jalankan analisis pada lembar kerja spreadsheet dan gunakan modul Penyusun Laporan untuk menghasilkan dokumen PDF resmi.
          </p>
          <Link
            href="/dashboard/files"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>Jelajahi Berkas Spreadsheet</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    Selesai
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 mb-1">
                  {report.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {report.executive_summary || "Laporan analisis eksekutif yang disusun otomatis oleh Excel Insight."}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(report.created_at)}</span>
                    </span>
                    <span>{formatBytes(report.file_size_bytes)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>{report.selected_charts.length} grafik disertakan</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <button
                  onClick={() => handleDownload(report)}
                  disabled={downloadingId === report.id}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {downloadingId === report.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Mengunduh PDF...
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      Unduh Dokumen PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
