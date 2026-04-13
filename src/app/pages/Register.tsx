import { useState } from "react";
import { useNavigate, Link } from "react-router";
import logoSrc from "../../imports/runtu_logo.png";
import { useAuth } from "../../lib/auth-context";

export function Register() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    setLoading(true);
    const { error } = await signUp(email, password, name);
    setLoading(false);
    if (error) { setError(error); return; }
    navigate("/app/onboarding");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] font-[Montserrat] px-4">
      <div className="w-full max-w-sm flex flex-col items-center">
        <img src={logoSrc} alt="Runtu" className="w-14 h-14 mb-2" />
        <h1 className="text-2xl text-gray-900 tracking-tight" style={{ fontWeight: 900 }}>Crea tu cuenta</h1>
        <p className="text-gray-400 text-sm mt-1">Empieza con Runtu.tech</p>
        <form onSubmit={handleSubmit} className="w-full mt-8 space-y-3">
          <input type="text" placeholder="Nombre completo" value={name} onChange={e => setName(e.target.value)} required
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 outline-none transition-all text-sm" />
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 outline-none transition-all text-sm" />
          <input type="password" placeholder="Contraseña (mínimo 6 caracteres)" value={password} onChange={e => setPassword(e.target.value)} required
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 outline-none transition-all text-sm" />
          {error && <p className="text-red-500 text-xs px-1">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white rounded-xl px-8 py-3.5 transition-all hover:shadow-lg text-sm" style={{ fontWeight: 700 }}>
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>
        <p className="text-gray-400 mt-6 text-sm">
          ¿Ya tienes cuenta? <Link to="/login" className="text-gray-900 hover:underline" style={{ fontWeight: 600 }}>Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
