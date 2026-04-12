// ============================================
// Audio Processor (with Gemini)
// ============================================

import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  generateEmbeddings,
  countTokens,
  chunkText,
} from "@/lib/embeddings";
import {
  downloadFile,
  saveChunks,
  updateUploadStatus,
  measureTime,
  cleanExtractedText,
} from "./utils";
import {
  ProcessingError,
  ProcessingErrorCodes,
  logProcessor,
  logProcessorError,
  type ProcessorParams,
  type ProcessingResult,
  type ChunkData,
} from "./types";

const PROCESSOR_NAME = "Audio";

// Gemini model for audio (1.5 Flash supports audio)
const AUDIO_MODEL = "gemini-1.5-flash";

// Transcription prompt
const TRANSCRIPTION_PROMPT = `Transcribe este audio en español.
Incluye:
- La transcripción completa y precisa del audio
- Indica si hay múltiples hablantes (Hablante 1, Hablante 2, etc.)
- Preserva la puntuación y estructura de las oraciones

Responde SOLO con la transcripción, sin comentarios adicionales.`;

// Summary prompt for business context
const SUMMARY_PROMPT = `Analiza esta transcripción de audio en contexto de negocio latinoamericano.

EXTRAE:
1. **Temas principales discutidos** (lista)
2. **Números y cifras mencionados** (precios, cantidades, fechas)
3. **Decisiones o compromisos** (si los hay)
4. **Personas mencionadas** (nombres, roles)
5. **Acciones pendientes o próximos pasos**
6. **Resumen ejecutivo** (2-3 oraciones)

Responde en español de forma estructurada.`;

// ============================================
// Main Processor
// ============================================

/**
 * Procesa un archivo de audio:
 * 1. Descarga de Storage
 * 2. Transcribe con Gemini
 * 3. Genera resumen estructurado
 * 4. Genera embeddings
 * 5. Guarda en knowledge_chunks
 */
