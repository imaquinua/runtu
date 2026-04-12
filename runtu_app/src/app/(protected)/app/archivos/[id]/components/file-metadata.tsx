"use client";

import {
  FileType,
  HardDrive,
  Calendar,
  Clock,
  Upload as UploadIcon,
  FileText,
  Table,
  Image,
  Mic,
  Video
} from "lucide-react";

type FileTypeEnum = "document" | "spreadsheet" | "image" | "audio" | "video";

interface FileMetadataProps {
  type: FileTypeEnum;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  processedAt?: Date | null;
  source?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFileTypeLabel(type: FileTypeEnum): string {
  switch (type) {
    case "document":
      return "Documento";
    case "spreadsheet":
      return "Hoja de cálculo";
    case "image":
      return "Imagen";
    case "audio":
      return "Audio";
    case "video":
      return "Video";
    default:
      return "Archivo";
  }
}

function getFileTypeIcon(type: FileTypeEnum) {
  switch (type) {
    case "document":
      return FileText;
    case "spreadsheet":
      return Table;
    case "image":
      return Image;
    case "audio":
      return Mic;
    case "video":
      return Video;
    default:
      return FileType;
  }
}

interface MetadataRowProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

function MetadataRow({ icon: Icon, label, value }: MetadataRowProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3 text-white/50">
        <Icon className="w-4 h-4" />
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-white text-sm font-medium">{value}</span>
    </div>
  );
}

export function FileMetadata({
  type,
  mimeType,
  size,
  uploadedAt,
  processedAt,
  source = "Subido manualmente",
}: FileMetadataProps) {
  const TypeIcon = getFileTypeIcon(type);

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <h3 className="text-white font-medium mb-4">Información del archivo</h3>

      <div className="divide-y divide-white/5">
        <MetadataRow
          icon={TypeIcon}
          label="Tipo"
          value={`${getFileTypeLabel(type)} (${mimeType})`}
        />
        <MetadataRow
          icon={HardDrive}
          label="Tamaño"
          value={formatFileSize(size)}
        />
        <MetadataRow
          icon={Calendar}
          label="Subido"
          value={formatDate(uploadedAt)}
        />
        {processedAt && (
          <MetadataRow
            icon={Clock}
            label="Procesado"
            value={formatDate(processedAt)}
          />
        )}
        <MetadataRow
          icon={UploadIcon}
          label="Fuente"
          value={source}
        />
      </div>
    </div>
  );
}
