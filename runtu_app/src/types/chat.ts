// ============================================
// Chat Types
// ============================================

export interface Source {
  id: string;
  name: string;
  type: string;
  preview: string;
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
