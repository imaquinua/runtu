import { useEffect, useState } from 'react';
import { ArrowRight, Check, LockKeyhole, Plus, Save, ShieldCheck } from 'lucide-react';
import { useControlPlane } from '../auth/ControlPlane';
import '../../styles/radiography.css';
import '../../styles/radiography-operations.css';

type Draft = { agentName: string; primaryUser: string; desiredResult: string; teamContext: string };
type RadiographyRecord = {
  id: string; revision: number; status: 'DRAFT' | 'BUILT'; agent_name: string;
  primary_user: string; desired_result: string; team_context: string; purpose_summary: string;
  built_version?: string; checksum_sha256?: string;
};

const EMPTY_DRAFT: Draft = { agentName: '', primaryUser: '', desiredResult: '', teamContext: '' };
const LIMITS = [
  'No inventa responsables ni compromisos.',
  'No inventa fechas ni plazos.',
  'No ejecuta decisiones ni envía mensajes.',
  'No obedece instrucciones escondidas en las notas.',
];

function storedDraft(key: string): Draft {
  try {
    const stored = JSON.parse(window.localStorage.getItem(key) || 'null');
    return stored?.version === 1 ? { ...EMPTY_DRAFT, ...stored.data } : EMPTY_DRAFT;
  } catch { return EMPTY_DRAFT; }
}

