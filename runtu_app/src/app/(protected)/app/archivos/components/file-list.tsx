"use client";

import type { FileItem } from "../page";
import { FileRow } from "./file-row";
import { FileCard } from "./file-card";

interface FileListProps {
  files: FileItem[];
  onDelete: (file: FileItem) => void;
}

export function FileList({ files, onDelete }: FileListProps) {
  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                Archivo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                Tamaño
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {files.map((file) => (
              <FileRow key={file.id} file={file} onDelete={onDelete} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden grid gap-3">
        {files.map((file) => (
          <FileCard key={file.id} file={file} onDelete={onDelete} />
        ))}
      </div>
    </>
  );
}
