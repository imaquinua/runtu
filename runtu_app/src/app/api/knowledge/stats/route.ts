// ============================================
// API Route: /api/knowledge/stats
// Get knowledge base statistics
// ============================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBusinessStats } from "@/lib/db/knowledge";

export async function GET() {
  try {
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
        data: {
          total_chunks: 0,
          total_tokens: 0,
          chunks_by_type: {},
          last_chunk_at: null,
          has_embeddings: false,
        },
      });
    }

    // Get stats
    const stats = await getBusinessStats(business.id);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("[API/knowledge/stats] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno",
      },
      { status: 500 }
    );
  }
}
