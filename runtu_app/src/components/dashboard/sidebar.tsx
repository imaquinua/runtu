"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, FolderOpen, LogOut } from "lucide-react";
import { RuntuLogo } from "@/components/ui/runtu-logo";
import { logout } from "@/app/actions/auth";

interface SidebarProps {
  businessName?: string;
  onClose?: () => void;
}

// Navegación simplificada - Chat es la experiencia principal
const navItems = [
  { href: "/app/chat", label: "Chat", icon: MessageCircle },
  { href: "/app/archivos", label: "Mis Archivos", icon: FolderOpen },
];

export function Sidebar({ businessName = "Mi Negocio", onClose }: SidebarProps) {
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/50 backdrop-blur-xl border-r border-white/10">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <RuntuLogo variant="minimal" size="sm" />
        <span className="font-bold text-xl text-white">Runtu</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-indigo-500/20 text-indigo-400"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon
                className={`w-5 h-5 ${
                  isActive ? "text-indigo-400" : "text-white/40"
                }`}
              />
              {item.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {businessName}
            </p>
            <p className="text-xs text-white/40">Plan gratuito</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
