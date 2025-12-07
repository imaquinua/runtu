import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/auth/logout-button";
import { RuntuLogo } from "@/components/ui/runtu-logo";
import Link from "next/link";

export default async function DashboardPage() {
  let user = null;

  // Only fetch user if Supabase is configured
  if (process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co') {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  return (
    <div className="min-h-screen bg-[#020617]">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(251,191,36,0.05),transparent_50%)]" />
      </div>

      {/* Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/app/dashboard" className="flex items-center gap-3">
              <RuntuLogo variant="minimal" size="sm" />
              <span className="text-white font-semibold hidden sm:block">Runtu</span>
            </Link>

            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-white/60 text-sm hidden sm:block">
                    {user.email}
                  </span>
                  <LogoutButton className="text-sm text-white/60 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors" />
                </>
              ) : (
                <Link
                  href="/login"
                  className="text-sm text-white/60 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors"
                >
                  Iniciar sesión
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Bienvenido a <span className="gradient-text">Runtu</span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl">
            Tu copiloto de negocio está listo para ayudarte. Aquí podrás gestionar tu negocio con la claridad que siempre quisiste.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <p className="text-white/40 text-sm font-medium mb-2">Ventas hoy</p>
            <p className="text-2xl font-bold text-white">S/ 0.00</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <p className="text-white/40 text-sm font-medium mb-2">Pedidos</p>
            <p className="text-2xl font-bold text-white">0</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <p className="text-white/40 text-sm font-medium mb-2">Productos</p>
            <p className="text-2xl font-bold text-white">0</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <p className="text-white/40 text-sm font-medium mb-2">Clientes</p>
            <p className="text-2xl font-bold text-white">0</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-4">Acciones rápidas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#fbbf24]/30 rounded-xl p-6 text-left transition-colors group">
              <div className="w-10 h-10 bg-[#fbbf24]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#fbbf24]/20 transition-colors">
                <svg className="w-5 h-5 text-[#fbbf24]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-white font-medium mb-1">Registrar venta</h3>
              <p className="text-white/40 text-sm">Agrega una nueva venta al sistema</p>
            </button>

            <button className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#fbbf24]/30 rounded-xl p-6 text-left transition-colors group">
              <div className="w-10 h-10 bg-[#fbbf24]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#fbbf24]/20 transition-colors">
                <svg className="w-5 h-5 text-[#fbbf24]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-white font-medium mb-1">Agregar producto</h3>
              <p className="text-white/40 text-sm">Registra un nuevo producto o servicio</p>
            </button>

            <button className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#fbbf24]/30 rounded-xl p-6 text-left transition-colors group">
              <div className="w-10 h-10 bg-[#fbbf24]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#fbbf24]/20 transition-colors">
                <svg className="w-5 h-5 text-[#fbbf24]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-white font-medium mb-1">Ver reportes</h3>
              <p className="text-white/40 text-sm">Analiza el rendimiento de tu negocio</p>
            </button>
          </div>
        </div>

        {/* Copilot CTA */}
        <div className="bg-gradient-to-r from-[#fbbf24]/10 to-[#fbbf24]/5 border border-[#fbbf24]/20 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-white mb-2">
            Tu copiloto está aprendiendo
          </h2>
          <p className="text-white/60 mb-6 max-w-lg mx-auto">
            Mientras más uses Runtu, mejor entenderé tu negocio. Pronto podré darte insights personalizados y responder tus preguntas.
          </p>
          <button className="bg-[#fbbf24] hover:bg-[#f59e0b] text-gray-900 font-semibold py-3 px-6 rounded-lg transition-colors">
            Hablar con Runtu
          </button>
        </div>
      </main>
    </div>
  );
}
