// ============================================
// RAG - Context Builder
// ============================================
// Construye contexto optimizado para el LLM a partir de chunks

import { countTokens } from "@/lib/embeddings";
import type { ChunkType } from "@/types/database";
import {
  type ContextOptions,
  type BuiltContext,
  type ContextSource,
  type StructuredContext,
  type ContextSection,
  type RAGSearchResult,
  RAG_DEFAULTS,
  CHUNK_TYPE_DISPLAY,
} from "./types";

// ============================================
// Main Context Builder
// ============================================

/**
 * Construye contexto para el LLM a partir de resultados de búsqueda.
 * Optimiza para el límite de tokens manteniendo la relevancia.
 */
export function buildContext(
  results: RAGSearchResult[],
  options: ContextOptions = {}
): BuiltContext {
  const {
    maxTokens = RAG_DEFAULTS.MAX_CONTEXT_TOKENS,
    includeSourceInfo = true,
    groupBySource = false,
    format = "plain",
    includeSeparators = true,
    prioritizeRecent = false,
  } = options;

  if (results.length === 0) {
    return {
      context: "",
      tokensUsed: 0,
      chunksIncluded: 0,
      sources: [],
      wasTruncated: false,
    };
  }

  // Opcionalmente priorizar resultados recientes
  let sortedResults = [...results];
  if (prioritizeRecent) {
    sortedResults = sortedResults.sort((a, b) => {
      // Mantener orden por score pero dar pequeño boost a recientes
      const scoreA = a.score * 0.8 + (a.metadata.createdAt ? 0.2 : 0);
      const scoreB = b.score * 0.8 + (b.metadata.createdAt ? 0.2 : 0);
      return scoreB - scoreA;
    });
  }

  // Agrupar por fuente si es necesario
  if (groupBySource) {
    return buildGroupedContext(sortedResults, maxTokens, includeSourceInfo, format);
  }

  // Construir contexto lineal
  return buildLinearContext(
    sortedResults,
    maxTokens,
    includeSourceInfo,
    format,
    includeSeparators
  );
}

// ============================================
// Linear Context Builder
// ============================================

function buildLinearContext(
  results: RAGSearchResult[],
  maxTokens: number,
  includeSourceInfo: boolean,
  format: "plain" | "structured" | "markdown",
  includeSeparators: boolean
): BuiltContext {
  const parts: string[] = [];
  const sources: Map<string, ContextSource> = new Map();
  let totalTokens = 0;
  let chunksIncluded = 0;
  let wasTruncated = false;

  // Reservar tokens para overhead (separadores, etc.)
  const overheadTokens = 50;
  const availableTokens = maxTokens - overheadTokens;

  for (const result of results) {
    // Formatear chunk según formato
    const formattedChunk = formatChunk(result, format, includeSourceInfo);
    const chunkTokens = countTokens(formattedChunk);

    // Verificar si cabe
    if (totalTokens + chunkTokens > availableTokens) {
      // Intentar incluir versión truncada
      const remainingTokens = availableTokens - totalTokens;
      if (remainingTokens > 50) {
        const truncated = truncateToTokens(formattedChunk, remainingTokens);
        parts.push(truncated);
        totalTokens += countTokens(truncated);
        chunksIncluded++;
      }
      wasTruncated = true;
      break;
    }

    parts.push(formattedChunk);
    totalTokens += chunkTokens;
    chunksIncluded++;

    // Trackear fuente
    const sourceKey = result.source.context ?? result.chunk_type;
    const existing = sources.get(sourceKey);
    if (existing) {
      existing.chunkCount++;
    } else {
      sources.set(sourceKey, {
        type: result.chunk_type,
        context: result.source.context,
        chunkCount: 1,
        filename: result.source.filename,
      });
    }
  }

  // Unir partes con separadores
  const separator = getSeparator(format, includeSeparators);
  const context = parts.join(separator);

  return {
    context,
    tokensUsed: totalTokens,
    chunksIncluded,
    sources: Array.from(sources.values()),
    wasTruncated,
  };
}

// ============================================
// Grouped Context Builder
// ============================================

