#!/usr/bin/env npx tsx
// ============================================
// RAG End-to-End Test Script
// ============================================
// Tests the complete RAG pipeline:
// 1. Create test business
// 2. Create test upload
// 3. Process content (generate chunks + embeddings)
// 4. Perform semantic search
// 5. Verify results
// 6. Clean up test data
//
// Usage: npx tsx scripts/test-rag.ts
// ============================================

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

// ============================================
// Configuration
// ============================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing required environment variables:");
  console.error("   - NEXT_PUBLIC_SUPABASE_URL");
  console.error("   - SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Create admin client (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

// Test data
const TEST_PREFIX = "__test_rag__";
const TEST_USER_EMAIL = `${TEST_PREFIX}user@test.local`;
const TEST_BUSINESS_NAME = `${TEST_PREFIX}business`;

// Sample content for testing (simulates restaurant data)
const TEST_CONTENT = `
Reporte de Ventas - Taquería El Sabroso

Resumen del Mes de Noviembre 2024:

Ventas Totales: $45,320.00 MXN
Días Trabajados: 26
Promedio Diario: $1,743.08 MXN

Productos Más Vendidos:
1. Tacos al Pastor - 1,234 unidades - $18,510.00
2. Tacos de Bistec - 856 unidades - $12,840.00
3. Quesadillas - 523 unidades - $7,845.00
4. Aguas Frescas - 1,100 unidades - $5,500.00
5. Refrescos - 625 unidades - $625.00

Mejor Día: Viernes 15 de noviembre con $2,890.00
Peor Día: Lunes 4 de noviembre con $890.00

Gastos del Mes:
- Carne: $12,500.00
- Tortillas: $3,200.00
- Verduras: $2,100.00
- Gas: $1,800.00
- Empleados: $15,000.00
- Renta: $8,000.00

Utilidad Neta: $2,720.00

Notas:
- La promoción de 2x1 los martes aumentó ventas 30%
- Nuevo proveedor de carne reduce costos 15%
- Considerar contratar mesero extra para fines de semana
`;

// ============================================
// Test Results Tracking
// ============================================

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: Record<string, unknown>;
}

const results: TestResult[] = [];
let testBusinessId: string | null = null;
let testUserId: string | null = null;
let testUploadId: string | null = null;
let testChunkIds: string[] = [];

// ============================================
// Helper Functions
// ============================================

function log(message: string, type: "info" | "success" | "error" | "warn" = "info") {
  const icons = {
    info: "ℹ️",
    success: "✅",
    error: "❌",
    warn: "⚠️",
  };
  console.log(`${icons[type]} ${message}`);
}

async function runTest(
  name: string,
  fn: () => Promise<Record<string, unknown> | void>
): Promise<boolean> {
  const start = Date.now();
  try {
    log(`Running: ${name}...`, "info");
    const details = await fn();
    const duration = Date.now() - start;
    results.push({
      name,
      passed: true,
      duration,
      details: details ?? undefined,
    });
    log(`${name} passed (${duration}ms)`, "success");
    return true;
  } catch (error) {
    const duration = Date.now() - start;
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.push({
      name,
      passed: false,
      duration,
      error: errorMessage,
    });
    log(`${name} failed: ${errorMessage}`, "error");
    return false;
  }
}

// ============================================
// Test Steps
// ============================================

async function testPgVectorExtension() {
  const { data, error } = await supabase.rpc("check_vector_extension");

  if (error) {
    // Try direct query
    const { data: extData, error: extError } = await supabase
      .from("pg_extension")
      .select("*")
      .eq("extname", "vector")
      .single();

    if (extError || !extData) {
      throw new Error("pgvector extension not found");
    }
  }

  return { extension: "vector", status: "enabled" };
}

async function testCreateTestUser() {
  // Check if test user exists
  const { data: existingUser } = await supabase.auth.admin.listUsers();
  const existing = existingUser?.users?.find((u) => u.email === TEST_USER_EMAIL);

  if (existing) {
    testUserId = existing.id;
    return { userId: testUserId, action: "reused" };
  }

  // Create test user
  const { data, error } = await supabase.auth.admin.createUser({
    email: TEST_USER_EMAIL,
    password: "test-password-123",
    email_confirm: true,
  });

  if (error) throw error;
  testUserId = data.user.id;

  return { userId: testUserId, action: "created" };
}

