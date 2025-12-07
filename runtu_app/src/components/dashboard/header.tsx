"use client";

import { Menu, Bell } from "lucide-react";

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
  notificationCount?: number;
}

export function Header({ title, onMenuClick, notificationCount = 0 }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/50 backdrop-blur-xl border-b border-white/10">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Left side - Menu button (mobile) + Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 -ml-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors md:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg md:text-xl font-semibold text-white">
            {title}
          </h1>
        </div>

        {/* Right side - Notifications */}
        <div className="flex items-center gap-2">
          <button
            className="relative p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Notificaciones"
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