function buildGroupedContext(
  results: RAGSearchResult[],
  maxTokens: number,
  includeSourceInfo: boolean,
  format: "plain" | "structured" | "markdown"
): BuiltContext {
  // Agrupar por tipo de chunk
  const groups = new Map<ChunkType, RAGSearchResult[]>();

  for (const result of results) {
    const type = result.chunk_type;
    if (!groups.has(type)) {
      groups.set(type, []);
    }
    groups.get(type)!.push(result);
  }

  const parts: string[] = [];
  const sources: Map<string, ContextSource> = new Map();
  let totalTokens = 0;
  let chunksIncluded = 0;
  let wasTruncated = false;

  const availableTokens = maxTokens - 100; // Overhead para headers

  // Procesar cada grupo
  for (const [type, groupResults] of groups) {
    // Header del grupo
    const header = formatGroupHeader(type, format);
    const headerTokens = countTokens(header);

    if (totalTokens + headerTokens > availableTokens) {
      wasTruncated = true;
      break;
    }

    parts.push(header);
    totalTokens += headerTokens;

    // Agregar chunks del grupo
    for (const result of groupResults) {
      const formattedChunk = formatChunk(result, format, includeSourceInfo);
      const chunkTokens = countTokens(formattedChunk);

      if (totalTokens + chunkTokens > availableTokens) {
        wasTruncated = true;
        break;
      }

      parts.push(formattedChunk);
      totalTokens += chunkTokens;
      chunksIncluded++;

      // Trackear fuente
      const sourceKey = result.source.context ?? type;
      const existing = sources.get(sourceKey);
      if (existing) {
        existing.chunkCount++;
      } else {
        sources.set(sourceKey, {
          type: result.chunk_type,
          context: result.source.context,
          chunkCount: 1,
          filename: result.source.filename,
        });
      }
    }

    if (wasTruncated) break;
  }

  const context = parts.join("\n");

  return {
    context,
    tokensUsed: totalTokens,
    chunksIncluded,
    sources: Array.from(sources.values()),
    wasTruncated,
  };
}

// ============================================
// Structured Context Builder
// ============================================

/**
 * Construye contexto estructurado con secciones por tipo.
 * Útil para prompts que necesitan referencia a diferentes tipos de información.
 */
export function buildStructuredContext(
  results: RAGSearchResult[],
  maxTokens: number = RAG_DEFAULTS.MAX_CONTEXT_TOKENS
): StructuredContext {
  // Agrupar por tipo
  const groups = new Map<ChunkType, RAGSearchResult[]>();

  for (const result of results) {
    const type = result.chunk_type;
    if (!groups.has(type)) {
      groups.set(type, []);
    }
    groups.get(type)!.push(result);
  }

  const sections: ContextSection[] = [];
  let totalTokens = 0;
  const availableTokens = maxTokens - 100;

  // Orden de prioridad de secciones
  const typeOrder: ChunkType[] = [
    "document",
    "spreadsheet",
    "manual_note",
    "image_analysis",
    "audio_transcript",
    "video_analysis",
  ];

  for (const type of typeOrder) {
    const groupResults = groups.get(type);
    if (!groupResults || groupResults.length === 0) continue;

    const title = CHUNK_TYPE_DISPLAY[type];
    const sectionParts: string[] = [];
    const sectionSources: string[] = [];
    let sectionTokens = 0;

    for (const result of groupResults) {
      const content = result.content;
      const contentTokens = countTokens(content);

      if (totalTokens + sectionTokens + contentTokens > availableTokens) {
        break;
      }

      sectionParts.push(content);
      sectionTokens += contentTokens;

      if (result.source.context && !sectionSources.includes(result.source.context)) {
        sectionSources.push(result.source.context);
      }
    }

    if (sectionParts.length > 0) {
      sections.push({
        title,
        type,
        content: sectionParts.join("\n\n"),
        tokens: sectionTokens,
        sources: sectionSources,
      });
      totalTokens += sectionTokens;
    }
  }

  // Generar resumen de fuentes
  const allSources = sections.flatMap((s) => s.sources);
  const uniqueSources = [...new Set(allSources)];
  const sourcesSummary =
    uniqueSources.length > 0
      ? `Fuentes consultadas: ${uniqueSources.join(", ")}`
      : "Sin fuentes identificadas";

  return {
    sections,
    sourcesSummary,
    totalTokens,
  };
}

