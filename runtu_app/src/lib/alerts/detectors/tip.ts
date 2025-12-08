// ============================================
// Tip Detector
// ============================================
// Genera sugerencias de uso basadas en el comportamiento
// del usuario para ayudarle a aprovechar mejor Runtu.

import { createAdminClient } from "@/lib/supabase/admin";
import type { CreateAlertData } from "@/types/alerts";

interface TipConfig {
  id: string;
  condition: (stats: UserStats) => boolean;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
}

interface UserStats {
  totalUploads: number;
  totalChunks: number;
  totalConversations: number;
  totalMessages: number;
  hasSummaries: boolean;
  lastUploadDaysAgo: number;
  fileTypes: string[];
}

// Tips disponibles
const TIPS: TipConfig[] = [
  {
    id: "try_chat",
    condition: (s) => s.totalUploads >= 3 && s.totalConversations === 0,
    title: "Prueba el chat",
    message:
      "Ya tienes archivos subidos. Pregúntale algo a Runtu sobre tu negocio.",
    actionUrl: "/app/chat",
    actionLabel: "Ir al chat",
  },
  {
    id: "upload_variety",
    condition: (s) =>
      s.totalUploads >= 5 && s.fileTypes.length === 1,
    title: "Variedad de archivos",
    message:
      "Prueba subir diferentes tipos de archivos: fotos de productos, recibos, facturas. Así Runtu entiende mejor tu negocio.",
    actionUrl: "/app/subir",
    actionLabel: "Subir archivo",
  },
  {
    id: "check_summaries",
    condition: (s) => s.hasSummaries && s.totalConversations < 3,
    title: "Revisa tus resúmenes",
    message:
      "Tienes resúmenes disponibles. Son una forma rápida de entender qué está pasando en tu negocio.",
    actionUrl: "/app/resumenes",
    actionLabel: "Ver resúmenes",
  },
  {
    id: "upload_receipts",
    condition: (s) =>
      s.totalUploads >= 2 &&
      !s.fileTypes.includes("image/jpeg") &&
      !s.fileTypes.includes("image/png"),
    title: "Sube fotos de recibos",
    message:
      "Runtu puede leer fotos de tickets y facturas. Tómales una foto y súbelas.",
    actionUrl: "/app/subir",
    actionLabel: "Subir foto",
  },
  {
    id: "explore_knowledge",
    condition: (s) => s.totalChunks >= 50 && s.totalConversations >= 5,
    title: "Explora tu conocimiento",
    message:
      "Tu base de conocimiento ha crecido. Revisa qué información tiene Runtu sobre tu negocio.",
    actionUrl: "/app/conocimiento",
    actionLabel: "Ver conocimiento",
  },
  {
    id: "keep_uploading",
    condition: (s) => s.totalUploads >= 10 && s.lastUploadDaysAgo >= 5,
    title: "Mantén a Runtu actualizado",
    message:
      "No olvides subir tus archivos recientes. Mientras más actualizada esté la información, mejores serán las respuestas.",
    actionUrl: "/app/subir",
    actionLabel: "Subir archivo",
  },
];

export async function detectTips(
  businessId: string
): Promise<CreateAlertData[]> {
  const supabase = createAdminClient();

  // Obtener estadísticas del usuario
  const stats = await getUserStats(businessId);

  // Verificar qué tips ya se han mostrado
  const { data: existingTips } = await supabase
    .from("alerts")
    .select("metadata")
    .eq("business_id", businessId)
    .eq("type", "tip");

  const shownTipIds = new Set(
    (existingTips || [])
      .map((a) => (a.metadata as { tipId?: string })?.tipId)
      .filter(Boolean)
  );

  // Encontrar tips aplicables que no se han mostrado
  const applicableTips = TIPS.filter(
    (tip) => !shownTipIds.has(tip.id) && tip.condition(stats)
  );

  // Limitar a 1 tip por ejecución
  const selectedTip = applicableTips[0];

  if (!selectedTip) {
    return [];
  }

  return [
    {
      businessId,
      type: "tip",
      priority: "low",
      title: selectedTip.title,
      message: selectedTip.message,
      actionUrl: selectedTip.actionUrl,
      actionLabel: selectedTip.actionLabel,
      metadata: { tipId: selectedTip.id },
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Expira en 14 días
    },
  ];
}

async function getUserStats(businessId: string): Promise<UserStats> {
  const supabase = createAdminClient();

  const [
    uploadsResult,
    chunksResult,
    conversationsResult,
    messagesResult,
    summariesResult,
    lastUploadResult,
    fileTypesResult,
  ] = await Promise.all([
    supabase
      .from("uploads")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId),
    supabase
      .from("knowledge_chunks")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId),
    supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId),
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("role", "user"),
    supabase
      .from("summaries")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId),
    supabase
      .from("uploads")
      .select("created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("uploads")
      .select("file_type")
      .eq("business_id", businessId),
  ]);

  const lastUploadDate = lastUploadResult.data?.created_at
    ? new Date(lastUploadResult.data.created_at)
    : new Date();

  const lastUploadDaysAgo = Math.floor(
    (Date.now() - lastUploadDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const fileTypes = [
    ...new Set((fileTypesResult.data || []).map((u) => u.file_type)),
  ];

  return {
    totalUploads: uploadsResult.count || 0,
    totalChunks: chunksResult.count || 0,
    totalConversations: conversationsResult.count || 0,
    totalMessages: messagesResult.count || 0,
    hasSummaries: (summariesResult.count || 0) > 0,
    lastUploadDaysAgo,
    fileTypes,
  };
}
