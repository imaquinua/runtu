"use client";

import {
  Brain,
  FileText,
  Table,
  Image,
  Mic,
  AlertCircle,
  Sparkles,
  Copy,
  Check
} from "lucide-react";
import { useState } from "react";

type FileType = "document" | "spreadsheet" | "image" | "audio" | "video";
type FileStatus = "processed" | "processing" | "error";

interface ExtractedContentProps {
  type: FileType;
  status: FileStatus;
  content?: {
    summary?: string;
    transcription?: string;
    detectedText?: string;
    structure?: {
      sheets?: number;
      rows?: number;
      columns?: string[];
    };
    visionAnalysis?: string;
  } | null;
  errorMessage?: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
      title="Copiar"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-400" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
}

function ProcessingState() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
      <div className="w-16 h-16 mx-auto bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
        <Brain className="w-8 h-8 text-yellow-400 animate-pulse" />
      </div>
      <h3 className="text-white font-medium mb-2">Procesando archivo...</h3>
      <p className="text-white/50 text-sm">
        Runtu está analizando el contenido de este archivo.
        <br />
        Esto puede tomar unos momentos.
      </p>

      <div className="mt-6 flex items-center justify-center gap-2">
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-red-400 font-medium mb-2">Error al procesar</h3>
          <p className="text-white/60 text-sm mb-4">
            {message || "No pudimos procesar este archivo correctamente."}
          </p>

          <div className="bg-black/20 rounded-lg p-4 mb-4">
            <p className="text-white/50 text-xs font-medium mb-2">Posibles causas:</p>
            <ul className="text-white/40 text-xs space-y-1">
              <li>• El archivo puede estar dañado o corrupto</li>
              <li>• El formato no es compatible</li>
              <li>• El archivo está protegido con contraseña</li>
              <li>• El contenido no es legible</li>
            </ul>
          </div>

          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Reintentar procesamiento
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DocumentContent({ summary }: { summary: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-white/50 text-sm">
        <FileText className="w-4 h-4" />
        <span>Resumen del documento</span>
      </div>

      <div className="bg-white/5 rounded-lg p-4 relative group">
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <CopyButton text={summary} />
        </div>
        <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap pr-8">
          {summary}
        </p>
      </div>
    </div>
  );
}

function SpreadsheetContent({ structure }: {
  structure: { sheets?: number; rows?: number; columns?: string[] }
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-white/50 text-sm">
        <Table className="w-4 h-4" />
        <span>Estructura detectada</span>
      </div>

      <div className="bg-white/5 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          {structure.sheets && (
            <div className="bg-green-500/10 rounded-lg p-3">
              <p className="text-green-400 text-2xl font-bold">{structure.sheets}</p>
              <p className="text-white/50 text-xs">Hojas</p>
            </div>
          )}
          {structure.rows && (
            <div className="bg-green-500/10 rounded-lg p-3">
              <p className="text-green-400 text-2xl font-bold">{structure.rows}</p>
              <p className="text-white/50 text-xs">Filas de datos</p>
            </div>
          )}
        </div>

        {structure.columns && structure.columns.length > 0 && (
          <div>
            <p className="text-white/50 text-xs mb-2">Columnas detectadas:</p>
            <div className="flex flex-wrap gap-2">
              {structure.columns.map((col, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-lg"
                >
                  {col}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ImageContent({ analysis }: { analysis: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-white/50 text-sm">
        <Image className="w-4 h-4" />
        <span>Análisis de imagen</span>
      </div>

      <div className="bg-white/5 rounded-lg p-4 relative group">
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <CopyButton text={analysis} />
        </div>
        <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap pr-8">
          {analysis}
        </p>
      </div>
    </div>
  );
}

function AudioContent({ transcription }: { transcription: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-white/50 text-sm">
        <Mic className="w-4 h-4" />
        <span>Transcripción</span>
      </div>

      <div className="bg-white/5 rounded-lg p-4 relative group">
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <CopyButton text={transcription} />
        </div>
        <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap pr-8">
          {transcription}
        </p>
      </div>
    </div>
  );
}

// Mock content for demonstration
function getMockContent(type: FileType) {
  switch (type) {
    case "document":
      return {
        summary: `Este documento contiene información sobre las ventas del mes de noviembre 2024.

Puntos clave detectados:
• Ventas totales: S/ 45,230.00
• Incremento del 15% respecto al mes anterior
• Producto más vendido: Hamburguesa Clásica (342 unidades)
• Día con más ventas: Sábado 23 de noviembre

El documento también menciona estrategias de marketing implementadas y resultados de la promoción "2x1 en bebidas" que generó un aumento del 28% en ventas de gaseosas.`,
      };
    case "spreadsheet":
      return {
        structure: {
          sheets: 3,
          rows: 145,
          columns: ["Fecha", "Producto", "Cantidad", "Precio Unit.", "Monto Total", "Método de Pago"],
        },
      };
    case "image":
      return {
        visionAnalysis: `Imagen de un recibo o comprobante de venta.

Detalles detectados:
• Tipo: Boleta de venta
• Número: B001-00234
• Fecha: 05/12/2024
• Total: S/ 47.50
• Items: 3 productos identificados

La imagen muestra buena calidad y todos los datos son legibles.`,
      };
    case "audio":
      return {
        transcription: `[00:00] Buenas tardes, bienvenido a Burguer House.

[00:03] Hola, quisiera hacer un pedido para llevar.

[00:06] Claro, ¿qué le puedo ofrecer?

[00:08] Dame dos hamburguesas clásicas, una con papas grandes y dos gaseosas medianas.

[00:15] Perfecto, serían dos clásicas, una porción de papas grandes y dos gaseosas medianas. ¿Algo más?

[00:22] No, eso sería todo.

[00:24] Son 54 soles con 50. ¿Efectivo o tarjeta?

[00:28] Efectivo, aquí tiene.

[00:30] Gracias, su pedido estará listo en 10 minutos.`,
      };
    case "video":
      return {
        summary: `Video de 2:34 minutos de duración.

Contenido detectado:
• Tipo: Grabación de local comercial
• Se observa el área de cocina y atención al cliente
• Hay movimiento de 3-4 personas
• Audio ambiente con conversaciones

Este video podría ser útil para análisis de operaciones o capacitación de personal.`,
      };
    default:
      return null;
  }
}

export function ExtractedContent({
  type,
  status,
  content,
  errorMessage
}: ExtractedContentProps) {
  // Use mock content if no real content provided
  const displayContent = content || getMockContent(type);

  if (status === "processing") {
    return <ProcessingState />;
  }

  if (status === "error") {
    return <ErrorState message={errorMessage} onRetry={() => console.log("Retry")} />;
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-indigo-400" />
        </div>
        <h3 className="text-white font-medium">Lo que Runtu aprendió</h3>
      </div>

      {type === "document" && displayContent?.summary && (
        <DocumentContent summary={displayContent.summary} />
      )}

      {type === "spreadsheet" && displayContent?.structure && (
        <SpreadsheetContent structure={displayContent.structure} />
      )}

      {type === "image" && displayContent?.visionAnalysis && (
        <ImageContent analysis={displayContent.visionAnalysis} />
      )}

      {type === "audio" && displayContent?.transcription && (
        <AudioContent transcription={displayContent.transcription} />
      )}

      {type === "video" && displayContent?.summary && (
        <DocumentContent summary={displayContent.summary} />
      )}

      {!displayContent && (
        <p className="text-white/50 text-sm">
          No hay contenido extraído disponible para este archivo.
        </p>
      )}
    </div>
  );
}