// ============================================
// Context Formatting Helpers
// ============================================

function formatChunk(
  result: RAGSearchResult,
  format: "plain" | "structured" | "markdown",
  includeSourceInfo: boolean
): string {
  const { content, source, score } = result;

  switch (format) {
    case "markdown":
      if (includeSourceInfo && source.context) {
        return `### ${source.context}\n${content}`;
      }
      return content;

    case "structured":
      if (includeSourceInfo) {
        return `[Fuente: ${source.context ?? CHUNK_TYPE_DISPLAY[source.type]}]\n${content}`;
      }
      return content;

    case "plain":
    default:
      if (includeSourceInfo && source.context) {
        return `(${source.context}) ${content}`;
      }
      return content;
  }
}

function formatGroupHeader(
  type: ChunkType,
  format: "plain" | "structured" | "markdown"
): string {
  const label = CHUNK_TYPE_DISPLAY[type];

  switch (format) {
    case "markdown":
      return `\n## ${label}\n`;
    case "structured":
      return `\n=== ${label.toUpperCase()} ===\n`;
    case "plain":
    default:
      return `\n[${label}]\n`;
  }
}

function getSeparator(
  format: "plain" | "structured" | "markdown",
  includeSeparators: boolean
): string {
  if (!includeSeparators) return "\n";

  switch (format) {
    case "markdown":
      return "\n\n---\n\n";
    case "structured":
      return "\n---\n";
    case "plain":
    default:
      return "\n\n";
  }
}

// ============================================
// Token Utilities
// ============================================

/**
 * Trunca texto a un número aproximado de tokens
 */
function truncateToTokens(text: string, maxTokens: number): string {
  // Estimación: ~4 caracteres por token
  const maxChars = maxTokens * 4;

  if (text.length <= maxChars) {
    return text;
  }

  // Cortar en límite de palabra
  let truncated = text.slice(0, maxChars);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > maxChars * 0.8) {
    truncated = truncated.slice(0, lastSpace);
  }

  return truncated + "...";
}

// ============================================
// Context Templates
// ============================================

/**
 * Genera un prompt de sistema con contexto para el LLM
 */
export function generateSystemPromptWithContext(
  context: BuiltContext | StructuredContext,
  businessName?: string
): string {
  const intro = businessName
    ? `Eres un asistente experto para "${businessName}", un negocio en Latinoamérica.`
    : "Eres un asistente experto para negocios en Latinoamérica.";

  const instructions = `
Responde las preguntas del usuario basándote SOLO en el contexto proporcionado.
Si la información no está en el contexto, indica que no tienes esa información.
Responde en español de manera clara y concisa.
Si hay datos numéricos, preséntalos de forma organizada.
`.trim();

  let contextSection: string;

  if ("sections" in context) {
    // StructuredContext
    const sectionTexts = context.sections.map(
      (s) => `### ${s.title}\n${s.content}`
    );
    contextSection = sectionTexts.join("\n\n");
  } else {
    // BuiltContext
    contextSection = context.context;
  }

  return `${intro}

${instructions}

## Contexto del Negocio

${contextSection}
`;
}

/**
 * Genera un contexto resumido para contextos muy grandes
 */
export function summarizeContext(
  results: RAGSearchResult[],
  maxTokens: number = 1000
): string {
  const summaryParts: string[] = [];
  let totalTokens = 0;

  // Agrupar por tipo y tomar los más relevantes
  const byType = new Map<ChunkType, RAGSearchResult>();

  for (const result of results) {
    const existing = byType.get(result.chunk_type);
    if (!existing || result.score > existing.score) {
      byType.set(result.chunk_type, result);
    }
  }

  for (const [type, result] of byType) {
    const label = CHUNK_TYPE_DISPLAY[type];
    const snippet = result.snippet;
    const line = `${label}: ${snippet}`;
    const lineTokens = countTokens(line);

    if (totalTokens + lineTokens > maxTokens) break;

    summaryParts.push(line);
    totalTokens += lineTokens;
  }

  return summaryParts.join("\n");
}

// ============================================
// Export
// ============================================

export type { ContextOptions, BuiltContext, StructuredContext, ContextSection };
