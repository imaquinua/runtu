"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Sparkles, Upload, FileText, Table, Image, Mic, Loader2, CheckCircle } from "lucide-react";
import { useFileUpload } from "@/hooks/use-file-upload";

interface EmptyChatProps {
  onSuggestionClick: (suggestion: string) => void;
  hasRecentUploads?: boolean;
  onFileUploaded?: () => void;
}

// Accepted file types
const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.ms-excel": [".xls"],
  "text/csv": [".csv"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
  "audio/mpeg": [".mp3"],
  "audio/wav": [".wav"],
};

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export function EmptyChat({ onSuggestionClick, hasRecentUploads, onFileUploaded }: EmptyChatProps) {
  const { uploadFile } = useFileUpload();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [uploadedFileName, setUploadedFileName] = useState("");

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setIsUploading(true);
    setUploadStatus("idle");
    setUploadedFileName(file.name);

    try {
      const result = await uploadFile(file);
      if (result.success) {
        setUploadStatus("success");
        onFileUploaded?.();
        // Auto-suggest a question about the uploaded file
        setTimeout(() => {
          onSuggestionClick(`Analiza el archivo ${file.name} que acabo de subir`);
        }, 1500);
      } else {
        setUploadStatus("error");
      }
    } catch {
      setUploadStatus("error");
    } finally {
      setIsUploading(false);
    }
  }, [uploadFile, onFileUploaded, onSuggestionClick]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    disabled: isUploading,
  });

  // Smart suggestions based on context
  const suggestions = hasRecentUploads
    ? [
        "¿Cómo me fue esta semana?",
        "¿Qué producto vendí más?",
        "Dame un resumen de mis ventas",
      ]
    : [
        "¿Qué puedes hacer por mi negocio?",
        "¿Qué tipo de archivos puedo subir?",
        "¿Cómo empiezo a usar Runtu?",
      ];

  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4 border border-indigo-500/20">
        <Sparkles className="w-8 h-8 text-indigo-400" />
      </div>

      {/* Greeting */}
      <h2 className="text-2xl font-semibold text-white mb-2">
        ¡Hola! Soy Runtu
      </h2>
      <p className="text-slate-400 text-sm mb-6 max-w-md">
        Tu copiloto de negocio. Sube un archivo para empezar o pregúntame lo que quieras.
      </p>

      {/* Upload Zone - Integrated */}
      <div
        {...getRootProps()}
        className={`w-full max-w-md mb-6 border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all duration-200 ${
          isDragActive
            ? "border-indigo-500 bg-indigo-500/10"
            : uploadStatus === "success"
            ? "border-green-500/50 bg-green-500/5"
            : "border-white/20 hover:border-indigo-500/50 hover:bg-white/5"
        } ${isUploading ? "pointer-events-none" : ""}`}
      >
        <input {...getInputProps()} />

        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-white font-medium">Subiendo {uploadedFileName}...</p>
            <p className="text-slate-500 text-sm">Runtu está aprendiendo de tu archivo</p>
          </div>
        ) : uploadStatus === "success" ? (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-400" />
            <p className="text-white font-medium">¡Listo!</p>
            <p className="text-slate-400 text-sm">Ahora puedes preguntarme sobre {uploadedFileName}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isDragActive ? "bg-indigo-500/20" : "bg-white/5"
            }`}>
              <Upload className={`w-6 h-6 ${isDragActive ? "text-indigo-400" : "text-white/40"}`} />
            </div>
            <div>
              <p className="text-white font-medium">
                {isDragActive ? "Suelta el archivo aquí" : "Arrastra tu archivo aquí"}
              </p>
              <p className="text-slate-500 text-sm">o haz clic para seleccionar</p>
            </div>
            {/* File type badges */}
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-500/10 text-red-400 border border-red-500/20">
                <FileText className="w-3 h-3" /> PDF
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-500/10 text-green-400 border border-green-500/20">
                <Table className="w-3 h-3" /> Excel
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Image className="w-3 h-3" /> Imagen
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                <Mic className="w-3 h-3" /> Audio
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 w-full max-w-md mb-6">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-slate-500 text-sm">o pregúntame</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Quick Suggestions */}
      <div className="flex flex-wrap gap-2 justify-center max-w-md">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onSuggestionClick(suggestion)}
            className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white/80 hover:text-white transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
