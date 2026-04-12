// ============================================
// API Route: /api/process
// Inicia y consulta procesamiento de uploads
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  processUpload,
  getUploadInfo,
  type ProcessingResult,
} from "@/lib/processors";

// ============================================
// POST - Start Processing
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { uploadId } = body;

    if (!uploadId) {
      return NextResponse.json(
        { error: "uploadId es requerido" },
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

    // Verify upload exists and belongs to user's business
    const upload = await getUploadInfo(uploadId);

    if (!upload) {
      return NextResponse.json(
        { error: "Upload no encontrado" },
        { status: 404 }
      );
    }

    // Verify user has access to this business
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", upload.business_id)
      .eq("user_id", user.id)
      .single();

    if (bizError || !business) {
      return NextResponse.json(
        { error: "No tienes acceso a este archivo" },
        { status: 403 }
      );
    }

    // Check if already processed
    if (upload.processed) {
      return NextResponse.json({
        success: true,
        message: "El archivo ya fue procesado",
        uploadId,
        status: "completed",
      });
    }

    // Check if already processing
    if (upload.processing_status === "processing") {
      return NextResponse.json({
        success: true,
        message: "El archivo ya está siendo procesado",
        uploadId,
        status: "processing",
      });
    }

    // Start processing (for small files, do it synchronously)
    // For larger files, you'd want to use a queue like Vercel Edge Functions or a background job
    const fileSize = upload.file_size ?? 0;
    const MAX_SYNC_SIZE = 5 * 1024 * 1024; // 5MB

    if (fileSize > MAX_SYNC_SIZE) {
      // For large files, start processing in background
      // Note: In production, you'd use a proper queue system
      processUpload(uploadId).catch((error) => {
        console.error(`[API/process] Error processing ${uploadId}:`, error);
      });

      return NextResponse.json({
        success: true,
        message: "Procesamiento iniciado",
        uploadId,
        status: "processing",
      });
    }

    // Process synchronously for small files
    const result = await processUpload(uploadId);

    return NextResponse.json({
      success: result.success,
      uploadId: result.uploadId,
      status: result.success ? "completed" : "failed",
      chunksCreated: result.chunksCreated,
      totalTokens: result.totalTokens,
      processingTimeMs: result.processingTimeMs,
      error: result.error,
    });
  } catch (error) {
    console.error("[API/process] Error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}

// ============================================
// GET - Check Processing Status
// ============================================

export async function GET(request: NextRequest) {
  try {
    // Get uploadId from query params
    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get("uploadId");

    if (!uploadId) {
      return NextResponse.json(
        { error: "uploadId es requerido" },
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

    // Get upload info
    const upload = await getUploadInfo(uploadId);

    if (!upload) {
      return NextResponse.json(
        { error: "Upload no encontrado" },
        { status: 404 }
      );
    }

    // Verify user has access
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", upload.business_id)
      .eq("user_id", user.id)
      .single();

    if (bizError || !business) {
      return NextResponse.json(
        { error: "No tienes acceso a este archivo" },
        { status: 403 }
      );
    }

    // Get chunk count if processed
    let chunksCount = 0;
    if (upload.processed) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count } = await (supabase as any)
        .from("knowledge_chunks")
        .select("*", { count: "exact", head: true })
        .eq("upload_id", uploadId);

      chunksCount = count ?? 0;
    }

    return NextResponse.json({
      uploadId,
      filename: upload.filename,
      fileType: upload.file_type,
      fileSize: upload.file_size,
      processed: upload.processed,
      status: upload.processing_status,
      chunksCount,
    });
  } catch (error) {
    console.error("[API/process] GET Error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
