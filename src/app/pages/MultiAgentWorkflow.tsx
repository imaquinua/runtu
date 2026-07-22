import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Database, KeyRound, Link2, LockKeyhole, ShieldCheck, Workflow } from 'lucide-react';
import { useControlPlane } from '../auth/ControlPlane';
import { RuntuMark } from './Incubadora';
import '../../styles/multi-agent-workflow.css';

type Template = {
  slug: string; name: string; category: 'TRANSFORMER' | 'CONSULTANT' | 'PREPARER' | 'OPERATOR';
  description: string; risk_level: 'low' | 'medium' | 'high'; maturity: 'CANDIDATE' | 'SPEC_READY' | 'PLANNED';
  input_label: string; output_label: string; capabilities: string[]; suggested_connectors: string[];
};
type Connector = {
  slug: string; name: string; provider_type: 'INTERNAL_API' | 'OAUTH_API' | 'REMOTE_MCP';
  description: string; write_capable: boolean; configuration_status: 'DESIGN_READY' | 'PROVIDER_REQUIRED';
};
type Spec = {
  id: string; template_slug: string; agent_name: string; primary_user: string;
  desired_result: string; operating_context: string; status: 'DRAFT' | 'SPEC_READY';
};
type Policy = {
  connector_slug: string; access_mode: AccessMode; approval_required: boolean;
  status: 'DRAFT' | 'READY_FOR_PROVIDER';
};
type AccessMode = 'DISCONNECTED' | 'READ_ONLY' | 'PROPOSE' | 'WRITE_APPROVED';
type WorkflowData = { templates: Template[]; connectors: Connector[]; specs: Spec[]; policies: Policy[] };
type Draft = { agentName: string; primaryUser: string; desiredResult: string; operatingContext: string };

const EMPTY_DRAFT: Draft = { agentName: '', primaryUser: '', desiredResult: '', operatingContext: '' };
const CATEGORY_LABEL = { TRANSFORMER: 'Transformador', CONSULTANT: 'Consultor', PREPARER: 'Preparador', OPERATOR: 'Operador aprobado' };
const MATURITY_LABEL = { CANDIDATE: 'OPERATIVO', SPEC_READY: 'LISTO PARA ESPECIFICAR', PLANNED: 'EN DISEÑO' };
const ACCESS_LABEL: Record<AccessMode, string> = {
  DISCONNECTED: 'Sin acceso', READ_ONLY: 'Sólo lectura', PROPOSE: 'Preparar borradores', WRITE_APPROVED: 'Escribir con aprobación',
};