async function testCreateTestBusiness() {
  if (!testUserId) throw new Error("No test user ID");

  // Check if test business exists
  const { data: existing } = await supabase
    .from("businesses")
    .select("id")
    .eq("name", TEST_BUSINESS_NAME)
    .single();

  if (existing) {
    testBusinessId = existing.id;
    return { businessId: testBusinessId, action: "reused" };
  }

  // Create test business
  const { data, error } = await supabase
    .from("businesses")
    .insert({
      user_id: testUserId,
      name: TEST_BUSINESS_NAME,
      industry: "restaurante",
    })
    .select()
    .single();

  if (error) throw error;
  testBusinessId = data.id;

  return { businessId: testBusinessId, action: "created" };
}

async function testCreateTestUpload() {
  if (!testBusinessId) throw new Error("No test business ID");

  // Create test upload record
  const { data, error } = await supabase
    .from("uploads")
    .insert({
      business_id: testBusinessId,
      filename: `${TEST_PREFIX}ventas.txt`,
      file_type: "text/plain",
      storage_path: `${testBusinessId}/${TEST_PREFIX}ventas.txt`,
      file_size: TEST_CONTENT.length,
      processing_status: "pending",
    })
    .select()
    .single();

  if (error) throw error;
  testUploadId = data.id;

  return { uploadId: testUploadId, filename: data.filename };
}

async function testGenerateEmbedding() {
  // Import the embedding function dynamically
  const { generateEmbedding } = await import("../src/lib/embeddings/index.js");

  const testText = "Ventas de tacos al pastor";
  const result = await generateEmbedding(testText);

  if (result.error) throw result.error;
  if (!result.data) throw new Error("No embedding returned");

  const embedding = result.data.embedding;

  // Verify embedding dimensions (Gemini uses 768)
  if (embedding.length !== 768) {
    throw new Error(`Expected 768 dimensions, got ${embedding.length}`);
  }

  return {
    dimensions: embedding.length,
    tokensUsed: result.data.tokens_used,
    sampleValues: embedding.slice(0, 5),
  };
}

async function testChunking() {
  const { chunkText, countTokens } = await import("../src/lib/embeddings/chunking.js");

  const chunks = chunkText(TEST_CONTENT, { maxTokens: 200 });

  if (chunks.length === 0) {
    throw new Error("No chunks generated");
  }

  // Verify chunks are reasonable
  for (const chunk of chunks) {
    const tokens = countTokens(chunk);
    if (tokens > 300) {
      throw new Error(`Chunk exceeds token limit: ${tokens} tokens`);
    }
  }

  return {
    totalChunks: chunks.length,
    avgTokensPerChunk: Math.round(
      chunks.reduce((sum, c) => sum + countTokens(c), 0) / chunks.length
    ),
  };
}

async function testProcessAndStoreChunks() {
  if (!testBusinessId || !testUploadId) {
    throw new Error("Missing test IDs");
  }

  const { chunkText } = await import("../src/lib/embeddings/chunking.js");
  const { generateEmbeddings } = await import("../src/lib/embeddings/index.js");

  // Chunk the content
  const chunks = chunkText(TEST_CONTENT, { maxTokens: 200 });

  // Generate embeddings
  const embeddingResult = await generateEmbeddings(chunks);

  if (embeddingResult.error || !embeddingResult.data) {
    throw new Error(`Embedding failed: ${embeddingResult.error?.message}`);
  }

  // Store chunks in database
  const chunkInserts = chunks.map((content, i) => ({
    business_id: testBusinessId,
    upload_id: testUploadId,
    content,
    embedding: embeddingResult.data!.embeddings[i],
    chunk_type: "document",
    source_context: `${TEST_PREFIX}ventas.txt - Chunk ${i + 1}`,
    metadata: { testRun: true, index: i },
    tokens_count: Math.ceil(content.length / 4),
  }));

  const { data, error } = await supabase
    .from("knowledge_chunks")
    .insert(chunkInserts)
    .select("id");

  if (error) throw error;

  testChunkIds = data.map((d) => d.id);

  // Update upload status
  await supabase
    .from("uploads")
    .update({
      processing_status: "completed",
      processed: true,
    })
    .eq("id", testUploadId);

  return {
    chunksStored: testChunkIds.length,
    totalTokens: embeddingResult.data.total_tokens_used,
  };
}

