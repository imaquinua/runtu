import { createClient } from "./server";
import type {
  Business,
  BusinessUpdate,
  Upload,
  UploadInsert,
  UploadUpdate,
  BusinessWithUploads,
  UploadMetadata,
} from "@/types/database";

// ============================================
// BUSINESS OPERATIONS
// ============================================

/**
 * Get the current user's business
 */
export async function getCurrentBusiness(): Promise<Business | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("Error fetching business:", error);
    return null;
  }

  return data;
}

/**
 * Get business by ID (only returns if user owns it due to RLS)
 */
export async function getBusinessById(id: string): Promise<Business | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching business:", error);
    return null;
  }

  return data;
}

/**
 * Update the current user's business
 */
export async function updateBusiness(
  updates: BusinessUpdate
): Promise<{ data: Business | null; error: string | null }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: "No authenticated user" };
  }

  const { data, error } = await supabase
    .from("businesses")
    .update(updates)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Get business with all its uploads
 */
export async function getBusinessWithUploads(): Promise<BusinessWithUploads | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("businesses")
    .select(`
      *,
      uploads (*)
    `)
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("Error fetching business with uploads:", error);
    return null;
  }

  return data as BusinessWithUploads;
}

// ============================================
// UPLOAD OPERATIONS
// ============================================

/**
 * Get all uploads for the current user's business
 */
export async function getUploads(): Promise<Upload[]> {
  const supabase = await createClient();

  const business = await getCurrentBusiness();
  if (!business) return [];

  const { data, error } = await supabase
    .from("uploads")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching uploads:", error);
    return [];
  }

  return data || [];
}

/**
 * Get upload by ID
 */
export async function getUploadById(id: string): Promise<Upload | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("uploads")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching upload:", error);
    return null;
  }

  return data;
}

/**
 * Create a new upload record
 */
export async function createUpload(
  upload: Omit<UploadInsert, "business_id">
): Promise<{ data: Upload | null; error: string | null }> {
  const supabase = await createClient();

  const business = await getCurrentBusiness();
  if (!business) {
    return { data: null, error: "No business found for user" };
  }

  const { data, error } = await supabase
    .from("uploads")
    .insert({
      ...upload,
      business_id: business.id,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Update an upload record
 */
export async function updateUpload(
  id: string,
  updates: UploadUpdate
): Promise<{ data: Upload | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("uploads")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Delete an upload record
 */
export async function deleteUpload(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("uploads")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

/**
 * Get pending uploads (not yet processed)
 */
export async function getPendingUploads(): Promise<Upload[]> {
  const supabase = await createClient();

  const business = await getCurrentBusiness();
  if (!business) return [];

  const { data, error } = await supabase
    .from("uploads")
    .select("*")
    .eq("business_id", business.id)
    .eq("processed", false)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching pending uploads:", error);
    return [];
  }

  return data || [];
}

/**
 * Mark upload as processed
 */
export async function markUploadProcessed(
  id: string,
  success: boolean,
  metadata?: UploadMetadata
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("uploads")
    .update({
      processed: true,
      processing_status: success ? "completed" : "failed",
      ...(metadata && { metadata }),
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}
