// ============================================
// API Route: /api/search
// Búsqueda RAG en conocimiento del negocio
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  ragSearch,
  quickSearch,
  buildContext,
  RAGError,
  RAG_DEFAULTS,
  getCacheStats,
} from "@/lib/rag";
import type { ChunkType } from "@/types/database";

// ============================================
// Types
// ============================================

interface SearchRequestBody {
  query: string;
  businessId?: string;
  limit?: number;
  threshold?: number;
  chunkTypes?: ChunkType[];
  hybridSearch?: boolean;
  includeContext?: boolean;
  contextMaxTokens?: number;
}

// ============================================
// POST - Full RAG Search
// ============================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse request body
    const body = (await request.json()) as SearchRequestBody;
    const {
      query,
      businessId: requestBusinessId,
      limit = RAG_DEFAULTS.MAX_RESULTS,
      threshold = RAG_DEFAULTS.SIMILARITY_THRESHOLD,
      chunkTypes,
      hybridSearch = true,
      includeContext = false,
      contextMaxTokens = RAG_DEFAULTS.MAX_CONTEXT_TOKENS,
    } = body;

    // Validate query
    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "La búsqueda debe tener al menos 2 caracteres" },
        { status: 400 }
      );
    }

    // Get current user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Determine business ID
    let businessId = requestBusinessId;

    if (!businessId) {
      // Get user's first business
      const { data: business, error: bizError } = await supabase
        .from("businesses")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (bizError || !business) {
        return NextResponse.json(
          { error: "No se encontró un negocio asociado" },
          { status: 404 }
        );
      }

      businessId = business.id;
    } else {
      // Verify user has access to specified business
      const { data: business, error: bizError } = await supabase
        .from("businesses")
        .select("id")
        .eq("id", businessId)
        .eq("user_id", user.id)
        .single();

      if (bizError || !business) {
        return NextResponse.json(
          { error: "No tienes acceso a este negocio" },
          { status: 403 }
        );
      }
    }

    // Perform search
    const searchResponse = await ragSearch({
      businessId,
      query: query.trim(),
      threshold,
      limit,
      chunkTypes,
      hybridSearch,
      useCache: true,
      analyzeQuery: true,
    });

    // Build context if requested
    let context = null;
    if (includeContext && searchResponse.results.length > 0) {
      const builtContext = buildContext(searchResponse.results, {
        maxTokens: contextMaxTokens,
        includeSourceInfo: true,
        format: "structured",
      });

      context = {
        text: builtContext.context,
        tokensUsed: builtContext.tokensUsed,
        chunksIncluded: builtContext.chunksIncluded,
        sources: builtContext.sources,
        wasTruncated: builtContext.wasTruncated,
      };
    }

    const totalTimeMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      query: query.trim(),
      results: searchResponse.results.map((r) => ({
        id: r.id,
        content: r.content,
        snippet: r.snippet,
        score: r.score,
        similarity: r.similarity,
        chunkType: r.chunk_type,
        source: r.source,
        matchedKeywords: r.matchedKeywords,
      })),
      context,
      queryAnalysis: searchResponse.queryAnalysis
        ? {
            intent: searchResponse.queryAnalysis.intent,
            category: searchResponse.queryAnalysis.category,
            keywords: searchResponse.queryAnalysis.keywords,
            specificity: searchResponse.queryAnalysis.specificity,
          }
        : null,
      metrics: {
        searchTimeMs: searchResponse.searchTimeMs,
        totalTimeMs,
        totalMatches: searchResponse.totalMatches,
        fromCache: searchResponse.fromCache,
      },
    });
  } catch (error) {
    console.error("[API/search] Error:", error);

    if (error instanceof RAGError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}

// ============================================
// GET - Quick Search (for autocomplete)
// ============================================

export async function GET(request: NextRequest) {
  try {
    // Get query params
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const businessId = searchParams.get("businessId");

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    // Get current user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Determine business ID
    let targetBusinessId = businessId;

    if (!targetBusinessId) {
      const { data: business } = await supabase
        .from("businesses")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (!business) {
        return NextResponse.json({ results: [] });
      }

      targetBusinessId = business.id;
    } else {
      // Verify access (businessId is guaranteed non-null here)
      const { data: business } = await supabase
        .from("businesses")
        .select("id")
        .eq("id", businessId!)
        .eq("user_id", user.id)
        .single();

      if (!business) {
        return NextResponse.json(
          { error: "No tienes acceso a este negocio" },
          { status: 403 }
        );
      }
    }

    // Quick search
    const results = await quickSearch(targetBusinessId, query);

    return NextResponse.json({ results });
  } catch (error) {
    console.error("[API/search] GET Error:", error);
    return NextResponse.json({ results: [] });
  }
}

// ============================================
// HEAD - Cache Stats (for monitoring)
// ============================================

export async function HEAD() {
  const stats = getCacheStats();

  return new NextResponse(null, {
    status: 200,
    headers: {
      "X-Cache-Size": stats.size.toString(),
      "X-Cache-Max-Size": stats.maxSize.toString(),
      "X-Cache-Hit-Rate": stats.hitRate.toFixed(3),
      "X-Cache-Total-Hits": stats.totalHits.toString(),
      "X-Cache-Total-Misses": stats.totalMisses.toString(),
    },
  });
}
