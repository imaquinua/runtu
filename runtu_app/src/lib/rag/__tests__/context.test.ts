// ============================================
// RAG Context Builder - Unit Tests
// ============================================

import { describe, it, expect } from "vitest";
import {
  buildContext,
  buildStructuredContext,
  generateSystemPromptWithContext,
  summarizeContext,
} from "../context";
import type { RAGSearchResult } from "../types";

// Mock search results for testing
const mockResults: RAGSearchResult[] = [
  {
    id: "chunk-1",
    content: "Las ventas del día fueron de $5,000 pesos. El producto más vendido fue la pizza margherita.",
    chunk_type: "spreadsheet",
    source_context: "ventas_diarias.xlsx",
    metadata: {
      filename: "ventas_diarias.xlsx",
      sheetName: "Enero",
    },
    similarity: 0.9,
    score: 0.9,
    snippet: "Las ventas del día fueron de $5,000 pesos...",
    matchedKeywords: ["ventas"],
    source: {
      type: "spreadsheet",
      context: "ventas_diarias.xlsx",
      filename: "ventas_diarias.xlsx",
      sheet: "Enero",
    },
  },
  {
    id: "chunk-2",
    content: "Para hacer un cierre de caja: 1. Contar efectivo. 2. Comparar con sistema. 3. Registrar diferencias.",
    chunk_type: "document",
    source_context: "manual_operaciones.pdf",
    metadata: {
      filename: "manual_operaciones.pdf",
      page: 5,
    },
    similarity: 0.85,
    score: 0.85,
    snippet: "Para hacer un cierre de caja: 1. Contar efectivo...",
    matchedKeywords: ["cierre", "caja"],
    source: {
      type: "document",
      context: "manual_operaciones.pdf",
      filename: "manual_operaciones.pdf",
      page: 5,
    },
  },
  {
    id: "chunk-3",
    content: "Nota: Revisar inventario cada lunes. El proveedor Juan entrega los miércoles.",
    chunk_type: "manual_note",
    source_context: "notas_gerente",
    metadata: {},
    similarity: 0.75,
    score: 0.75,
    snippet: "Nota: Revisar inventario cada lunes...",
    matchedKeywords: ["inventario"],
    source: {
      type: "manual_note",
      context: "notas_gerente",
    },
  },
];

describe("buildContext", () => {
  it("should build context from search results", () => {
    const result = buildContext(mockResults);

    expect(result.context).toContain("ventas del día");
    expect(result.context).toContain("cierre de caja");
    expect(result.tokensUsed).toBeGreaterThan(0);
    expect(result.chunksIncluded).toBe(3);
    expect(result.sources.length).toBeGreaterThan(0);
    expect(result.wasTruncated).toBe(false);
  });

  it("should return empty context for no results", () => {
    const result = buildContext([]);

    expect(result.context).toBe("");
    expect(result.tokensUsed).toBe(0);
    expect(result.chunksIncluded).toBe(0);
    expect(result.sources).toHaveLength(0);
    expect(result.wasTruncated).toBe(false);
  });

  it("should respect maxTokens limit", () => {
    const result = buildContext(mockResults, { maxTokens: 50 });

    expect(result.tokensUsed).toBeLessThanOrEqual(50);
    expect(result.wasTruncated).toBe(true);
    expect(result.chunksIncluded).toBeLessThan(3);
  });

  it("should include source info when enabled", () => {
    const result = buildContext(mockResults, {
      includeSourceInfo: true,
      format: "structured",
    });

    expect(result.context).toContain("Fuente:");
  });

  it("should exclude source info when disabled", () => {
    const result = buildContext(mockResults, {
      includeSourceInfo: false,
      format: "structured",
    });

    expect(result.context).not.toContain("[Fuente:");
  });

  it("should format as markdown when specified", () => {
    const result = buildContext(mockResults, {
      includeSourceInfo: true,
      format: "markdown",
    });

    expect(result.context).toContain("###");
  });

  it("should use separators when enabled", () => {
    const result = buildContext(mockResults, {
      format: "markdown",
      includeSeparators: true,
    });

    expect(result.context).toContain("---");
  });

  it("should group by source when enabled", () => {
    const result = buildContext(mockResults, {
      groupBySource: true,
      format: "markdown",
    });

    expect(result.context).toContain("##");
  });

  it("should track all sources used", () => {
    const result = buildContext(mockResults);

    expect(result.sources).toContainEqual(
      expect.objectContaining({ type: "spreadsheet" })
    );
    expect(result.sources).toContainEqual(
      expect.objectContaining({ type: "document" })
    );
    expect(result.sources).toContainEqual(
      expect.objectContaining({ type: "manual_note" })
    );
  });
});

