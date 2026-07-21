import { lazy, Suspense, type ReactNode } from "react";
import { ArrowRight, Check, Download, FlaskConical, Gauge, LockKeyhole, MonitorDown, Pause, ShieldCheck } from "lucide-react";
import { PixelEgg, RuntuMark } from "./Incubadora";
import "../../styles/lab-shell.css";

const AgentWorkspace = lazy(() => import("./Lab").then(({ Lab }) => ({ default: Lab })));

type StageKey = "radiografia" | "arquitectura" | "escala" | "revision" | "instalar";

const agentId = "minuta-comite";
const stages: Array<{ id: StageKey; label: string; href: string }> = [
  { id: "radiografia", label: "Radiografía", href: `/lab/${agentId}/radiografia` },
  { id: "arquitectura", label: "Arquitectura", href: `/lab/${agentId}/arquitectura` },
  { id: "escala", label: "Escala", href: `/lab/${agentId}/escala` },
  { id: "revision", label: "Revisión", href: `/lab/${agentId}/revision` },
  { id: "instalar", label: "Instalar", href: `/lab/${agentId}/instalar` },
];

const stageContent: Record<Exclude<StageKey, "escala"> | "eclosion" | "afuera", {
  eyebrow: string;
  title: string;
  description: string;
  facts: Array<{ label: string; value: string }>;
  action: string;
  next?: string;
}> = {
  radiografia: {
    eyebrow: "PASO 1 DE 5 · RADIOGRAFÍA",
    title: "Dile para quién trabaja y dónde termina su criterio.",
    description: "Nombre, usuario, resultado y límites formarán el contrato inicial de este huevo. La lógica de guardado autenticado se conecta en el Día 5.",
    facts: [
      { label: "MOLDE", value: "Minuta de Comité" },
      { label: "RIESGO", value: "Bajo" },
      { label: "HERRAMIENTAS", value: "Ninguna" },
    ],
    action: "Completar Radiografía",
    next: `/lab/${agentId}/arquitectura`,
  },
  arquitectura: {
    eyebrow: "PASO 2 DE 5 · ARQUITECTURA",
    title: "No entrenas un modelo. Defines un criterio verificable.",
    description: "Esta pantalla hará visibles Entrada, Criterio, Salida y Límites antes de congelar una versión. El manifiesto técnico será inspeccionable, no dominante.",
    facts: [
      { label: "ENTRADA", value: "Notas · máx. 30.000 caracteres" },
      { label: "SALIDA", value: "Minuta estructurada" },
      { label: "RETENCIÓN", value: "ZERO_CONTENT" },
    ],
    action: "Construir versión",
    next: `/lab/${agentId}/escala`,
  },
  revision: {
    eyebrow: "PASO 4 DE 5 · REVISIÓN",
    title: "Superó la escala. Falta tu revisión.",
    description: "El acta mostrará versión, checksum, evidencia, límites y resultado personal. Ningún agente eclosiona sin una confirmación humana atribuible.",
    facts: [
      { label: "VERSIÓN", value: "0.2.0" },
      { label: "SUITE BASE", value: "20/20 · replay identificado" },
      { label: "REVISOR", value: "Pendiente" },
    ],
    action: "Revisar acta",
    next: `/lab/${agentId}/eclosion`,
  },
  eclosion: {
    eyebrow: "ECLOSIÓN · COMPUERTA HUMANA",
    title: "Todo nacimiento necesita un testigo.",
    description: "La eclosión será una transición real y atómica. Esta base visual no cambia todavía el estado del sistema ni simula una aprobación.",
    facts: [
      { label: "ESTADO", value: "Candidato técnico" },
      { label: "CHECKSUM", value: "Se fija en el Día 4" },
      { label: "DESTINO", value: "Aún sin elegir" },
    ],
    action: "Eclosionar versión",
    next: `/lab/${agentId}/instalar`,
  },
  instalar: {
    eyebrow: "PASO 5 DE 5 · INSTALAR",
    title: "Elige dónde va a vivir.",
    description: "Web App, instalación en dispositivo, Vercel propio y canales futuros vivirán aquí. Solo la Web privada y la descarga portable estarán activas en el Fast Track.",
    facts: [
      { label: "WEB APP", value: "Incluida" },
      { label: "PWA", value: "Base preparada" },
      { label: "PAQUETE", value: "Completo y sin secretos" },
    ],
    action: "Preparar instalación",
    next: `/lab/${agentId}/afuera`,
  },
  afuera: {
    eyebrow: "AFUERA · AGENTE INSTALADO",
    title: "La cáscara sigue en el Lab como respaldo vivo.",
    description: "Estado, versión, uso, pausa, rollback y descarga convergerán en esta vista. Hoy muestra el contrato visual sin inventar telemetría.",
    facts: [
      { label: "ESTADO", value: "Todavía no instalado" },
      { label: "VERSIÓN", value: "0.2.0 candidata" },
      { label: "RUNS", value: "Sin deployment" },
    ],
    action: "Abrir agente",
    next: "/a/minuta-comite",
  },
};

function LabFrame({ active, children }: { active?: StageKey; children: ReactNode }) {
  return (
    <main className="shell-page">
      <header className="shell-header">
        <a className="shell-brand" href="/" aria-label="Runtu, volver al inicio"><RuntuMark inverse /><span>runtu</span></a>
        <span className="shell-lab-label">LAB-01 · INCUBADORA</span>
        <div className="shell-save"><i /> PREVIEW · DÍA 2</div>
      </header>
      <nav className="shell-stages" aria-label="Etapas de incubación">
        {stages.map((stage, index) => (
          <a className={stage.id === active ? "active" : ""} href={stage.href} key={stage.id} aria-current={stage.id === active ? "step" : undefined}>
            <span>{String(index + 1).padStart(2, "0")}</span>{stage.label}
          </a>
        ))}
      </nav>
      {children}
      <footer className="shell-footer"><span>RUNTU LAB · FAST TRACK</span><span>Primero se prueba. Después se despliega.</span></footer>
    </main>
  );
}

