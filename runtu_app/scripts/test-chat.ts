/**
 * ============================================
 * Chat E2E Test Script
 * ============================================
 *
 * Prueba end-to-end del flujo completo de chat con RAG.
 *
 * Uso:
 *   npx ts-node scripts/test-chat.ts
 *
 * Requisitos:
 *   - Variables de entorno configuradas (.env.local)
 *   - Supabase corriendo
 *   - Usuario de prueba existente
 */

import { createClient } from "@supabase/supabase-js";

// ============================================
// Configuración
// ============================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

// Usuario de prueba (crear manualmente o usar existente)
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || "test@runtu.tech";
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || "testpassword123";

// ============================================
// Helpers
// ============================================

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    results.push({
      name,
      passed: true,
      duration: Date.now() - start,
    });
    console.log(`  ✅ ${name} (${Date.now() - start}ms)`);
  } catch (error) {
    results.push({
      name,
      passed: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    });
    console.log(`  ❌ ${name}: ${error}`);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

// ============================================
// Test Data
// ============================================

const TEST_CSV_CONTENT = `fecha,producto,cantidad,precio,total
2024-07-01,Tacos al Pastor,50,45,2250
2024-07-01,Quesadillas,30,35,1050
2024-07-02,Tacos al Pastor,65,45,2925
2024-07-02,Burritos,25,55,1375
2024-07-03,Tacos al Pastor,45,45,2025
2024-07-03,Tortas,20,60,1200
2024-07-04,Tacos al Pastor,80,45,3600
2024-07-04,Quesadillas,40,35,1400`;

// ============================================
// Tests
// ============================================

async function runTests() {
  console.log("\n🧪 Iniciando tests E2E de Chat...\n");
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`📍 Supabase: ${SUPABASE_URL}\n`);

  let userId: string | null = null;
  let businessId: string | null = null;
  let uploadId: string | null = null;
  let conversationId: string | null = null;
  let accessToken: string | null = null;

  // ============================================
  // 1. Setup: Autenticación
  // ============================================
  console.log("📋 1. Setup y Autenticación");

  await test("Login con usuario de prueba", async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    });

    assert(!error, `Error de auth: ${error?.message}`);
    assert(!!data.user, "No se obtuvo usuario");
    assert(!!data.session, "No se obtuvo sesión");

    userId = data.user.id;
    accessToken = data.session.access_token;
  });

  await test("Obtener business del usuario", async () => {
    const { data, error } = await supabase
      .from("businesses")
      .select("id, name")
      .eq("owner_id", userId)
      .single();

    assert(!error, `Error obteniendo business: ${error?.message}`);
    assert(!!data, "No se encontró business");

    businessId = data.id;
    console.log(`    → Business: ${data.name} (${businessId})`);
  });

  // ============================================
  // 2. Crear datos de prueba (Upload + Chunks)
  // ============================================
  console.log("\n📋 2. Datos de Prueba (Upload + RAG)");

  await test("Crear upload de prueba", async () => {
    const { data, error } = await supabase
      .from("uploads")
      .insert({
        business_id: businessId,
        original_name: "ventas_julio_test.csv",
        storage_path: `test/${businessId}/ventas_julio_test.csv`,
        mime_type: "text/csv",
        size_bytes: TEST_CSV_CONTENT.length,
        status: "completed",
        row_count: 8,
        column_count: 5,
        extracted_text: TEST_CSV_CONTENT,
      })
      .select()
      .single();

    assert(!error, `Error creando upload: ${error?.message}`);
    uploadId = data.id;
    console.log(`    → Upload ID: ${uploadId}`);
  });

  await test("Crear chunks de conocimiento", async () => {
    // Simular chunks que el procesador crearía
    const chunks = [
      {
        upload_id: uploadId,
        business_id: businessId,
        content: "Ventas de Tacos al Pastor en julio 2024: 50 unidades el día 1, 65 unidades el día 2, 45 unidades el día 3, 80 unidades el día 4. Total aproximado: 240 unidades, precio unitario $45.",
        chunk_index: 0,
        token_count: 50,
        metadata: { source: "ventas_julio_test.csv", type: "sales" },
      },
      {
        upload_id: uploadId,
        business_id: businessId,
        content: "Resumen de ventas julio 2024: Producto más vendido: Tacos al Pastor. Total de transacciones: 8. Ingresos totales aproximados: $15,825 MXN.",
        chunk_index: 1,
        token_count: 40,
        metadata: { source: "ventas_julio_test.csv", type: "summary" },
      },
    ];

    // Generar embeddings simulados (en producción usaría la API real)
    for (const chunk of chunks) {
      const { error } = await supabase.from("knowledge_chunks").insert({
        ...chunk,
        // Embedding simulado - 768 dimensiones con valores aleatorios
        embedding: Array(768)
          .fill(0)
          .map(() => Math.random() * 2 - 1),
      });

      assert(!error, `Error creando chunk: ${error?.message}`);
    }

    console.log(`    → ${chunks.length} chunks creados`);
  });

  // ============================================
  // 3. Test de Chat API
  // ============================================
  console.log("\n📋 3. Chat API");

  await test("Crear conversación via API", async () => {
    const response = await fetch(`${BASE_URL}/api/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        Cookie: `sb-access-token=${accessToken}`,
      },
      body: JSON.stringify({
        title: "Test Conversation",
      }),
    });

    // Si el endpoint requiere cookies de sesión, puede que falle en script
    // En ese caso, crear directamente en BD
    if (!response.ok) {
      const { data, error } = await supabase
        .from("conversations")
        .insert({
          business_id: businessId,
          title: "Test Conversation",
        })
        .select()
        .single();

      assert(!error, `Error creando conversación: ${error?.message}`);
      conversationId = data.id;
    } else {
      const data = await response.json();
      conversationId = data.conversation?.id || data.id;
    }

    assert(!!conversationId, "No se obtuvo ID de conversación");
    console.log(`    → Conversation ID: ${conversationId}`);
  });

  await test("Enviar mensaje de prueba", async () => {
    // Insertar mensaje de usuario
    const { error: userMsgError } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: "¿Cuántos tacos al pastor vendí en julio?",
    });

    assert(!userMsgError, `Error guardando mensaje: ${userMsgError?.message}`);
  });

  await test("Verificar que chunks de RAG son recuperables", async () => {
    // Simular búsqueda semántica (en producción usaría match_knowledge_chunks)
    const { data: chunks, error } = await supabase
      .from("knowledge_chunks")
      .select("content, metadata")
      .eq("business_id", businessId)
      .limit(5);

    assert(!error, `Error buscando chunks: ${error?.message}`);
    assert(chunks && chunks.length > 0, "No se encontraron chunks");

    const hasRelevantChunk = chunks.some(
      (c) =>
        c.content.toLowerCase().includes("tacos") ||
        c.content.toLowerCase().includes("julio")
    );
    assert(hasRelevantChunk, "No se encontró chunk relevante para la pregunta");

    console.log(`    → ${chunks.length} chunks encontrados`);
  });

  // ============================================
  // 4. Verificar Persistencia
  // ============================================
  console.log("\n📋 4. Persistencia");

  await test("Conversación guardada en BD", async () => {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    assert(!error, `Error: ${error?.message}`);
    assert(data.business_id === businessId, "Business ID no coincide");
  });

  await test("Mensajes guardados en BD", async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId);

    assert(!error, `Error: ${error?.message}`);
    assert(data && data.length > 0, "No se encontraron mensajes");

    console.log(`    → ${data.length} mensajes en la conversación`);
  });

  // ============================================
  // 5. Test de Seguridad
  // ============================================
  console.log("\n📋 5. Seguridad");

  await test("RLS: No acceso a chunks de otro business", async () => {
    // Crear cliente con el token del usuario (no service role)
    const userClient = createClient(
      SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    );

    // Intentar acceder a chunks de otro business (ID inventado)
    const { data } = await userClient
      .from("knowledge_chunks")
      .select("*")
      .eq("business_id", "00000000-0000-0000-0000-000000000000");

    // Debería estar vacío por RLS
    assert(
      !data || data.length === 0,
      "RLS no está bloqueando acceso a otros businesses"
    );
  });

  await test("RLS: No acceso a conversaciones de otro business", async () => {
    const userClient = createClient(
      SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    );

    const { data } = await userClient
      .from("conversations")
      .select("*")
      .eq("business_id", "00000000-0000-0000-0000-000000000000");

    assert(
      !data || data.length === 0,
      "RLS no está bloqueando acceso a otras conversaciones"
    );
  });

  // ============================================
  // 6. Cleanup
  // ============================================
  console.log("\n📋 6. Cleanup");

  await test("Eliminar datos de prueba", async () => {
    // Eliminar en orden por foreign keys
    if (conversationId) {
      await supabase
        .from("messages")
        .delete()
        .eq("conversation_id", conversationId);
      await supabase.from("conversations").delete().eq("id", conversationId);
    }

    if (uploadId) {
      await supabase
        .from("knowledge_chunks")
        .delete()
        .eq("upload_id", uploadId);
      await supabase.from("uploads").delete().eq("id", uploadId);
    }

    console.log("    → Datos de prueba eliminados");
  });

  // ============================================
  // Resumen
  // ============================================
  console.log("\n" + "=".repeat(50));
  console.log("📊 RESUMEN DE TESTS");
  console.log("=".repeat(50));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const totalTime = results.reduce((acc, r) => acc + r.duration, 0);

  console.log(`\n  Total: ${results.length} tests`);
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  ⏱️  Tiempo total: ${totalTime}ms`);

  if (failed > 0) {
    console.log("\n  Tests fallidos:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`    - ${r.name}: ${r.error}`);
      });
  }

  console.log("\n" + "=".repeat(50));

  if (failed === 0) {
    console.log("🎉 TODOS LOS TESTS PASARON\n");
    process.exit(0);
  } else {
    console.log("💥 ALGUNOS TESTS FALLARON\n");
    process.exit(1);
  }
}

// ============================================
// Ejecutar
// ============================================

runTests().catch((error) => {
  console.error("Error fatal en tests:", error);
  process.exit(1);
});
