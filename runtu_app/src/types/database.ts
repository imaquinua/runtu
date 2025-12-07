// ============================================
// RUNTU - Database Types
// Auto-generated types for Supabase tables
// ============================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ============================================
// Database Schema Types
// ============================================

export interface Database {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          industry: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          industry?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          industry?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "businesses_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      uploads: {
        Row: {
          id: string;
          business_id: string;
          filename: string;
          file_type: string;
          storage_path: string;
          file_size: number | null;
          processed: boolean;
          processing_status: ProcessingStatus;
          metadata: UploadMetadata;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          filename: string;
          file_type: string;
          storage_path: string;
          file_size?: number | null;
          processed?: boolean;
          processing_status?: ProcessingStatus;
          metadata?: UploadMetadata;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          filename?: string;
          file_type?: string;
          storage_path?: string;
          file_size?: number | null;
          processed?: boolean;
          processing_status?: ProcessingStatus;
          metadata?: UploadMetadata;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "uploads_business_id_fkey";
            columns: ["business_id"];
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

// ============================================
// Convenience Types
// ============================================

// Processing status for uploads
export type ProcessingStatus = "pending" | "processing" | "completed" | "failed";

// Metadata structure for uploads (extend as needed)
export interface UploadMetadata {
  originalName?: string;
  mimeType?: string;
  encoding?: string;
  extractedData?: Json;
  processingErrors?: string[];
  [key: string]: Json | undefined;
}

// Table row types
export type Business = Database["public"]["Tables"]["businesses"]["Row"];
export type Upload = Database["public"]["Tables"]["uploads"]["Row"];

// Insert types
export type BusinessInsert = Database["public"]["Tables"]["businesses"]["Insert"];
export type UploadInsert = Database["public"]["Tables"]["uploads"]["Insert"];

// Update types
export type BusinessUpdate = Database["public"]["Tables"]["businesses"]["Update"];
export type UploadUpdate = Database["public"]["Tables"]["uploads"]["Update"];

// ============================================
// Extended Types with Relations
// ============================================

// Business with uploads
export interface BusinessWithUploads extends Business {
  uploads: Upload[];
}

// Upload with business info
export interface UploadWithBusiness extends Upload {
  business: Business;
}

// ============================================
// Industry Types (common industries in LATAM)
// ============================================

export const INDUSTRIES = [
  "restaurante",
  "cafeteria",
  "panaderia",
  "bodega",
  "tienda",
  "peluqueria",
  "barberia",
  "taller_mecanico",
  "lavanderia",
  "farmacia",
  "ferreteria",
  "libreria",
  "floreria",
  "carniceria",
  "pescaderia",
  "verduleria",
  "licoreria",
  "gimnasio",
  "spa",
  "hotel",
  "hostal",
  "transporte",
  "delivery",
  "catering",
  "food_truck",
  "otro",
] as const;

export type Industry = (typeof INDUSTRIES)[number];

// ============================================
// File Types (supported upload formats)
// ============================================

export const SUPPORTED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
] as const;

export type SupportedFileType = (typeof SUPPORTED_FILE_TYPES)[number];

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
