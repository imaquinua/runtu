// ============================================
// Database Functions - Conversations
// ============================================

import { createClient } from "@/lib/supabase/server";

// ============================================
// Types
// ============================================

export interface Conversation {
  id: string;
  business_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  preview?: string; // Último mensaje (para lista)
  message_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  tokens_used?: number;
  created_at: string;
}

export interface Source {
  documentId: string;
  documentName: string;
  chunkIndex: number;
  relevance: number;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

// ============================================
// Create Conversation
// ============================================

export async function createConversation(businessId: string): Promise<Conversation> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("conversations")
    .insert({ business_id: businessId })
    .select()
    .single();

  if (error) {
    console.error("[DB] Error creating conversation:", error);
    throw new Error("No se pudo crear la conversación");
  }

  return data;
}

// ============================================
// Get Conversations List
// ============================================

export async function getConversations(
  businessId: string,
  limit: number = 50
): Promise<Conversation[]> {
  const supabase = await createClient();

  // Obtener conversaciones con el último mensaje como preview
  const { data, error } = await supabase
    .from("conversations")
    .select(`
      id,
      business_id,
      title,
      created_at,
      updated_at,
      messages (
        content,
        role,
        created_at
      )
    `)
    .eq("business_id", businessId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[DB] Error fetching conversations:", error);
    throw new Error("No se pudieron cargar las conversaciones");
  }

  // Procesar para agregar preview del último mensaje
  return (data || []).map((conv) => {
    const messages = conv.messages as Array<{ content: string; role: string; created_at: string }>;
    const lastMessage = messages?.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    return {
      id: conv.id,
      business_id: conv.business_id,
      title: conv.title,
      created_at: conv.created_at,
      updated_at: conv.updated_at,
      preview: lastMessage?.content?.slice(0, 100) || undefined,
      message_count: messages?.length || 0,
    };
  });
}

// ============================================
// Get Single Conversation with Messages
// ============================================

export async function getConversation(
  conversationId: string
): Promise<ConversationWithMessages | null> {
  const supabase = await createClient();

  // Obtener conversación
  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .select()
    .eq("id", conversationId)
    .single();

  if (convError) {
    if (convError.code === "PGRST116") {
      return null; // No encontrada
    }
    console.error("[DB] Error fetching conversation:", convError);
    throw new Error("No se pudo cargar la conversación");
  }

  // Obtener mensajes
  const { data: messages, error: msgError } = await supabase
    .from("messages")
    .select()
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (msgError) {
    console.error("[DB] Error fetching messages:", msgError);
    throw new Error("No se pudieron cargar los mensajes");
  }

  // Map messages to ensure proper typing
  const typedMessages: Message[] = (messages || []).map((m) => ({
    id: m.id,
    conversation_id: m.conversation_id,
    role: m.role as "user" | "assistant",
    content: m.content,
    sources: (m.sources as unknown) as Source[] | undefined,
    tokens_used: m.tokens_used ?? undefined,
    created_at: m.created_at,
  }));

  return {
    ...conversation,
    messages: typedMessages,
  };
}

// ============================================
// Add Message
// ============================================

export interface AddMessageParams {
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  tokensUsed?: number;
}

export async function addMessage(params: AddMessageParams): Promise<Message> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: params.conversationId,
      role: params.role,
      content: params.content,
      sources: params.sources ? JSON.parse(JSON.stringify(params.sources)) : null,
      tokens_used: params.tokensUsed || null,
    })
    .select()
    .single();

  if (error) {
    console.error("[DB] Error adding message:", error);
    throw new Error("No se pudo guardar el mensaje");
  }

  return {
    id: data.id,
    conversation_id: data.conversation_id,
    role: data.role as "user" | "assistant",
    content: data.content,
    sources: (data.sources as unknown) as Source[] | undefined,
    tokens_used: data.tokens_used ?? undefined,
    created_at: data.created_at,
  };
}

// ============================================
// Update Conversation Title
// ============================================

export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("conversations")
    .update({ title })
    .eq("id", conversationId);

  if (error) {
    console.error("[DB] Error updating title:", error);
    throw new Error("No se pudo actualizar el título");
  }
}

// ============================================
// Delete Conversation
// ============================================

export async function deleteConversation(conversationId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", conversationId);

  if (error) {
    console.error("[DB] Error deleting conversation:", error);
    throw new Error("No se pudo eliminar la conversación");
  }
}
