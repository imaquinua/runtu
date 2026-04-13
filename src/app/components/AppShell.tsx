import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import {
  MessageSquare, LayoutDashboard, LogOut, Menu, X,
  Radar, Globe, BarChart3, CalendarDays, Activity, Plug
} from "lucide-react";
import logoSrc from "../../imports/runtu_logo.png";
import { RuntuLogo } from "./RuntuLogo";
import { useAuth } from "../../lib/auth-context";

const navSections = [
  {
    title: "Comando",
    items: [
      { path: "/app", label: "Dashboard", icon: LayoutDashboard },
      { path: "/app/chat", label: "Chat IA", icon: MessageSquare },
    ],
  },
  {
    title: "Inteligencia",
    items: [
      { path: "/app/social-scraping", label: "Social Scraping", icon: Radar },
      { path: "/app/web-scraping", label: "Web Scraping", icon: Globe },
      { path: "/app/analytics", label: "Social Analytics", icon: Activity },
    ],
  },
  {
    title: "Estrategia",
    items: [
      { path: "/app/mmm", label: "MMM Engine", icon: BarChart3 },
      { path: "/app/calendar", label: "Calendario", icon: CalendarDays },
      { path: "/app/integrations", label: "Integraciones", icon: Plug },
    ],
  },
];

const bottomNavItems = [
  { path: "/app", label: "Dashboard", icon: LayoutDashboard },
  { path: "/app/social-scraping", label: "Scraping", icon: Radar },
  { path: "/app/analytics", label: "Analytics", icon: Activity },
  { path: "/app/calendar", label: "Calendario", icon: CalendarDays },
  { path: "/app/chat", label: "Chat", icon: MessageSquare },
];

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { business, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const isActive = (path: string) => {
    if (path === "/app") return location.pathname === "/app";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="h-screen flex bg-[#FAFAFA] text-gray-900 font-[Montserrat]">
      {/* Mobile header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 bg-white/90 backdrop-blur-xl border-b border-gray-200/60 lg:hidden">
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-gray-400 hover:text-gray-600">
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <img src={logoSrc} alt="Runtu" className="w-7 h-7" />
          <span style={{ fontWeight: 700 }} className="text-sm text-gray-900">Runtu<span className="text-amber-600">.tech</span></span>
        </div>
        <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-700 text-xs" style={{ fontWeight: 700 }}>R</div>
      </header>

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative z-40 top-0 left-0 h-full w-[252px] bg-white border-r border-gray-200/80 flex flex-col
        transition-transform duration-300 ease-out
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <button onClick={() => setMobileOpen(false)} className="absolute top-3 right-3 lg:hidden text-gray-300 hover:text-gray-500">
          <X className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-gray-100">
          <img src={logoSrc} alt="Runtu" className="w-8 h-8" />
          <div className="flex flex-col">
            <span className="text-gray-900 text-sm" style={{ fontWeight: 700 }}>
              Runtu<span className="text-amber-600">.tech</span>
            </span>
            <span className="text-gray-400 text-[10px] uppercase tracking-widest" style={{ fontWeight: 500 }}>Marketing OS</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-3 overflow-y-auto space-y-5">
          {navSections.map(section => (
            <div key={section.title}>
              <p className="text-gray-400 text-[10px] uppercase tracking-[0.15em] px-3 mb-2" style={{ fontWeight: 600 }}>{section.title}</p>
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const active = isActive(item.path);
                  return (
                    <button
                      key={item.path}
                      onClick={() => { navigate(item.path); setMobileOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 ${
                        active
                          ? "bg-gray-900 text-white shadow-sm"
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                      }`}
                      style={{ fontWeight: active ? 600 : 400 }}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom user section */}
        <div className="p-3 border-t border-gray-100">
          <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700 text-xs" style={{ fontWeight: 700 }}>
              {business?.name?.[0]?.toUpperCase() ?? "R"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-700 text-xs truncate" style={{ fontWeight: 600 }}>{business?.name ?? "Mi Negocio"}</p>
              {business?.sector && (
                <p className="text-gray-400 text-[10px] truncate">{business.sector}</p>
              )}
            </div>
            <button onClick={handleLogout} className="text-gray-300 hover:text-gray-500 transition-colors" title="Cerrar sesión">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0 bg-[#FAFAFA]">
        <Outlet />
      </main>

      {/* Bottom nav mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white border-t border-gray-200/60 flex items-center justify-around lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {bottomNavItems.map(item => {
          const active = isActive(item.path);
          return (
            <button key={item.path} onClick={() => navigate(item.path)} className={`flex flex-col items-center gap-0.5 transition-colors ${active ? "text-gray-900" : "text-gray-400"}`}>
              <item.icon className="w-5 h-5" />
              <span className="text-[9px]" style={{ fontWeight: active ? 600 : 400 }}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
