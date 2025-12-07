-- ============================================
-- RUNTU - Initial Database Schema
-- Multitenant SaaS for Latin American businesses
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Businesses table (one per user, multitenant)
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Mi Negocio',
    industry TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure one business per user (can be relaxed later for multi-business)
    CONSTRAINT unique_user_business UNIQUE (user_id)
);

-- Uploads table (files uploaded by businesses)
CREATE TABLE IF NOT EXISTS public.uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_size BIGINT,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    processing_status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON public.businesses(user_id);

-- Index for faster lookups by business
CREATE INDEX IF NOT EXISTS idx_uploads_business_id ON public.uploads(business_id);

-- Index for filtering unprocessed uploads
CREATE INDEX IF NOT EXISTS idx_uploads_processed ON public.uploads(processed) WHERE processed = FALSE;

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to businesses
DROP TRIGGER IF EXISTS set_businesses_updated_at ON public.businesses;
CREATE TRIGGER set_businesses_updated_at
    BEFORE UPDATE ON public.businesses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Apply updated_at trigger to uploads
DROP TRIGGER IF EXISTS set_uploads_updated_at ON public.uploads;
CREATE TRIGGER set_uploads_updated_at
    BEFORE UPDATE ON public.uploads
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- AUTO-CREATE BUSINESS ON USER SIGNUP
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.businesses (user_id, name, industry)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'business_name', 'Mi Negocio'),
        NEW.raw_user_meta_data->>'industry'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create business when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES FOR BUSINESSES
-- ============================================

-- Users can view their own businesses
DROP POLICY IF EXISTS "Users can view own businesses" ON public.businesses;
CREATE POLICY "Users can view own businesses"
    ON public.businesses
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own businesses (usually handled by trigger)
DROP POLICY IF EXISTS "Users can insert own businesses" ON public.businesses;
CREATE POLICY "Users can insert own businesses"
    ON public.businesses
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own businesses
DROP POLICY IF EXISTS "Users can update own businesses" ON public.businesses;
CREATE POLICY "Users can update own businesses"
    ON public.businesses
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own businesses
DROP POLICY IF EXISTS "Users can delete own businesses" ON public.businesses;
CREATE POLICY "Users can delete own businesses"
    ON public.businesses
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- POLICIES FOR UPLOADS
-- ============================================

-- Users can view uploads from their own businesses
DROP POLICY IF EXISTS "Users can view own uploads" ON public.uploads;
CREATE POLICY "Users can view own uploads"
    ON public.uploads
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE businesses.id = uploads.business_id
            AND businesses.user_id = auth.uid()
        )
    );

-- Users can insert uploads to their own businesses
DROP POLICY IF EXISTS "Users can insert own uploads" ON public.uploads;
CREATE POLICY "Users can insert own uploads"
    ON public.uploads
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE businesses.id = uploads.business_id
            AND businesses.user_id = auth.uid()
        )
    );

-- Users can update uploads from their own businesses
DROP POLICY IF EXISTS "Users can update own uploads" ON public.uploads;
CREATE POLICY "Users can update own uploads"
    ON public.uploads
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE businesses.id = uploads.business_id
            AND businesses.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE businesses.id = uploads.business_id
            AND businesses.user_id = auth.uid()
        )
    );

-- Users can delete uploads from their own businesses
DROP POLICY IF EXISTS "Users can delete own uploads" ON public.uploads;
CREATE POLICY "Users can delete own uploads"
    ON public.uploads
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE businesses.id = uploads.business_id
            AND businesses.user_id = auth.uid()
        )
    );

-- ============================================
-- STORAGE BUCKET FOR UPLOADS (run in Supabase dashboard)
-- ============================================

-- Note: Run this in the Supabase SQL Editor or Dashboard
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('uploads', 'uploads', false);

-- Storage policies (run in dashboard):
-- CREATE POLICY "Users can upload files to their business folder"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--     bucket_id = 'uploads' AND
--     (storage.foldername(name))[1] = auth.uid()::text
-- );

-- CREATE POLICY "Users can view their own files"
-- ON storage.objects FOR SELECT
-- USING (
--     bucket_id = 'uploads' AND
--     (storage.foldername(name))[1] = auth.uid()::text
-- );

-- CREATE POLICY "Users can delete their own files"
-- ON storage.objects FOR DELETE
-- USING (
--     bucket_id = 'uploads' AND
--     (storage.foldername(name))[1] = auth.uid()::text
-- );
