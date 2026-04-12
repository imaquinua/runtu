// ============================================
// Database Access Layer - Exports
// ============================================

// Knowledge chunks operations
export {
  // CRUD
  createChunk,
  createChunks,
  getChunksByUpload,
  getChunksByBusiness,
  deleteChunksByUpload,
  deleteChunk,
  getChunkById,
  // Stats
  getBusinessStats,
  countChunks,
  hasKnowledge,
  // Search
  searchKnowledge,
  searchKnowledgeSimple,
  // Error class
  KnowledgeError,
} from "./knowledge";

// Re-export types
export type {
  KnowledgeChunk,
  ChunkInsert,
  ChunkSearchResult,
  ChunkTextSearchResult,
  BusinessKnowledgeStats,
  ChunkListOptions,
  SemanticSearchOptions,
  TextSearchOptions,
  ChunkType,
} from "@/types/database";
