import { useEffect } from "react";
import {
  ArrowRight,
  Braces,
  Check,
  ChevronRight,
  Eye,
  FlaskConical,
  Gauge,
  LockKeyhole,
  Pause,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import "../../styles/incubadora.css";

const stages = [
  {
    number: "01",
    title: "Radiografía",
    description: "Define el proceso, sus usuarios, datos, riesgos y el resultado que importa.",
  },
  {
    number: "02",
    title: "Arquitectura",
    description: "Ordena conocimiento, instrucciones, herramientas, permisos y excepciones.",
  },
  {
    number: "03",
    title: "Escala",
    description: "Prueba casos reales, costos, latencia y controles antes de soltarlo.",
  },
  {
    number: "04",
    title: "Siembra",
    description: "Eclosiona una versión trazable, desplegable y lista para volver atrás.",
  },
];

const safeguards = [
  { icon: Eye, title: "A la vista", text: "Ves fuentes, decisiones, costo y versión de cada ejecución." },
  { icon: ShieldCheck, title: "Antes de eclosionar", text: "El agente supera evaluaciones y reglas definidas contigo." },
  { icon: LockKeyhole, title: "Permiso mínimo", text: "Cada herramienta recibe solo el alcance que necesita." },
  { icon: RotateCcw, title: "Siempre reversible", text: "Pausa, cuarentena y rollback forman parte del despliegue." },
];

function RuntuMark({ size = 28, inverse = false }: { size?: number; inverse?: boolean }) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden="true">
      <path
        d="M 118 41 C 70 44 45 80 45 115 C 45 152 70 176 100 176 C 130 176 155 152 155 115 C 155 96 150 76 142 62"
        fill="none"
        stroke={inverse ? "#FDFAF2" : "#1B1622"}
        strokeWidth="13"
        strokeLinecap="round"
      />
      <circle cx="100" cy="120" r="15" fill="#FFD21E" />
    </svg>
  );
}

function Egg({ progress = 72 }: { progress?: number }) {
  return (
    <div className="inc-egg-wrap" aria-label={`Incubación al ${progress}%`}>
      <div className="inc-egg-glow" />
      <div className="inc-egg"><RuntuMark size={150} inverse /></div>
    </div>
  );
}

