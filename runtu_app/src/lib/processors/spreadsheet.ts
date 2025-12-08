// ============================================
// Spreadsheet Processor (Excel/CSV)
// ============================================

import * as XLSX from "xlsx";
import {
  processContentForEmbedding,
  chunkSpreadsheetData,
  generateEmbeddings,
  countTokens,
  type SpreadsheetData,
} from "@/lib/embeddings";
import {
  downloadFile,
  saveChunks,
  updateUploadStatus,
  measureTime,
} from "./utils";
import {
  ProcessingError,
  ProcessingErrorCodes,
  logProcessor,
  logProcessorError,
  type SpreadsheetProcessorParams,
  type ProcessingResult,
  type ChunkData,
} from "./types";

const PROCESSOR_NAME = "Spreadsheet";

// ============================================
// Main Processor
// ============================================

/**
 * Procesa un archivo Excel o CSV:
 * 1. Descarga de Storage
 * 2. Parsea con SheetJS
 * 3. Por cada hoja: detecta headers, genera resumen
 * 4. Genera embeddings
 * 5. Guarda en knowledge_chunks
 */
export async function processSpreadsheet(
  params: SpreadsheetProcessorParams
): Promise<ProcessingResult> {
  const { uploadId, businessId, filePath, fileType } = params;
  const startTime = Date.now();

  logProcessor(PROCESSOR_NAME, uploadId, "Iniciando procesamiento de hoja de cálculo", {
    filePath,
    fileType,
  });

  try {
    // Update status to processing
    await updateUploadStatus(uploadId, "processing");

    // 1. Download file from Storage
    logProcessor(PROCESSOR_NAME, uploadId, "Descargando archivo...");
    const { result: buffer, timeMs: downloadTime } = await measureTime(() =>
      downloadFile(filePath, uploadId)
    );
    logProcessor(PROCESSOR_NAME, uploadId, `Archivo descargado en ${downloadTime}ms`);

    // 2. Parse spreadsheet
    logProcessor(PROCESSOR_NAME, uploadId, "Parseando hoja de cálculo...");
    const parseStart = Date.now();
    const workbook = parseSpreadsheet(buffer, fileType, uploadId);
    const parseTime = Date.now() - parseStart;
    logProcessor(
      PROCESSOR_NAME,
      uploadId,
      `Parseado en ${parseTime}ms: ${workbook.SheetNames.length} hojas`
    );

    // 3. Process each sheet
    const filename = filePath.split("/").pop() ?? "archivo";
    const allChunks: ChunkData[] = [];
    let totalTokens = 0;

    for (const sheetName of workbook.SheetNames) {
      logProcessor(PROCESSOR_NAME, uploadId, `Procesando hoja: ${sheetName}`);

      const sheet = workbook.Sheets[sheetName];
      const sheetData = extractSheetData(sheet, sheetName);

      if (sheetData.rows.length === 0) {
        logProcessor(PROCESSOR_NAME, uploadId, `Hoja "${sheetName}" está vacía, saltando`);
        continue;
      }

      // Generate chunks for this sheet
      const sheetChunks = await processSheet(sheetData, filename, uploadId);
      allChunks.push(...sheetChunks);

      // Count tokens
      totalTokens += sheetChunks.reduce((sum, c) => sum + c.tokensCount, 0);

      logProcessor(
        PROCESSOR_NAME,
        uploadId,
        `Hoja "${sheetName}": ${sheetData.rows.length} filas, ${sheetChunks.length} chunks`
      );
    }

    if (allChunks.length === 0) {
      throw new ProcessingError(
        "El archivo no contiene datos procesables",
        ProcessingErrorCodes.INVALID_CONTENT,
        uploadId,
        false
      );
    }

    // 4. Save chunks
    logProcessor(PROCESSOR_NAME, uploadId, `Guardando ${allChunks.length} chunks...`);
    const { result: savedCount, timeMs: saveTime } = await measureTime(() =>
      saveChunks(allChunks, businessId, uploadId)
    );
    logProcessor(PROCESSOR_NAME, uploadId, `Guardados ${savedCount} chunks en ${saveTime}ms`);

    // 5. Update upload status
    await updateUploadStatus(uploadId, "completed", {
      processingResult: {
        chunksCreated: savedCount,
        totalTokens,
        sheetCount: workbook.SheetNames.length,
      },
    });

    const totalTime = Date.now() - startTime;
    logProcessor(PROCESSOR_NAME, uploadId, `Procesamiento completado en ${totalTime}ms`);

    return {
      success: true,
      uploadId,
      chunksCreated: savedCount,
      totalTokens,
      processingTimeMs: totalTime,
      details: {
        sheetCount: workbook.SheetNames.length,
        contentSummary: `${workbook.SheetNames.length} hojas procesadas`,
      },
    };
  } catch (error) {
    logProcessorError(PROCESSOR_NAME, uploadId, error);

    await updateUploadStatus(uploadId, "failed", {
      error: error instanceof Error ? error.message : "Error desconocido",
    });

    if (error instanceof ProcessingError) {
      return {
        success: false,
        uploadId,
        chunksCreated: 0,
        totalTokens: 0,
        processingTimeMs: Date.now() - startTime,
        error: error.message,
      };
    }

    return {
      success: false,
      uploadId,
      chunksCreated: 0,
      totalTokens: 0,
      processingTimeMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Parsea un archivo de hoja de cálculo.
 */
function parseSpreadsheet(
  buffer: Buffer,
  fileType: string,
  uploadId: string
): XLSX.WorkBook {
  try {
    const options: XLSX.ParsingOptions = {
      type: "buffer",
      cellDates: true,
      cellNF: true,
    };

    return XLSX.read(buffer, options);
  } catch (error) {
    throw new ProcessingError(
      `Error parseando archivo: ${error instanceof Error ? error.message : "Error desconocido"}`,
      ProcessingErrorCodes.EXTRACTION_FAILED,
      uploadId,
      false,
      error
    );
  }
}

/**
 * Extrae datos de una hoja.
 */
function extractSheetData(sheet: XLSX.WorkSheet, sheetName: string): SpreadsheetData {
  // Convert to JSON with headers
  const jsonData = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    blankrows: false,
  });

  if (jsonData.length === 0) {
    return { headers: [], rows: [], sheetName };
  }

  // First row as headers (if they look like headers)
  const firstRow = jsonData[0] as unknown[];
  const hasHeaders = firstRow.every(
    (cell) => typeof cell === "string" && cell.length < 100
  );

  if (hasHeaders && jsonData.length > 1) {
    return {
      headers: firstRow.map((h) => String(h).trim()),
      rows: jsonData.slice(1) as unknown[][],
      sheetName,
    };
  }

  // No headers detected
  return {
    headers: [],
    rows: jsonData as unknown[][],
    sheetName,
  };
}

/**
 * Procesa una hoja y genera chunks.
 */
async function processSheet(
  sheetData: SpreadsheetData,
  filename: string,
  uploadId: string
): Promise<ChunkData[]> {
  const chunks: ChunkData[] = [];

  // 1. Generate structure summary
  const structureSummary = generateStructureSummary(sheetData);
  if (structureSummary) {
    const summaryChunk = await createChunkWithEmbedding(
      structureSummary,
      `${filename} - ${sheetData.sheetName} - Estructura`,
      "spreadsheet",
      {
        sheetName: sheetData.sheetName,
        rowCount: sheetData.rows.length,
        columnCount: sheetData.headers.length,
        isStructureSummary: true,
      }
    );
    if (summaryChunk) chunks.push(summaryChunk);
  }

  // 2. Generate data summary (aggregations)
  const dataSummary = generateDataSummary(sheetData);
  if (dataSummary) {
    const dataChunk = await createChunkWithEmbedding(
      dataSummary,
      `${filename} - ${sheetData.sheetName} - Resumen de datos`,
      "spreadsheet",
      {
        sheetName: sheetData.sheetName,
        isDataSummary: true,
      }
    );
    if (dataChunk) chunks.push(dataChunk);
  }

  // 3. Chunk the actual data rows
  const textChunks = chunkSpreadsheetData(sheetData);

  if (textChunks.length > 0) {
    const result = await generateEmbeddings(textChunks);

    if (result.data) {
      for (let i = 0; i < textChunks.length; i++) {
        chunks.push({
          content: textChunks[i],
          embedding: result.data.embeddings[i],
          chunkType: "spreadsheet",
          sourceContext: `${filename} - ${sheetData.sheetName} (parte ${i + 1} de ${textChunks.length})`,
          metadata: {
            sheetName: sheetData.sheetName,
            chunkIndex: i,
            totalChunks: textChunks.length,
          },
          tokensCount: countTokens(textChunks[i]),
        });
      }
    }
  }

  return chunks;
}

/**
 * Genera un resumen de la estructura de la hoja.
 */
function generateStructureSummary(sheetData: SpreadsheetData): string | null {
  if (sheetData.headers.length === 0 && sheetData.rows.length === 0) {
    return null;
  }

  const lines: string[] = [];
  lines.push(`Hoja: "${sheetData.sheetName}"`);
  lines.push(`Total de filas: ${sheetData.rows.length}`);

  if (sheetData.headers.length > 0) {
    lines.push(`Columnas (${sheetData.headers.length}):`);
    sheetData.headers.forEach((header, index) => {
      // Detect column type from first few values
      const columnType = detectColumnType(sheetData.rows, index);
      lines.push(`  - ${header} (${columnType})`);
    });
  }

  return lines.join("\n");
}

/**
 * Detecta el tipo de una columna basado en sus valores.
 */
function detectColumnType(rows: unknown[][], columnIndex: number): string {
  const sampleSize = Math.min(10, rows.length);
  let numbers = 0;
  let dates = 0;
  let texts = 0;

  for (let i = 0; i < sampleSize; i++) {
    const value = rows[i]?.[columnIndex];
    if (value === null || value === undefined || value === "") continue;

    if (typeof value === "number") {
      numbers++;
    } else if (value instanceof Date) {
      dates++;
    } else {
      texts++;
    }
  }

  if (numbers > texts && numbers > dates) return "numérico";
  if (dates > texts && dates > numbers) return "fecha";
  return "texto";
}

/**
 * Genera un resumen de datos con agregaciones.
 */
function generateDataSummary(sheetData: SpreadsheetData): string | null {
  if (sheetData.rows.length === 0) return null;

  const lines: string[] = [];
  lines.push(`Resumen de datos de "${sheetData.sheetName}":`);

  // Find numeric columns and calculate stats
  for (let colIndex = 0; colIndex < sheetData.headers.length; colIndex++) {
    const header = sheetData.headers[colIndex];
    const values = sheetData.rows
      .map((row) => row[colIndex])
      .filter((v) => typeof v === "number") as number[];

    if (values.length > sheetData.rows.length * 0.5) {
      // More than 50% are numbers
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);

      lines.push(`${header}:`);
      lines.push(`  - Total: ${sum.toLocaleString("es-MX")}`);
      lines.push(`  - Promedio: ${avg.toLocaleString("es-MX", { maximumFractionDigits: 2 })}`);
      lines.push(`  - Mínimo: ${min.toLocaleString("es-MX")}`);
      lines.push(`  - Máximo: ${max.toLocaleString("es-MX")}`);
    }
  }

  return lines.length > 1 ? lines.join("\n") : null;
}

/**
 * Crea un chunk con su embedding.
 */
async function createChunkWithEmbedding(
  content: string,
  sourceContext: string,
  chunkType: "spreadsheet",
  metadata: Record<string, unknown>
): Promise<ChunkData | null> {
  try {
    const result = await generateEmbeddings([content]);
    if (!result.data || result.data.embeddings.length === 0) {
      return null;
    }

    return {
      content,
      embedding: result.data.embeddings[0],
      chunkType,
      sourceContext,
      metadata,
      tokensCount: countTokens(content),
    };
  } catch {
    return null;
  }
}
