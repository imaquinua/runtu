import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, LockKeyhole } from "lucide-react";
import { RuntuMark } from "./Incubadora";
import "../../styles/public-form.css";

type Field = { id: string; label: string; type: "text" | "email" | "textarea"; required: boolean; maxLength: number };
type PublicFormData = { public_id: string; title: string; description: string; field_schema: Field[]; consent_version: string; consent_copy: string };

export default function PublicForm({ path }: { path: string }) {
  const id = path.split('/').filter(Boolean)[1] || '';
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const embedded = params.get('embed') === '1';
  const source = (params.get('source') || 'direct').slice(0, 120);
  const [form, setForm] = useState<PublicFormData | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'sending' | 'sent' | 'missing'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/public-form?id=${encodeURIComponent(id)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('missing');
        return response.json();
      })
      .then((body) => { setForm(body.form); setStatus('ready'); })
      .catch(() => setStatus('missing'));
  }, [id]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form || status === 'sending') return;
    if (!consent) { setError('Confirma el consentimiento para poder enviar tus respuestas.'); return; }
    setStatus('sending');
    setError('');
    try {
      const response = await fetch('/api/public-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, payload: values, consent: true, source }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'send_failed');
      setStatus('sent');
    } catch {
      setStatus('ready');
      setError('No pudimos enviar el formulario. Inténtalo nuevamente.');
    }
  }

  if (status === 'loading') return <main className="public-form-state" role="status">ABRIENDO FORMULARIO…</main>;
  if (status === 'missing' || !form) return <main className="public-form-state"><strong>ESTE FORMULARIO NO ESTÁ DISPONIBLE</strong><a href="/">Volver a Runtu</a></main>;
  if (status === 'sent') return <main className="public-form-state public-form-success"><Check size={34} /><strong>RESPUESTAS RECIBIDAS</strong><p>La organización que compartió este enlace ya puede revisar tu radiografía.</p></main>;

  return (
    <main className={`public-form-page ${embedded ? 'embedded' : ''}`}>
      {!embedded ? <header><a href="/" aria-label="Runtu"><RuntuMark inverse /><span>runtu</span></a><small>FORMULARIO AUTÓNOMO · RADI0-01</small></header> : null}
      <section className="public-form-layout">
        <div className="public-form-intro">
          <p>RUNTU · RADIOGRAFÍA</p>
          <h1>{form.title}</h1>
          <span>{form.description}</span>
          <div><LockKeyhole size={17} /><small>Tus respuestas quedan dentro de la organización que te envió este enlace.</small></div>
        </div>
        <form onSubmit={submit}>
          {form.field_schema.map((field, index) => (
            <label key={field.id}>
              <span><i>{String(index + 1).padStart(2, '0')}</i>{field.label}{field.required ? <b>OBLIGATORIO</b> : null}</span>
              {field.type === 'textarea' ? (
                <textarea required={field.required} maxLength={field.maxLength} value={values[field.id] || ''} onChange={(event) => setValues((current) => ({ ...current, [field.id]: event.target.value }))} />
              ) : (
                <input type={field.type} required={field.required} maxLength={field.maxLength} value={values[field.id] || ''} onChange={(event) => setValues((current) => ({ ...current, [field.id]: event.target.value }))} />
              )}
            </label>
          ))}
          <label className="public-form-consent">
            <input type="checkbox" checked={consent} onChange={(event) => { setConsent(event.target.checked); setError(''); }} />
            <span>{form.consent_copy}<small>Versión {form.consent_version}</small></span>
          </label>
          {error ? <p className="public-form-error" role="alert">{error}</p> : null}
          <button disabled={status === 'sending'}>{status === 'sending' ? 'ENVIANDO…' : 'ENVIAR RADIOGRAFÍA →'}</button>
        </form>
      </section>
      {!embedded ? <footer><span>RUNTU · FORMULARIO COMPARTIBLE</span><span>Primero se entiende. Después se incuba.</span></footer> : null}
    </main>
  );
}

