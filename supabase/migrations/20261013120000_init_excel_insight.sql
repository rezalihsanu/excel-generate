-- ====================================================================
-- Excel Insight Initial Schema & Security Policies Migration
-- ====================================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    organization TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Trigger for auto-profile creation on auth.users sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. UPLOADED_FILES TABLE
CREATE TABLE IF NOT EXISTS public.uploaded_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    original_filename TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    sheet_names JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_sheets INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'uploaded', -- 'uploaded', 'processed', 'error'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_uploaded_files_user_id ON public.uploaded_files(user_id);
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own uploaded files"
    ON public.uploaded_files FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own uploaded files"
    ON public.uploaded_files FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own uploaded files"
    ON public.uploaded_files FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own uploaded files"
    ON public.uploaded_files FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);


-- 3. ANALYSES TABLE
CREATE TABLE IF NOT EXISTS public.analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES public.uploaded_files(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sheet_name TEXT NOT NULL,
    row_count INTEGER NOT NULL DEFAULT 0,
    column_count INTEGER NOT NULL DEFAULT 0,
    columns_metadata JSONB NOT NULL DEFAULT '[]'::jsonb,
    quality_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    statistical_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_file_id ON public.analyses(file_id);
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analyses"
    ON public.analyses FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analyses"
    ON public.analyses FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analyses"
    ON public.analyses FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses"
    ON public.analyses FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);


-- 4. CHART_CONFIGURATIONS TABLE
CREATE TABLE IF NOT EXISTS public.chart_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    chart_type TEXT NOT NULL,
    x_axis TEXT NOT NULL,
    y_axis TEXT NOT NULL,
    aggregation TEXT NOT NULL DEFAULT 'sum',
    filters JSONB DEFAULT '{}'::jsonb,
    sort_order TEXT DEFAULT 'desc',
    top_n INTEGER DEFAULT 10,
    chart_data JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_charts_user_id ON public.chart_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_charts_analysis_id ON public.chart_configurations(analysis_id);
ALTER TABLE public.chart_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own charts"
    ON public.chart_configurations FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own charts"
    ON public.chart_configurations FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own charts"
    ON public.chart_configurations FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own charts"
    ON public.chart_configurations FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);


-- 5. REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    selected_charts JSONB NOT NULL DEFAULT '[]'::jsonb,
    executive_summary TEXT,
    key_findings JSONB DEFAULT '[]'::jsonb,
    storage_path TEXT NOT NULL,
    file_size_bytes BIGINT DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_analysis_id ON public.reports(analysis_id);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports"
    ON public.reports FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reports"
    ON public.reports FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports"
    ON public.reports FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports"
    ON public.reports FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);


-- 6. STORAGE BUCKETS SETUP
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('excel-uploads', 'excel-uploads', false, 52428800, ARRAY['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']),
    ('pdf-reports', 'pdf-reports', false, 52428800, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET 
    public = false,
    file_size_limit = 52428800;

-- Storage RLS Policies
DROP POLICY IF EXISTS "Users can upload their own excel files" ON storage.objects;
CREATE POLICY "Users can upload their own excel files"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'excel-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can view their own excel files" ON storage.objects;
CREATE POLICY "Users can view their own excel files"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'excel-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete their own excel files" ON storage.objects;
CREATE POLICY "Users can delete their own excel files"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'excel-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can upload their own pdf reports" ON storage.objects;
CREATE POLICY "Users can upload their own pdf reports"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'pdf-reports' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can view their own pdf reports" ON storage.objects;
CREATE POLICY "Users can view their own pdf reports"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'pdf-reports' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete their own pdf reports" ON storage.objects;
CREATE POLICY "Users can delete their own pdf reports"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'pdf-reports' AND (storage.foldername(name))[1] = auth.uid()::text);
