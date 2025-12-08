"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getFileTypeFromMime, type FileTypeEnum } from "@/types/file";

// ============================================
// Types
// ============================================

export interface UploadResult {
  success: boolean;
  fileId?: string;
  storagePath?: string;
  error?: string;
}

export interface UploadProgress {
  [fileId: string]: number;
}

export interface UploadErrors {
  [fileId: string]: string;
}

export interface UseFileUploadReturn {
  uploadFile: (file: File) => Promise<UploadResult>;
  uploadMultiple: (files: File[]) => Promise<UploadResult[]>;
  progress: UploadProgress;
  isUploading: boolean;
  errors: UploadErrors;
  clearErrors: () => void;
  reset: () => void;
}

// ============================================
// Constants
// ============================================

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "video/mp4",
  "video/webm",
];

const BUCKET_NAME = "business-files";

// ============================================
// Helpers
// ============================================

function generateFileId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function sanitizeFilename(filename: string): string {
  // Remove special characters, keep extension
  return filename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-zA-Z0-9._-]/g, "_") // Replace special chars
    .replace(/_+/g, "_"); // Collapse multiple underscores
}

function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `El archivo excede el límite de 25MB (${(file.size / 1024 / 1024).toFixed(1)}MB)`,
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de archivo no soportado: ${file.type || "desconocido"}`,
    };
  }

  return { valid: true };
}

// ============================================
// Hook
// ============================================

export function useFileUpload(): UseFileUploadReturn {
  const [progress, setProgress] = useState<UploadProgress>({});
  const [errors, setErrors] = useState<UploadErrors>({});
  const [isUploading, setIsUploading] = useState(false);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const reset = useCallback(() => {
    setProgress({});
    setErrors({});
    setIsUploading(false);
  }, []);

  const uploadFile = useCallback(async (file: File): Promise<UploadResult> => {
    const fileId = generateFileId();
    const supabase = createClient();

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      setErrors((prev) => ({ ...prev, [fileId]: validation.error! }));
      console.error("[Upload] Validation failed:", validation.error);
      return { success: false, error: validation.error };
    }

    try {
      setIsUploading(true);
      setProgress((prev) => ({ ...prev, [fileId]: 0 }));

      // Get current user and business
      console.log("[Upload] Getting user...");
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error("[Upload] Auth error:", authError);
        throw new Error("No autenticado");
      }
      console.log("[Upload] User ID:", user.id);

      // Get user's business
      console.log("[Upload] Getting business...");
      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (businessError) {
        console.error("[Upload] Business error:", businessError);
        throw new Error(`No se encontró tu negocio: ${businessError.message}`);
      }

      if (!business) {
        console.error("[Upload] No business found for user");
        throw new Error("No se encontró tu negocio. Por favor contacta soporte.");
      }

      console.log("[Upload] Business ID:", business.id);

      // Generate storage path: {business_id}/{timestamp}_{filename}
      const timestamp = Date.now();
      const sanitizedName = sanitizeFilename(file.name);
      const storagePath = `${business.id}/${timestamp}_${sanitizedName}`;

      // Simulate progress (Supabase doesn't provide real progress)
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const current = prev[fileId] || 0;
          if (current < 90) {
            return { ...prev, [fileId]: current + 10 };
          }
          return prev;
        });
      }, 200);

      // Upload to Supabase Storage
      console.log("[Upload] Uploading to storage:", storagePath);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      clearInterval(progressInterval);

      if (uploadError) {
        console.error("[Upload] Storage error:", uploadError);
        throw new Error(`Error de storage: ${uploadError.message}`);
      }
      console.log("[Upload] Storage upload success:", uploadData);

      setProgress((prev) => ({ ...prev, [fileId]: 95 }));

      // Create record in uploads table
      const fileType: FileTypeEnum = getFileTypeFromMime(file.type);

      const { data: uploadRecord, error: dbError } = await supabase
        .from("uploads")
        .insert({
          business_id: business.id,
          filename: file.name,
          file_type: file.type,
          storage_path: storagePath,
          file_size: file.size,
          processed: false,
          processing_status: "pending",
          metadata: {
            originalName: file.name,
            mimeType: file.type,
            fileType: fileType,
          },
        })
        .select()
        .single();

      if (dbError) {
        console.error("[Upload] DB insert error:", dbError);
        // Try to delete the uploaded file if DB insert fails
        await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
        throw new Error(`Error de base de datos: ${dbError.message}`);
      }

      console.log("[Upload] DB insert success:", uploadRecord);

      setProgress((prev) => ({ ...prev, [fileId]: 100 }));

      return {
        success: true,
        fileId: uploadRecord.id,
        storagePath,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      console.error("[Upload] Final error:", errorMessage);
      setErrors((prev) => ({ ...prev, [fileId]: errorMessage }));
      return { success: false, error: errorMessage };
    } finally {
      setIsUploading(false);
    }
  }, []);

  const uploadMultiple = useCallback(
    async (files: File[]): Promise<UploadResult[]> => {
      setIsUploading(true);
      const results: UploadResult[] = [];

      for (const file of files) {
        const result = await uploadFile(file);
        results.push(result);
      }

      setIsUploading(false);
      return results;
    },
    [uploadFile]
  );

  return {
    uploadFile,
    uploadMultiple,
    progress,
    isUploading,
    errors,
    clearErrors,
    reset,
  };
}
