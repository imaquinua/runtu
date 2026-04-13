import { supabase } from "../supabase";

export interface DbConversation {
  id: string;
  business_id: string;
  title: string;
  created_at: string;
}

export interface DbMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export async function listConversations(businessId: string) {
  const { data, error } = await supabase
    .from("conversations")
    .select("id, business_id, title, created_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(50);
  return { data: (data ?? []) as DbConversation[], error };
}

export async function createConversation(businessId: string, title: string) {
  const { data, error } = await supabase
    .from("conversations")
    .insert({ business_id: businessId, title: title.slice(0, 100) })
    .select("id, business_id, title, created_at")
    .single();
  return { data: data as DbConversation | null, error };
}

export async function updateConversationTitle(id: string, title: string) {
  return supabase.from("conversations").update({ title: title.slice(0, 100) }).eq("id", id);
}

export async function deleteConversation(id: string) {
  return supabase.from("conversations").delete().eq("id", id);
}

export async function getMessages(conversationId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  return { data: (data ?? []) as DbMessage[], error };
}

export async function insertMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string
) {
  return supabase.from("messages").insert({ conversation_id: conversationId, role, content });
}
