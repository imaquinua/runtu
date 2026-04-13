import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = { runtime: "edge" };

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  message: string;
  history: ChatMessage[];
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

function buildSystemPrompt(
  business: ChatRequest["business"],
  mmm: ChatRequest["mmmContext"]
): string {
  const parts: string[] = [
    `Eres Runtu, el copiloto de marketing de un emprendedor latinoamericano.`,
    `Tu estilo: directo, analítico, cercano. Hablas español neutro LATAM.`,
    `Respondes con datos específicos, sin rodeos corporativos. Usas markdown cuando ayuda (tablas, listas, negritas).`,
    `Nunca inventas datos. Si no tienes información, lo dices.`,
  ];

  if (business) {
    parts.push(``, `## Contexto del negocio`);
    parts.push(`- **Nombre:** ${business.name}`);
    if (business.sector) parts.push(`- **Sector:** ${business.sector}`);
    if (business.description) parts.push(`- **Descripción:** ${business.description}`);
  }

  if (mmm) {
    parts.push(``, `## Último análisis MMM (${mmm.filename})`);
    parts.push(`- **R²:** ${mmm.rSquared.toFixed(2)}`);
    parts.push(`- **Canal con mayor elasticidad:** ${mmm.topChannel}`);
    parts.push(`- **Canales:**`);
    mmm.channels.forEach((c) => {
      const sig = c.pValue < 0.05 ? "significativo" : "no significativo";
      parts.push(
        `  - ${c.name}: elasticidad ${c.elasticity.toFixed(2)}x · contribución ${c.contribution}% · p-value ${c.pValue.toFixed(3)} (${sig})`
      );
    });
    parts.push(``, `Cuando el usuario te pregunte sobre ROI, presupuesto, canales, rendimiento o atribución, usa estos datos reales.`);
  } else {
    parts.push(``, `## Nota`);
    parts.push(`Este usuario aún no ha corrido un análisis MMM. Si pregunta por atribución, canales o presupuesto, invítalo a subir su CSV en /app/mmm.`);
  }

  return parts.join("\n");
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: ChatRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body.message?.trim()) {
    return new Response(JSON.stringify({ error: "Message required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const systemInstruction = buildSystemPrompt(body.business ?? null, body.mmmContext ?? null);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction,
  });

  const history = (body.history ?? []).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  try {
    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(body.message);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error llamando a Gemini";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
