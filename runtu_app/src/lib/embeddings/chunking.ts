// ============================================
// Text Chunking Utilities
// ============================================
// Divide textos largos en chunks manejables para embeddings

// ============================================
// Constants
// ============================================

export const MAX_TOKENS_PER_CHUNK = 500;
export const CHUNK_OVERLAP = 50;

// ============================================
// Types
// ============================================

export interface ChunkOptions {
  /** Máximo de tokens por chunk (default: 500) */
  maxTokens?: number;
  /** Tokens de overlap entre chunks (default: 50) */
  overlap?: number;
  /** Intenta preservar párrafos completos */
  preserveParagraphs?: boolean;
}

export interface SpreadsheetData {
  headers: string[];
  rows: unknown[][];
  sheetName: string;
}

export interface ChunkMetadata {
  index: number;
  totalChunks: number;
  tokens: number;
}

export interface TextChunk {
  content: string;
  metadata: ChunkMetadata;
}

// ============================================
// Token Counting
// ============================================

/**
 * Cuenta tokens en un texto.
 * Aproximación: ~4 caracteres = 1 token para español/inglés.
 */
export function countTokens(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) {
    return 0;
  }

  const charCount = trimmed.length;
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;

  const byChars = Math.ceil(charCount / 4);
  const byWords = Math.ceil(wordCount * 1.3);

  return Math.max(byChars, byWords);
}

// ============================================
// Main Chunking Function
// ============================================

/**
 * Divide texto largo en chunks manejables.
 * Intenta no cortar oraciones a la mitad.
 */
export function chunkText(text: string, options: ChunkOptions = {}): string[] {
  const {
    maxTokens = MAX_TOKENS_PER_CHUNK,
    overlap = CHUNK_OVERLAP,
    preserveParagraphs = true,
  } = options;

  const cleanedText = text.trim();

  if (!cleanedText) {
    return [];
  }

  if (countTokens(cleanedText) <= maxTokens) {
    return [cleanedText];
  }

  if (preserveParagraphs) {
    return chunkByParagraphs(cleanedText, maxTokens, overlap);
  }

  return chunkBySentences(cleanedText, maxTokens, overlap);
}

/**
 * Divide texto en chunks con metadata detallada.
 */
export function chunkTextWithMetadata(
  text: string,
  options: ChunkOptions = {}
): TextChunk[] {
  const chunks = chunkText(text, options);

  return chunks.map((content, index) => ({
    content,
    metadata: {
      index,
      totalChunks: chunks.length,
      tokens: countTokens(content),
    },
  }));
}

// ============================================
// Paragraph-based Chunking
// ============================================

/**
 * Agrupa párrafos hasta llenar el límite de tokens.
 */
export function chunkByParagraphs(
  text: string,
  maxTokens: number = MAX_TOKENS_PER_CHUNK,
  overlap: number = CHUNK_OVERLAP
): string[] {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return [];
  }

  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentTokens = 0;

  for (const paragraph of paragraphs) {
    const paragraphTokens = countTokens(paragraph);

    if (paragraphTokens > maxTokens) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join("\n\n"));
        currentChunk = [];
        currentTokens = 0;
      }

      const sentenceChunks = chunkBySentences(paragraph, maxTokens, overlap);
      chunks.push(...sentenceChunks);
      continue;
    }

    if (currentTokens + paragraphTokens > maxTokens) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join("\n\n"));
      }

      if (overlap > 0 && currentChunk.length > 0) {
        const lastParagraph = currentChunk[currentChunk.length - 1];
        const lastTokens = countTokens(lastParagraph);
        if (lastTokens <= overlap) {
          currentChunk = [lastParagraph];
          currentTokens = lastTokens;
        } else {
          currentChunk = [];
          currentTokens = 0;
        }
      } else {
        currentChunk = [];
        currentTokens = 0;
      }
    }

    currentChunk.push(paragraph);
    currentTokens += paragraphTokens;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join("\n\n"));
  }

  return chunks;
}

// ============================================
// Sentence-based Chunking
// ============================================

/**
 * Divide texto por oraciones, agrupándolas hasta el límite.
 */
export function chunkBySentences(
  text: string,
  maxTokens: number = MAX_TOKENS_PER_CHUNK,
  overlap: number = CHUNK_OVERLAP
): string[] {
  const sentences = text
    .split(/(?<=[.!?…])\s+|(?<=[.!?…])(?=[¿¡A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length === 0) {
    return [text.trim()].filter(Boolean);
  }

  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentTokens = 0;

  for (const sentence of sentences) {
    const sentenceTokens = countTokens(sentence);

    if (sentenceTokens > maxTokens) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(" "));
        currentChunk = [];
        currentTokens = 0;
      }

      const wordChunks = chunkByWords(sentence, maxTokens, overlap);
      chunks.push(...wordChunks);
      continue;
    }

    if (currentTokens + sentenceTokens > maxTokens) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(" "));
      }

      if (overlap > 0 && currentChunk.length > 0) {
        const overlapSentences: string[] = [];
        let overlapTokens = 0;

        for (let i = currentChunk.length - 1; i >= 0 && overlapTokens < overlap; i--) {
          const s = currentChunk[i];
          const tokens = countTokens(s);
          if (overlapTokens + tokens <= overlap) {
            overlapSentences.unshift(s);
            overlapTokens += tokens;
          } else {
            break;
          }
        }

        currentChunk = overlapSentences;
        currentTokens = overlapTokens;
      } else {
        currentChunk = [];
        currentTokens = 0;
      }
    }

    currentChunk.push(sentence);
    currentTokens += sentenceTokens;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(" "));
  }

  return chunks;
}

