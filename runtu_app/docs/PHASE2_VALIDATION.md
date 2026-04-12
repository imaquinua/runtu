# Phase 2 Validation Checklist: Memoria Vectorial

## Pre-requisitos

### Supabase Configuration
- [ ] pgvector extension enabled
- [ ] `knowledge_chunks` table created with correct schema
- [ ] `match_knowledge` RPC function deployed
- [ ] HNSW index created on embedding column
- [ ] RLS policies configured for business isolation

### Environment Variables
- [ ] `GOOGLE_AI_API_KEY` set (for Gemini embeddings)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set

---

## 1. File Upload Pipeline

### PDF Processing
- [ ] Upload a PDF file
- [ ] Verify file appears in uploads table with status "pending"
- [ ] Wait for processing to complete
- [ ] Verify status changes to "completed"
- [ ] Verify chunks created in `knowledge_chunks` table
- [ ] Verify each chunk has:
  - [ ] Valid embedding (768 dimensions)
  - [ ] chunk_type = "document"
  - [ ] source_context = filename
  - [ ] Correct business_id
  - [ ] token_count > 0

### Excel/CSV Processing
- [ ] Upload an Excel file (.xlsx)
- [ ] Verify chunks created with chunk_type = "spreadsheet"
- [ ] Verify metadata contains sheet name
- [ ] Upload a CSV file
- [ ] Verify similar processing

### Image Processing
- [ ] Upload an image (JPG/PNG)
- [ ] Verify OCR/analysis runs
- [ ] Verify chunks created with chunk_type = "image_analysis"

### Audio Processing
- [ ] Upload an audio file (MP3/WAV)
- [ ] Verify transcription runs
- [ ] Verify chunks created with chunk_type = "audio_transcript"

### Manual Notes
- [ ] Create a manual note via UI
- [ ] Verify chunk created with chunk_type = "manual_note"

---

## 2. Embedding Generation

### Gemini API Integration
- [ ] Verify embeddings are 768 dimensions (not 256)
- [ ] Verify model used is `text-embedding-004`
- [ ] Test embedding generation for Spanish text
- [ ] Test embedding generation for mixed Spanish/English

### Chunking Quality
- [ ] Verify chunks are appropriately sized (300-500 tokens)
- [ ] Verify paragraph preservation in documents
- [ ] Verify spreadsheet rows grouped logically

---

## 3. Search Functionality

### Semantic Search
Run these test queries:
- [ ] "ventas del mes" - should return sales-related chunks
- [ ] "ingredientes de la pizza" - should return menu/recipe chunks
- [ ] "cómo cerrar la caja" - should return procedure chunks

Verify for each:
- [ ] Results are ranked by similarity
- [ ] Similarity scores > 0.5 for top results
- [ ] Results are from correct business only

### Hybrid Search (Semantic + Text)
- [ ] Search for exact phrases from documents
- [ ] Verify both semantic and text matches appear
- [ ] Verify RRF scoring combines results correctly

### Search API
- [ ] Test `/api/search` endpoint
- [ ] Verify authentication required
- [ ] Verify business isolation (user A can't see user B's data)
- [ ] Verify error handling for invalid queries

### Search Performance
- [ ] Query response time < 500ms for typical queries
- [ ] Embedding cache working (second query faster)
- [ ] No timeout errors

---

## 4. Knowledge UI Page

### Stats Display
- [ ] Total chunks count is correct
- [ ] Total tokens count is correct
- [ ] Chunks by type breakdown is accurate
- [ ] Last updated timestamp shows

### Chunk List
- [ ] Chunks load and display
- [ ] Pagination works
- [ ] Filter by type works
- [ ] Click to expand chunk works
- [ ] Full modal view works

### Search Test Interface
- [ ] Search input accepts queries
- [ ] Results display with relevance scores
- [ ] Snippets show matched text
- [ ] Empty state for no results

---

## 5. Security & Isolation

### Row Level Security
- [ ] User A cannot see User B's chunks via UI
- [ ] User A cannot see User B's chunks via API
- [ ] Direct DB queries respect RLS

### Business Isolation
- [ ] Create test users with separate businesses
- [ ] Verify complete data isolation
- [ ] Verify search only returns own data

---

## 6. Error Handling

### Upload Failures
- [ ] Large file upload (>50MB) shows error
- [ ] Unsupported file type shows error
- [ ] Network failure during upload shows error
- [ ] Processing failure marks upload as "failed"

### Search Failures
- [ ] Empty query shows validation error
- [ ] Very long query handled gracefully
- [ ] API timeout shows user-friendly error

### Embedding Failures
- [ ] API quota exceeded handled
- [ ] Network failure during embedding handled
- [ ] Invalid content handled

---

## 7. Unit Tests

Run all unit tests:
```bash
npm test
```

### Chunking Tests
- [ ] `src/lib/embeddings/__tests__/chunking.test.ts` passes
- [ ] All chunking methods tested
- [ ] Edge cases covered (empty, very long, special chars)

### RAG Tests
- [ ] `src/lib/rag/__tests__/utils.test.ts` passes
- [ ] `src/lib/rag/__tests__/context.test.ts` passes
- [ ] `src/lib/rag/__tests__/cache.test.ts` passes

---

## 8. E2E Test

Run the E2E test script:
```bash
npx tsx scripts/test-rag.ts
```

Verify all steps pass:
- [ ] pgvector extension check
- [ ] Test business/user creation
- [ ] Embedding generation
- [ ] Chunk storage
- [ ] Semantic search
- [ ] Business isolation
- [ ] Chunk type filtering
- [ ] RAG context building
- [ ] Cleanup

---

## 9. SQL Diagnostics

Run diagnostic queries from `scripts/diagnostic-queries.sql`:

- [ ] No chunks without embeddings
- [ ] All embeddings are 768 dimensions
- [ ] No orphan chunks
- [ ] No duplicate chunks
- [ ] Index is being used (check pg_stat_user_indexes)
- [ ] RLS is enabled

---

## 10. Metrics to Monitor

### Key Metrics
- Total chunks per business
- Average tokens per chunk
- Chunks created per day
- Search latency (p50, p95, p99)
- Cache hit rate
- Embedding API calls per day
- Storage used

### Alerts to Set
- [ ] Chunks without embeddings > 0
- [ ] Search latency > 2s
- [ ] Upload processing time > 60s
- [ ] Embedding API errors > 10/hour

---

## Sign-Off

| Check | Date | Tester | Status |
|-------|------|--------|--------|
| File Processing | | | |
| Embeddings | | | |
| Search | | | |
| UI | | | |
| Security | | | |
| Tests | | | |

**Phase 2 Complete:** [ ] Yes / [ ] No

**Notes:**
