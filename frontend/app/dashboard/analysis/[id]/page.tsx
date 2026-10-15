"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import {
  AnalysisRecord,
  ChartRecommendation,
  ComputedChartData,
  SelectedChartItem,
} from "@/types";
import {
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  ScatterChart as ScatterIcon,
  Table as TableIcon,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  Plus,
  Trash2,
  ArrowLeft,
  Loader2,
  Sliders,
  TrendingUp,
  Database,
  Hash,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

const CHART_COLORS = ["#2563EB", "#3B82F6", "#60A5FA", "#93C5FD", "#1D4ED8", "#1E40AF", "#0284C7"];

// Helper functions to ensure recommendations are always in Bahasa Indonesia
function formatRecTitle(title: string): string {
  return title
    .replace(/Total (.*) by (.*)/i, "Total $1 berdasarkan $2")
    .replace(/(.*) Trend Over Time/i, "Tren $1 Berdasarkan Waktu")
    .replace(/(.*) Share by (.*)/i, "Proporsi Komposisi $1 per $2")
    .replace(/(.*) vs (.*) Correlation/i, "Korelasi Nilai $1 vs $2")
    .replace(/(.*) Frequency Distribution/i, "Distribusi Frekuensi Rentang $1")
    .replace(/Tabular Data Summary/i, "Ringkasan Data Tabel Spreadsheet");
}

function formatRecReason(reason: string): string {
  if (reason.includes("Optimal for visualizing historical trends")) {
    return reason.replace(
      /Optimal for visualizing historical trends of (.*) across (.*)\./i,
      "Optimal untuk memantau tren historis perkembangan $1 sepanjang linimasa $2."
    );
  }
  if (reason.includes("Best for comparing performance")) {
    return reason.replace(
      /Best for comparing performance and aggregations of (.*) across distinct (.*) categories\./i,
      "Sangat ideal untuk membandingkan akumulasi $1 antar domain kategori $2."
    );
  }
  if (reason.includes("Ideal for showing proportional contribution")) {
    return reason.replace(
      /Ideal for showing proportional contribution of each (.*) segment \((.*) parts\)\./i,
      "Tepat untuk menampilkan persentase distribusi dari masing-masing segmen $1 ($2 bagian unik)."
    );
  }
  if (reason.includes("Evaluates statistical correlation")) {
    return reason.replace(
      /Evaluates statistical correlation, outliers, and cluster patterns between (.*) and (.*)\./i,
      "Menganalisis hubungan korelasi statistik, sebaran klaster, dan titik anomali antara $1 dan $2."
    );
  }
  if (reason.includes("Highlights data skewness")) {
    return reason.replace(
      /Highlights data skewness, concentration intervals, and variance for (.*)\./i,
      "Menampilkan densitas frekuensi, varians rentang nilai, dan pola persebaran $1."
    );
  }
  if (reason.includes("Structured raw and aggregated data grid")) {
    return "Tinjauan tabulasi matriks data terstruktur untuk pengecekan detail baris dan kolom.";
  }
  return reason;
}

export default function AnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const analysisId = resolvedParams.id;

  const [analysis, setAnalysis] = useState<AnalysisRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Chart configuration state
  const [chartType, setChartType] = useState<string>("bar");
  const [xAxis, setXAxis] = useState<string>("");
  const [yAxis, setYAxis] = useState<string>("");
  const [aggregation, setAggregation] = useState<string>("sum");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [topN, setTopN] = useState<number>(10);

  // Computed chart data
  const [chartData, setChartData] = useState<ComputedChartData | null>(null);
  const [computingChart, setComputingChart] = useState(false);

  // Report Basket
  const [selectedCharts, setSelectedCharts] = useState<SelectedChartItem[]>([]);
  const [reportTitle, setReportTitle] = useState("Laporan Kinerja & Analisis Eksekutif");
  const [executiveSummary, setExecutiveSummary] = useState(
    "Laporan audit kualitas data dan intelijen analitik otomatis yang dikompilasi dari buku kerja spreadsheet."
  );
  const [keyFindings, setKeyFindings] = useState<string[]>([
    "Kategori data utama menunjukkan konsentrasi volume yang signifikan.",
    "Tingkat kelengkapan dataset terverifikasi melampaui ambang batas kualitas standar.",
  ]);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportSuccessUrl, setReportSuccessUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnalysis() {
      try {
        setLoading(true);
        const data = await apiClient.getAnalysis(analysisId);
        setAnalysis(data);

        // Set default chart from top recommendation if available
        if (data.recommendations && data.recommendations.length > 0) {
          const topRec = data.recommendations[0];
          applyRecommendation(topRec, data);
        } else if (data.columns_metadata.length > 0) {
          const firstCat = data.columns_metadata.find((c) => c.general_type === "categorical")?.name || data.columns_metadata[0].name;
          const firstNum = data.columns_metadata.find((c) => c.general_type === "numeric")?.name || "";
          setXAxis(firstCat);
          setYAxis(firstNum);
          fetchChartData(analysisId, "bar", firstCat, firstNum, "sum", "desc", 10);
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Gagal memuat data analisis");
      } finally {
        setLoading(false);
      }
    }
    loadAnalysis();
  }, [analysisId]);

  const applyRecommendation = (rec: ChartRecommendation, currentAnalysis = analysis) => {
    setChartType(rec.chart_type);
    setXAxis(rec.x_axis);
    setYAxis(rec.y_axis || "");
    setAggregation(rec.aggregation || "sum");
    fetchChartData(
      analysisId,
      rec.chart_type,
      rec.x_axis,
      rec.y_axis || undefined,
      rec.aggregation || "sum",
      sortOrder,
      topN
    );
  };

  const fetchChartData = async (
    id: string,
    cType: string,
    xCol: string,
    yCol?: string,
    agg = "sum",
    sort = "desc",
    limit = 10
  ) => {
    if (!xCol) return;
    setComputingChart(true);
    try {
      const data = await apiClient.computeChart(id, {
        chart_type: cType,
        x_axis: xCol,
        y_axis: yCol || null,
        aggregation: agg,
        sort_order: sort,
        top_n: limit,
      });
      setChartData(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setComputingChart(false);
    }
  };

  const handleUpdateChart = () => {
    fetchChartData(analysisId, chartType, xAxis, yAxis || undefined, aggregation, sortOrder, topN);
  };

  const handleAddChartToReport = () => {
    if (!chartData) return;
    const newChart: SelectedChartItem = {
      title: `${yAxis ? `${yAxis} berdasarkan ${xAxis}` : `Distribusi ${xAxis}`} (${chartType.toUpperCase()})`,
      chart_type: chartType,
      x_axis: xAxis,
      y_axis: yAxis || undefined,
      aggregation: aggregation,
      chart_data: chartData.chart_data,
      insight: `Agregasi ${aggregation.toUpperCase()} dari ${yAxis || "jumlah baris"} menurut ${xAxis}.`,
    };
    setSelectedCharts([...selectedCharts, newChart]);
  };

  const handleRemoveChart = (index: number) => {
    setSelectedCharts(selectedCharts.filter((_, i) => i !== index));
  };

  const handleGeneratePdf = async () => {
    if (selectedCharts.length === 0) {
      alert("Silakan tambahkan setidaknya satu grafik ke keranjang laporan sebelum mengekspor.");
      return;
    }
    setGeneratingReport(true);
    setReportSuccessUrl(null);
    try {
      const report = await apiClient.createReport({
        analysis_id: analysisId,
        title: reportTitle,
        executive_summary: executiveSummary,
        selected_charts: selectedCharts,
        key_findings: keyFindings,
      });
      // Trigger download
      await apiClient.downloadReport(report.id, reportTitle);
      setReportSuccessUrl(`/dashboard/reports`);
    } catch (err: any) {
      alert(err.message || "Gagal menyusun laporan PDF");
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium">Menjalankan diagnostik kualitas data & kalkulasi analitik...</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
        <p className="text-sm text-slate-500">Rekaman analisis tidak ditemukan.</p>
        <Link href="/dashboard" className="text-xs text-blue-600 font-semibold underline mt-2 inline-block">
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  const { quality_summary: q, statistical_summary: stats, columns_metadata: cols } = analysis;

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-16">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/dashboard/files"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Repositori Spreadsheet</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Analisis Data: {analysis.sheet_name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {analysis.row_count.toLocaleString()} baris &bull; {analysis.column_count} kolom &bull; Kualitas Data Terverifikasi
          </p>
        </div>

        <a
          href="#report-section"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition self-start sm:self-auto"
        >
          <FileText className="w-4 h-4 text-blue-400" />
          <span>Keranjang Laporan ({selectedCharts.length})</span>
        </a>
      </div>
      {/* 1. DATA QUALITY & HEALTH AUDIT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Kelengkapan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Kelengkapan Data
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-3xl font-extrabold text-slate-900">
              {q?.completeness_score || 100}%
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                q?.quality_grade === "Excellent"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : q?.quality_grade === "Good"
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {q?.quality_grade === "Excellent" ? "Sangat Baik" : q?.quality_grade === "Good" ? "Baik" : "Cukup"}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 mt-3 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${q?.completeness_score || 100}%` }}
            />
          </div>
        </div>

        {/* Card 2: Nilai Kosong */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Nilai Kosong (Missing)
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-3xl font-extrabold text-slate-900">
              {q?.missing_cells || 0}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {q?.missing_percentage || 0}% total sel
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Dari {q?.total_cells?.toLocaleString() || 0} total titik sel data
          </p>
        </div>

        {/* Card 3: Duplikasi Baris */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Duplikasi Baris
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-3xl font-extrabold text-slate-900">
              {q?.duplicate_rows || 0}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {q?.duplicate_percentage || 0}% baris
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Baris identik persis teridentifikasi
          </p>
        </div>

        {/* Card 4: Tipe Kolom */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Tipe Data Kolom
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Hash className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200/60">
              {cols.filter((c) => c.general_type === "numeric").length} Numerik
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200/60">
              {cols.filter((c) => c.general_type === "categorical").length} Kategori
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200/60">
              {cols.filter((c) => c.general_type === "datetime").length} Tanggal
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Total {cols.length} kolom terdeteksi otomatis
          </p>
        </div>
      </div>

      {/* 2. SMART CHART RECOMMENDATIONS */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white rounded-2xl border border-blue-100/90 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 tracking-tight">
                  Rekomendasi Grafik Cerdas
                </h3>
                <span className="text-[11px] text-blue-700 font-bold bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
                  Dipilih Otomatis
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Klik kartu rekomendasi di bawah untuk langsung memuat visualisasi grafik ke studio analisis.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysis.recommendations.map((rec) => (
              <div
                key={rec.id}
                onClick={() => applyRecommendation(rec)}
                className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-sm hover:border-blue-500 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                      {rec.chart_type}
                    </span>
                    <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      {Math.round(rec.score * 100)}% cocok
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition leading-snug">
                    {formatRecTitle(rec.title)}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    {formatRecReason(rec.reason)}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
                  <span>Muat Visualisasi Ini</span>
                  <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. CHART BUILDER & LIVE VISUALIZATION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 lg:col-span-1 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
              Studio Visualisasi
            </h3>
          </div>

          {/* Chart Type Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Tipe Grafik
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "bar", name: "Batang", icon: BarChart3 },
                { id: "line", name: "Garis", icon: LineChartIcon },
                { id: "donut", name: "Donat", icon: PieChartIcon },
                { id: "scatter", name: "Sebar", icon: ScatterIcon },
                { id: "histogram", name: "Histogram", icon: BarChart3 },
                { id: "table", name: "Tabel", icon: TableIcon },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setChartType(t.id)}
                  className={`p-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 border transition cursor-pointer ${
                    chartType === t.id
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <t.icon className="w-4 h-4" />
                  <span>{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* X Axis */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Sumbu X (Dimensi / Kategori)
            </label>
            <select
              value={xAxis}
              onChange={(e) => setXAxis(e.target.value)}
              className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {cols.map((col) => (
                <option key={col.name} value={col.name}>
                  {col.name} ({col.general_type === "numeric" ? "numerik" : col.general_type === "categorical" ? "kategori" : "tanggal"})
                </option>
              ))}
            </select>
          </div>

          {/* Y Axis (Metric) */}
          {chartType !== "histogram" && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Sumbu Y (Metrik / Nilai)
              </label>
              <select
                value={yAxis}
                onChange={(e) => setYAxis(e.target.value)}
                className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">(Hitung Jumlah Baris / Frekuensi)</option>
                {cols
                  .filter((c) => c.general_type === "numeric")
                  .map((col) => (
                    <option key={col.name} value={col.name}>
                      {col.name} (numerik)
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Aggregation */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Metode Agregasi
            </label>
            <select
              value={aggregation}
              onChange={(e) => setAggregation(e.target.value)}
              className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="sum">SUM (Total Penjumlahan)</option>
              <option value="avg">AVERAGE (Rata-rata)</option>
              <option value="count">COUNT (Jumlah Baris)</option>
              <option value="min">MINIMUM (Nilai Terkecil)</option>
              <option value="max">MAXIMUM (Nilai Terbesar)</option>
            </select>
          </div>

          {/* Top N */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Batas Data
              </label>
              <select
                value={topN}
                onChange={(e) => setTopN(Number(e.target.value))}
                className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 cursor-pointer"
              >
                <option value={5}>Top 5</option>
                <option value={10}>Top 10</option>
                <option value={15}>Top 15</option>
                <option value={20}>Top 20</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Urutan
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 cursor-pointer"
              >
                <option value="desc">Tertinggi ke Terendah</option>
                <option value="asc">Terendah ke Tertinggi</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleUpdateChart}
              disabled={computingChart}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {computingChart ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Mengkalkulasi...
                </>
              ) : (
                "Perbarui Pratinjau Grafik"
              )}
            </button>

            <button
              type="button"
              onClick={handleAddChartToReport}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambahkan Grafik ke Laporan PDF
            </button>
          </div>
        </div>

        {/* Live Visualization Canvas */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:col-span-2 shadow-sm flex flex-col justify-between min-h-[420px]">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {yAxis ? `${yAxis} berdasarkan ${xAxis}` : `Distribusi ${xAxis}`}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Agregasi: {aggregation.toUpperCase()} &bull; Menampilkan {topN} baris data teratas
                </p>
              </div>
              <span className="text-[11px] font-bold uppercase px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                {chartType}
              </span>
            </div>

            {computingChart ? (
              <div className="h-72 flex items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-sm">Menghitung agregasi data...</span>
              </div>
            ) : chartData && chartData.chart_data.length > 0 ? (
              <div className="h-72 w-full">
                {chartType === "bar" && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.chart_data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#2563EB" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {chartType === "line" && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.chart_data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                {chartType === "donut" && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip />
                      <Pie
                        data={chartData.chart_data}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={85}
                        paddingAngle={3}
                      >
                        {chartData.chart_data.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}

                {chartType === "scatter" && (
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="x" name={xAxis} tick={{ fontSize: 11, fill: "#64748b" }} />
                      <YAxis dataKey="y" name={yAxis || "Y"} tick={{ fontSize: 11, fill: "#64748b" }} />
                      <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                      <Scatter data={chartData.chart_data} fill="#2563EB" />
                    </ScatterChart>
                  </ResponsiveContainer>
                )}

                {chartType === "histogram" && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.chart_data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {chartType === "table" && (
                  <div className="overflow-x-auto max-h-72">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          {Object.keys(chartData.chart_data[0] || {}).map((k) => (
                            <th key={k} className="py-2 px-3 font-semibold text-slate-600 uppercase">
                              {k}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {chartData.chart_data.map((r, i) => (
                          <tr key={i}>
                            {Object.values(r).map((v: any, j) => (
                              <td key={j} className="py-1.5 px-3">
                                {String(v)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-slate-400 text-xs">
                Belum ada data yang dikalkulasi.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Titik data ditampilkan: {chartData?.total_points || 0}</span>
            <span className="text-blue-600 font-semibold cursor-pointer hover:underline" onClick={handleAddChartToReport}>
              + Tambahkan pratinjau ini ke PDF
            </span>
          </div>
        </div>
      </div>

      {/* 4. REPORTLAB PDF REPORT COMPOSER BASKET */}
      <div id="report-section" className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-base text-slate-900">
                Penyusun Laporan Eksekutif PDF (ReportLab)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih grafik dan sesuaikan narasi. Kompilasi dokumen PDF multi-halaman resmi lengkap dengan nomor halaman.
            </p>
          </div>

          <button
            onClick={handleGeneratePdf}
            disabled={generatingReport || selectedCharts.length === 0}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-2 self-start sm:self-auto disabled:opacity-50 cursor-pointer"
          >
            {generatingReport ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Mengompilasi PDF ReportLab...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Kompilasi & Unduh Laporan PDF
              </>
            )}
          </button>
        </div>

        {reportSuccessUrl && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
            <span className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Laporan PDF berhasil dikompilasi dan diunduh ke perangkat Anda!
            </span>
            <Link href="/dashboard/reports" className="font-bold underline">
              Buka Riwayat Laporan
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Judul Dokumen Laporan
              </label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="w-full py-2.5 px-3.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Narasi Ringkasan Eksekutif
              </label>
              <textarea
                rows={4}
                value={executiveSummary}
                onChange={(e) => setExecutiveSummary(e.target.value)}
                className="w-full py-2.5 px-3.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Grafik & Visualisasi Terpilih ({selectedCharts.length})
            </label>

            {selectedCharts.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400">
                Belum ada grafik dalam keranjang laporan.
                <p className="mt-1 text-slate-500">
                  Klik <b>"Tambahkan Grafik ke Laporan PDF"</b> di atas untuk menyertakan grafik ke dokumen.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedCharts.map((ch, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 mr-2">
                        {ch.chart_type}
                      </span>
                      <span className="text-xs font-semibold text-slate-900">
                        {ch.title}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">
                        {ch.insight}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveChart(idx)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded cursor-pointer transition"
                      title="Hapus grafik"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
