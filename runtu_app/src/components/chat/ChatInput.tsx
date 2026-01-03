"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Send, Paperclip, X, FileText, Table, Image, Mic, Loader2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useFileUpload } from "@/hooks/use-file-upload";

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

function getFileIcon(type: string) {
  if (type === "application/pdf") return FileText;
  if (type.includes("spreadsheet") || type.includes("excel") || type === "text/csv") return Table;
  if (type.startsWith("image/")) return Image;
  if (type.startsWith("audio/")) return Mic;
  return FileText;
}

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  onFileUploaded?: () => void;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = "Escribe tu pregunta...",
  onFileUploaded,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile } = useFileUpload();

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const maxHeight = 120; // ~5 lines
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        maxHeight
      )}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if ((value.trim() || pendingFile) && !disabled && !isUploading) {
        handleSend();
      }
    }
  };

  const handleFileSelect = useCallback((files: File[]) => {
    if (files.length > 0) {
      setPendingFile(files[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileSelect,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    noClick: true,
    disabled: disabled || isUploading,
  });

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleSend = async () => {
    if ((!value.trim() && !pendingFile) || disabled || isUploading) return;

    // If there's a pending file, upload it first
    if (pendingFile) {
      setIsUploading(true);
      try {
        const result = await uploadFile(pendingFile);
        if (result.success) {
          onFileUploaded?.();
          // Add file reference to message
          const fileMessage = value.trim()
            ? `${value.trim()} [Archivo adjunto: ${pendingFile.name}]`
            : `Analiza el archivo ${pendingFile.name} que acabo de subir`;
          onChange(fileMessage);
          setPendingFile(null);

          // Send after a brief delay to update the input
          setTimeout(() => {
            onSend();
            if (textareaRef.current) {
              textareaRef.current.style.height = "auto";
            }
          }, 100);
        }
      } catch {
        // Error handling
      } finally {
        setIsUploading(false);
      }
      return;
    }

    // Normal send without file
    onSend();
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const removePendingFile = () => {
    setPendingFile(null);
  };

  const FileIcon = pendingFile ? getFileIcon(pendingFile.type) : FileText;

  return (
    <div {...getRootProps()} className={`relative ${isDragActive ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900 rounded-xl" : ""}`}>
      {/* Pending file indicator */}
      {pendingFile && (
        <div className="mb-2 flex items-center gap-2 px-3 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
          <FileIcon className="w-4 h-4 text-indigo-400" />
          <span className="text-sm text-white truncate flex-1">{pendingFile.name}</span>
          <button
            onClick={removePendingFile}
            className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex gap-2 items-end">
        {/* Attach button */}
        <button
          onClick={handleAttachClick}
          disabled={disabled || isUploading}
          className="flex-shrink-0 w-11 h-11 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          aria-label="Adjuntar archivo"
          title="Adjuntar archivo"
        >
          <Paperclip className="w-5 h-5 text-white/60" />
        </button>

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isDragActive ? "Suelta el archivo aquí..." : placeholder}
            disabled={disabled || isUploading}
            rows={1}
            className="w-full resize-none rounded-xl bg-slate-800/50 border border-slate-700/50 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{ maxHeight: "120px" }}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={(!value.trim() && !pendingFile) || disabled || isUploading}
          className="flex-shrink-0 w-11 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed flex items-center justify-center transition-colors active:scale-95"
          aria-label="Enviar mensaje"
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <Send className="w-5 h-5 text-white" />
          )}
        </button>
      </div>

      {/* Hidden file input */}
      <input
        {...getInputProps()}
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          if (files && files.length > 0) {
            handleFileSelect(Array.from(files));
          }
        }}
      />

      {/* Drag overlay */}
      {isDragActive && (
        <div className="absolute inset-0 bg-indigo-500/10 border-2 border-dashed border-indigo-500 rounded-xl flex items-center justify-center pointer-events-none">
          <p className="text-indigo-400 font-medium">Suelta el archivo aquí</p>
        </div>
      )}
    </div>
  );
}
