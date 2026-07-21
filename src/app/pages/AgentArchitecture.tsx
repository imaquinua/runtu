import { useEffect, useState } from "react";
import { ArrowLeft, Check, Download, Fingerprint, LockKeyhole, PackageCheck } from "lucide-react";
import { useControlPlane } from "../auth/ControlPlane";
import "../../styles/agent-architecture.css";

type AgentRecord = {
  id: string; slug: string; name: string; purpose: string; risk_level: string; status: string;
  version_id: string; version: string; state: string; checksum_sha256: string; immutable: boolean;
  report_id: string; source_type: string; model: string; cases: number; passed: number;
  pass_rate: string; schema_pass_rate: string; policy_pass_rate: string;
  latency_p95_ms: number; estimated_cost_usd: string;
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

  const passPercent = Math.round(Number(agent.pass_rate) * 100);
  return (
    <main className="architecture-page">
      <header><a href="/lab/minuta-comite/radiografia"><ArrowLeft size={15} /> RADIOGRAFÍA</a><span>RUNTU · REGISTRO VERSIONADO</span><strong>{organization.name} · {organization.role}</strong></header>
      <section className="architecture-hero"><div><p>PASO 2 DE 5 · ARQUITECTURA</p><h1>El criterio ya tiene<br /><em>huella digital.</em></h1><span>{agent.purpose}</span></div><aside><small>ESTADO CANÓNICO</small><strong>{agent.state}</strong><span>v{agent.version} · RIESGO {agent.risk_level.toUpperCase()}</span></aside></section>
      <section className="architecture-grid">
        <article className="architecture-contract"><header><span>CONTRATO DEL AGENTE</span><strong>{agent.slug}</strong></header><dl><div><dt>ENTRADA</dt><dd>Notas de reunión · texto · máximo 30.000 caracteres</dd></div><div><dt>CRITERIO</dt><dd>Decisiones completas; lo incompleto queda pendiente; el ruido se explica.</dd></div><div><dt>SALIDA</dt><dd>Minuta estructurada bajo esquema JSON estricto.</dd></div><div><dt>LÍMITES</dt><dd>No inventa responsables ni fechas. No ejecuta ni envía mensajes.</dd></div><div><dt>RETENCIÓN</dt><dd>ZERO_CONTENT · contenido no persistido por Runtu.</dd></div></dl></article>
        <aside className="architecture-proof">
          <div><Fingerprint size={20} /><span>CHECKSUM SHA-256</span><code>{agent.checksum_sha256}</code></div>
          <div><LockKeyhole size={20} /><span>INMUTABILIDAD</span><strong>{agent.immutable ? 'VERSIÓN CONGELADA' : 'EDITABLE'}</strong><small>Un cambio exige una versión nueva y otro checksum.</small></div>
          <div><Check size={20} /><span>EVIDENCIA</span><strong>{agent.passed}/{agent.cases} · {passPercent}%</strong><small>{agent.source_type.toUpperCase()} identificado · {agent.model} · p95 {agent.latency_p95_ms} ms</small></div>
        </aside>
      </section>
      <section className="architecture-actions"><div><PackageCheck size={23} /><p><strong>PAQUETE PORTABLE VERIFICADO</strong><span>Manifiesto, instrucciones, esquema y evidencia. Inventario incluido y escaneo de secretos antes de salir.</span></p></div><button onClick={downloadPackage} disabled={downloading}><Download size={16} /> {downloading ? 'VERIFICANDO…' : 'DESCARGAR .RUNTU.JSON'}</button>{error ? <p className="architecture-error">{error}</p> : null}</section>
      <footer><a href="/lab/minuta-comite/escala">CONTINUAR A LA ESCALA →</a><span>La versión 0.2.0 no se edita. La siguiente mejora será otra versión.</span></footer>
    </main>
  );
}

