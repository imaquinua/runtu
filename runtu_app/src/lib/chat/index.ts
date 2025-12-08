// ============================================
// Chat Service - Public API
// ============================================

export { processChat, hasBusinessKnowledge, getSuggestedQuestions } from "./service";

export { generateChatResponse, generateWithRetry } from "./gemini";

export {
  type ChatRequest,
  type ChatResponse,
  type ChatMetrics,
  type ChatHistoryMessage,
  type ChatConfig,
  type ChatErrorCode,
  ChatError,
  DEFAULT_CHAT_CONFIG,
  RUNTU_SYSTEM_PROMPT,
  NO_KNOWLEDGE_RESPONSE,
} from "./types";
