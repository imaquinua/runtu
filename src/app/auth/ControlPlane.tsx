import { SignInButton, SignedIn, SignedOut, UserButton, useAuth } from "@clerk/clerk-react";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";

type Organization = { id: string; name: string; slug: string; role: "OWNER" | "REVIEWER" };
type ControlPlaneValue = { organization: Organization; getToken: () => Promise<string | null> };

const ControlPlaneContext = createContext<ControlPlaneValue | null>(null);

export function useControlPlane() {
  const value = useContext(ControlPlaneContext);
  if (!value) throw new Error("ControlPlaneProvider is required");
  return value;
}

function AccessGate() {
  return (
    <main className="shell-access">
      <a className="shell-access-brand" href="/">runtu</a>
      <section>
        <span><LockKeyhole size={18} /> LAB PRIVADO</span>
        <h1>Tu incubadora empieza con una identidad.</h1>
        <p>Inicia sesión para crear un espacio aislado para tu organización. Tus datos no se mezclan con los de otras personas.</p>
        <SignInButton mode="modal"><button>ENTRAR AL LAB <ArrowRight size={16} /></button></SignInButton>
      </section>
    </main>
  );
}

function SignedInControlPlane({ children }: { children: ReactNode }) {
  const { getToken } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function bootstrap() {
      try {
        const token = await getToken();
        const response = await fetch("/api/control-plane", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: "Mi organización" }),
        });
        if (!response.ok) throw new Error("No pudimos abrir tu organización.");
        const body = await response.json();
        if (active) setOrganization(body.organization);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "No pudimos abrir el Lab.");
      }
    }
    bootstrap();
    return () => { active = false; };
  }, [getToken]);

  const value = useMemo(() => organization ? { organization, getToken } : null, [organization, getToken]);
  if (error) return <main className="shell-session-state"><strong>NO PUDIMOS ABRIR EL LAB</strong><p>{error}</p><a href="/">Volver al inicio</a></main>;
  if (!value) return <main className="shell-session-state" role="status"><strong>PREPARANDO TU NIDO…</strong><p>Estamos verificando el espacio privado.</p></main>;
  return <ControlPlaneContext.Provider value={value}>{children}</ControlPlaneContext.Provider>;
}

export function ProtectedLab({ children }: { children: ReactNode }) {
  return (
    <>
      <SignedOut><AccessGate /></SignedOut>
      <SignedIn><SignedInControlPlane>{children}</SignedInControlPlane></SignedIn>
    </>
  );
}

export function SessionBadge() {
  const { organization } = useControlPlane();
  return <div className="shell-session"><span>{organization.name} · {organization.role}</span><UserButton /></div>;
}

