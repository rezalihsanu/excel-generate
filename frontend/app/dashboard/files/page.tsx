"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api";
import { formatBytes, formatDate } from "@/lib/utils";
import { UploadedFileRecord, PaginatedFilePreview } from "@/types";
import {
  FileSpreadsheet,
  Layers,
  Sparkles,
  Trash2,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  UploadCloud,
} from "lucide-react";

function MyFilesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFileId = searchParams.get("fileId");

  const [files, setFiles] = useState<UploadedFileRecord[]>([]);
  const [selectedFile, setSelectedFile] = useState<UploadedFileRecord | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [preview, setPreview] = useState<PaginatedFilePreview | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    async function loadFiles() {
      try {
        setLoading(true);
        const data = await apiClient.listFiles();
        setFiles(data);
        if (data.length > 0) {
          const target = initialFileId
            ? data.find((f) => f.id === initialFileId) || data[0]
            : data[0];
          setSelectedFile(target);
          const firstSheet = target.sheet_names[0] || "Sheet1";
          setSelectedSheet(firstSheet);
          loadPreview(target.id, firstSheet, 1);
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Gagal memuat berkas spreadsheet");
      } finally {
        setLoading(false);
      }
    }
    loadFiles();
  }, [initialFileId]);

  const loadPreview = async (fileId: string, sheet: string, p = 1) => {
    setPreviewLoading(true);
    try {
      const data = await apiClient.getFilePreview(fileId, sheet, p, 15);
      setPreview(data);
      setPage(p);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal memuat pratinjau lembar kerja");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSelectFile = (file: UploadedFileRecord) => {
    setSelectedFile(file);
    const firstSheet = file.sheet_names[0] || "Sheet1";
    setSelectedSheet(firstSheet);
    loadPreview(file.id, firstSheet, 1);
  };

  const handleSelectSheet = (sheet: string) => {
    if (!selectedFile) return;
    setSelectedSheet(sheet);
    loadPreview(selectedFile.id, sheet, 1);
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus berkas spreadsheet ini beserta seluruh riwayat analisisnya?")) return;
    try {
      await apiClient.deleteFile(fileId);
      const updated = files.filter((f) => f.id !== fileId);
      setFiles(updated);
      if (selectedFile?.id === fileId) {
        if (updated.length > 0) {
          handleSelectFile(updated[0]);
        } else {
          setSelectedFile(null);
          setPreview(null);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menghapus berkas");
    }
  };

  const handleAnalyzeSheet = async () => {
    if (!selectedFile || !selectedSheet) return;
    setAnalyzing(true);
    try {
      const analysis = await apiClient.createAnalysis(selectedFile.id, selectedSheet);
      router.push(`/dashboard/analysis/${analysis.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menjalankan pipeline analisis");
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium">Memuat daftar buku kerja (workbook)...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Repositori Spreadsheet
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Jelajahi berkas yang diunggah, periksa tab lembar kerja (worksheet), dan jalankan pipeline analisis otomatis.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-center gap-3 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {files.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Belum Ada Berkas Spreadsheet yang Diunggah
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            Unggah berkas Excel (.xlsx) untuk mulai memvisualisasikan data dan menghasilkan laporan PDF profesional.
          </p>
          <button
            onClick={() => router.push("/dashboard/upload")}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition cursor-pointer"
          >
            Unggah Berkas Excel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Files List Sidebar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2 lg:col-span-1 h-fit max-h-[75vh] overflow-y-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-2 mb-3">
              Berkas Terunggah ({files.length})
            </h3>
            {files.map((file) => {
              const isSelected = selectedFile?.id === file.id;
              return (
                <div
                  key={file.id}
                  onClick={() => handleSelectFile(file)}
                  className={`p-3 rounded-xl cursor-pointer border transition text-left relative group ${
                    isSelected
                      ? "bg-blue-50/70 border-blue-200"
                      : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileSpreadsheet
                        className={`w-4 h-4 shrink-0 ${
                          isSelected ? "text-blue-600" : "text-emerald-600"
                        }`}
                      />
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {file.original_filename}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFile(file.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 p-1 rounded transition"
                      title="Hapus berkas"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{formatBytes(file.file_size_bytes)}</span>
                    <span>{file.total_sheets} lembar kerja</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Worksheet Preview & Actions */}
          {selectedFile && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 lg:col-span-3">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedFile.original_filename}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Diunggah pada {formatDate(selectedFile.created_at)} &bull; {formatBytes(selectedFile.file_size_bytes)}
                  </p>
                </div>

                <button
                  onClick={handleAnalyzeSheet}
                  disabled={analyzing}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-2 self-start sm:self-auto disabled:opacity-50 cursor-pointer"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menganalisis...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Analisis Lembar: {selectedSheet}
                    </>
                  )}
                </button>
              </div>

              {/* Sheet Switcher */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Daftar Lembar Kerja (Worksheet)
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedFile.sheet_names.map((sheet) => (
                    <button
                      key={sheet}
                      onClick={() => handleSelectSheet(sheet)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                        selectedSheet === sheet
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>{sheet}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Data Table */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <TableIcon className="w-4 h-4 text-blue-600" />
                    Tabel Data Pratinjau ({selectedSheet})
                  </span>
                  {preview && (
                    <span className="text-xs text-slate-500">
                      Total: {preview.total_rows.toLocaleString()} baris &bull; {preview.total_columns} kolom
                    </span>
                  )}
                </div>

                {previewLoading ? (
                  <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <span className="text-xs">Memuat data baris...</span>
                  </div>
                ) : preview && preview.data.length > 0 ? (
                  <>
                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0">
                          <tr>
                            {preview.columns.map((col) => (
                              <th key={col} className="py-2.5 px-4 font-semibold uppercase tracking-wider whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                          {preview.data.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              {preview.columns.map((col) => (
                                <td key={col} className="py-2 px-4 whitespace-nowrap">
                                  {row[col] !== null ? String(row[col]) : <span className="text-slate-300 italic">kosong</span>}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Bar */}
                    <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                      <span>
                        Halaman {preview.page} dari {preview.total_pages}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          disabled={preview.page <= 1}
                          onClick={() => loadPreview(selectedFile.id, selectedSheet, preview.page - 1)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          disabled={preview.page >= preview.total_pages}
                          onClick={() => loadPreview(selectedFile.id, selectedSheet, preview.page + 1)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Tidak ada baris data ditemukan pada lembar kerja ini.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MyFilesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <p className="text-sm font-medium">Menyiapkan tampilan spreadsheet...</p>
        </div>
      }
    >
      <MyFilesContent />
    </Suspense>
  );
}
