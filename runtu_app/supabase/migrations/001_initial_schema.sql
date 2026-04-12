-- ============================================
-- RUNTU - Schema Inicial para Supabase
-- ============================================
-- Este archivo crea todas las tablas, triggers,
-- políticas RLS y storage buckets necesarios.
--
-- INSTRUCCIONES:
-- 1. Ve a tu dashboard de Supabase
-- 2. Ve a "SQL Editor"
-- 3. Copia y pega todo este código
-- 4. Haz clic en "Run"
-- ============================================

-- ============================================
-- 1. EXTENSIONES
-- ============================================
-- Habilitamos la extensión UUID si no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. TABLA: businesses
-- ============================================
-- Almacena información del negocio de cada usuario

CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Mi Negocio',
    industry TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Cada usuario solo puede tener un negocio
    CONSTRAINT businesses_user_id_unique UNIQUE (user_id)
);

-- Índice para búsquedas rápidas por user_id
CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON public.businesses(user_id);

-- Comentarios de documentación
COMMENT ON TABLE public.businesses IS 'Información de negocios de usuarios de Runtu';
COMMENT ON COLUMN public.businesses.user_id IS 'Referencia al usuario en auth.users';
COMMENT ON COLUMN public.businesses.name IS 'Nombre del negocio';
COMMENT ON COLUMN public.businesses.industry IS 'Tipo de industria/rubro del negocio';

-- ============================================
-- 3. TABLA: uploads
-- ============================================
-- Almacena los archivos subidos por cada negocio

CREATE TABLE IF NOT EXISTS public.uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_size BIGINT,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    processing_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_uploads_business_id ON public.uploads(business_id);
CREATE INDEX IF NOT EXISTS idx_uploads_processing_status ON public.uploads(processing_status);
CREATE INDEX IF NOT EXISTS idx_uploads_created_at ON public.uploads(created_at DESC);

-- Comentarios de documentación
COMMENT ON TABLE public.uploads IS 'Archivos subidos por los negocios';
COMMENT ON COLUMN public.uploads.business_id IS 'Negocio dueño del archivo';
COMMENT ON COLUMN public.uploads.filename IS 'Nombre original del archivo';
COMMENT ON COLUMN public.uploads.file_type IS 'Tipo MIME del archivo';
COMMENT ON COLUMN public.uploads.storage_path IS 'Ruta en Supabase Storage';
COMMENT ON COLUMN public.uploads.processed IS 'Si el archivo ya fue procesado por Runtu';
COMMENT ON COLUMN public.uploads.processing_status IS 'Estado del procesamiento: pending, processing, completed, failed';
COMMENT ON COLUMN public.uploads.metadata IS 'Datos extraídos y metadatos adicionales';

-- ============================================
-- 4. FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para businesses
DROP TRIGGER IF EXISTS update_businesses_updated_at ON public.businesses;
CREATE TRIGGER update_businesses_updated_at
    BEFORE UPDATE ON public.businesses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para uploads
DROP TRIGGER IF EXISTS update_uploads_updated_at ON public.uploads;
CREATE TRIGGER update_uploads_updated_at
    BEFORE UPDATE ON public.uploads
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Función para crear un negocio automáticamente cuando un usuario se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.businesses (user_id, name)
    VALUES (NEW.id, 'Mi Negocio');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que crea negocio al registrarse un usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================
-- Políticas de seguridad para que cada usuario
-- solo vea sus propios datos

-- Habilitar RLS en las tablas
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes (si las hay)
DROP POLICY IF EXISTS "Users can view own business" ON public.businesses;
DROP POLICY IF EXISTS "Users can update own business" ON public.businesses;
DROP POLICY IF EXISTS "Users can insert own business" ON public.businesses;
DROP POLICY IF EXISTS "Users can view own uploads" ON public.uploads;
DROP POLICY IF EXISTS "Users can insert own uploads" ON public.uploads;
DROP POLICY IF EXISTS "Users can update own uploads" ON public.uploads;
DROP POLICY IF EXISTS "Users can delete own uploads" ON public.uploads;

-- Políticas para businesses
CREATE POLICY "Users can view own business"
    ON public.businesses
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own business"
    ON public.businesses
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own business"
    ON public.businesses
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Políticas para uploads
CREATE POLICY "Users can view own uploads"
    ON public.uploads
    FOR SELECT
    USING (
        business_id IN (
            SELECT id FROM public.businesses WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own uploads"
    ON public.uploads
    FOR INSERT
    WITH CHECK (
        business_id IN (
            SELECT id FROM public.businesses WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own uploads"
    ON public.uploads
    FOR UPDATE
    USING (
        business_id IN (
            SELECT id FROM public.businesses WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        business_id IN (
            SELECT id FROM public.businesses WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own uploads"
    ON public.uploads
    FOR DELETE
    USING (
        business_id IN (
            SELECT id FROM public.businesses WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- 6. STORAGE BUCKET
-- ============================================
-- Crear bucket para archivos de usuarios

-- Nota: Este código solo funciona si tienes permisos de storage
-- Si da error, créalo manualmente desde el dashboard

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'uploads',
    'uploads',
    FALSE,
    26214400, -- 25MB en bytes
    ARRAY[
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'image/jpeg',
        'image/png',
        'image/webp',
        'audio/mpeg',
        'audio/wav',
        'audio/ogg',
        'video/mp4',
        'video/webm'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Políticas de storage
DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

CREATE POLICY "Users can upload own files"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'uploads' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own files"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'uploads' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own files"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'uploads' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- ============================================
-- 7. VERIFICACIÓN
-- ============================================
-- Estas queries verifican que todo se creó correctamente

-- Verificar tablas
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN ('businesses', 'uploads');

-- Verificar políticas RLS
SELECT
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- ¡LISTO! Tu base de datos está configurada.
-- ============================================
