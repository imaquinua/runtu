"use client";

import { Home, FolderOpen, MessageSquare, Menu, Plus, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: "Inicio", href: "/app/inicio" },
  { icon: FolderOpen, label: "Archivos", href: "/app/archivos" },
  { icon: MessageSquare, label: "Chat", href: "/app/chat" },
];

interface BottomNavProps {
  onUploadClick?: () => void;
  onMenuClick?: () => void;
}

export function BottomNav({ onUploadClick, onMenuClick }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
        {/* Blur background */}
        <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-lg border-t border-white/10" />

        {/* Nav content */}
        <div className="relative flex items-center justify-around px-2 py-2 safe-area-bottom">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all active:scale-95 ${
                  active
                    ? "text-indigo-400"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : ""}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
                {active && (
                  <div className="absolute bottom-1 w-1 h-1 bg-indigo-400 rounded-full" />
                )}
              </button>
            );
          })}

          {/* More menu button */}
          <button
            onClick={() => setShowMenu(true)}
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-white/50 hover:text-white/80 transition-all active:scale-95"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium">Más</span>
          </button>
        </div>
      </nav>

      {/* FAB - Floating Action Button */}
      <button
        onClick={onUploadClick}
        className="fixed bottom-20 right-4 z-50 md:hidden w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center text-white active:scale-95 transition-transform hover:shadow-xl hover:shadow-indigo-500/40"
        aria-label="Subir archivo"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* More Menu Overlay */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden animate-in slide-in-from-bottom duration-300">
            <div className="bg-slate-900 border-t border-white/10 rounded-t-2xl p-4 safe-area-bottom">
              {/* Handle */}
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />

              {/* Close button */}
              <button
                onClick={() => setShowMenu(false)}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 text-white/60"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Menu items */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    router.push("/app/dashboard");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-white/80 transition-colors active:scale-[0.98]"
                >
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Dashboard</p>
                    <p className="text-white/40 text-sm">Métricas y estadísticas</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowMenu(false);
                    onUploadClick?.();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-white/80 transition-colors active:scale-[0.98]"
                >
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Subir archivo</p>
                    <p className="text-white/40 text-sm">PDF, Excel, imágenes, audio</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowMenu(false);
                    router.push("/app/settings");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-white/80 transition-colors active:scale-[0.98]"
                >
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Configuración</p>
                    <p className="text-white/40 text-sm">Cuenta y preferencias</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