describe("buildStructuredContext", () => {
  it("should create sections by chunk type", () => {
    const result = buildStructuredContext(mockResults);

    expect(result.sections.length).toBeGreaterThan(0);
    expect(result.sections.some((s) => s.type === "spreadsheet")).toBe(true);
    expect(result.sections.some((s) => s.type === "document")).toBe(true);
    expect(result.sections.some((s) => s.type === "manual_note")).toBe(true);
  });

  it("should include section titles", () => {
    const result = buildStructuredContext(mockResults);

    const spreadsheetSection = result.sections.find((s) => s.type === "spreadsheet");
    expect(spreadsheetSection?.title).toBe("Hoja de cálculo");

    const docSection = result.sections.find((s) => s.type === "document");
    expect(docSection?.title).toBe("Documento");
  });

  it("should count tokens per section", () => {
    const result = buildStructuredContext(mockResults);

    for (const section of result.sections) {
      expect(section.tokens).toBeGreaterThan(0);
    }
  });

  it("should calculate total tokens", () => {
    const result = buildStructuredContext(mockResults);

    const sectionTokens = result.sections.reduce((sum, s) => sum + s.tokens, 0);
    expect(result.totalTokens).toBe(sectionTokens);
  });

  it("should generate sources summary", () => {
    const result = buildStructuredContext(mockResults);

    expect(result.sourcesSummary).toContain("Fuentes consultadas");
  });

  it("should respect maxTokens", () => {
    const result = buildStructuredContext(mockResults, 50);

    expect(result.totalTokens).toBeLessThanOrEqual(50);
  });

  it("should track sources per section", () => {
    const result = buildStructuredContext(mockResults);

    const spreadsheetSection = result.sections.find((s) => s.type === "spreadsheet");
    expect(spreadsheetSection?.sources).toContain("ventas_diarias.xlsx");
  });
});

describe("generateSystemPromptWithContext", () => {
  it("should generate prompt with built context", () => {
    const builtContext = buildContext(mockResults);
    const prompt = generateSystemPromptWithContext(builtContext, "Mi Taquería");

    expect(prompt).toContain("Mi Taquería");
    expect(prompt).toContain("asistente experto");
    expect(prompt).toContain("ventas del día");
    expect(prompt).toContain("Contexto del Negocio");
  });

  it("should generate prompt with structured context", () => {
    const structuredContext = buildStructuredContext(mockResults);
    const prompt = generateSystemPromptWithContext(structuredContext);

    expect(prompt).toContain("asistente experto");
    expect(prompt).toContain("###");
  });

  it("should include instructions about using context", () => {
    const builtContext = buildContext(mockResults);
    const prompt = generateSystemPromptWithContext(builtContext);

    expect(prompt).toContain("SOLO en el contexto");
    expect(prompt).toContain("español");
  });

  it("should work without business name", () => {
    const builtContext = buildContext(mockResults);
    const prompt = generateSystemPromptWithContext(builtContext);

    expect(prompt).toContain("negocios en Latinoamérica");
  });
});

describe("summarizeContext", () => {
  it("should summarize results by type", () => {
    const summary = summarizeContext(mockResults);

    expect(summary).toContain("Hoja de cálculo");
    expect(summary).toContain("Documento");
    expect(summary).toContain("Nota");
  });

  it("should respect token limit", () => {
    const summary = summarizeContext(mockResults, 20);

    // Should be truncated
    expect(summary.length).toBeLessThan(200);
  });

  it("should take best result per type", () => {
    const resultsWithDuplicateTypes: RAGSearchResult[] = [
      { ...mockResults[0], score: 0.9 },
      { ...mockResults[0], id: "chunk-1b", score: 0.7 },
    ];

    const summary = summarizeContext(resultsWithDuplicateTypes);
    // Should only include one spreadsheet entry
    const spreadsheetCount = (summary.match(/Hoja de cálculo/g) || []).length;
    expect(spreadsheetCount).toBe(1);
  });

  it("should return empty for no results", () => {
    const summary = summarizeContext([]);
    expect(summary).toBe("");
  });
});

describe("context with edge cases", () => {
  it("should handle results with missing metadata", () => {
    const resultsWithMissingMeta: RAGSearchResult[] = [
      {
        id: "chunk-x",
        content: "Contenido sin metadata completa",
        chunk_type: "document",
        source_context: null,
        metadata: {},
        similarity: 0.8,
        score: 0.8,
        snippet: "Contenido sin metadata...",
        matchedKeywords: [],
        source: {
          type: "document",
          context: null,
        },
      },
    ];

    const result = buildContext(resultsWithMissingMeta);
    expect(result.context).toContain("Contenido sin metadata");
  });

  it("should handle very long content", () => {
    const longResult: RAGSearchResult = {
      ...mockResults[0],
      content: "Contenido muy largo. ".repeat(500),
    };

    const result = buildContext([longResult], { maxTokens: 100 });
    expect(result.wasTruncated).toBe(true);
    expect(result.tokensUsed).toBeLessThanOrEqual(100);
  });

  it("should handle special characters in content", () => {
    const specialResult: RAGSearchResult = {
      ...mockResults[0],
      content: "Precio: $1,500.00 MXN. 50% descuento. Emoji: 🎉",
    };

    const result = buildContext([specialResult]);
    expect(result.context).toContain("$1,500.00");
    expect(result.context).toContain("🎉");
  });
});
