"use client";

import { FolderOpen, MessageSquare, Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

// Navegación simplificada - Chat primero
const navItems: NavItem[] = [
  { icon: MessageSquare, label: "Chat", href: "/app/chat" },
  { icon: FolderOpen, label: "Archivos", href: "/app/archivos" },
];

interface BottomNavProps {
  onUploadClick?: () => void;
}

export function BottomNav({ onUploadClick }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
        {/* Blur background */}
        <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-lg border-t border-white/10" />

        {/* Nav content */}
        <div className="relative flex items-center justify-around px-4 py-2 safe-area-bottom">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all active:scale-95 ${
                  active
                    ? "text-indigo-400"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                <Icon className={`w-6 h-6 ${active ? "stroke-[2.5]" : ""}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* FAB - Floating Action Button para subir archivos */}
      <button
        onClick={onUploadClick}
        className="fixed bottom-20 right-4 z-50 md:hidden w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center text-white active:scale-95 transition-transform hover:shadow-xl hover:shadow-indigo-500/40"
        aria-label="Subir archivo"
      >
        <Plus className="w-6 h-6" />
      </button>
    </>
  );
}
