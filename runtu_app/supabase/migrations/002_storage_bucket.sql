-- ============================================
-- RUNTU - Storage Bucket para Archivos
-- ============================================
-- Ejecuta esto en el SQL Editor de Supabase
-- después de la migración inicial (001)
-- ============================================

-- ============================================
-- 1. CREAR BUCKET (si no existe)
-- ============================================

-- Primero intentamos crear el bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'business-files',
    'business-files',
    FALSE, -- Privado, requiere autenticación
    26214400, -- 25MB máximo
    ARRAY[
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'audio/mpeg',
        'audio/wav',
        'audio/ogg',
        'audio/mp4',
        'video/mp4',
        'video/webm',
        'video/quicktime'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================
-- 2. POLÍTICAS RLS PARA STORAGE
-- ============================================
-- Estructura de path: {business_id}/{timestamp}_{filename}
-- Los usuarios solo pueden acceder a archivos de SU negocio

-- Eliminar políticas anteriores si existen
DROP POLICY IF EXISTS "Users can upload to own business folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own business files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own business files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own business files" ON storage.objects;

-- Función helper para obtener business_id del usuario actual
CREATE OR REPLACE FUNCTION public.get_user_business_id()
RETURNS UUID AS $$
  SELECT id FROM public.businesses WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- POLÍTICA: Subir archivos (INSERT)
-- Usuario puede subir si el primer segmento del path es su business_id
CREATE POLICY "Users can upload to own business folder"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'business-files' AND
    (storage.foldername(name))[1]::uuid = public.get_user_business_id()
);

-- POLÍTICA: Ver archivos (SELECT)
CREATE POLICY "Users can view own business files"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'business-files' AND
    (storage.foldername(name))[1]::uuid = public.get_user_business_id()
);

-- POLÍTICA: Actualizar archivos (UPDATE)
CREATE POLICY "Users can update own business files"
ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'business-files' AND
    (storage.foldername(name))[1]::uuid = public.get_user_business_id()
)
WITH CHECK (
    bucket_id = 'business-files' AND
    (storage.foldername(name))[1]::uuid = public.get_user_business_id()
);

-- POLÍTICA: Eliminar archivos (DELETE)
CREATE POLICY "Users can delete own business files"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'business-files' AND
    (storage.foldername(name))[1]::uuid = public.get_user_business_id()
);

-- ============================================
-- 3. VERIFICACIÓN
-- ============================================

-- Verificar que el bucket existe
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'business-files';

-- Verificar políticas de storage
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
AND policyname LIKE '%business%';

-- ============================================
-- ¡LISTO! El bucket está configurado.
-- ============================================