async function testSemanticSearch() {
  if (!testBusinessId) throw new Error("No test business ID");

  const { generateQueryEmbedding } = await import("../src/lib/embeddings/index.js");

  // Test query
  const query = "cuánto vendí de tacos al pastor";

  // Generate query embedding
  const embeddingResult = await generateQueryEmbedding(query);
  if (embeddingResult.error || !embeddingResult.data) {
    throw new Error("Failed to generate query embedding");
  }

  // Search using the match_knowledge function
  const { data, error } = await supabase.rpc("match_knowledge", {
    query_embedding: embeddingResult.data,
    match_threshold: 0.5,
    match_count: 5,
    filter_business_id: testBusinessId,
    filter_chunk_types: null,
  });

  if (error) throw error;

  if (!data || data.length === 0) {
    throw new Error("No search results returned");
  }

  // Verify results contain relevant content
  const topResult = data[0];
  const hasRelevantContent =
    topResult.content.toLowerCase().includes("taco") ||
    topResult.content.toLowerCase().includes("pastor") ||
    topResult.content.toLowerCase().includes("venta");

  if (!hasRelevantContent) {
    throw new Error("Top result doesn't contain relevant content");
  }

  return {
    query,
    resultsCount: data.length,
    topSimilarity: topResult.similarity,
    topContentPreview: topResult.content.slice(0, 100) + "...",
  };
}

async function testSecurityIsolation() {
  if (!testBusinessId) throw new Error("No test business ID");

  const { generateQueryEmbedding } = await import("../src/lib/embeddings/index.js");

  const query = "ventas";
  const embeddingResult = await generateQueryEmbedding(query);
  if (embeddingResult.error || !embeddingResult.data) {
    throw new Error("Failed to generate query embedding");
  }

  // Search with a different (fake) business ID
  const { data: wrongBizData } = await supabase.rpc("match_knowledge", {
    query_embedding: embeddingResult.data,
    match_threshold: 0.3,
    match_count: 10,
    filter_business_id: "00000000-0000-0000-0000-000000000000",
    filter_chunk_types: null,
  });

  // Should return no results for non-existent business
  if (wrongBizData && wrongBizData.length > 0) {
    throw new Error("Security violation: returned data for wrong business");
  }

  // Search with correct business ID
  const { data: correctBizData } = await supabase.rpc("match_knowledge", {
    query_embedding: embeddingResult.data,
    match_threshold: 0.3,
    match_count: 10,
    filter_business_id: testBusinessId,
    filter_chunk_types: null,
  });

  if (!correctBizData || correctBizData.length === 0) {
    throw new Error("No results for correct business");
  }

  return {
    wrongBusinessResults: wrongBizData?.length ?? 0,
    correctBusinessResults: correctBizData.length,
    securityPassed: true,
  };
}

async function testChunkTypeFilter() {
  if (!testBusinessId) throw new Error("No test business ID");

  const { generateQueryEmbedding } = await import("../src/lib/embeddings/index.js");

  const embeddingResult = await generateQueryEmbedding("ventas");
  if (embeddingResult.error || !embeddingResult.data) {
    throw new Error("Failed to generate query embedding");
  }

  // Search with document filter
  const { data: docData } = await supabase.rpc("match_knowledge", {
    query_embedding: embeddingResult.data,
    match_threshold: 0.3,
    match_count: 10,
    filter_business_id: testBusinessId,
    filter_chunk_types: ["document"],
  });

  // Search with spreadsheet filter (should return nothing)
  const { data: sheetData } = await supabase.rpc("match_knowledge", {
    query_embedding: embeddingResult.data,
    match_threshold: 0.3,
    match_count: 10,
    filter_business_id: testBusinessId,
    filter_chunk_types: ["spreadsheet"],
  });

  return {
    documentResults: docData?.length ?? 0,
    spreadsheetResults: sheetData?.length ?? 0,
    filterWorking: (docData?.length ?? 0) > 0 && (sheetData?.length ?? 0) === 0,
  };
}

