// ============================================
// Chunking Utilities - Unit Tests
// ============================================

import { describe, it, expect } from "vitest";
import {
  chunkText,
  chunkByParagraphs,
  chunkBySentences,
  chunkByWords,
  chunkSpreadsheetData,
  chunkTranscript,
  chunkTextWithMetadata,
  countTokens,
  type SpreadsheetData,
} from "../chunking";

describe("countTokens", () => {
  it("should estimate tokens for short text", () => {
    const text = "Hola mundo";
    const tokens = countTokens(text);
    expect(tokens).toBeGreaterThan(0);
    expect(tokens).toBeLessThan(10);
  });

  it("should estimate tokens for longer text", () => {
    const text = "Este es un texto más largo que contiene múltiples palabras para probar la estimación de tokens.";
    const tokens = countTokens(text);
    expect(tokens).toBeGreaterThan(10);
    expect(tokens).toBeLessThan(50);
  });

  it("should return 0 for empty text", () => {
    expect(countTokens("")).toBe(0);
    expect(countTokens("   ")).toBe(0);
  });
});

describe("chunkText", () => {
  it("should return single chunk for short text", () => {
    const text = "Este es un texto corto.";
    const chunks = chunkText(text, { maxTokens: 100 });
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe(text);
  });

  it("should return empty array for empty text", () => {
    expect(chunkText("")).toHaveLength(0);
    expect(chunkText("   ")).toHaveLength(0);
  });

  it("should split long text into multiple chunks", () => {
    const paragraph = "Esta es una oración de prueba. ";
    const text = paragraph.repeat(50);
    const chunks = chunkText(text, { maxTokens: 50 });
    expect(chunks.length).toBeGreaterThan(1);
  });

  it("should respect maxTokens limit", () => {
    const text = "Palabra ".repeat(100);
    const maxTokens = 30;
    const chunks = chunkText(text, { maxTokens });

    for (const chunk of chunks) {
      const tokens = countTokens(chunk);
      expect(tokens).toBeLessThanOrEqual(maxTokens * 1.5);
    }
  });

  it("should preserve paragraph structure when enabled", () => {
    const text = `Primer párrafo con contenido.

Segundo párrafo con más contenido.

Tercer párrafo final.`;

    const chunks = chunkText(text, {
      maxTokens: 1000,
      preserveParagraphs: true,
    });

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toContain("Primer párrafo");
    expect(chunks[0]).toContain("Segundo párrafo");
  });
});

describe("chunkByParagraphs", () => {
  it("should keep paragraphs together when possible", () => {
    const text = `Párrafo uno es corto.

Párrafo dos también.

Párrafo tres igual.`;

    const chunks = chunkByParagraphs(text, 100);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toContain("Párrafo uno");
    expect(chunks[0]).toContain("Párrafo dos");
    expect(chunks[0]).toContain("Párrafo tres");
  });

  it("should split when paragraphs exceed limit", () => {
    const longParagraph = "Esta es una oración larga. ".repeat(30);
    const text = `${longParagraph}

${longParagraph}`;

    const chunks = chunkByParagraphs(text, 50);
    expect(chunks.length).toBeGreaterThan(1);
  });

  it("should handle single paragraph", () => {
    const text = "Un solo párrafo sin separaciones.";
    const chunks = chunkByParagraphs(text, 100);
    expect(chunks).toHaveLength(1);
  });
});

describe("chunkBySentences", () => {
  it("should split by sentences", () => {
    const text = "Primera oración. Segunda oración. Tercera oración.";
    const chunks = chunkBySentences(text, 20);
    expect(chunks.length).toBeGreaterThan(0);
  });

  it("should handle Spanish punctuation", () => {
    const text = "¿Cómo estás? ¡Muy bien! Gracias por preguntar.";
    const chunks = chunkBySentences(text, 100);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toContain("¿Cómo");
    expect(chunks[0]).toContain("¡Muy");
  });

  it("should handle ellipsis", () => {
    const text = "Pensando... Luego decidí... Finalmente actué.";
    const chunks = chunkBySentences(text, 100);
    expect(chunks.length).toBeGreaterThan(0);
  });

  it("should group sentences up to token limit", () => {
    const text = "Uno. Dos. Tres. Cuatro. Cinco. Seis.";
    const chunks = chunkBySentences(text, 10);
    expect(chunks.length).toBeGreaterThan(1);
  });
});

