# Product Requirements Document (PRD) — Excel Insight

## 1. Product Overview
**Excel Insight** is a modern, production-grade web application that empowers users to transform raw Excel spreadsheets (.xlsx, .xls) into insightful data summaries, interactive charts, and downloadable professional PDF reports without manual spreadsheet formulas.

## 2. Target Users & Use Cases
- **Business Analysts & Managers**: Quickly generate board-ready reports from sales, finance, or inventory data.
- **Police & Administrative Officers**: Summarize incident logs, operational statistics, and resource metrics clearly for leadership briefing.
- **Researchers & Operations Teams**: Audit dataset quality, identify anomalies, missing values, and trend patterns.

## 3. User Journey
1. **Landing Page**: Public hero section displaying value proposition, visualization demo, core features, and workflow guide.
2. **Authentication**: Secure sign up, login, and session persistence via Supabase Auth.
3. **Dashboard Overview**: KPI cards (total files, total analyses, total reports, activity feeds), recent files table, and quick upload CTA.
4. **Excel Upload & Workbook Inspection**: Drag-and-drop file upload with format, MIME, and size validation. Automatic discovery of all worksheet tabs.
5. **Sheet Analysis & Data Quality**: Column type identification (numeric, categorical, datetime), missing value audit, duplicate detection, and tabular pagination preview.
6. **Smart Chart Recommendation**: Intelligent rule-based engine recommending Bar, Line, Pie, Donut, Scatter, Histogram, Stacked Bar, and Table based on column distributions.
7. **Chart Customization**: Configurable X/Y axes, aggregations (SUM, AVG, COUNT, MIN, MAX), date/category filters, sorting, and Top N limits with real-time interactive previews.
8. **PDF Report Generation**: Multi-page branded PDF reports generated with ReportLab containing executive summaries, selected charts, data tables, observations, and quality notes.
9. **History & Secure Download**: Storage of historical files and generated reports with signed URL access and strict user-level isolation.

## 4. Non-Functional Requirements
- **Security**: Strict Row-Level Security (RLS) on PostgreSQL, private Storage buckets, JWT verification on FastAPI backend, input sanitization.
- **Performance**: Asynchronous streaming for file parsing; sub-second query execution for table preview; efficient ReportLab rendering.
- **Design & Usability**: Responsive modern design using clean corporate blues (`#2563EB`), dark slate (`#0F172A`), soft borders, and clear typography.
- **Reliability**: Graceful fallback handling for irregular headers, merged cells, null values, or corrupted workbooks.
