import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Package, BarChart3, MessageCircle } from "lucide-react";

export default async function DashboardPage() {
  let user = null;
  let businessName = "tu negocio";

  // Only fetch user if Supabase is configured
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder.supabase.co"
  ) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;

    if (user) {
      const { data: business } = await supabase
        .from("businesses")
        .select("name")
        .eq("user_id", user.id)
        .single();

      if (business?.name) {
        businessName = business.name;
      }
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          Bienvenido a {businessName}
        </h2>
        <p className="mt-2 text-gray-600">
          Tu copiloto de negocio está listo para ayudarte. Aquí podrás gestionar
          tu negocio con la claridad que siempre quisiste.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Ventas hoy</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">S/ 0.00</p>
          <p className="mt-1 text-xs text-gray-400">+0% vs ayer</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Pedidos</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">0</p>
          <p className="mt-1 text-xs text-gray-400">Este mes</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Productos</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">0</p>
          <p className="mt-1 text-xs text-gray-400">Registrados</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Clientes</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">0</p>
          <p className="mt-1 text-xs text-gray-400">Total</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Acciones rápidas
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="flex items-start gap-4 bg-white hover:bg-gray-50 border border-gray-200 hover:border-indigo-200 rounded-xl p-5 text-left transition-all group shadow-sm">
            <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 group-hover:bg-indigo-200 rounded-lg flex items-center justify-center transition-colors">
              <Plus className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Registrar venta</h4>
              <p className="text-sm text-gray-500 mt-0.5">
                Agrega una nueva venta al sistema
              </p>
            </div>
          </button>

          <button className="flex items-start gap-4 bg-white hover:bg-gray-50 border border-gray-200 hover:border-indigo-200 rounded-xl p-5 text-left transition-all group shadow-sm">
            <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 group-hover:bg-indigo-200 rounded-lg flex items-center justify-center transition-colors">
              <Package className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Agregar producto</h4>
              <p className="text-sm text-gray-500 mt-0.5">
                Registra un nuevo producto o servicio
              </p>
            </div>
          </button>

          <Link
            href="/app/reportes"
            className="flex items-start gap-4 bg-white hover:bg-gray-50 border border-gray-200 hover:border-indigo-200 rounded-xl p-5 text-left transition-all group shadow-sm"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 group-hover:bg-indigo-200 rounded-lg flex items-center justify-center transition-colors">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Ver reportes</h4>
              <p className="text-sm text-gray-500 mt-0.5">
                Analiza el rendimiento de tu negocio
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Copilot CTA */}
      <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl p-6 md:p-8 text-center shadow-lg">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Tu copiloto está aprendiendo
        </h3>
        <p className="text-indigo-100 mb-6 max-w-lg mx-auto">
          Mientras más uses Runtu, mejor entenderé tu negocio. Pronto podré
          darte insights personalizados y responder tus preguntas.
        </p>
        <Link
          href="/app/chat"
          className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-indigo-600 font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Hablar con Runtu
        </Link>
      </div>
    </div>
  );
}
