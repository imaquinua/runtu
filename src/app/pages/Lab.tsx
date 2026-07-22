import { FormEvent, useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, Check, Clock3, FlaskConical, FolderKanban, ListTodo, Mic, RotateCcw, ShieldCheck, Sparkles, Square, ThumbsDown, ThumbsUp, UserRound } from "lucide-react";
import { PixelEgg, RuntuMark } from "./Incubadora";
import { useControlPlane } from "../auth/ControlPlane";
import "../../styles/lab.css";

type Decision = { decision: string; owner: string; due_date: string };
type Pending = { missing: string; owner: string | null; due_date: string | null };
type Noise = { topic: string; reason: string };
type Project = { name: string; objective: string; owner: string | null; source: "explicit" | "inferred" };
type Task = {
  title: string; project: string | null; owner: string | null; due_date: string | null;
  status: "ready" | "needs_owner" | "needs_due_date" | "needs_owner_and_due_date";
};
type Minuta = {
  agent_id: string;
  agent_version: string;
  meeting: { date: string | null; attendees: string[] };
  decided: Decision[];
  pending_data: Pending[];
  discarded_noise: Noise[];
  weekly_grain: { status: "decided" | "pending"; statement: string };
  warnings: string[];
  projects?: Project[];
  tasks?: Task[];
};
type Run = {
  output: Minuta;
  telemetry: {
    model: string;
    latency_ms: number;
    usage?: { input_tokens?: number; output_tokens?: number };
    run_id: string | null;
    source_type: "real";
    agent_version: string;
    checksum: string | null;
    deployment_id: string | null;
    remaining_quota: number | null;
    store: false;
    evaluation: RuntimeContext["evaluation"];
  };
};

export type RuntimeContext = {
  deploymentId: string;
  versionId: string;
  version: string;
  checksum: string;
  model: string;
  state: "ACTIVE" | "PAUSED";
  retention: string;
  evaluation: null | {
    reportId: string; sourceType: "real" | "replay"; cases: number; passed: number;
    version: string; checksum: string; criticalCases: string[];
  };
};

const example = `COMITÉ 20/07/2026. Asistentes: Julia, Omar y Nina.
Proyecto Experiencia sin fricción: Julia lidera el proyecto para reducir reclamos.
Julia publica la nueva política de devoluciones el 23/07/2026.
Omar capacita a soporte el 25/07/2026.
Nina validará el impacto en reclamos el 05/08/2026.
La fiesta de aniversario se verá en otra reunión.`;

type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEvent = { results: ArrayLike<RecognitionResult> };
type RecognitionError = { error: string };
type Recognition = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionError) => void) | null;
  onend: (() => void) | null;
  start(): void; stop(): void; abort(): void;
};
type RecognitionConstructor = new () => Recognition;

