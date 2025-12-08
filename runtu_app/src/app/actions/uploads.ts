"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ============================================
// Types
// ============================================

export interface UploadRecord {
  id: string;
  business_id: string;
  filename: string;
  file_type: string;
  storage_path: string;
  file_size: number | null;
  processed: boolean;
  processing_status: "pending" | "processing" | "completed" | "failed";
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================
// Helper: Get current user's business ID
// ============================================

async function getCurrentBusinessId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  return business?.id || null;
}

// ============================================
// Actions
// ============================================

/**
 * Get all uploads for the current user's business
 */
export async function getUploads(): Promise<ActionResult<UploadRecord[]>> {
  try {
    const supabase = await createClient();
    const businessId = await getCurrentBusinessId();

    if (!businessId) {
      return { success: false, error: "No autenticado o sin negocio" };
    }

    const { data, error } = await supabase
      .from("uploads")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Get a single upload by ID (with ownership validation)
 */
export async function getUploadById(
  uploadId: string
): Promise<ActionResult<UploadRecord>> {
  try {
    const supabase = await createClient();
    const businessId = await getCurrentBusinessId();

    if (!businessId) {
      return { success: false, error: "No autenticado" };
    }

    const { data, error } = await supabase
      .from("uploads")
      .select("*")
      .eq("id", uploadId)
      .eq("business_id", businessId) // Ensure ownership
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: "Archivo no encontrado" };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Delete an upload (file + database record)
 */
export async function deleteUpload(uploadId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const businessId = await getCurrentBusinessId();

    if (!businessId) {
      return { success: false, error: "No autenticado" };
    }

    // First, get the upload to verify ownership and get storage path
    const { data: upload, error: fetchError } = await supabase
      .from("uploads")
      .select("*")
      .eq("id", uploadId)
      .eq("business_id", businessId) // Ensure ownership
      .single();

    if (fetchError || !upload) {
      return { success: false, error: "Archivo no encontrado o sin permisos" };
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("business-files")
      .remove([upload.storage_path]);

    if (storageError) {
      console.error("Storage delete error:", storageError);
      // Continue anyway to delete the DB record
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from("uploads")
      .delete()
      .eq("id", uploadId)
      .eq("business_id", businessId);

    if (dbError) {
      return { success: false, error: dbError.message };
    }

    // Revalidate the archivos page
    revalidatePath("/app/archivos");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Get download URL for a file
 */
export async function getDownloadUrl(
  uploadId: string
): Promise<ActionResult<string>> {
  try {
    const supabase = await createClient();
    const businessId = await getCurrentBusinessId();

    if (!businessId) {
      return { success: false, error: "No autenticado" };
    }

    // Get the upload to verify ownership
    const { data: upload, error: fetchError } = await supabase
      .from("uploads")
      .select("storage_path")
      .eq("id", uploadId)
      .eq("business_id", businessId)
      .single();

    if (fetchError || !upload) {
      return { success: false, error: "Archivo no encontrado" };
    }

    // Create signed URL (valid for 1 hour)
    const { data, error } = await supabase.storage
      .from("business-files")
      .createSignedUrl(upload.storage_path, 3600);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data.signedUrl };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Update upload processing status
 */
export async function updateUploadStatus(
  uploadId: string,
  status: "pending" | "processing" | "completed" | "failed",
  metadata?: Record<string, unknown>
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const businessId = await getCurrentBusinessId();

    if (!businessId) {
      return { success: false, error: "No autenticado" };
    }

    const updateData: Record<string, unknown> = {
      processing_status: status,
      processed: status === "completed",
    };

    if (metadata) {
      // Merge with existing metadata
      const { data: existing } = await supabase
        .from("uploads")
        .select("metadata")
        .eq("id", uploadId)
        .single();

      updateData.metadata = {
        ...(existing?.metadata || {}),
        ...metadata,
      };
    }

    const { error } = await supabase
      .from("uploads")
      .update(updateData)
      .eq("id", uploadId)
      .eq("business_id", businessId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/app/archivos");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Get upload stats for dashboard
 */
export async function getUploadStats(): Promise<
  ActionResult<{
    total: number;
    processed: number;
    pending: number;
    failed: number;
  }>
> {
  try {
    const supabase = await createClient();
    const businessId = await getCurrentBusinessId();

    if (!businessId) {
      return { success: false, error: "No autenticado" };
    }

    const { data, error } = await supabase
      .from("uploads")
      .select("processing_status")
      .eq("business_id", businessId);

    if (error) {
      return { success: false, error: error.message };
    }

    const stats = {
      total: data?.length || 0,
      processed: data?.filter((u) => u.processing_status === "completed").length || 0,
      pending: data?.filter((u) => ["pending", "processing"].includes(u.processing_status)).length || 0,
      failed: data?.filter((u) => u.processing_status === "failed").length || 0,
    };

    return { success: true, data: stats };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