export default function MultiAgentWorkflow({ path }: { path: string }) {
  const { organization, getToken } = useControlPlane();
  const templateSlug = path.startsWith('/lab/molde/') ? path.split('/')[3] : null;
  const [data, setData] = useState<WorkflowData | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const owner = organization.role === 'OWNER';

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = await getToken();
        const query = new URLSearchParams({ organizationId: organization.id });
        if (templateSlug) query.set('templateSlug', templateSlug);
        const response = await fetch(`/api/workflow?${query}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error('No pudimos abrir el catálogo de agentes.');
        const body: WorkflowData = await response.json();
        if (!active) return;
        setData(body);
        const saved = body.specs[0];
        setDraft(saved
          ? { agentName: saved.agent_name, primaryUser: saved.primary_user, desiredResult: saved.desired_result, operatingContext: saved.operating_context }
          : EMPTY_DRAFT);
      } catch (cause) { if (active) setMessage(cause instanceof Error ? cause.message : 'Workflow no disponible.'); }
    })();
    return () => { active = false; };
  }, [getToken, organization.id, templateSlug]);

  const selected = useMemo(() => data?.templates.find((template) => template.slug === templateSlug) || null, [data?.templates, templateSlug]);
  const policies = useMemo(() => new Map(data?.policies.map((policy) => [policy.connector_slug, policy]) || []), [data?.policies]);
  const suggested = useMemo(() => selected ? data?.connectors.filter((connector) => selected.suggested_connectors.includes(connector.slug)) || [] : [], [data?.connectors, selected]);
  const contractValid = draft.agentName.trim().length >= 3
    && draft.primaryUser.trim().length >= 3
    && draft.desiredResult.trim().length >= 10
    && draft.operatingContext.trim().length >= 3;

  async function update(action: string, payload: Record<string, unknown>) {
    if (!templateSlug || !owner) return;
    setBusy(action);
    setMessage('');
    try {
      const token = await getToken();
      const response = await fetch('/api/workflow', {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ organizationId: organization.id, templateSlug, action, ...payload }),
      });
      if (!response.ok) throw new Error(response.status === 403 ? 'Sólo OWNER puede cambiar este workflow.' : 'No pudimos guardar el workflow.');
      const body: WorkflowData = await response.json();
      setData(body);
      setMessage(action === 'save_spec' ? 'Contrato guardado. Ya puedes definir sus conexiones.' : 'Política de conexión guardada; todavía no se enviaron credenciales.');
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'No pudimos guardar el workflow.'); }
    finally { setBusy(''); }
  }

  if (!data) return <main className="workflow-state" role="status">{message || 'ABRIENDO CATÁLOGO…'}</main>;

  if (!selected) return (
    <main className="workflow-page">
      <header className="workflow-nav"><a href="/lab"><RuntuMark /><span>runtu</span></a><strong>CATÁLOGO DE MOLDES</strong><small>{organization.name} · {organization.role}</small></header>
      <section className="workflow-hero"><p>NUEVO HUEVO · PASO 0</p><h1>Elige el tipo de trabajo.<br /><em>Después define sus permisos.</em></h1><span>Un agente es propósito, entrada, salida, herramientas, límites y pruebas. No sólo un prompt.</span></section>
      <section className="workflow-catalog">
        {data.templates.map((template, index) => <a href={`/lab/molde/${template.slug}`} className={`workflow-template ${template.maturity.toLowerCase()}`} key={template.slug}>
          <header><span>{String(index + 1).padStart(2, '0')}</span><strong>{MATURITY_LABEL[template.maturity]}</strong></header>
          <small>{CATEGORY_LABEL[template.category]} · RIESGO {template.risk_level.toUpperCase()}</small>
          <h2>{template.name}</h2><p>{template.description}</p>
          <dl><div><dt>ENTRA</dt><dd>{template.input_label}</dd></div><div><dt>SALE</dt><dd>{template.output_label}</dd></div></dl>
          <footer>ABRIR WORKFLOW <ArrowRight size={15} /></footer>
        </a>)}
      </section>
    </main>
  );

  const specReady = Boolean(data.specs[0]);
  return (
    <main className="workflow-page">
      <header className="workflow-nav"><a href="/lab/nuevo"><ArrowLeft size={15} /> CATÁLOGO</a><strong>{selected.name}</strong><small>{organization.name} · {organization.role}</small></header>
      <nav className="workflow-steps" aria-label="Workflow del agente"><span className="done"><Check size={13} /> MOLDE</span><span className={specReady ? 'done' : 'active'}>02 CONTRATO</span><span className={specReady ? 'active' : ''}>03 CONEXIONES</span><span>04 CONSTRUIR</span><span>05 ESCALA</span></nav>
      <section className="workflow-selected">
        <article className="workflow-summary"><small>{CATEGORY_LABEL[selected.category]} · {MATURITY_LABEL[selected.maturity]}</small><h1>{selected.name}</h1><p>{selected.description}</p><div>{selected.capabilities.map((capability) => <span key={capability}>{capability.replaceAll('_', ' ')}</span>)}</div><dl><div><dt>ENTRADA</dt><dd>{selected.input_label}</dd></div><div><dt>SALIDA</dt><dd>{selected.output_label}</dd></div><div><dt>RIESGO</dt><dd>{selected.risk_level.toUpperCase()}</dd></div></dl></article>
        <section className="workflow-contract">
          <header><Workflow size={19} /><div><strong>01 · CONTRATO OPERATIVO</strong><span>Define para quién trabaja y qué debe dejar listo.</span></div></header>
          <div className="workflow-fields">
            <label><span>NOMBRE DEL AGENTE</span><input value={draft.agentName} onChange={(event) => setDraft((current) => ({ ...current, agentName: event.target.value }))} disabled={!owner} maxLength={100} placeholder={selected.name} /></label>
            <label><span>USUARIO PRINCIPAL</span><input value={draft.primaryUser} onChange={(event) => setDraft((current) => ({ ...current, primaryUser: event.target.value }))} disabled={!owner} maxLength={200} placeholder="Ej. Gerencia y líderes de frente" /></label>
            <label><span>RESULTADO ESPERADO</span><textarea value={draft.desiredResult} onChange={(event) => setDraft((current) => ({ ...current, desiredResult: event.target.value }))} disabled={!owner} maxLength={1200} placeholder="¿Qué debe quedar claro o preparado al terminar?" /></label>
            <label><span>CONTEXTO DE OPERACIÓN</span><textarea value={draft.operatingContext} onChange={(event) => setDraft((current) => ({ ...current, operatingContext: event.target.value }))} disabled={!owner} maxLength={600} placeholder="Equipo, frecuencia, datos y restricciones" /></label>
          </div>
          {owner ? <button type="button" onClick={() => update('save_spec', draft)} disabled={Boolean(busy) || !contractValid}>{busy === 'save_spec' ? 'GUARDANDO…' : 'GUARDAR CONTRATO'} <ArrowRight size={15} /></button> : <p className="workflow-readonly">REVIEWER puede inspeccionar; sólo OWNER modifica el contrato.</p>}
        </section>
      </section>

      <section className="workflow-connections">
        <header><Link2 size={20} /><div><strong>02 · CONEXIONES Y APIs</strong><span>Primero se define el permiso. Las credenciales se agregan después con el proveedor elegido.</span></div></header>
        {!specReady ? <p className="workflow-gate"><LockKeyhole size={16} /> Guarda el contrato antes de configurar conexiones.</p> : suggested.length ? <div className="workflow-connector-grid">{suggested.map((connector) => {
          const policy = policies.get(connector.slug);
          const mode = policy?.access_mode || 'DISCONNECTED';
          return <article className="workflow-connector" key={connector.slug}>
            <header><Database size={17} /><div><strong>{connector.name}</strong><small>{connector.provider_type.replaceAll('_', ' ')}</small></div></header><p>{connector.description}</p>
            <label><span>NIVEL DE ACCESO</span><select value={mode} disabled={!owner || Boolean(busy)} onChange={(event) => update('save_connection', { connectorSlug: connector.slug, accessMode: event.target.value })}>
              <option value="DISCONNECTED">{ACCESS_LABEL.DISCONNECTED}</option><option value="READ_ONLY">{ACCESS_LABEL.READ_ONLY}</option><option value="PROPOSE">{ACCESS_LABEL.PROPOSE}</option>{connector.write_capable ? <option value="WRITE_APPROVED">{ACCESS_LABEL.WRITE_APPROVED}</option> : null}
            </select></label>
            <div className="workflow-connector-status"><span className={policy?.status === 'READY_FOR_PROVIDER' ? 'ready' : ''} /><strong>{policy?.status === 'READY_FOR_PROVIDER' ? 'POLÍTICA LISTA' : 'SIN CONFIGURAR'}</strong><small>{connector.configuration_status === 'PROVIDER_REQUIRED' ? 'Falta elegir cuenta/proveedor' : 'Contrato técnico disponible'}</small></div>
            {policy?.approval_required ? <p className="workflow-approval"><ShieldCheck size={14} /> Requiere aprobación humana antes de producir un efecto.</p> : null}
          </article>;
        })}</div> : <p className="workflow-gate"><ShieldCheck size={16} /> Este molde empieza sin APIs. Podrá añadirlas en una versión posterior.</p>}
        <aside className="workflow-secret-note"><KeyRound size={18} /><div><strong>RUNTU NO RECIBE SECRETOS EN ESTE PASO</strong><p>Tokens, contraseñas y API keys no se guardan en el contrato ni viajan al modelo. Una conexión real usará OAuth o una referencia cifrada de servidor.</p></div></aside>
      </section>
      {message ? <p className="workflow-message" role="status">{message}</p> : null}
      <footer className="workflow-next"><div><strong>SIGUIENTE COMPUERTA</strong><span>{selected.slug === 'minuta-comite' ? 'La Minuta ya tiene runtime y puede continuar a Radiografía.' : 'Falta construir instrucciones, esquema y suite exacta de este molde.'}</span></div>{selected.slug === 'minuta-comite' ? <a href="/lab/minuta-comite/radiografia">CONTINUAR A RADIOGRAFÍA <ArrowRight size={15} /></a> : <button type="button" disabled>CONSTRUIR RUNTIME · PENDIENTE</button>}</footer>
    </main>
  );
}
