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
      knowledge_chunks: {
        Row: {
          id: string;
          business_id: string;
          upload_id: string | null;
          content: string;
          embedding: number[] | null;
          chunk_type: ChunkType;
          source_context: string | null;
          metadata: KnowledgeChunkMetadata;
          tokens_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          upload_id?: string | null;
          content: string;
          embedding?: number[] | null;
          chunk_type?: ChunkType;
          source_context?: string | null;
          metadata?: KnowledgeChunkMetadata;
          tokens_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          upload_id?: string | null;
          content?: string;
          embedding?: number[] | null;
          chunk_type?: ChunkType;
          source_context?: string | null;
          metadata?: KnowledgeChunkMetadata;
          tokens_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "knowledge_chunks_business_id_fkey";
            columns: ["business_id"];
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "knowledge_chunks_upload_id_fkey";
            columns: ["upload_id"];
            referencedRelation: "uploads";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {};
    Functions: {
      match_knowledge: {
        Args: {
          query_embedding: number[];
          match_threshold?: number;
          match_count?: number;
          filter_business_id: string;
          filter_chunk_types?: string[] | null;
        };
        Returns: {
          id: string;
          content: string;
          chunk_type: string;
          source_context: string | null;
          metadata: KnowledgeChunkMetadata;
          similarity: number;
        }[];
      };
      get_business_knowledge_stats: {
        Args: {
          target_business_id?: string | null;
        };
        Returns: {
          total_chunks: number;
          total_tokens: number;
          chunks_by_type: Record<string, number>;
          last_chunk_at: string | null;
          has_embeddings: boolean;
        }[];
      };
      search_knowledge_simple: {
        Args: {
          search_query: string;
          target_business_id?: string | null;
          result_limit?: number;
        };
        Returns: {
          id: string;
          content: string;
          chunk_type: string;
          source_context: string | null;
          metadata: KnowledgeChunkMetadata;
          relevance: number;
        }[];
      };
    };
    Enums: {};
  };
}

// Chunk types for knowledge chunks
export type ChunkType =
  | "document"
  | "spreadsheet"
  | "image_analysis"
  | "audio_transcript"
  | "video_analysis"
  | "manual_note";

// Metadata for knowledge chunks
export interface KnowledgeChunkMetadata {
  page?: number;
  section?: string;
  sheet?: string;
  row_range?: string;
  column_headers?: string[];
  start_time?: number;
  end_time?: number;
  speaker?: string;
  image_region?: string;
  detected_objects?: string[];
  confidence?: number;
  language?: string;
  [key: string]: Json | undefined;
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
export type KnowledgeChunk = Database["public"]["Tables"]["knowledge_chunks"]["Row"];

// Insert types
export type BusinessInsert = Database["public"]["Tables"]["businesses"]["Insert"];
export type UploadInsert = Database["public"]["Tables"]["uploads"]["Insert"];
export type KnowledgeChunkInsert = Database["public"]["Tables"]["knowledge_chunks"]["Insert"];

// Update types
export type BusinessUpdate = Database["public"]["Tables"]["businesses"]["Update"];
export type UploadUpdate = Database["public"]["Tables"]["uploads"]["Update"];
export type KnowledgeChunkUpdate = Database["public"]["Tables"]["knowledge_chunks"]["Update"];

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
// Knowledge Chunk Types (Extended)
// ============================================

// Input type for creating chunks (requires embedding)
export interface ChunkInsert {
  business_id: string;
  upload_id?: string | null;
  content: string;
  embedding: number[];
  chunk_type: ChunkType;
  source_context: string;
  metadata?: KnowledgeChunkMetadata;
  tokens_count: number;
}

// Result from semantic search
export interface ChunkSearchResult {
  id: string;
  content: string;
  chunk_type: ChunkType;
  source_context: string | null;
  metadata: KnowledgeChunkMetadata;
  similarity: number;
}

// Result from simple text search
export interface ChunkTextSearchResult {
  id: string;
  content: string;
  chunk_type: ChunkType;
  source_context: string | null;
  metadata: KnowledgeChunkMetadata;
  relevance: number;
}

// Statistics for a business's knowledge base
export interface BusinessKnowledgeStats {
  total_chunks: number;
  total_tokens: number;
  chunks_by_type: Partial<Record<ChunkType, number>>;
  last_chunk_at: string | null;
  has_embeddings: boolean;
}

// Options for listing chunks
export interface ChunkListOptions {
  limit?: number;
  offset?: number;
  chunkTypes?: ChunkType[];
  uploadId?: string;
  orderBy?: "created_at" | "updated_at" | "tokens_count";
  orderDirection?: "asc" | "desc";
}

// Options for semantic search
export interface SemanticSearchOptions {
  businessId: string;
  queryEmbedding: number[];
  threshold?: number;
  limit?: number;
  chunkTypes?: ChunkType[];
}

// Options for text search
export interface TextSearchOptions {
  businessId: string;
  query: string;
  limit?: number;
}

// Chunk type labels for UI
export const CHUNK_TYPE_LABELS: Record<ChunkType, string> = {
  document: "Documento",
  spreadsheet: "Hoja de cálculo",
  image_analysis: "Análisis de imagen",
  audio_transcript: "Transcripción de audio",
  video_analysis: "Análisis de video",
  manual_note: "Nota manual",
};

// Chunk type icons (Lucide icon names)
export const CHUNK_TYPE_ICONS: Record<ChunkType, string> = {
  document: "FileText",
  spreadsheet: "Table",
  image_analysis: "Image",
  audio_transcript: "Mic",
  video_analysis: "Video",
  manual_note: "StickyNote",
};

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
