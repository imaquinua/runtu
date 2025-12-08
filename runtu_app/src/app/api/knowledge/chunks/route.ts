// ============================================
// API Route: /api/knowledge/chunks
// Get knowledge chunks
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getChunksByBusiness } from "@/lib/db/knowledge";
import type { ChunkType } from "@/types/database";

export async function GET(request: NextRequest) {
  try {
    // Get query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const chunkTypesParam = searchParams.get("chunkTypes");

    // Get current user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    // Get user's business
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (bizError || !business) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Parse chunk types if provided
    const chunkTypes = chunkTypesParam
      ? (chunkTypesParam.split(",") as ChunkType[])
      : undefined;

    // Get chunks
    const chunks = await getChunksByBusiness(business.id, {
      limit: Math.min(limit, 100),
      offset,
      chunkTypes,
      orderBy: "created_at",
      orderDirection: "desc",
    });

    return NextResponse.json({
      success: true,
      data: chunks,
    });
  } catch (error) {
    console.error("[API/knowledge/chunks] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno",
      },
      { status: 500 }
    );
  }
}