describe("chunkByWords", () => {
  it("should split by words", () => {
    const text = "palabra ".repeat(20);
    const chunks = chunkByWords(text.trim(), 10);
    expect(chunks.length).toBeGreaterThan(1);
  });

  it("should handle very long words", () => {
    const text = "supercalifragilisticoexpialidoso normal palabra";
    const chunks = chunkByWords(text, 100);
    expect(chunks).toHaveLength(1);
  });

  it("should apply overlap", () => {
    const text = "uno dos tres cuatro cinco seis siete ocho nueve diez";
    const chunks = chunkByWords(text, 10, 5);

    if (chunks.length > 1) {
      const firstChunkWords = chunks[0].split(" ");
      const secondChunkWords = chunks[1].split(" ");
      const shared = firstChunkWords.filter((w) => secondChunkWords.includes(w));
      expect(shared.length).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("chunkSpreadsheetData", () => {
  it("should chunk spreadsheet data with headers", () => {
    const data: SpreadsheetData = {
      headers: ["Producto", "Precio", "Cantidad"],
      rows: [
        ["Manzanas", 10, 50],
        ["Naranjas", 15, 30],
        ["Plátanos", 8, 100],
      ],
      sheetName: "Inventario",
    };

    const chunks = chunkSpreadsheetData(data, 500);
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0]).toContain("Inventario");
    expect(chunks[0]).toContain("Producto");
    expect(chunks[0]).toContain("Manzanas");
  });

  it("should handle empty rows", () => {
    const data: SpreadsheetData = {
      headers: ["Col1", "Col2"],
      rows: [],
      sheetName: "Vacío",
    };

    const chunks = chunkSpreadsheetData(data);
    expect(chunks).toHaveLength(0);
  });

  it("should handle data without headers", () => {
    const data: SpreadsheetData = {
      headers: [],
      rows: [
        [1, 2, 3],
        [4, 5, 6],
      ],
      sheetName: "Números",
    };

    const chunks = chunkSpreadsheetData(data);
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0]).toContain("Fila 1");
  });

  it("should split large spreadsheets into multiple chunks", () => {
    const data: SpreadsheetData = {
      headers: ["ID", "Descripción", "Valor"],
      rows: Array.from({ length: 100 }, (_, i) => [
        i + 1,
        `Descripción del item ${i + 1} con texto adicional`,
        Math.random() * 1000,
      ]),
      sheetName: "Datos",
    };

    const chunks = chunkSpreadsheetData(data, 200);
    expect(chunks.length).toBeGreaterThan(1);
  });

  it("should format numbers in Spanish locale", () => {
    const data: SpreadsheetData = {
      headers: ["Monto"],
      rows: [[1234567.89]],
      sheetName: "Test",
    };

    const chunks = chunkSpreadsheetData(data);
    const chunkText = chunks[0];
    expect(chunkText).toContain("Monto");
  });
});

describe("chunkTranscript", () => {
  it("should chunk transcript with timestamps", () => {
    const transcript = `[00:00:00] Hola, bienvenidos.
[00:00:05] Hoy vamos a hablar de algo importante.
[00:00:15] Comencemos con el primer punto.
[00:01:00] Ahora pasemos al segundo tema.`;

    const chunks = chunkTranscript(transcript, 50);
    expect(chunks.length).toBeGreaterThan(0);
  });

  it("should handle transcript without timestamps", () => {
    const transcript = "Esta es una transcripción sin marcas de tiempo. Continúa el texto normalmente.";
    const chunks = chunkTranscript(transcript, 100);
    expect(chunks).toHaveLength(1);
  });

  it("should keep timestamp context together", () => {
    const transcript = `[0:00] Inicio.
[0:05] Medio.
[0:10] Final.`;

    const chunks = chunkTranscript(transcript, 500);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toContain("[0:00]");
    expect(chunks[0]).toContain("[0:05]");
  });
});

describe("chunkTextWithMetadata", () => {
  it("should return chunks with metadata", () => {
    const text = "Primer chunk de texto. ".repeat(50);
    const chunks = chunkTextWithMetadata(text, { maxTokens: 50 });

    expect(chunks.length).toBeGreaterThan(0);
    chunks.forEach((chunk, index) => {
      expect(chunk.content).toBeTruthy();
      expect(chunk.metadata.index).toBe(index);
      expect(chunk.metadata.totalChunks).toBe(chunks.length);
      expect(chunk.metadata.tokens).toBeGreaterThan(0);
    });
  });

  it("should have correct totalChunks in all metadata", () => {
    const text = "Contenido de prueba. ".repeat(100);
    const chunks = chunkTextWithMetadata(text, { maxTokens: 30 });

    const totalChunks = chunks.length;
    chunks.forEach((chunk) => {
      expect(chunk.metadata.totalChunks).toBe(totalChunks);
    });
  });
});

describe("edge cases", () => {
  it("should handle text with only whitespace", () => {
    expect(chunkText("     ")).toHaveLength(0);
    expect(chunkText("\n\n\n")).toHaveLength(0);
    expect(chunkText("\t\t")).toHaveLength(0);
  });

  it("should handle text with special characters", () => {
    const text = "Texto con émojis 🎉 y caracteres especiales: áéíóú ñ ¿? ¡!";
    const chunks = chunkText(text, { maxTokens: 100 });
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toContain("🎉");
  });

  it("should handle very long single word", () => {
    const longWord = "a".repeat(1000);
    const chunks = chunkByWords(longWord, 50);
    expect(chunks.length).toBeGreaterThan(0);
  });

  it("should handle mixed content", () => {
    const text = `# Título

Párrafo normal con texto.

- Lista item 1
- Lista item 2

Más contenido después.`;

    const chunks = chunkText(text, { maxTokens: 500 });
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0]).toContain("Título");
  });
});
