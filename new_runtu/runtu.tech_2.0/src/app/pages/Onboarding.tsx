import { useState } from "react";
import { useNavigate } from "react-router";
import logoSrc from "../../imports/runtu_logo.png";
import { useAuth } from "../../lib/auth-context";

const sectors = ["E-commerce", "Alimentos y bebidas", "Moda", "Servicios profesionales", "Salud y bienestar", "Tecnología", "Educación", "Otro"];

export function Onboarding() {
  const navigate = useNavigate();
  const { saveBusiness } = useAuth();
  const [bizName, setBizName] = useState("");
  const [sector, setSector] = useState("");
  const [desc, setDesc] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!bizName.trim()) { setError("El nombre del negocio es requerido"); return; }
    setLoading(true);
    const { error } = await saveBusiness(bizName.trim(), sector, desc.trim());
    setLoading(false);
    if (error) { setError(error); return; }
    navigate("/app");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] font-[Montserrat] px-4">
      <div className="w-full max-w-md flex flex-col items-center">
        <img src={logoSrc} alt="Runtu" className="w-14 h-14 mb-2" />
        <h1 className="text-2xl text-gray-900 tracking-tight" style={{ fontWeight: 900 }}>Cuentame de tu negocio</h1>
        <p className="text-gray-400 text-sm mt-1">Esto nos ayuda a personalizar tu experiencia</p>
        <form onSubmit={handleSubmit} className="w-full mt-8 space-y-3">
          <input type="text" placeholder="Nombre del negocio" value={bizName} onChange={e => setBizName(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 outline-none transition-all text-sm" />
          <select value={sector} onChange={e => setSector(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 outline-none transition-all appearance-none text-sm">
            <option value="">Sector</option>
            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <textarea placeholder="A que te dedicas?" value={desc} onChange={e => setDesc(e.target.value)} rows={3}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 outline-none transition-all resize-none text-sm" />
          {error && <p className="text-red-500 text-xs px-1">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white rounded-xl px-8 py-3.5 transition-all hover:shadow-lg text-sm" style={{ fontWeight: 700 }}>
            {loading ? "Guardando..." : "Guardar y empezar"}
          </button>
        </form>
      </div>
    </div>
  );
}