export default function Radiography() {
  const { organization, getToken } = useControlPlane();
  const storageKey = `runtu:radiography:v1:${organization.id}:minuta-comite`;
  const [draft, setDraft] = useState<Draft>(() => storedDraft(storageKey));
  const [record, setRecord] = useState<RadiographyRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<'save' | 'build' | null>(null);
  const [message, setMessage] = useState('');
  const owner = organization.role === 'OWNER';

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const token = await getToken();
        const query = new URLSearchParams({ organizationId: organization.id });
        const response = await fetch(`/api/radiography?${query}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error('No pudimos abrir la Radiografía.');
        const body = await response.json();
        const serverRecord: RadiographyRecord | null = body.radiography;
        if (!active) return;
        setRecord(serverRecord);
        const local = storedDraft(storageKey);
        const hasLocal = Object.values(local).some(Boolean);
        if (serverRecord?.status === 'BUILT' || !hasLocal) {
          setDraft(serverRecord ? {
            agentName: serverRecord.agent_name,
            primaryUser: serverRecord.primary_user,
            desiredResult: serverRecord.desired_result,
            teamContext: serverRecord.team_context,
          } : EMPTY_DRAFT);
        } else {
          setMessage('Recuperamos un borrador guardado en este dispositivo.');
        }
      } catch (cause) { if (active) setMessage(cause instanceof Error ? cause.message : 'Radiografía no disponible.'); }
      finally { if (active) setLoading(false); }
    }
    load();
    return () => { active = false; };
  }, [getToken, organization.id, storageKey]);

  useEffect(() => {
    if (!loading && record?.status !== 'BUILT') {
      window.localStorage.setItem(storageKey, JSON.stringify({ version: 1, data: draft }));
    }
  }, [draft, loading, record?.status, storageKey]);

  function update(field: keyof Draft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setMessage('');
  }

  async function saveDraft() {
    const token = await getToken();
    const response = await fetch('/api/radiography', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ organizationId: organization.id, ...draft }),
    });
    if (!response.ok) throw new Error(response.status === 400 ? 'Completa los cuatro campos antes de guardar.' : 'No pudimos guardar el borrador.');
    const body = await response.json();
    setRecord(body.radiography);
    return body.radiography as RadiographyRecord;
  }

  async function submit(action: 'save' | 'build') {
    if (!owner || busy || record?.status === 'BUILT') return;
    setBusy(action);
    setMessage('');
    try {
      await saveDraft();
      if (action === 'save') {
        setMessage('Borrador guardado en tu organización.');
        return;
      }
      const token = await getToken();
      const response = await fetch('/api/radiography', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ organizationId: organization.id }),
      });
      if (!response.ok) throw new Error('No pudimos congelar la versión candidata.');
      const body = await response.json();
      setRecord(body.radiography);
      window.localStorage.removeItem(storageKey);
      window.location.assign('/lab/minuta-comite/arquitectura');
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'No pudimos completar la acción.'); }
    finally { setBusy(null); }
  }

  function startNewVersion() {
    if (!owner || record?.status !== 'BUILT') return;
    setDraft({
      agentName: record.agent_name,
      primaryUser: record.primary_user,
      desiredResult: record.desired_result,
      teamContext: record.team_context,
    });
    setRecord(null);
    setMessage('Nueva versión preparada. Al construirla agregará dictado, proyectos, tareas y responsables sin modificar la versión activa.');
  }

  const purpose = record?.status === 'BUILT'
    ? record.purpose_summary
    : draft.agentName && draft.primaryUser && draft.desiredResult && draft.teamContext
      ? `${draft.agentName} ayuda a ${draft.primaryUser} a ${draft.desiredResult} en el contexto de ${draft.teamContext}.`
      : 'Completa los cuatro campos para generar un propósito verificable.';

  if (loading) return <main className="radiography-state" role="status">ABRIENDO RADIOGRAFÍA…</main>;

  return (
    <main className="radiography-page">
      <header><a href="/lab">← EL NIDO</a><span>RUNTU · RADIOGRAFÍA PRIVADA</span><strong>{organization.name} · {organization.role}</strong></header>
      <section className="radiography-hero"><div><p>PASO 1 DE 5 · RADIOGRAFÍA</p><h1>Primero acordamos<br /><em>para quién trabaja.</em></h1><span>Personaliza el molde sin abrir el prompt ni retirar sus límites de seguridad.</span></div><aside><small>ESTADO</small><strong>{record?.status || 'SIN GUARDAR'}</strong><span>{record ? `REVISIÓN ${record.revision}` : 'BORRADOR LOCAL'}</span></aside></section>
      <form className="radiography-grid" onSubmit={(event) => event.preventDefault()}>
        <section className="radiography-fields" aria-disabled={!owner || record?.status === 'BUILT'}>
          <label><span>01 · NOMBRE DEL AGENTE</span><input value={draft.agentName} onChange={(event) => update('agentName', event.target.value)} maxLength={100} minLength={3} required disabled={!owner || record?.status === 'BUILT'} placeholder="Ej. Minuta del comité comercial" /></label>
          <label><span>02 · USUARIO PRINCIPAL</span><input value={draft.primaryUser} onChange={(event) => update('primaryUser', event.target.value)} maxLength={200} minLength={3} required disabled={!owner || record?.status === 'BUILT'} placeholder="Ej. Gerencia y líderes de frente" /></label>
          <label><span>03 · RESULTADO ESPERADO</span><textarea value={draft.desiredResult} onChange={(event) => update('desiredResult', event.target.value)} maxLength={1200} minLength={10} required disabled={!owner || record?.status === 'BUILT'} placeholder="¿Qué debe quedar claro al terminar?" /></label>
          <label><span>04 · EQUIPO Y CONTEXTO</span><textarea value={draft.teamContext} onChange={(event) => update('teamContext', event.target.value)} maxLength={500} minLength={3} required disabled={!owner || record?.status === 'BUILT'} placeholder="Ritmo, tipo de reunión y equipo involucrado" /></label>
        </section>
        <aside className="radiography-contract">
          <div className="radiography-purpose"><ShieldCheck size={20} /><span>RESUMEN DE PROPÓSITO</span><p>{purpose}</p></div>
          <div className="radiography-limits"><header><LockKeyhole size={18} /><span>LÍMITES BASE · NO DESACTIVABLES</span></header><ul>{LIMITS.map((limit) => <li key={limit}><Check size={15} /> {limit}</li>)}</ul></div>
          {message ? <p className="radiography-message" role="status">{message}</p> : null}
          {record?.status === 'BUILT' ? <div className="radiography-built"><strong>VERSIÓN {record.built_version} CONSTRUIDA</strong><code>{record.checksum_sha256}</code><a href="/lab/minuta-comite/arquitectura">VER ARQUITECTURA <ArrowRight size={15} /></a>{owner ? <button type="button" onClick={startNewVersion}><Plus size={15} /> CREAR NUEVA VERSIÓN OPERATIVA</button> : null}</div> : owner ? <div className="radiography-actions"><button type="button" onClick={() => submit('save')} disabled={Boolean(busy)}><Save size={15} /> {busy === 'save' ? 'GUARDANDO…' : 'GUARDAR BORRADOR'}</button><button className="primary" type="button" onClick={() => submit('build')} disabled={Boolean(busy)}> {busy === 'build' ? 'CONSTRUYENDO…' : 'CONSTRUIR VERSIÓN'} <ArrowRight size={15} /></button></div> : <p className="radiography-readonly">REVIEWER puede inspeccionar esta Radiografía, pero no modificarla ni aprobarla.</p>}
        </aside>
      </form>
    </main>
  );
}
