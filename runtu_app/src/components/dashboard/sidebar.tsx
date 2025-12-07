"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Folder,
  MessageCircle,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";
import { RuntuLogo } from "@/components/ui/runtu-logo";
import { logout } from "@/app/actions/auth";

interface SidebarProps {
  businessName?: string;
  onClose?: () => void;
}

const navItems = [
  { href: "/app/inicio", label: "Inicio", icon: Home },
  { href: "/app/archivos", label: "Mis Archivos", icon: Folder },
  { href: "/app/chat", label: "Chat", icon: MessageCircle },
  { href: "/app/reportes", label: "Reportes", icon: FileText },
  { href: "/app/configuracion", label: "Configuración", icon: Settings },
];

export function Sidebar({ businessName = "Mi Negocio", onClose }: SidebarProps) {
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <RuntuLogo variant="minimal" size="sm" />
        <span className="font-bold text-xl text-gray-900">Runtu</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon
                className={`w-5 h-5 ${
                  isActive ? "text-indigo-600" : "text-gray-400"
                }`}
              />
              {item.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {businessName}
            </p>
            <p className="text-xs text-gray-500">Plan gratuito</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
