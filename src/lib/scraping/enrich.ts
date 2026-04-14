import { GoogleGenerativeAI } from "@google/generative-ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Sentiment } from "./types";

const ENRICH_BATCH_SIZE = 20;

interface EnrichedMention {
  id: string;
  sentiment: Sentiment;
  sentiment_score: number;
  topics: string[];
}

const ENRICH_PROMPT = `Eres analista de menciones en redes sociales para marcas latinoamericanas.

Tu tarea: clasificar cada mención y devolver JSON.

Para cada mención:
1. **sentiment**: "positive" | "neutral" | "negative"
2. **sentiment_score**: número entre -1 (muy negativo) y 1 (muy positivo)
3. **topics**: array de 1-5 temas cortos en español (2-3 palabras cada uno)

Reconoce jerga LATAM: chido, padre, bacano, chévere, chimba, mero, genial, terrible, horrible, malísimo.
Ignora emoji-spam, concursos y bots.

Devuelve SOLO JSON válido, sin markdown, con este shape exacto:
{
  "mentions": [
    { "id": "...", "sentiment": "positive|neutral|negative", "sentiment_score": 0.5, "topics": ["envío rápido", "buen precio"] }
  ]
}`;

export async function enrichBatch(supabase: SupabaseClient, geminiKey: string): Promise<number> {
  const { data: mentions, error } = await supabase
    .from("scraping_mentions")
    .select("id, text, platform")
    .is("processed_at", null)
    .not("text", "is", null)
    .order("created_at", { ascending: true })
    .limit(ENRICH_BATCH_SIZE);

  if (error) throw error;
  if (!mentions || mentions.length === 0) return 0;

  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: { responseMimeType: "application/json" },
  });
  const embModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

  // Clasificación en batch
  const userPrompt = `Menciones a clasificar:\n\n${mentions
    .map((m) => `ID: ${m.id}\nTexto: ${String(m.text).slice(0, 500)}`)
    .join("\n\n")}`;

  let enriched: EnrichedMention[] = [];
  try {
    const result = await model.generateContent([
      { text: ENRICH_PROMPT },
      { text: userPrompt },
    ]);
    const text = result.response.text();
    const parsed = JSON.parse(text);
    enriched = Array.isArray(parsed.mentions) ? parsed.mentions : [];
  } catch (err) {
    console.error("Error parseando JSON de Gemini:", err);
    // Marca como procesados con sentiment neutral para no bloquear la cola
    for (const m of mentions) {
      await supabase
        .from("scraping_mentions")
        .update({
          sentiment: "neutral",
          sentiment_score: 0,
          topics: [],
          processed_at: new Date().toISOString(),
        })
        .eq("id", m.id);
    }
    return mentions.length;
  }

  // Embeddings en paralelo (768 dim)
  const embeddingPromises = mentions.map(async (m) => {
    try {
      const emb = await embModel.embedContent(String(m.text).slice(0, 2000));
      return { id: m.id, values: emb.embedding.values };
    } catch {
      return { id: m.id, values: null };
    }
  });
  const embeddings = await Promise.all(embeddingPromises);
  const embMap = new Map(embeddings.map((e) => [e.id, e.values]));

  // Update uno por uno (mejor error recovery que bulk)
  let updated = 0;
  for (const m of mentions) {
    const enr = enriched.find((e) => e.id === m.id);
    const emb = embMap.get(m.id);
    const patch: Record<string, unknown> = {
      sentiment: enr?.sentiment ?? "neutral",
      sentiment_score: enr?.sentiment_score ?? 0,
      topics: enr?.topics ?? [],
      processed_at: new Date().toISOString(),
    };
    if (emb) patch.embedding = emb;

    const { error: updErr } = await supabase
      .from("scraping_mentions")
      .update(patch)
      .eq("id", m.id);
    if (!updErr) updated++;
  }

  return updated;
}
