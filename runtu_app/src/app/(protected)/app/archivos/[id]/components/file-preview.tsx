"use client";

import { FileText, Table, Image as ImageIcon, Mic, Video, File, Play, Pause } from "lucide-react";
import { useState, useRef } from "react";

type FileType = "document" | "spreadsheet" | "image" | "audio" | "video";

interface FilePreviewProps {
  type: FileType;
  name: string;
  previewUrl?: string | null;
  mimeType: string;
}

function getFileIcon(type: FileType) {
  switch (type) {
    case "document":
      return { icon: FileText, color: "text-red-400", bg: "bg-red-500/20" };
    case "spreadsheet":
      return { icon: Table, color: "text-green-400", bg: "bg-green-500/20" };
    case "image":
      return { icon: ImageIcon, color: "text-purple-400", bg: "bg-purple-500/20" };
    case "audio":
      return { icon: Mic, color: "text-yellow-400", bg: "bg-yellow-500/20" };
    case "video":
      return { icon: Video, color: "text-blue-400", bg: "bg-blue-500/20" };
    default:
      return { icon: File, color: "text-white/60", bg: "bg-white/10" };
  }
}

function ImagePreview({ url, name }: { url: string; name: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
    return <PlaceholderPreview type="image" />;
  }

  return (
    <div className="relative w-full aspect-video bg-black/20 rounded-xl overflow-hidden">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <img
        src={url}
        alt={name}
        className={`w-full h-full object-contain transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
}

function AudioPreview({ url }: { url: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="flex items-center gap-4">
        <button
          onClick={togglePlay}
          className="w-14 h-14 rounded-full bg-yellow-500/20 hover:bg-yellow-500/30 flex items-center justify-center transition-colors"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 text-yellow-400" />
          ) : (
            <Play className="w-6 h-6 text-yellow-400 ml-1" />
          )}
        </button>

        <div className="flex-1">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-400 transition-all"
              style={{ width: duration ? `${(progress / duration) * 100}%` : "0%" }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-white/40">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function VideoPreview({ url }: { url: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
      <video
        ref={videoRef}
        src={url}
        className="w-full h-full object-contain"
        onEnded={() => setIsPlaying(false)}
        onClick={togglePlay}
      />

      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/30 transition-colors"
        >
          <div className="w-16 h-16 rounded-full bg-blue-500/80 flex items-center justify-center">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </button>
      )}
    </div>
  );
}

function PDFPreview() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
      <div className="w-20 h-20 mx-auto bg-red-500/20 rounded-xl flex items-center justify-center mb-4">
        <FileText className="w-10 h-10 text-red-400" />
      </div>
      <p className="text-white/60 text-sm">
        Vista previa de PDF no disponible
      </p>
      <p className="text-white/40 text-xs mt-1">
        Descarga el archivo para verlo completo
      </p>
    </div>
  );
}

function SpreadsheetPreview({ data }: { data?: { columns: string[]; rows: string[][] } }) {
  // Mock data for preview
  const mockData = data || {
    columns: ["Fecha", "Producto", "Cantidad", "Monto"],
    rows: [
      ["01/12/2024", "Hamburguesa clásica", "15", "S/ 225.00"],
      ["01/12/2024", "Papas fritas", "12", "S/ 72.00"],
      ["01/12/2024", "Gaseosa 500ml", "18", "S/ 54.00"],
      ["02/12/2024", "Hamburguesa doble", "8", "S/ 160.00"],
      ["02/12/2024", "Combo familiar", "3", "S/ 135.00"],
    ],
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-green-500/10">
              {mockData.columns.map((col, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-left text-xs font-medium text-green-400 uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {mockData.rows.map((row, i) => (
              <tr key={i} className="hover:bg-white/5">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-2.5 text-white/70 whitespace-nowrap">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 border-t border-white/10 bg-white/5">
        <p className="text-white/40 text-xs">
          Mostrando primeras 5 filas de 145
        </p>
      </div>
    </div>
  );
}

function PlaceholderPreview({ type }: { type: FileType }) {
  const { icon: Icon, color, bg } = getFileIcon(type);

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
      <div className={`w-24 h-24 mx-auto ${bg} rounded-2xl flex items-center justify-center mb-4`}>
        <Icon className={`w-12 h-12 ${color}`} />
      </div>
      <p className="text-white/60 text-sm">
        Vista previa no disponible
      </p>
    </div>
  );
}

export function FilePreview({ type, name, previewUrl, mimeType }: FilePreviewProps) {
  // Determine which preview to show based on type and available URL
  if (type === "image" && previewUrl) {
    return <ImagePreview url={previewUrl} name={name} />;
  }

  if (type === "audio" && previewUrl) {
    return <AudioPreview url={previewUrl} />;
  }

  if (type === "video" && previewUrl) {
    return <VideoPreview url={previewUrl} />;
  }

  if (type === "document" && mimeType === "application/pdf") {
    return <PDFPreview />;
  }

  if (type === "spreadsheet") {
    return <SpreadsheetPreview />;
  }

  return <PlaceholderPreview type={type} />;
}
