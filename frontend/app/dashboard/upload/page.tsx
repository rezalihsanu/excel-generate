"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { formatBytes } from "@/lib/utils";
import { UploadedFileRecord, PaginatedFilePreview } from "@/types";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Layers,
  Table as TableIcon,
  Sparkles,
} from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploadedRecord, setUploadedRecord] = useState<UploadedFileRecord | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [preview, setPreview] = useState<PaginatedFilePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setErrorMsg(null);
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx" && ext !== "xls") {
      setErrorMsg("Harap pilih spreadsheet Excel yang valid (.xlsx atau .xls)");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg("Ukuran file melebihi batas maksimum 50MB");
      return;
    }
    setSelectedFile(file);
    setUploadedRecord(null);
    setPreview(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setErrorMsg(null);

    try {
      const res = await apiClient.uploadFile(selectedFile);
      setUploadedRecord(res);
      const defaultSheet = res.sheet_names[0] || "Sheet1";
      setSelectedSheet(defaultSheet);
      fetchPreview(res.id, defaultSheet, 1);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mengunggah file");
    } finally {
      setUploading(false);
    }
  };

  const fetchPreview = async (fileId: string, sheetName: string, page = 1) => {
    setPreviewLoading(true);
    try {
      const p = await apiClient.getFilePreview(fileId, sheetName, page, 10);
      setPreview(p);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal memuat pratinjau lembar kerja");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSheetChange = (sheet: string) => {
    setSelectedSheet(sheet);
    if (uploadedRecord) {
      fetchPreview(uploadedRecord.id, sheet, 1);
    }
  };

  const handleStartAnalysis = async () => {
    if (!uploadedRecord || !selectedSheet) return;
    setAnalyzing(true);
    setErrorMsg(null);
    try {
      const analysis = await apiClient.createAnalysis(uploadedRecord.id, selectedSheet);
      router.push(`/dashboard/analysis/${analysis.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menganalisis lembar kerja");
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Unggah & Periksa Spreadsheet
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Mendukung format Microsoft Excel (.xlsx, .xls) hingga 50MB dengan deteksi sheet instan.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-center gap-3 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* DROPZONE AREA */}
      {!uploadedRecord && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-3xl p-10 text-center transition ${
            dragActive
              ? "border-blue-500 bg-blue-50/50"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-base font-bold text-slate-900 mb-1">
            {selectedFile ? selectedFile.name : "Tarik dan letakkan spreadsheet Excel Anda di sini"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            {selectedFile
              ? `Ukuran file: ${formatBytes(selectedFile.size)} siap diunggah`
              : "Unggah file Excel yang berisi data tabular untuk diolah dan dianalisis otomatis."}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
            >
              Pilih dari Komputer
            </button>
            {selectedFile && (
              <button
                type="button"
                disabled={uploading}
                onClick={handleUpload}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-2 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Mengunggah & Membaca Sheet...
                  </>
                ) : (
                  <>
                    Konfirmasi Unggah
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* UPLOADED RESULT & SHEET SELECTION */}
      {uploadedRecord && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-100 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {uploadedRecord.original_filename}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatBytes(uploadedRecord.file_size_bytes)} &bull; {uploadedRecord.total_sheets} lembar kerja ditemukan
                </p>
              </div>
            </div>

            <button
              onClick={handleStartAnalysis}
              disabled={analyzing}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menganalisis Lembar Kerja...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Analisis Sheet: {selectedSheet}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Sheet Selector Tabs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Pilih Lembar Kerja untuk Diperiksa
            </label>
            <div className="flex flex-wrap gap-2">
              {uploadedRecord.sheet_names.map((sheet) => (
                <button
                  key={sheet}
                  onClick={() => handleSheetChange(sheet)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
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

          {/* Table Preview */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <TableIcon className="w-4 h-4 text-blue-600" />
                Pratinjau Data: {selectedSheet}
              </span>
              {preview && (
                <span className="text-xs text-slate-500">
                  Menampilkan {preview.data.length} dari {preview.total_rows.toLocaleString()} baris &bull; {preview.total_columns} kolom
                </span>
              )}
            </div>

            {previewLoading ? (
              <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-xs">Memuat pratinjau lembar kerja...</span>
              </div>
            ) : preview && preview.data.length > 0 ? (
              <div className="overflow-x-auto max-h-80">
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
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                Lembar kerja tidak memiliki data.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