async function testRAGContext() {
  if (!testBusinessId) throw new Error("No test business ID");

  // Test the RAG search function
  const { ragSearch, buildContext } = await import("../src/lib/rag/index.js");

  const response = await ragSearch({
    businessId: testBusinessId,
    query: "cuáles fueron las ventas del mes",
    threshold: 0.5,
    limit: 5,
    hybridSearch: false,
  });

  if (response.results.length === 0) {
    throw new Error("RAG search returned no results");
  }

  // Build context
  const context = buildContext(response.results, {
    maxTokens: 1000,
    includeSourceInfo: true,
  });

  if (!context.context || context.context.length === 0) {
    throw new Error("Context building failed");
  }

  return {
    resultsCount: response.results.length,
    searchTimeMs: response.searchTimeMs,
    contextTokens: context.tokensUsed,
    contextChunks: context.chunksIncluded,
    fromCache: response.fromCache,
  };
}

// ============================================
// Cleanup
// ============================================

async function cleanup() {
  log("Cleaning up test data...", "info");

  try {
    // Delete test chunks
    if (testChunkIds.length > 0) {
      await supabase
        .from("knowledge_chunks")
        .delete()
        .in("id", testChunkIds);
    }

    // Delete test upload
    if (testUploadId) {
      await supabase.from("uploads").delete().eq("id", testUploadId);
    }

    // Delete test business
    if (testBusinessId) {
      // First delete all related data
      await supabase.from("knowledge_chunks").delete().eq("business_id", testBusinessId);
      await supabase.from("uploads").delete().eq("business_id", testBusinessId);
      await supabase.from("businesses").delete().eq("id", testBusinessId);
    }

    // Delete test user
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }

    log("Cleanup completed", "success");
  } catch (error) {
    log(`Cleanup error: ${error}`, "warn");
  }
}

// ============================================
// Main
// ============================================

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 RAG End-to-End Test Suite");
  console.log("=".repeat(60) + "\n");

  const startTime = Date.now();

  // Run tests
  await runTest("pgvector Extension Check", testPgVectorExtension);
  await runTest("Create Test User", testCreateTestUser);
  await runTest("Create Test Business", testCreateTestBusiness);
  await runTest("Create Test Upload", testCreateTestUpload);
  await runTest("Generate Embedding", testGenerateEmbedding);
  await runTest("Chunking", testChunking);
  await runTest("Process and Store Chunks", testProcessAndStoreChunks);
  await runTest("Semantic Search", testSemanticSearch);
  await runTest("Security Isolation", testSecurityIsolation);
  await runTest("Chunk Type Filter", testChunkTypeFilter);
  await runTest("RAG Context Building", testRAGContext);

  // Cleanup
  await cleanup();

  // Print results
  console.log("\n" + "=".repeat(60));
  console.log("📊 Test Results");
  console.log("=".repeat(60) + "\n");

  const passed = results.filter((r) => r.passed);
  const failed = results.filter((r) => !r.passed);

  console.log(`Total: ${results.length} | ✅ Passed: ${passed.length} | ❌ Failed: ${failed.length}`);
  console.log(`Duration: ${Date.now() - startTime}ms\n`);

  if (failed.length > 0) {
    console.log("Failed Tests:");
    failed.forEach((r) => {
      console.log(`  ❌ ${r.name}: ${r.error}`);
    });
    console.log();
  }

  // Detailed results
  console.log("Detailed Results:");
  results.forEach((r) => {
    const status = r.passed ? "✅" : "❌";
    console.log(`  ${status} ${r.name} (${r.duration}ms)`);
    if (r.details) {
      Object.entries(r.details).forEach(([key, value]) => {
        console.log(`      ${key}: ${JSON.stringify(value)}`);
      });
    }
    if (r.error) {
      console.log(`      error: ${r.error}`);
    }
  });

  console.log("\n" + "=".repeat(60));

  if (failed.length > 0) {
    console.log("❌ SOME TESTS FAILED");
    process.exit(1);
  } else {
    console.log("✅ ALL TESTS PASSED");
    process.exit(0);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  cleanup().finally(() => process.exit(1));
});