function recognitionConstructor() {
  const speechWindow = window as typeof window & {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition || null;
}

const TASK_STATUS: Record<Task["status"], string> = {
  ready: "Lista para revisar",
  needs_owner: "Falta responsable",
  needs_due_date: "Falta fecha",
  needs_owner_and_due_date: "Faltan responsable y fecha",
};

function EmptyState() {
  return (
    <div className="lab-empty">
      <div className="lab-empty-egg"><PixelEgg unit={7} stage={1} /></div>
      <p>La minuta aparecerá aquí después de incubar las notas.</p>
      <small>Una ejecución · cero herramientas · revisión humana obligatoria</small>
    </div>
  );
}
export function Lab({ surface = "lab", initialContext = null }: { surface?: "lab" | "installed"; initialContext?: RuntimeContext | null }) {
  const { getToken, organization } = useControlPlane();
  const [notes, setNotes] = useState(example);
  const [context, setContext] = useState<RuntimeContext | null>(initialContext);
  const [run, setRun] = useState<Run | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [anonymized, setAnonymized] = useState(false);
  const [feedback, setFeedback] = useState<"CORRECT" | "INCORRECT" | null>(null);
  const [feedbackBusy, setFeedbackBusy] = useState(false);
  const [dictationState, setDictationState] = useState<"idle" | "listening">("idle");
  const recognitionRef = useRef<Recognition | null>(null);
  const dictationSupported = Boolean(recognitionConstructor());
  const usingExample = notes.trim() === example.trim();

  useEffect(() => () => recognitionRef.current?.abort(), []);

  useEffect(() => {
    if (initialContext) return;
    let active = true;
    async function loadContext() {
      try {
        const token = await getToken();
        const query = new URLSearchParams({ organizationId: organization.id });
        const response = await fetch(`/api/minuta?${query}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error('No hay una versión activa para ejecutar.');
        const body = await response.json();
        if (active) setContext(body.context);
      } catch (cause) { if (active) setError(cause instanceof Error ? cause.message : 'No pudimos abrir la Escala.'); }
    }
    loadContext();
    return () => { active = false; };
  }, [getToken, initialContext, organization.id]);

  async function incubate(event: FormEvent) {
    event.preventDefault();
    if (!notes.trim() || loading || !context || (!usingExample && !anonymized)) return;
    setLoading(true);
    setError("");
    setFeedback(null);
    try {
      const token = await getToken();
      const response = await fetch("/api/minuta", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          notes, organizationId: organization.id, versionId: context.versionId,
          inputSource: usingExample ? 'example' : 'personal_anonymized',
          anonymized: usingExample ? false : anonymized,
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(response.status === 401 ? "Este laboratorio requiere acceso privado." : response.status === 429 ? "Tu organización alcanzó la cuota de ejecuciones." : response.status === 423 ? "Este deployment está pausado." : response.status === 409 ? "La versión ya no está activa." : "No pudimos incubar esta minuta.");
      }
      setRun(body);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  async function sendFeedback(rating: "CORRECT" | "INCORRECT") {
    if (!run?.telemetry.run_id || feedbackBusy) return;
    setFeedbackBusy(true);
    setError('');
    try {
      const token = await getToken();
      const response = await fetch('/api/run-feedback', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ organizationId: organization.id, runId: run.telemetry.run_id, rating }),
      });
      if (!response.ok) throw new Error('No pudimos registrar tu evaluación.');
      setFeedback(rating);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No pudimos registrar tu evaluación.'); }
    finally { setFeedbackBusy(false); }
  }

  function toggleDictation() {
    if (dictationState === "listening") {
      recognitionRef.current?.stop();
      return;
    }
    const RecognitionApi = recognitionConstructor();
    if (!RecognitionApi) {
      setError("El dictado no está disponible en este navegador. Puedes pegar una transcripción.");
      return;
    }
    const recognition = new RecognitionApi();
    const base = notes.trimEnd();
    recognition.lang = "es-PE";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) finalText += `${result[0].transcript.trim()} `;
        else interimText += result[0].transcript;
      }
      const spoken = `${finalText}${interimText}`.trim();
      setNotes(`${base}${base && spoken ? "\n" : ""}${spoken}`.slice(0, 30_000));
      setAnonymized(false);
    };
    recognition.onerror = (event) => {
      const permissionDenied = event.error === "not-allowed" || event.error === "service-not-allowed";
      setError(permissionDenied ? "Necesitamos permiso de micrófono para dictar. También puedes pegar una transcripción." : "El dictado se interrumpió. Tu texto permanece en la caja.");
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setDictationState("idle");
    };
    recognitionRef.current = recognition;
    setError("");
    setDictationState("listening");
    recognition.start();
  }

  return (
    <main className="lab-page">
      <header className="lab-nav">
        <a className="lab-brand" href="/" aria-label="Volver a Runtu"><RuntuMark /><span>runtu</span></a>
        <div className="lab-nav-status"><i /> {organization.name} · {surface === "installed" ? "WEB APP PRIVADA" : "LAB PRIVADO"} · V{context?.version || '—'}</div>
        <a className="lab-back" href={surface === "installed" ? "/lab/minuta-comite/afuera" : "/lab"}><ArrowLeft size={15} /> {surface === "installed" ? "Afuera" : "El Nido"}</a>
      </header>

      <section className="lab-heading">
        <div>
          <p className="lab-eyebrow">HUEVO 0 · MINUTA DE COMITÉ</p>
          <h1>Las notas entran crudas.<br /><em>La decisión sale a la vista.</em></h1>
        </div>
        <div className="lab-heading-meta">
          <span><ShieldCheck size={15} /> Sin acciones autónomas</span>
          <span><FlaskConical size={15} /> {context?.evaluation ? `${context.evaluation.passed}/${context.evaluation.cases} · ${context.evaluation.sourceType}` : 'Suite de esta versión pendiente'}</span>
          <span><Clock3 size={15} /> {context?.model || 'Cargando modelo…'}</span>
        </div>
      </section>

      <section className="lab-workspace">
        <form className="lab-input" onSubmit={incubate}>
          <div className="lab-panel-head">
            <div><span>01</span><strong>Notas de reunión</strong></div>
            <button type="button" onClick={() => { setNotes(example); setAnonymized(false); }}>Cargar ejemplo</button>
          </div>
          <div className="lab-input-label"><label htmlFor="meeting-notes">Pega notas, una transcripción o dicta</label><button className={dictationState === "listening" ? "listening" : ""} type="button" onClick={toggleDictation} disabled={!dictationSupported} aria-pressed={dictationState === "listening"}>{dictationState === "listening" ? <><Square size={13} /> Detener dictado</> : <><Mic size={15} /> Dictar</>}</button></div>
          <textarea
            id="meeting-notes"
            value={notes}
            onChange={(event) => { setNotes(event.target.value.slice(0, 30_000)); setAnonymized(false); }}
            placeholder="Ejemplo: Ana enviará la encuesta el 24/07/2026…"
          />
          <p className="lab-dictation-note" role="status">{dictationState === "listening" ? "ESCUCHANDO · habla con naturalidad; podrás editar antes de enviar." : dictationSupported ? "El navegador convierte la voz en texto. Runtu sólo procesa la transcripción cuando presionas Incubar." : "Dictado no disponible aquí; pega una transcripción para continuar."}</p>
          <div className="lab-input-meta"><span>{notes.length.toLocaleString("es-PE")} / 30.000</span><span>Contenido no persistido · store:false</span></div>
          {!usingExample ? <label className="lab-anonymized"><input type="checkbox" checked={anonymized} onChange={(event) => setAnonymized(event.target.checked)} /><span>Confirmo que retiré datos personales y secretos antes de ejecutar.</span></label> : null}
          {error ? <div className="lab-error"><AlertTriangle size={16} /> {error}</div> : null}
          <div className="lab-actions">
            <button className="lab-reset" type="button" onClick={() => { setNotes(""); setRun(null); setAnonymized(false); }}><RotateCcw size={15} /> Limpiar</button>
            <button className="lab-incubate" type="submit" disabled={!notes.trim() || loading || !context || (!usingExample && !anonymized)}>
              {loading ? "Incubando…" : "Incubar minuta"} <Sparkles size={16} />
            </button>
          </div>
        </form>

        <section className="lab-output" aria-live="polite">
          <div className="lab-panel-head">
            <div><span>02</span><strong>Minuta estructurada</strong></div>
            <small>{run ? `V${run.telemetry.agent_version} · ${run.telemetry.latency_ms} MS` : "ESPERANDO"}</small>
          </div>
          {!run ? <EmptyState /> : (
            <div className="lab-result">
              <article className={`lab-grain ${run.output.weekly_grain.status}`}>
                <small>GRANO DE LA SEMANA</small>
                <strong>{run.output.weekly_grain.statement}</strong>
              </article>

              {run.output.projects || run.output.tasks ? <div className="lab-operations">
                <div className="lab-result-section">
                  <h2><span>{run.output.projects?.length || 0}</span> Proyectos</h2>
                  {run.output.projects?.length ? run.output.projects.map((project, index) => (
                    <article className="lab-project" key={`${project.name}-${index}`}>
                      <FolderKanban size={17} />
                      <div><strong>{project.name}</strong><p>{project.objective}</p><small><UserRound size={12} /> {project.owner || "Responsable por definir"} · {project.source === "explicit" ? "Nombrado en la reunión" : "Agrupación propuesta por IA"}</small></div>
                    </article>
                  )) : <p className="lab-none">No se identificó un proyecto válido.</p>}
                </div>
                <div className="lab-result-section">
                  <h2><span>{run.output.tasks?.length || 0}</span> Tareas</h2>
                  {run.output.tasks?.length ? run.output.tasks.map((task, index) => (
                    <article className={`lab-task ${task.status}`} key={`${task.title}-${index}`}>
                      <ListTodo size={16} />
                      <div><strong>{task.title}</strong><p>{task.project || "Sin proyecto"} · {task.owner || "Sin responsable"} · {task.due_date || "Sin fecha"}</p><small>{TASK_STATUS[task.status]}</small></div>
                    </article>
                  )) : <p className="lab-none">No se identificaron tareas accionables.</p>}
                </div>
                <p className="lab-operation-note"><ShieldCheck size={14} /> Borrador operativo: revisa responsables y fechas antes de crear o sincronizar tareas fuera de Runtu.</p>
              </div> : null}

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
              <div className="lab-evidence"><span>EJECUCIÓN REAL · NO ES LA SUITE</span><dl><div><dt>VERSIÓN</dt><dd>{run.telemetry.agent_version}</dd></div><div><dt>CHECKSUM</dt><dd>{run.telemetry.checksum?.slice(0, 12)}…</dd></div><div><dt>MODELO</dt><dd>{run.telemetry.model}</dd></div><div><dt>LATENCIA</dt><dd>{run.telemetry.latency_ms} ms</dd></div><div><dt>CUOTA RESTANTE</dt><dd>{run.telemetry.remaining_quota ?? '—'}</dd></div><div><dt>RETENCIÓN</dt><dd>store:false</dd></div></dl></div>
              {run.telemetry.evaluation ? <details className="lab-details"><summary>SUITE EXACTA · {run.telemetry.evaluation.passed}/{run.telemetry.evaluation.cases} · {run.telemetry.evaluation.sourceType}</summary>{run.telemetry.evaluation.criticalCases.map((item) => <p key={item}>{item}</p>)}</details> : <p className="lab-suite-pending">Esta versión todavía no tiene suite oficial. La ejecución personal no hereda el 20/20 del baseline.</p>}
              <div className="lab-feedback"><span>¿El resultado es correcto?</span><div><button className={feedback === 'CORRECT' ? 'active' : ''} type="button" onClick={() => sendFeedback('CORRECT')} disabled={feedbackBusy}><ThumbsUp size={15} /> Correcto</button><button className={feedback === 'INCORRECT' ? 'active' : ''} type="button" onClick={() => sendFeedback('INCORRECT')} disabled={feedbackBusy}><ThumbsDown size={15} /> Incorrecto</button></div><small>Tu feedback queda ligado al run; no reentrena automáticamente al agente.</small></div>
            </div>
          )}
        </section>
      </section>

      <footer className="lab-footer"><span>{surface === "installed" ? "AGENTE INSTALADO" : "RUNTU LAB · CANDIDATO TÉCNICO"}</span><span>Una iniciativa de Imaquinua</span></footer>
    </main>
  );
}
