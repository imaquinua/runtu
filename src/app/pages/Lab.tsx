import { FormEvent, useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, Check, Clock3, FlaskConical, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { PixelEgg, RuntuMark } from "./Incubadora";
import "../../styles/lab.css";

type Decision = { decision: string; owner: string; due_date: string };
type Pending = { missing: string; owner: string | null; due_date: string | null };
type Noise = { topic: string; reason: string };
type Minuta = {
  agent_id: string;
  agent_version: string;
  meeting: { date: string | null; attendees: string[] };
  decided: Decision[];
  pending_data: Pending[];
  discarded_noise: Noise[];
  weekly_grain: { status: "decided" | "pending"; statement: string };
  warnings: string[];
};
type Run = {
  output: Minuta;
  telemetry: {
    model: string;
    latency_ms: number;
    usage?: { input_tokens?: number; output_tokens?: number };
  };
};

const example = `COMITÉ 20/07/2026. Asistentes: Julia, Omar y Nina.
Julia publica la nueva política de devoluciones el 23/07/2026.
Omar capacita a soporte el 25/07/2026.
Nina validará el impacto en reclamos el 05/08/2026.
La fiesta de aniversario se verá en otra reunión.`;

const notesStorageKey = "runtu:lab:minuta-comite:notes:v1";

function initialNotes() {
  try {
    return window.localStorage.getItem(notesStorageKey)?.slice(0, 30_000) || example;
  } catch {
    return example;
  }
}

function EmptyState() {
  return (
    <div className="lab-empty">
      <div className="lab-empty-egg"><PixelEgg unit={7} stage={1} /></div>
      <p>La minuta aparecerá aquí después de incubar las notas.</p>
      <small>Una ejecución · cero herramientas · revisión humana obligatoria</small>
    </div>
  );
}
export function Lab({ surface = "lab" }: { surface?: "lab" | "installed" }) {
  const [notes, setNotes] = useState(initialNotes);
  const [run, setRun] = useState<Run | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [reviewed, setReviewed] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        window.localStorage.setItem(notesStorageKey, notes);
      } catch {
        // El input sigue funcionando aunque el navegador bloquee almacenamiento.
      }
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [notes]);

  async function incubate(event: FormEvent) {
    event.preventDefault();
    if (!notes.trim() || loading) return;
    setLoading(true);
    setError("");
    setReviewed(false);
    try {
      const response = await fetch("/api/minuta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, model: "gpt-5.6-luna" }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(response.status === 401 ? "Este laboratorio requiere acceso privado." : "No pudimos incubar esta minuta.");
      }
      setRun(body);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="lab-page">
      <header className="lab-nav">
        <a className="lab-brand" href="/" aria-label="Volver a Runtu"><RuntuMark /><span>runtu</span></a>
        <div className="lab-nav-status"><i /> {surface === "installed" ? "WEB APP PRIVADA" : "LAB PRIVADO"} · V0.2.0</div>
        <a className="lab-back" href={surface === "installed" ? "/lab/minuta-comite/afuera" : "/lab"}><ArrowLeft size={15} /> {surface === "installed" ? "Afuera" : "El Nido"}</a>
      </header>

      <section className="lab-heading">
        <div>
          <p className="lab-eyebrow">HUEVO 0 · MINUTA DE COMITÉ</p>
          <h1>Las notas entran crudas.<br /><em>La decisión sale a la vista.</em></h1>
        </div>
        <div className="lab-heading-meta">
          <span><ShieldCheck size={15} /> Sin acciones autónomas</span>
          <span><FlaskConical size={15} /> 20/20 evaluaciones</span>
          <span><Clock3 size={15} /> p95 3.3 segundos</span>
        </div>
      </section>

      <section className="lab-workspace">
        <form className="lab-input" onSubmit={incubate}>
          <div className="lab-panel-head">
            <div><span>01</span><strong>Notas de reunión</strong></div>
            <button type="button" onClick={() => setNotes(example)}>Cargar ejemplo</button>
          </div>
          <label htmlFor="meeting-notes">Pega notas o una transcripción</label>
          <textarea
            id="meeting-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value.slice(0, 30_000))}
            placeholder="Ejemplo: Ana enviará la encuesta el 24/07/2026…"
          />
          <div className="lab-input-meta"><span>{notes.length.toLocaleString("es-PE")} / 30.000</span><span>Los datos no se guardan</span></div>
          {error ? <div className="lab-error"><AlertTriangle size={16} /> {error}</div> : null}
          <div className="lab-actions">
            <button className="lab-reset" type="button" onClick={() => { setNotes(""); setRun(null); }}><RotateCcw size={15} /> Limpiar</button>
            <button className="lab-incubate" type="submit" disabled={!notes.trim() || loading}>
              {loading ? "Incubando…" : "Incubar minuta"} <Sparkles size={16} />
            </button>
          </div>
        </form>

        <section className="lab-output" aria-live="polite">
          <div className="lab-panel-head">
            <div><span>02</span><strong>Minuta estructurada</strong></div>
            <small>{run ? `${run.telemetry.model} · ${run.telemetry.latency_ms} ms` : "ESPERANDO"}</small>
          </div>
          {!run ? <EmptyState /> : (
            <div className="lab-result">
              <article className={`lab-grain ${run.output.weekly_grain.status}`}>
                <small>GRANO DE LA SEMANA</small>
                <strong>{run.output.weekly_grain.statement}</strong>
              </article>

              <div className="lab-result-section">
                <h2><span>{run.output.decided.length}</span> Decidido</h2>
                {run.output.decided.length ? run.output.decided.map((item, index) => (
                  <article className="lab-decision" key={`${item.decision}-${index}`}>
                    <Check size={16} />
                    <div><strong>{item.decision}</strong><p>{item.owner} · {item.due_date}</p></div>
                  </article>
                )) : <p className="lab-none">No hay decisiones completas.</p>}
              </div>

              <div className="lab-result-section">
                <h2><span>{run.output.pending_data.length}</span> Pendiente de dato</h2>
                {run.output.pending_data.map((item, index) => (
                  <article className="lab-pending" key={`${item.missing}-${index}`}>
                    <strong>{item.missing}</strong>
                    <p>{[item.owner, item.due_date].filter(Boolean).join(" · ") || "Sin responsable o fecha completa"}</p>
                  </article>
                ))}
              </div>

              {run.output.discarded_noise.length ? (
                <details className="lab-details">
                  <summary>Ruido descartado · {run.output.discarded_noise.length}</summary>
                  {run.output.discarded_noise.map((item, index) => <p key={`${item.topic}-${index}`}><strong>{item.topic}:</strong> {item.reason}</p>)}
                </details>
              ) : null}

              {run.output.warnings.length ? (
                <div className="lab-warnings"><AlertTriangle size={17} /><div>{run.output.warnings.map((warning) => <p key={warning}>{warning}</p>)}</div></div>
              ) : null}

              <button className={`lab-review ${reviewed ? "reviewed" : ""}`} type="button" onClick={() => setReviewed(true)} disabled={reviewed}>
                <Check size={16} /> {reviewed ? "Revisión humana registrada" : "Marcar como revisada"}
              </button>
            </div>
          )}
        </section>
      </section>

      <footer className="lab-footer"><span>{surface === "installed" ? "AGENTE INSTALADO" : "RUNTU LAB · CANDIDATO TÉCNICO"}</span><span>Una iniciativa de Imaquinua</span></footer>
    </main>
  );
}
