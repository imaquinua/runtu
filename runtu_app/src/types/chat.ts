// ============================================
// Chat Types
// ============================================

export interface Source {
  id: string;
  name: string;
  type: string;
  chunkPreview: string;
}

export interface Message {
  id: string;
  conversationId?: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  createdAt: Date;
}

export interface Conversation {
  id: string;
  businessId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}
