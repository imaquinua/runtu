import type { MMMResult } from "../mmm/types";

export interface ChatStreamRequest {
  message: string;
  history: { role: "user" | "assistant"; content: string }[];
  business?: {
    name: string;
    sector: string | null;
    description: string | null;
  } | null;
  mmmContext?: {
    rSquared: number;
    channels: { name: string; elasticity: number; pValue: number; contribution: number }[];
    topChannel: string;
    filename: string;
  } | null;
}

export function buildMMMContext(mmm: MMMResult | null): ChatStreamRequest["mmmContext"] {
  if (!mmm) return null;
  const top = [...mmm.channels].sort((a, b) => b.elasticity - a.elasticity)[0];
  return {
    rSquared: mmm.rSquared,
    filename: mmm.filename,
    topChannel: top?.name ?? "",
    channels: mmm.channels.map((c) => ({
      name: c.name,
      elasticity: c.elasticity,
      pValue: c.pValue,
      contribution: c.contribution,
    })),
  };
}

/**
 * Stream de la respuesta de Gemini vía el endpoint /api/chat.
 * Llama onChunk por cada fragmento recibido.
 * Retorna el texto completo al final.
 */
export async function streamChat(
  req: ChatStreamRequest,
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    signal,
  });

  if (!res.ok) {
    let errorMsg = `Error ${res.status}`;
    try {
      const data = await res.json();
      errorMsg = data.error ?? errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  if (!res.body) throw new Error("No hay cuerpo en la respuesta");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      full += chunk;
      onChunk(chunk);
    }
  } finally {
    reader.releaseLock();
  }

  return full;
}
