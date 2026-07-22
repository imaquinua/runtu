import { useEffect, useState } from "react";
import { ArrowLeft, Check, Download, Fingerprint, LockKeyhole, PackageCheck } from "lucide-react";
import { useControlPlane } from "../auth/ControlPlane";
import "../../styles/agent-architecture.css";

type AgentRecord = {
  id: string; slug: string; name: string; purpose: string; risk_level: string; status: string;
  version_id: string; version: string; state: string; checksum_sha256: string; immutable: boolean;
  checksum_scope: string; manifest: {
    agent: { purpose: string }; runtime: { model: string; budget_per_run_usd: number };
    policy: { retention: string; prohibited_actions: string[] }; tools: unknown[];
    configuration?: { radiography_id?: string };
    capabilities?: string[];
  };
  output_schema: { required?: string[]; properties?: { projects?: unknown } };
  report_id: string | null; source_type: string | null; model: string | null; cases: number | null; passed: number | null;
  pass_rate: string | null; schema_pass_rate: string | null; policy_pass_rate: string | null;
  latency_p95_ms: number | null; estimated_cost_usd: string | null;
};

export default function AgentArchitecture() {
  const { organization, getToken } = useControlPlane();
  const [agent, setAgent] = useState<AgentRecord | null>(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const token = await getToken();
        const owner = organization.role === 'OWNER';
        const response = await fetch(owner ? '/api/agents' : `/api/agents?organizationId=${organization.id}`, owner ? {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ organizationId: organization.id }),
        } : { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error('No pudimos abrir el registro del agente.');
        const body = await response.json();
        if (active) setAgent(body.agents[0] || null);
      } catch (cause) { if (active) setError(cause instanceof Error ? cause.message : 'Registro no disponible.'); }
    }
    load();
    return () => { active = false; };
  }, [getToken, organization.id, organization.role]);

  async function downloadPackage() {
    if (!agent || downloading) return;
    setDownloading(true);
    setError('');
    try {
      const token = await getToken();
      const query = new URLSearchParams({ organizationId: organization.id, versionId: agent.version_id });
      const response = await fetch(`/api/agent-package?${query}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('El paquete no superó la verificación de integridad.');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${agent.slug}-${agent.version}.runtu.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No pudimos descargar el paquete.'); }
    finally { setDownloading(false); }
  }

  if (error && !agent) return <main className="architecture-state"><strong>REGISTRO NO DISPONIBLE</strong><p>{error}</p><a href="/lab">Volver al Nido</a></main>;
  if (!agent) return <main className="architecture-state" role="status">REGISTRANDO HUEVO 0…</main>;

  const hasEvidence = Boolean(agent.report_id);
  const passPercent = hasEvidence ? Math.round(Number(agent.pass_rate) * 100) : 0;
  const builtFromRadiography = Boolean(agent.manifest.configuration?.radiography_id);
  const model = agent.model || agent.manifest.runtime.model;
  return (
    <main className="architecture-page">
      <header><a href="/lab/minuta-comite/radiografia"><ArrowLeft size={15} /> RADIOGRAFÍA</a><span>RUNTU · REGISTRO VERSIONADO</span><strong>{organization.name} · {organization.role}</strong></header>
      <section className="architecture-hero"><div><p>PASO 2 DE 5 · ARQUITECTURA</p><h1>El criterio ya tiene<br /><em>huella digital.</em></h1><span>{agent.manifest.agent.purpose}</span></div><aside><small>ESTADO CANÓNICO</small><strong>{agent.state}</strong><span>v{agent.version} · RIESGO {agent.risk_level.toUpperCase()}</span></aside></section>
      <section className="architecture-grid">
        <article className="architecture-contract"><header><span>CONTRATO DEL AGENTE</span><strong>{agent.slug}</strong></header><dl><div><dt>ENTRADA</dt><dd>{agent.manifest.capabilities?.includes('dictation_input') ? 'Notas, texto o dictado convertido en transcripción · máximo 30.000 caracteres' : 'Notas de reunión · texto · máximo 30.000 caracteres'}</dd></div><div><dt>CRITERIO</dt><dd>Decisiones completas; lo incompleto queda pendiente; el ruido se explica.</dd></div><div><dt>SALIDA</dt><dd>{agent.output_schema?.properties?.projects ? 'Minuta, proyectos y tareas con responsables bajo esquema JSON estricto.' : 'Minuta estructurada bajo esquema JSON estricto.'}</dd></div><div><dt>LÍMITES</dt><dd>No inventa responsables ni fechas. No ejecuta ni envía mensajes.</dd></div><div><dt>RETENCIÓN</dt><dd>ZERO_CONTENT · contenido no persistido por Runtu.</dd></div></dl></article>
        <aside className="architecture-proof">
          <div><Fingerprint size={20} /><span>CHECKSUM SHA-256</span><code>{agent.checksum_sha256}</code></div>
          <div><LockKeyhole size={20} /><span>INMUTABILIDAD</span><strong>{agent.immutable ? 'VERSIÓN CONGELADA' : 'EDITABLE'}</strong><small>Un cambio exige una versión nueva y otro checksum.</small></div>
          <div><Check size={20} /><span>EVIDENCIA</span><strong>{hasEvidence ? `${agent.passed}/${agent.cases} · ${passPercent}%` : 'PENDIENTE DE ESCALA'}</strong><small>{hasEvidence ? `${agent.source_type?.toUpperCase()} identificado · ${model} · p95 ${agent.latency_p95_ms} ms` : `La definición está congelada; ${model} aún no ha ejecutado esta versión.`}</small></div>
        </aside>
      </section>
      <section className="architecture-specs"><div><span>MODELO</span><strong>{model}</strong></div><div><span>ESQUEMA</span><strong>{agent.output_schema.required?.length || 0} campos obligatorios</strong></div><div><span>RETENCIÓN</span><strong>{agent.manifest.policy.retention}</strong></div><div><span>ACCIONES EXTERNAS</span><strong>{agent.manifest.tools.length === 0 ? 'NINGUNA' : agent.manifest.tools.length}</strong></div><div><span>PRESUPUESTO/RUN</span><strong>US${agent.manifest.runtime.budget_per_run_usd.toFixed(2)}</strong></div></section>
      <details className="architecture-manifest"><summary>VER MANIFIESTO TÉCNICO</summary><pre>{JSON.stringify(agent.manifest, null, 2)}</pre></details>
      <section className="architecture-actions"><div><PackageCheck size={23} /><p><strong>{hasEvidence ? 'PAQUETE PORTABLE VERIFICADO' : 'PAQUETE EN ESPERA DE EVIDENCIA'}</strong><span>{hasEvidence ? 'Manifiesto, instrucciones, esquema y evidencia. Inventario incluido y escaneo de secretos antes de salir.' : 'La descarga se habilita cuando la Escala genere evidencia atribuible a este checksum.'}</span></p></div><button onClick={downloadPackage} disabled={downloading || !hasEvidence}><Download size={16} /> {downloading ? 'VERIFICANDO…' : hasEvidence ? 'DESCARGAR .RUNTU.JSON' : 'EVALUAR PRIMERO'}</button>{error ? <p className="architecture-error">{error}</p> : null}</section>
      <footer>{builtFromRadiography ? <a href="/lab/minuta-comite/escala">CONTINUAR A LA ESCALA →</a> : <a href="/lab/minuta-comite/radiografia">CONSTRUIR DESDE RADIOGRAFÍA →</a>}<span>La versión {agent.version} está congelada. Cualquier mejora creará otra versión.</span></footer>
    </main>
  );
}