export async function processAudio(params: ProcessorParams): Promise<ProcessingResult> {
  const { uploadId, businessId, filePath } = params;
  const startTime = Date.now();

  logProcessor(PROCESSOR_NAME, uploadId, "Iniciando procesamiento de audio", { filePath });

  try {
    // Update status to processing
    await updateUploadStatus(uploadId, "processing");

    // 1. Download audio from Storage
    logProcessor(PROCESSOR_NAME, uploadId, "Descargando audio...");
    const { result: buffer, timeMs: downloadTime } = await measureTime(() =>
      downloadFile(filePath, uploadId)
    );
    logProcessor(PROCESSOR_NAME, uploadId, `Audio descargado en ${downloadTime}ms: ${buffer.length} bytes`);

    // Check file size (Gemini has limits)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (buffer.length > maxSize) {
      throw new ProcessingError(
        `El archivo de audio es muy grande (${Math.round(buffer.length / 1024 / 1024)}MB). Máximo permitido: 20MB`,
        ProcessingErrorCodes.FILE_TOO_LARGE,
        uploadId,
        false
      );
    }

    // 2. Determine MIME type
    const mimeType = getAudioMimeType(filePath);

    // 3. Transcribe audio with Gemini
    logProcessor(PROCESSOR_NAME, uploadId, "Transcribiendo audio...");
    const { result: transcription, timeMs: transcribeTime } = await measureTime(() =>
      transcribeAudioWithGemini(buffer, mimeType, uploadId)
    );
    logProcessor(
      PROCESSOR_NAME,
      uploadId,
      `Transcripción completada en ${transcribeTime}ms: ${transcription.length} caracteres`
    );

    if (!transcription || transcription.trim().length < 20) {
      throw new ProcessingError(
        "No se pudo transcribir el audio o está vacío",
        ProcessingErrorCodes.INVALID_CONTENT,
        uploadId,
        false
      );
    }

    const cleanedTranscription = cleanExtractedText(transcription);

    // 4. Generate summary
    logProcessor(PROCESSOR_NAME, uploadId, "Generando resumen estructurado...");
    const { result: summary, timeMs: summaryTime } = await measureTime(() =>
      generateAudioSummary(cleanedTranscription, uploadId)
    );
    logProcessor(PROCESSOR_NAME, uploadId, `Resumen generado en ${summaryTime}ms`);

    // 5. Create chunks (transcription + summary)
    const filename = filePath.split("/").pop() ?? "audio";
    const allChunks: ChunkData[] = [];
    let totalTokens = 0;

    // Chunk the transcription if it's long
    const transcriptionChunks = chunkText(cleanedTranscription, {
      maxTokens: 500,
      overlap: 50,
      preserveParagraphs: true,
    });

    // Generate embeddings for all content
    const allTexts = [...transcriptionChunks, summary].filter(Boolean);
    const result = await generateEmbeddings(allTexts);

    if (!result.data || result.data.embeddings.length === 0) {
      throw new ProcessingError(
        "Error generando embeddings",
        ProcessingErrorCodes.EMBEDDING_FAILED,
        uploadId,
        true
      );
    }

    // Add transcription chunks
    for (let i = 0; i < transcriptionChunks.length; i++) {
      allChunks.push({
        content: transcriptionChunks[i],
        embedding: result.data.embeddings[i],
        chunkType: "audio_transcript",
        sourceContext: `Audio: ${filename} - Transcripción (parte ${i + 1} de ${transcriptionChunks.length})`,
        metadata: {
          filename,
          isTranscription: true,
          chunkIndex: i,
          totalTranscriptionChunks: transcriptionChunks.length,
        },
        tokensCount: countTokens(transcriptionChunks[i]),
      });
      totalTokens += countTokens(transcriptionChunks[i]);
    }

    // Add summary chunk
    if (summary) {
      const summaryIndex = transcriptionChunks.length;
      allChunks.push({
        content: summary,
        embedding: result.data.embeddings[summaryIndex],
        chunkType: "audio_transcript",
        sourceContext: `Audio: ${filename} - Resumen`,
        metadata: {
          filename,
          isSummary: true,
        },
        tokensCount: countTokens(summary),
      });
      totalTokens += countTokens(summary);
    }

    // 6. Save chunks
    logProcessor(PROCESSOR_NAME, uploadId, `Guardando ${allChunks.length} chunks...`);
    const { result: savedCount, timeMs: saveTime } = await measureTime(() =>
      saveChunks(allChunks, businessId, uploadId)
    );
    logProcessor(PROCESSOR_NAME, uploadId, `Guardados en ${saveTime}ms`);

    // 7. Update upload status
    await updateUploadStatus(uploadId, "completed", {
      processingResult: {
        chunksCreated: savedCount,
        totalTokens,
        transcriptionLength: cleanedTranscription.length,
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
        contentSummary: `Audio transcrito: ${cleanedTranscription.substring(0, 100)}...`,
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
 * Transcribe audio usando Gemini.
 */
async function transcribeAudioWithGemini(
  buffer: Buffer,
  mimeType: string,
  uploadId: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new ProcessingError(
      "GEMINI_API_KEY no está configurada",
      ProcessingErrorCodes.EXTRACTION_FAILED,
      uploadId,
      false
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: AUDIO_MODEL });

    // Convert buffer to base64
    const base64Audio = buffer.toString("base64");

    // Create the audio part
    const audioPart = {
      inlineData: {
        data: base64Audio,
        mimeType: mimeType,
      },
    };

    // Generate transcription
    const result = await model.generateContent([TRANSCRIPTION_PROMPT, audioPart]);
    const response = result.response;
    const text = response.text();

    return text;
  } catch (error) {
    throw new ProcessingError(
      `Error transcribiendo audio: ${error instanceof Error ? error.message : "Error desconocido"}`,
      ProcessingErrorCodes.EXTRACTION_FAILED,
      uploadId,
      true,
      error
    );
  }
}

/**
 * Genera un resumen estructurado del audio.
 */
async function generateAudioSummary(
  transcription: string,
  uploadId: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new ProcessingError(
      "GEMINI_API_KEY no está configurada",
      ProcessingErrorCodes.EXTRACTION_FAILED,
      uploadId,
      false
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: AUDIO_MODEL });

    const prompt = `${SUMMARY_PROMPT}\n\nTRANSCRIPCIÓN:\n${transcription}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    // Non-fatal - we can continue without summary
    logProcessor(PROCESSOR_NAME, uploadId, `Error generando resumen: ${error}`);
    return "";
  }
}

/**
 * Determina el MIME type de un archivo de audio.
 */
function getAudioMimeType(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "mp3":
      return "audio/mp3";
    case "wav":
      return "audio/wav";
    case "ogg":
      return "audio/ogg";
    case "m4a":
      return "audio/m4a";
    case "flac":
      return "audio/flac";
    case "aac":
      return "audio/aac";
    default:
      return "audio/mp3"; // Default
  }
}
