// ============================================
// Milestone Detector
// ============================================
// Detecta logros y hitos del usuario para celebrar
// su progreso en la plataforma.

import { createAdminClient } from "@/lib/supabase/admin";
import type { CreateAlertData } from "@/types/alerts";

// Milestones de archivos
const FILE_MILESTONES = [1, 5, 10, 25, 50, 100];

// Milestones de preguntas al chat
const QUESTION_MILESTONES = [1, 10, 25, 50, 100];

export async function detectMilestones(
  businessId: string
): Promise<CreateAlertData[]> {
  const supabase = createAdminClient();
  const alerts: CreateAlertData[] = [];

  // Obtener estadísticas - uploads y chunks
  const [uploadsResult, chunksResult] = await Promise.all([
    supabase
      .from("uploads")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("processing_status", "completed"),
    supabase
      .from("knowledge_chunks")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId),
  ]);

  // Para mensajes, primero obtener conversaciones del business
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id")
    .eq("business_id", businessId);

  let totalQuestions = 0;
  if (conversations && conversations.length > 0) {
    const conversationIds = conversations.map((c) => c.id);
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("role", "user")
      .in("conversation_id", conversationIds);
    totalQuestions = count || 0;
  }

  const totalUploads = uploadsResult.count || 0;
  const totalChunks = chunksResult.count || 0;

  // Verificar milestones de archivos
  for (const milestone of FILE_MILESTONES) {
    if (totalUploads === milestone) {
      const exists = await checkMilestoneExists(
        businessId,
        `files_${milestone}`
      );
      if (!exists) {
        alerts.push(createFileMilestone(businessId, milestone));
      }
    }
  }

  // Verificar milestones de preguntas
  for (const milestone of QUESTION_MILESTONES) {
    if (totalQuestions === milestone) {
      const exists = await checkMilestoneExists(
        businessId,
        `questions_${milestone}`
      );
      if (!exists) {
        alerts.push(createQuestionMilestone(businessId, milestone));
      }
    }
  }

  // Milestone especial: primer resumen generado
  const { count: summariesCount } = await supabase
    .from("summaries")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId);

  if (summariesCount === 1) {
    const exists = await checkMilestoneExists(businessId, "first_summary");
    if (!exists) {
      alerts.push({
        businessId,
        type: "milestone",
        priority: "low",
        title: "Tu primer resumen",
        message:
          "Runtu generó tu primer resumen. Cada semana tendrás uno nuevo con lo más importante de tu negocio.",
        actionUrl: "/app/resumenes",
        actionLabel: "Ver resumen",
        metadata: { milestone: "first_summary" },
      });
    }
  }

  // Milestone especial: base de conocimiento robusta (100+ chunks)
  if (totalChunks >= 100) {
    const exists = await checkMilestoneExists(businessId, "knowledge_100");
    if (!exists) {
      alerts.push({
        businessId,
        type: "milestone",
        priority: "low",
        title: "Runtu te conoce bien",
        message:
          "Tu base de conocimiento ya tiene más de 100 fragmentos. Las respuestas de Runtu serán cada vez más precisas.",
        actionUrl: "/app/conocimiento",
        actionLabel: "Ver conocimiento",
        metadata: { milestone: "knowledge_100" },
      });
    }
  }

  return alerts;
}

async function checkMilestoneExists(
  businessId: string,
  milestoneKey: string
): Promise<boolean> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("alerts")
    .select("id")
    .eq("business_id", businessId)
    .eq("type", "milestone")
    .contains("metadata", { milestone: milestoneKey })
    .limit(1)
    .single();

  return !!data;
}

function createFileMilestone(
  businessId: string,
  count: number
): CreateAlertData {
  const messages: Record<number, { title: string; message: string }> = {
    1: {
      title: "¡Primer archivo!",
      message: "Subiste tu primer archivo. Runtu ya está aprendiendo de ti.",
    },
    5: {
      title: "¡5 archivos!",
      message: "Ya tienes 5 archivos. Runtu empieza a conocer tu negocio.",
    },
    10: {
      title: "¡10 archivos!",
      message:
        "Con 10 archivos, Runtu puede darte respuestas mucho más útiles.",
    },
    25: {
      title: "¡25 archivos!",
      message: "Impresionante. Tu base de conocimiento está creciendo.",
    },
    50: {
      title: "¡50 archivos!",
      message: "Runtu ya es todo un experto en tu negocio.",
    },
    100: {
      title: "¡100 archivos!",
      message:
        "Increíble compromiso. Runtu tiene una visión muy completa de tu negocio.",
    },
  };

  const content = messages[count] || {
    title: `¡${count} archivos!`,
    message: `Ya tienes ${count} archivos en Runtu.`,
  };

  return {
    businessId,
    type: "milestone",
    priority: "low",
    title: content.title,
    message: content.message,
    actionUrl: "/app/archivos",
    actionLabel: "Ver archivos",
    metadata: { milestone: `files_${count}` },
  };
}

function createQuestionMilestone(
  businessId: string,
  count: number
): CreateAlertData {
  const messages: Record<number, { title: string; message: string }> = {
    1: {
      title: "¡Primera pregunta!",
      message: "Hiciste tu primera pregunta. Runtu está aquí para ayudarte.",
    },
    10: {
      title: "¡10 preguntas!",
      message: "Ya le has preguntado 10 cosas a Runtu. ¡Sigue así!",
    },
    25: {
      title: "¡25 preguntas!",
      message: "Runtu ha respondido 25 de tus preguntas.",
    },
    50: {
      title: "¡50 preguntas!",
      message: "Eres un usuario activo. Runtu aprende de cada conversación.",
    },
    100: {
      title: "¡100 preguntas!",
      message: "Has tenido más de 100 interacciones con Runtu. ¡Impresionante!",
    },
  };

  const content = messages[count] || {
    title: `¡${count} preguntas!`,
    message: `Has hecho ${count} preguntas a Runtu.`,
  };

  return {
    businessId,
    type: "milestone",
    priority: "low",
    title: content.title,
    message: content.message,
    actionUrl: "/app/chat",
    actionLabel: "Ir al chat",
    metadata: { milestone: `questions_${count}` },
  };
}
