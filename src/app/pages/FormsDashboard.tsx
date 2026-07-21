import { useEffect, useState } from "react";
import { ArrowLeft, Copy, ExternalLink, MessageCircle, Plus } from "lucide-react";
import { useControlPlane } from "../auth/ControlPlane";
import "../../styles/forms-dashboard.css";

type SharedForm = { id: string; public_id: string; title: string; status: string; created_at: string; submissions: number };

export default function FormsDashboard() {
  const { organization, getToken } = useControlPlane();
  const [forms, setForms] = useState<SharedForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  async function load() {
    try {
      const token = await getToken();
      const response = await fetch(`/api/forms?organizationId=${organization.id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error();
      setForms((await response.json()).forms);
    } catch { setError('No pudimos cargar los formularios.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function createForm() {
    setError('');
    try {
      const token = await getToken();
      const response = await fetch('/api/forms', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ organizationId: organization.id, title: 'Radiografía de un nuevo agente' }),
      });
      if (!response.ok) throw new Error(response.status === 403 ? 'Solo OWNER puede crear formularios.' : 'No pudimos crear el formulario.');
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No pudimos crear el formulario.'); }
  }

  function link(form: SharedForm, source = 'direct') {
    return `${window.location.origin}/f/${form.public_id}?source=${source}`;
  }

  async function copy(form: SharedForm) {
    await navigator.clipboard.writeText(link(form));
    setCopied(form.id);
    window.setTimeout(() => setCopied(''), 1600);
  }

  return (
    <main className="forms-page">
      <header><a href="/lab"><ArrowLeft size={15} /> EL NIDO</a><span>RUNTU · FORMULARIOS AUTÓNOMOS</span><strong>{organization.name} · {organization.role}</strong></header>
      <section className="forms-heading"><p>CAPTURA DESCENTRALIZADA</p><h1>Un enlace. Cualquier canal.<br /><em>Una sola organización.</em></h1><span>Crea una radiografía, compártela por WhatsApp o insértala en otra página. Toda respuesta exige opt‑in y conserva evidencia.</span></section>
      <section className="forms-list">
        <div className="forms-list-head"><div><small>{forms.length} FORMULARIOS</small><h2>Radiografías compartibles</h2></div>{organization.role === 'OWNER' ? <button onClick={createForm}><Plus size={16} /> CREAR FORMULARIO</button> : null}</div>
        {error ? <p className="forms-error">{error}</p> : null}
        {loading ? <p className="forms-empty">CARGANDO…</p> : forms.length === 0 ? <p className="forms-empty">Todavía no hay formularios. Crea el primero y comparte el enlace.</p> : forms.map((form) => {
          const whatsappText = encodeURIComponent(`Te comparto una radiografía de Runtu para entender el agente que necesitas: ${link(form, 'whatsapp')}`);
          return <article key={form.id}><div><small>{form.status} · {form.submissions} RESPUESTAS</small><h3>{form.title}</h3><code>/f/{form.public_id}</code></div><nav><a href={link(form)} target="_blank" rel="noreferrer"><ExternalLink size={15} /> ABRIR</a><button onClick={() => copy(form)}><Copy size={15} /> {copied === form.id ? 'COPIADO ✓' : 'COPIAR'}</button><a href={`https://wa.me/?text=${whatsappText}`} target="_blank" rel="noreferrer"><MessageCircle size={15} /> WHATSAPP</a></nav></article>;
        })}
      </section>
    </main>
  );
}