function Nido() {
  return (
    <LabFrame>
      <section className="shell-nido">
        <header><p>EL NIDO · 1 AGENTE</p><h1>Tus agentes empiezan aquí.</h1><span>Solo mostramos estados respaldados por evidencia real.</span></header>
        <div className="shell-agent-grid">
          <a className="shell-agent-card" href={`/lab/${agentId}/escala`}>
            <div className="shell-agent-state"><span>SLOT-01</span><strong>CANDIDATO</strong></div>
            <div className="shell-egg"><PixelEgg unit={7} stage={2} ready /></div>
            <h2>Minuta de Comité</h2>
            <p>Ordena notas crudas en decisiones, pendientes, ruido y un grano semanal.</p>
            <div className="shell-agent-meta"><span>v0.2.0</span><span>20/20 BASE</span><ArrowRight size={16} /></div>
          </a>
          <a className="shell-new-card" href="/lab/nuevo"><span>+</span><strong>INCUBAR NUEVA IDEA</strong><small>Empieza con un molde probado.</small></a>
        </div>
      </section>
    </LabFrame>
  );
}

function NewEgg() {
  return (
    <LabFrame>
      <section className="shell-new">
        <header><p>NUEVO HUEVO</p><h1>Elige qué quieres incubar.</h1><span>En el Fast Track solo Minuta de Comité está disponible.</span></header>
        <article className="shell-template">
          <div className="shell-template-egg"><PixelEgg unit={6} stage={1} /></div>
          <div><span>HUEVO 0 · RIESGO BAJO</span><h2>Minuta de Comité</h2><p>Convierte notas crudas en decisiones completas, pendientes y un único grano semanal.</p></div>
          <dl><div><dt>PRUEBAS BASE</dt><dd>20/20</dd></div><div><dt>HERRAMIENTAS</dt><dd>0</dd></div><div><dt>CONFIGURACIÓN</dt><dd>≈ 5 MIN</dd></div></dl>
          <a href={`/lab/${agentId}/radiografia`}>ELEGIR ESTE HUEVO <ArrowRight size={15} /></a>
        </article>
        <div className="shell-coming"><span>Pre-diagnóstico E³ · PRÓXIMAMENTE</span><span>Lector de indicadores · PRÓXIMAMENTE</span><span>Desde cero · PRÓXIMAMENTE</span></div>
      </section>
    </LabFrame>
  );
}

function StageShell({ stage }: { stage: Exclude<StageKey, "escala"> | "eclosion" | "afuera" }) {
  const content = stageContent[stage];
  const active = stage === "eclosion" ? "revision" : stage === "afuera" ? "instalar" : stage;
  const icons = { radiografia: ShieldCheck, arquitectura: LockKeyhole, revision: Check, eclosion: FlaskConical, instalar: MonitorDown, afuera: Gauge };
  const Icon = icons[stage];
  return (
    <LabFrame active={active}>
      <section className="shell-stage-view">
        <div className="shell-stage-copy"><p>{content.eyebrow}</p><h1>{content.title}</h1><span>{content.description}</span><div className="shell-stage-note"><Icon size={18} /><div><strong>BASE VISUAL LISTA</strong><small>La acción permanece informativa hasta conectar estado, permisos y auditoría.</small></div></div></div>
        <aside className="shell-stage-panel">
          <div className="shell-panel-head"><span>HUEVO 0</span><strong>{stage === "afuera" ? "AFUERA" : "EN INCUBACIÓN"}</strong></div>
          <div className="shell-panel-egg"><PixelEgg unit={6} stage={2} ready={stage !== "radiografia"} hatched={stage === "afuera"} /></div>
          <dl>{content.facts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>
          {content.next ? <a className="shell-stage-action" href={content.next} aria-label={`${content.action}. Vista previa de navegación`}>{content.action} <ArrowRight size={15} /></a> : null}
          <small className="shell-action-disclaimer">Navegación de Preview · no cambia estado todavía</small>
        </aside>
      </section>
    </LabFrame>
  );
}

function WorkspaceLoading() {
  return <div className="shell-workspace-loading" role="status">CARGANDO EL AGENTE…</div>;
}

export default function LabRouter({ path }: { path: string }) {
  if (path.startsWith("/a/")) return <Suspense fallback={<WorkspaceLoading />}><AgentWorkspace surface="installed" /></Suspense>;
  if (path === "/lab" || path === "/lab/") return <Nido />;
  if (path === "/lab/nuevo") return <NewEgg />;
  if (path.endsWith("/escala")) return <Suspense fallback={<WorkspaceLoading />}><AgentWorkspace /></Suspense>;
  if (path.endsWith("/radiografia")) return <StageShell stage="radiografia" />;
  if (path.endsWith("/arquitectura")) return <StageShell stage="arquitectura" />;
  if (path.endsWith("/revision")) return <StageShell stage="revision" />;
  if (path.endsWith("/eclosion")) return <StageShell stage="eclosion" />;
  if (path.endsWith("/instalar")) return <StageShell stage="instalar" />;
  if (path.endsWith("/afuera")) return <StageShell stage="afuera" />;
  return <Nido />;
}