// ============================================
// Word-based Chunking (fallback)
// ============================================

/**
 * Divide por palabras cuando oraciones son muy largas.
 */
export function chunkByWords(
  text: string,
  maxTokens: number = MAX_TOKENS_PER_CHUNK,
  overlap: number = CHUNK_OVERLAP
): string[] {
  const words = text.split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return [];
  }

  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentTokens = 0;

  for (const word of words) {
    const wordTokens = countTokens(word);

    if (currentTokens + wordTokens > maxTokens) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(" "));
      }

      const overlapWords = Math.ceil(overlap / 1.3);

      if (overlap > 0 && currentChunk.length > overlapWords) {
        currentChunk = currentChunk.slice(-overlapWords);
        currentTokens = countTokens(currentChunk.join(" "));
      } else {
        currentChunk = [];
        currentTokens = 0;
      }
    }

    currentChunk.push(word);
    currentTokens += wordTokens;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(" "));
  }

  return chunks;
}

// ============================================
// Spreadsheet Chunking
// ============================================

/**
 * Convierte data de Excel/CSV a chunks textuales.
 */
export function chunkSpreadsheetData(
  data: SpreadsheetData,
  maxTokens: number = MAX_TOKENS_PER_CHUNK
): string[] {
  const { headers, rows, sheetName } = data;

  if (rows.length === 0) {
    return [];
  }

  const headerContext = headers.length > 0
    ? `Columnas: ${headers.join(", ")}`
    : "";
  const sheetContext = sheetName ? `En la hoja "${sheetName}"` : "";
  const contextPrefix = [sheetContext, headerContext].filter(Boolean).join(". ");

  const chunks: string[] = [];
  let currentRows: string[] = [];
  let currentTokens = countTokens(contextPrefix);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowText = formatRow(headers, row, i + 1);
    const rowTokens = countTokens(rowText);

    if (rowTokens > maxTokens - countTokens(contextPrefix)) {
      if (currentRows.length > 0) {
        chunks.push(formatChunk(contextPrefix, currentRows));
        currentRows = [];
        currentTokens = countTokens(contextPrefix);
      }

      const truncatedRow = truncateText(rowText, maxTokens - countTokens(contextPrefix) - 20);
      chunks.push(formatChunk(contextPrefix, [truncatedRow + " [truncado]"]));
      continue;
    }

    if (currentTokens + rowTokens > maxTokens) {
      if (currentRows.length > 0) {
        chunks.push(formatChunk(contextPrefix, currentRows));
      }
      currentRows = [];
      currentTokens = countTokens(contextPrefix);
    }

    currentRows.push(rowText);
    currentTokens += rowTokens;
  }

  if (currentRows.length > 0) {
    chunks.push(formatChunk(contextPrefix, currentRows));
  }

  return chunks;
}

function formatRow(headers: string[], row: unknown[], rowNumber: number): string {
  if (headers.length === 0) {
    return `Fila ${rowNumber}: ${row.map(formatCell).join(", ")}`;
  }

  const pairs: string[] = [];
  for (let i = 0; i < Math.max(headers.length, row.length); i++) {
    const header = headers[i] || `Col${i + 1}`;
    const value = row[i];
    if (value !== undefined && value !== null && value !== "") {
      pairs.push(`${header}: ${formatCell(value)}`);
    }
  }

  return `Fila ${rowNumber}: ${pairs.join(" | ")}`;
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "number") {
    return value.toLocaleString("es-MX");
  }
  if (value instanceof Date) {
    return value.toLocaleDateString("es-MX");
  }
  return String(value);
}

function formatChunk(context: string, rows: string[]): string {
  if (context) {
    return `${context}\n\n${rows.join("\n")}`;
  }
  return rows.join("\n");
}

function truncateText(text: string, maxTokens: number): string {
  const words = text.split(/\s+/);
  const result: string[] = [];
  let tokens = 0;

  for (const word of words) {
    const wordTokens = countTokens(word);
    if (tokens + wordTokens > maxTokens) {
      break;
    }
    result.push(word);
    tokens += wordTokens;
  }

  return result.join(" ");
}

// ============================================
// Transcript Chunking
// ============================================

/**
 * Chunking para transcripciones de audio/video.
 */
export function chunkTranscript(
  text: string,
  maxTokens: number = MAX_TOKENS_PER_CHUNK
): string[] {
  const timestampPattern = /\[?\d{1,2}:\d{2}(?::\d{2})?\]?/g;
  const hasTimestamps = timestampPattern.test(text);

  if (hasTimestamps) {
    const segments = text.split(/(?=\[?\d{1,2}:\d{2}(?::\d{2})?\]?)/);
    return chunkSegments(segments, maxTokens);
  }

  return chunkBySentences(text, maxTokens);
}

function chunkSegments(segments: string[], maxTokens: number): string[] {
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentTokens = 0;

  for (const segment of segments) {
    const segmentTokens = countTokens(segment);

    if (segmentTokens > maxTokens) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(""));
        currentChunk = [];
        currentTokens = 0;
      }
      const subChunks = chunkBySentences(segment, maxTokens);
      chunks.push(...subChunks);
      continue;
    }

    if (currentTokens + segmentTokens > maxTokens) {
      chunks.push(currentChunk.join(""));
      currentChunk = [];
      currentTokens = 0;
    }

    currentChunk.push(segment);
    currentTokens += segmentTokens;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(""));
  }

  return chunks;
}