export function Incubadora() {
  const pilotHref = "mailto:hola@imaquinua.com?subject=Quiero%20incubar%20un%20agente%20con%20Runtu";

  useEffect(() => {
    const previousTitle = document.title;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = description?.content;
    document.title = "Runtu — Incubadora de agentes";
    if (description) {
      description.content = "Convierte un proceso concreto en un agente probado, gobernado y desplegable.";
    }
    return () => {
      document.title = previousTitle;
      if (description && previousDescription) description.content = previousDescription;
    };
  }, []);

  return (
    <main className="inc-page">
      <nav className="inc-nav" aria-label="Navegación principal">
        <a className="inc-brand" href="#inicio" aria-label="Runtu, volver al inicio">
          <RuntuMark />
          <span>runtu</span>
        </a>
        <div className="inc-nav-links">
          <a href="#metodo">Método</a>
          <a href="#control">Control</a>
          <a href="#piloto">Piloto</a>
        </div>
        <a className="inc-button inc-button-small" href={pilotHref}>
          Solicitar piloto <ArrowRight size={15} aria-hidden="true" />
        </a>
      </nav>

      <section className="inc-hero" id="inicio">
        <div className="inc-hero-copy">
          <p className="inc-eyebrow">LAB-01 · INCUBADORA DE AGENTES</p>
          <h1>Tu proceso entra<br />como idea. Sale<br /><em>listo para operar.</em></h1>
          <p className="inc-lede">
            Runtu convierte un proceso concreto en un agente probado, gobernado y desplegable.
            Con tus datos, tu criterio y límites que puedes ver.
          </p>
          <div className="inc-actions">
            <a className="inc-button" href={pilotHref}>
              Poner mi primer huevo <ArrowRight size={17} aria-hidden="true" />
            </a>
            <a className="inc-text-link" href="#metodo">Ver cómo se incuba <ChevronRight size={16} /></a>
          </div>
          <p className="inc-proof"><ShieldCheck size={15} /> Primero se prueba. Después se despliega.</p>
        </div>

        <div className="inc-console" aria-label="Vista previa del laboratorio">
          <div className="inc-console-head">
            <span>RUNTU LAB / NIDO-01</span>
            <span className="inc-live"><i /> SISTEMA ESTABLE</span>
          </div>
          <div className="inc-console-body">
            <div className="inc-slot-label">AGENTE / YANAPAQ</div>
            <Egg progress={72} />
            <div className="inc-progress-row">
              <span>ESCALA</span>
              <strong>72%</strong>
            </div>
            <div className="inc-progress"><span /></div>
            <div className="inc-console-stats">
              <div><small>PRUEBAS</small><strong>46 / 52</strong></div>
              <div><small>RIESGO</small><strong>BAJO</strong></div>
              <div><small>COSTO</small><strong>$0.08</strong></div>
            </div>
          </div>
          <div className="inc-log"><span>12:04</span> APROBACIÓN HUMANA PENDIENTE</div>
        </div>
      </section>

      <div className="inc-ticker" aria-hidden="true">
        <span>IDEA → CRITERIO → PRUEBAS → AGENTE → DESPLIEGUE · SIN CAJAS NEGRAS · CON SALIDA DE EMERGENCIA · </span>
      </div>

      <section className="inc-section inc-method" id="metodo">
        <header className="inc-section-head">
          <p className="inc-eyebrow dark">01 / EL MÉTODO</p>
          <h2>La eclosión no es un efecto.<br /><em>Es una compuerta.</em></h2>
          <p>Una versión solo nace cuando demuestra que puede operar dentro de los límites acordados.</p>
        </header>
        <div className="inc-stage-grid">
          {stages.map((stage, index) => (
            <article className={`inc-stage ${index === 3 ? "active" : ""}`} key={stage.number}>
              <span>{stage.number}</span>
              <h3>{stage.title}</h3>
              <p>{stage.description}</p>
              <div className="inc-stage-state">{index === 3 ? "LISTO PARA PILOTO" : "COMPLETAR Y VALIDAR"}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="inc-section inc-control" id="control">
        <div className="inc-control-copy">
          <p className="inc-eyebrow">02 / CONTROL</p>
          <h2>Autonomía con<br /><em>bordes visibles.</em></h2>
          <p>
            Runtu no promete magia ni autonomía sin dueño. Cada agente nace con versión, permisos,
            presupuesto, evidencias y una forma inmediata de detenerlo.
          </p>
          <ul>
            <li><Check size={16} /> Tus datos y configuración son exportables.</li>
            <li><Check size={16} /> Las acciones sensibles piden aprobación.</li>
            <li><Check size={16} /> Cada cambio genera una versión evaluada.</li>
          </ul>
        </div>
        <div className="inc-safeguards">
          {safeguards.map(({ icon: Icon, title, text }) => (
            <article key={title}>
              <Icon size={23} aria-hidden="true" />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="inc-section inc-deploy">
        <div className="inc-section-head compact">
          <p className="inc-eyebrow dark">03 / DESPLIEGUE</p>
          <h2>Del nido al lugar<br /><em>donde ocurre el trabajo.</em></h2>
        </div>
        <div className="inc-deploy-flow" aria-label="Flujo de despliegue">
          <div><FlaskConical /><small>INCUBA</small><strong>Runtu Lab</strong></div>
          <ArrowRight className="inc-flow-arrow" />
          <div><Gauge /><small>PRUEBA</small><strong>Canary 10%</strong></div>
          <ArrowRight className="inc-flow-arrow" />
          <div><Braces /><small>OPERA</small><strong>Web · Slack · API</strong></div>
          <ArrowRight className="inc-flow-arrow" />
          <div><Pause /><small>CONTROLA</small><strong>Pausa · Rollback</strong></div>
        </div>
      </section>

      <section className="inc-pilot" id="piloto">
        <div>
          <p className="inc-eyebrow dark">PILOTO FUNDADOR · CUPOS LIMITADOS</p>
          <h2>Empieza con un proceso.<br />Mide antes de escalar.</h2>
          <p>Buscamos equipos con un flujo repetitivo, un dueño claro y datos disponibles. Construimos un agente acotado, lo probamos contra un baseline y decidimos con evidencia.</p>
        </div>
        <div className="inc-pilot-card">
          <Sparkles size={28} />
          <h3>Tu primer huevo</h3>
          <ul>
            <li>Radiografía del proceso</li>
            <li>Un agente y una fuente</li>
            <li>Evaluaciones y despliegue web</li>
            <li>30 días de medición</li>
          </ul>
          <a className="inc-button wide" href={pilotHref}>
            Solicitar evaluación <ArrowRight size={17} />
          </a>
          <small>La solicitud no activa una suscripción.</small>
        </div>
      </section>

      <footer className="inc-footer">
        <a className="inc-brand" href="#inicio">
          <RuntuMark />
          <span>runtu</span>
        </a>
        <p>Agentes que nacen con criterio.</p>
        <span>© 2026 Runtu.tech · Una iniciativa de Imaquinua</span>
      </footer>
    </main>
  );
}
