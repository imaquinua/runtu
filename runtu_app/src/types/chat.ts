// ============================================
// Chat Types
// ============================================

export interface Source {
  id: string;
  name: string;
  type: string;
  preview: string;
  uploadId?: string;
  confidence?: number; // 0-1 similarity score
  fullContent?: string; // Para el modal
}

export interface Message {
  id: string;
  conversationId?: string;
  conversation_id?: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  createdAt: Date;
  created_at?: string;
}

export interface Conversation {
  id: string;
  businessId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}
