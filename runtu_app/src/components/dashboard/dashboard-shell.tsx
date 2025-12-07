"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { Header } from "./header";

interface DashboardShellProps {
  children: React.ReactNode;
  businessName?: string;
}

const pageTitles: Record<string, string> = {
  "/app/inicio": "Inicio",
  "/app/dashboard": "Dashboard",
  "/app/archivos": "Mis Archivos",
  "/app/chat": "Chat con Runtu",
  "/app/reportes": "Reportes",
  "/app/configuracion": "Configuración",
};

export function DashboardShell({ children, businessName }: DashboardShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();

  const pageTitle = pageTitles[pathname] || "Runtu";

  return (
    <div className="min-h-screen bg-gray-50">
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
          notificationCount={0}
        />

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
