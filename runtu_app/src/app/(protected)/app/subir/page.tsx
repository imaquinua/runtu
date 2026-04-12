"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UploadZone } from "@/components/upload";

export default function SubirPage() {
  const router = useRouter();

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/app/archivos"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a archivos
        </Link>
        <h1 className="text-2xl font-bold text-white">Subir archivos</h1>
        <p className="text-white/60 mt-1">
          Sube documentos para que Runtu aprenda sobre tu negocio
        </p>
      </div>

      {/* Upload Zone Card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <UploadZone onCancel={handleCancel} showCancelButton={true} />
      </div>

      {/* Help text */}
      <div className="mt-6 text-center">
        <p className="text-white/40 text-sm">
          Tus archivos están seguros y encriptados. Solo tú y Runtu pueden acceder a ellos.
        </p>
      </div>
    </div>
  );
}
