export interface UserProfile {
  id: string;
  full_name: string | null;
  organization: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface UploadedFileRecord {
  id: string;
  user_id: string;
  original_filename: string;
  storage_path: string;
  file_size_bytes: number;
  mime_type: string;
  sheet_names: string[];
  total_sheets: number;
  status: string;
  created_at: string;
}

export interface ColumnMetadata {
  name: string;
  dtype: string;
  general_type: "numeric" | "categorical" | "datetime" | "boolean" | "text";
  null_count: number;
  null_percentage: number;
  unique_count: number;
  sample_values: any[];
}

export interface QualitySummary {
  total_cells: number;
  missing_cells: number;
  missing_percentage: number;
  duplicate_rows: number;
  duplicate_percentage: number;
  completeness_score: number;
  quality_grade: "Excellent" | "Good" | "Fair" | "Poor";
}

export interface ChartRecommendation {
  id: string;
  chart_type: "bar" | "line" | "pie" | "donut" | "scatter" | "histogram" | "stacked_bar" | "table";
  title: string;
  x_axis: string;
  y_axis?: string | null;
  aggregation?: "sum" | "avg" | "count" | "min" | "max" | null;
  score: number;
  reason: string;
}

export interface AnalysisRecord {
  id: string;
  file_id: string;
  user_id: string;
  sheet_name: string;
  row_count: number;
  column_count: number;
  columns_metadata: ColumnMetadata[];
  quality_summary: QualitySummary;
  statistical_summary: Record<string, any>;
  recommendations: ChartRecommendation[];
  created_at: string;
}

export interface SelectedChartItem {
  title: string;
  chart_type: string;
  x_axis: string;
  y_axis?: string | null;
  aggregation?: string | null;
  chart_data?: any[];
  insight?: string | null;
}

export interface ChartDataItem {
  name?: string;
  value?: number;
  [key: string]: any;
}

export interface ComputedChartData {
  chart_type: string;
  x_axis: string;
  y_axis?: string | null;
  aggregation?: string | null;
  chart_data: ChartDataItem[];
  total_points: number;
}

export interface ReportRecord {
  id: string;
  analysis_id: string;
  user_id: string;
  title: string;
  description?: string | null;
  selected_charts: any[];
  executive_summary?: string | null;
  key_findings: string[];
  storage_path: string;
  file_size_bytes: number;
  status: string;
  created_at: string;
  download_url?: string;
}

export interface PaginatedFilePreview {
  file_id: string;
  sheet_name: string;
  page: number;
  page_size: number;
  total_rows: number;
  total_columns: number;
  total_pages: number;
  columns: string[];
  data: Record<string, any>[];
}
