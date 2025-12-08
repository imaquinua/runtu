"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { Header } from "./header";
import { BottomNav } from "@/components/navigation";
import { UploadModal } from "@/components/upload";

interface DashboardShellProps {
  children: React.ReactNode;
  businessName?: string;
}

const pageTitles: Record<string, string> = {
  "/app/inicio": "Inicio",
  "/app/dashboard": "Dashboard",
  "/app/archivos": "Mis Archivos",
  "/app/conocimiento": "Conocimiento",
  "/app/chat": "Chat con Runtu",
  "/app/reportes": "Reportes",
  "/app/configuracion": "Configuración",
};

export function DashboardShell({ children, businessName }: DashboardShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const pathname = usePathname();

  const pageTitle = pageTitles[pathname] || "Runtu";

  return (
    <div className="min-h-screen bg-[#020617]">
      {/* Background gradient */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(99,102,241,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(99,102,241,0.05),transparent_50%)]" />
      </div>
      {/* Desktop Sidebar - hidden on mobile */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-64 md:flex-col">
        <Sidebar businessName={businessName} />
      </aside>

      {/* Mobile Navigation Drawer */}
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        businessName={businessName}
      />

      {/* Main content area */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        {/* Header */}
        <Header
          title={pageTitle}
          onMenuClick={() => setMobileNavOpen(true)}
        />

        {/* Page content - extra padding bottom for mobile nav */}
        <main className="flex-1 p-4 pb-24 md:p-6 md:pb-6 lg:p-8 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        onUploadClick={() => setShowUploadModal(true)}
        onMenuClick={() => setMobileNavOpen(true)}
      />

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />
    </div>
  );
}
