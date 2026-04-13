# RUNTU.TECH — UX BRIEF (aspiracional)
## Marketing Intelligence Platform para Latinoamérica
**Versión:** 2.0 | **Fecha:** Abril 2026 | **Stack implementado:** Vite + React 18 + Supabase + Tailwind 4

---

> ⚠️ **Nota importante sobre este documento**
>
> Este brief describe una **visión aspiracional** del producto con tema oscuro (`#020617`), acentos dorados (`#fbbf24`) y logo animado de 5 capas.
>
> La **implementación actual** sigue un enfoque **light mode** (fondo `#FAFAFA`, texto `gray-900`, acentos ámbar sutiles), más cercano al estilo Linear/Notion. La decisión fue posterior al brief, buscando mayor legibilidad en data tables densas y charts econométricos del MMM Engine.
>
> Las guidelines del sistema **real** están en [`guidelines/Guidelines.md`](./guidelines/Guidelines.md).
>
> El brief dark-mode queda como referencia para futuros módulos o una posible v2.1 con tema oscuro opcional.

---

## 1. IDENTIDAD VISUAL

### Paleta de color

| Token             | Hex       | Uso                                              |
|-------------------|-----------|--------------------------------------------------|
| `--background`    | `#020617` | Fondo principal (casi negro azulado)             |
| `--bg-secondary`  | `#0f172a` | Sidebar, cards elevadas                          |
| `--bg-tertiary`   | `#1e293b` | Inputs, hover states, chips                      |
| `--accent`        | `#fbbf24` | CTA principal, logo glow, highlights activos     |
| `--accent-dark`   | `#f59e0b` | Hover del accent                                 |
| `--accent-indigo` | `#6366f1` | Nav activo, estados secundarios, streaming       |
| `--accent-purple` | `#a855f7` | Badges premium, gradientes especiales            |
| `--border`        | `rgba(255,255,255,0.1)` | Bordes de cards y separadores       |
| `--text-muted`    | `rgba(255,255,255,0.6)` | Subtítulos, labels                  |
| `--text-subtle`   | `rgba(255,255,255,0.4)` | Placeholders, metadata              |

**Gradiente principal:** `from-[#fbbf24] via-[#f59e0b] to-[#fbbf24]` — usado en textos hero y acentos especiales.

**Gradiente de fondo global:**
- Base: `from-slate-950 via-slate-900 to-black`
- Orbe 1: `radial-gradient(circle at 20% 30%, rgba(251,191,36,0.08), transparent 50%)`
- Orbe 2: `radial-gradient(circle at 80% 70%, rgba(251,191,36,0.05), transparent 50%)`
- Noise texture: `opacity-[0.015]` SVG fractal noise encima

### Tipografía

| Uso            | Fuente         | Peso    | Tamaño          |
|----------------|----------------|---------|-----------------|
| Headings       | Montserrat     | 900     | 4xl → 7xl       |
| Subheadings    | Montserrat     | 700     | xl → 3xl        |
| Body           | Montserrat     | 400/500 | sm → lg         |
| Labels/badges  | Montserrat     | 500/600 | xs → sm         |
| Código         | monospace      | 400     | sm              |

**Tracking:** `tracking-tight` en headings grandes.
**Line-height:** `leading-[1.1]` en heroes, `leading-relaxed` en body.

---

## 2. LOGO ANIMADO — ESPECIFICACIÓN COMPLETA

### Concepto visual
El logo de Runtu es una entidad viva. Emana energía, respira, orbita. No es estático nunca.
La imagen base (`runtu_logo.png`) flota sobre capas de luz que la envuelven.

### Sistema de animaciones (5 capas)

```
CAPA 5 (foreground) ── Partícula orbita anti-horaria: 6s   · w-1.5 h-1.5 · gold/60%
CAPA 4 (foreground) ── Partícula orbita horaria:     8s   · w-2 h-2     · gold
CAPA 3 (main)       ── LOGO flotando arriba-abajo:   4s   · translateY(-10px)
CAPA 2 (background) ── Glow pulsante:                3s   · scale 1→1.1 · blur-2xl
CAPA 1 (background) ── Anillo rotatorio:             20s  · gradient gold/20%
```

### Keyframes definidos

```css
/* Reveal inicial — solo 1 vez al montar */
logo-reveal: 0% { opacity:0; scale:0.8; translateY(-20px); blur(10px) }
             100% { opacity:1; scale:1; translateY(0); blur(0) }
timing: 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)  ← bounce elegante

/* Float — continuo */
float: 0%,100% { translateY(0) }
       50%     { translateY(-10px) }
timing: 4s ease-in-out infinite

/* Spin Slow — continuo */
spin-slow: 0→360deg
timing: 20s linear infinite

/* Pulse Glow — continuo */
pulse-glow: 0%,100% { opacity:0.3; scale:1 }
            50%      { opacity:0.6; scale:1.1 }
timing: 3s ease-in-out infinite

/* Orbit — continuo */
orbit: 0→360deg
timing: 8s linear infinite

/* Orbit Reverse — continuo */
orbit-reverse: 360→0deg
timing: 6s linear infinite
```

### Variantes del componente

**HERO** (landing, splash screens)
- Tamaño: `w-40 h-40` (desktop) / `w-28 h-28` (mobile)
- Todas las capas activas
- Drop-shadow: `drop-shadow-[0_0_30px_rgba(251,191,36,0.4)]`
- Glow interno: `blur-xl opacity-60 bg-[#fbbf24]/30`

**HEADER** (navbar, sidebar)
- Tamaño: `w-10 h-10` — sin órbitas, sin anillo
- Solo: glow pulsante sutil + float
- Junto al wordmark "Runtu" en bold

**MINIMAL** (footer, favicon contexts)
- Solo imagen + drop-shadow estático
- Sin animaciones continuas

**LOADING** (splash/skeleton screens)
- Igual que HERO pero más rápido:
  - spin-slow: 10s
  - pulse-glow: 2s
  - float: 3s
  - órbitas: 5s y 4s
- Glow amplificado: `blur-2xl opacity-70 bg-[#fbbf24]/40`

### Mejora propuesta para versión "increíble"

Agregar a la variante HERO estas capas adicionales:

1. **Halo exterior:** segundo anillo más grande, opacidad 5%, rotación inversa 35s
2. **Glitch flicker ocasional:** cada 8s un micro-flash de `scale(1.02)` en 80ms, simulando pulso eléctrico
3. **Partícula extra:** tercera partícula en órbita diagonal (45°) a 11s, tamaño w-1 h-1
4. **Texto reveal coordinado:** el h1 debajo del logo hace `fade-in + translateY(12px→0)` con `delay: 0.4s` tras el logo-reveal
5. **Mix-blend-mode: lighten** ya está aplicado — mantener

---

## 3. LAYOUT GLOBAL

### Shell de la app (autenticado)

```
┌─────────────────────────────────────────────────────┐
│  HEADER MOBILE (h-14, blur backdrop, z-50)           │
│  [≡ Menu] [Logo + "Runtu"] [Avatar/notif]            │
├──────────┬──────────────────────────────────────────┤
│          │                                           │
│ SIDEBAR  │  MAIN CONTENT AREA                        │
│ (w-64)   │  (flex-1, overflow-y-auto)                │
│ desktop  │                                           │
│ only     │  padding: p-4 md:p-6 lg:p-8               │
│          │                                           │
├──────────┴──────────────────────────────────────────┤
│  BOTTOM NAV MOBILE (h-16, safe-area-bottom)          │
└─────────────────────────────────────────────────────┘
```

### Sidebar (desktop, w-64)

```
┌──────────────────────────────┐
│ [Logo minimal] Runtu         │  ← h-[73px] border-b
├──────────────────────────────┤
│ ● Chat                       │  ← nav items
│   Mis Archivos               │
│   ─────────────              │  ← NEW SECTION
│   Marketing Hub              │
│   MMM Engine                 │
│   TikTok Intel               │
├──────────────────────────────┤
│ [Nombre negocio]    [logout] │  ← bottom: plan badge
└──────────────────────────────┘
```

Nav item activo: `bg-indigo-500/20 text-indigo-400` + dot indicator
Nav item idle: `text-white/60 hover:bg-white/5 hover:text-white`

### Card base

```
bg-white/5 border border-white/10 rounded-2xl p-6
hover: border-[#fbbf24]/30 transition-colors
```

### Button primario

```
bg-[#fbbf24] hover:bg-[#f59e0b] text-gray-900 font-bold
rounded-xl px-8 py-4
hover: scale-105 shadow-[0_0_30px_rgba(251,191,36,0.3)]
```

### Button secundario

```
bg-white/5 border border-white/10 text-white/70
hover:bg-white/10 hover:text-white rounded-xl
```

---

## 4. PANTALLAS — ESPECIFICACIÓN POR PANTALLA

---

### 4.1 LANDING PAGE (público, `/`)

**Layout:** full viewport, sin sidebar.

**Secciones:**

```
HEADER (fixed, blur backdrop)
└─ Logo minimal + "Runtu" | "Iniciar sesión" | CTA "Solicitar acceso" [gold]

HERO (100vh, centered)
└─ Logo HERO animado (lg)
└─ H1: "Tu negocio merece / un copiloto" (gradient-text en "copiloto")
└─ Subtitle: texto/60, max-w-2xl
└─ CTA principal: "Quiero mi copiloto" → /register
└─ Trust badges: pills con texto/60

FEATURES (py-24)
└─ H2: "¿Cómo te ayuda Runtu?"
└─ Grid 3 cols: cards con icono gold, título, descripción

FOR WHO (py-24, gradient bg)
└─ H2 con gradient-text
└─ Blockquote card italic

CTA FINAL (py-24)
└─ Logo header animado
└─ H2, CTA gold

FOOTER (border-top/5)
└─ Logo minimal + "Runtu © 2025" | tagline
```

**Animaciones de entrada:**
Cada sección hace `animate-fade-in` con delays escalonados (0.1s, 0.2s, 0.4s, 0.6s, 0.8s, 1.0s).

---

### 4.2 LOGIN / REGISTER (`/login`, `/register`)

**Layout:** centrado, sin sidebar, fondo con orbes.

```
┌─────────────────────────────┐
│  [Logo HERO md]              │
│  "Bienvenido de vuelta"      │
│                              │
│  [Email ________________]    │
│  [Password _____________]    │
│  [Iniciar sesión — gold]     │
│                              │
│  ¿No tienes cuenta? Regístr  │
└─────────────────────────────┘
```

Inputs: `bg-white/5 border border-white/10 rounded-xl px-4 py-3`
Focus: `border-[#fbbf24]/50 outline-none ring-2 ring-[#fbbf24]/20`

---

### 4.3 ONBOARDING (`/app/onboarding`)

Paso único. Recoge nombre del negocio, sector, descripción.

```
[Logo loading animado — grande]
"Cuéntame de tu negocio"

[Nombre del negocio ___________]
[Sector ↓ dropdown ____________]
[¿A qué te dedicas? textarea___]
[Guardar y empezar → gold btn]
```

---

### 4.4 CHAT (`/app/chat`) — Pantalla principal

**Layout:** 3 paneles horizontales.

```
┌─────────────┬──────────────────────────────┐
│ CONV        │  CHAT AREA                    │
│ SIDEBAR     │                               │
│ (w-64)      │  ┌──────────────────────┐     │
│             │  │  [Empty state logo]  │     │
│ [+ Nueva]   │  │  "¿En qué te ayudo?" │     │
│ ─────────   │  │                      │     │
│ Conv 1      │  │  [User bubble]       │     │
│ Conv 2      │  │    [Assistant bubble]│     │
│ Conv 3      │  │  [streaming...]      │     │
│             │  │                      │     │
│             │  └──────────────────────┘     │
│             │                               │
│             │  ┌── INPUT BAR ─────────────┐ │
│             │  │ [textarea] [send btn →]  │ │
│             │  └──────────────────────────┘ │
└─────────────┴──────────────────────────────┘
```

**Bubbles:**
- Usuario: `bg-indigo-500/20 text-white rounded-2xl rounded-br-sm` — alineado derecha
- Asistente: `bg-white/5 border border-white/8` — alineado izquierda
- Streaming: cursor parpadeante en el último char

**Follow-up suggestions:** chips dorados al final de la respuesta del asistente.

**Input bar:**
- Textarea auto-resize
- Botón enviar: círculo gold con icono arrow
- Estado streaming: botón "Detener" con icono cuadrado

---

### 4.5 ARCHIVOS (`/app/archivos`)

```
┌─────────────────────────────────┐
│ "Mis Archivos"  [+ Subir]       │
│ [Filtros: Todos · PDF · Excel…] │
├─────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐     │
│ │ PDF  │ │ XLSX │ │ IMG  │     │  ← grid de cards
│ │ nom  │ │ nom  │ │ nom  │     │
│ │ 2MB  │ │ 1MB  │ │ 3MB  │     │
│ │●done │ │⏳proc│ │✓done │     │
│ └──────┘ └──────┘ └──────┘     │
└─────────────────────────────────┘
```

**File card:** ícono de tipo + nombre truncado + tamaño + badge de estado.
Estados: `pending` (gris), `processing` (gold pulsante), `completed` (verde), `error` (rojo + btn reprocesar).

**Upload zone:** drag & drop con borde dashed gold al hover, icono cloud upload.

---

### 4.6 MMM ENGINE (`/app/mmm`) — NUEVO MÓDULO

#### 4.6.1 Upload CSV

```
┌─────────────────────────────────────┐
│ "Marketing Mix Modeling"            │
│ "Sube tu data y descubre qué        │
│  canal de marketing realmente       │
│  mueve tus ventas."                 │
│                                     │
│ ┌────────────────────────────────┐  │
│ │  [icono tabla CSV]             │  │  ← drop zone gold
│ │  Arrastra tu CSV aquí          │  │
│ │  o haz clic para seleccionar   │  │
│ │                                │  │
│ │  Columnas esperadas:           │  │
│ │  semana · ventas ·             │  │
│ │  inversion_[canal]...          │  │
│ └────────────────────────────────┘  │
│                                     │
│ [Ver ejemplo de CSV]  [Analizar →]  │
└─────────────────────────────────────┘
```

#### 4.6.2 Resultados MMM

```
┌────────────────────────────────────────────────┐
│ "Resultados para: [nombre archivo]"  [exportar]│
├─────────────────┬──────────────────────────────┤
│ ATRIBUCIÓN      │  CORRELACIÓN MÓVIL            │
│ ─────────────── │  ─────────────────────────── │
│ TV       ████▌  │  [línea chart]                │
│          42%    │  eje X: semanas               │
│ Digital  ███    │  eje Y: correlación -1 a 1    │
│          28%    │  líneas: una por canal        │
│ TikTok   ██▌    │  colores: gold, indigo, etc   │
│          18%    │                               │
│ OOH      █▌     │                               │
│          12%    │                               │
├─────────────────┴──────────────────────────────┤
│ TABLA INVERSIÓN vs VENTAS                       │
│ ─────────────────────────────────────────────  │
│ Sem | Ventas | TV    | Digital | TikTok | OOH  │
│ W01 | 150k   | 20k   | 8k      | 3k     | 5k   │
│ W02 | 162k   | 20k   | 10k     | 5k     | 5k   │
│ ...                                             │
├─────────────────────────────────────────────────┤
│ PREGUNTAS DIAGNÓSTICAS (generadas por IA)       │
│ ─────────────────────────────────────────────  │
│ ❓ Tu correlación TikTok cayó 0.72→0.31.        │
│    ¿Cambió el tipo de contenido que publicas?   │
│ ❓ Elasticidad TV: 3.2x vs Digital: 1.8x        │
│    ¿Estás sobreinvirtiendo en digital?          │
└─────────────────────────────────────────────────┘
```

**Colores por canal en charts:**
- TV: `#fbbf24` (gold)
- Digital: `#6366f1` (indigo)
- TikTok: `#a855f7` (purple)
- OOH: `#34d399` (verde esmeralda)
- Radio: `#f87171` (rojo suave)

---

### 4.7 TIKTOK INTELLIGENCE (`/app/tiktok`) — NUEVO MÓDULO

```
┌─────────────────────────────────────────────────┐
│ "TikTok Intelligence"                           │
│ [Conectar cuenta TikTok Business]  ← si no vinc │
├─────────────────────────────────────────────────┤
│ MÉTRICAS GENERALES (cards top)                  │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │
│ │ Views  │ │ Likes  │ │ Shares │ │ Saves  │    │
│ │ 240K   │ │ 18.4K  │ │ 2.1K   │ │ 890    │    │
│ │ ↑12%   │ │ ↓3%    │ │ ↑8%    │ │ ↑25%   │    │
│ └────────┘ └────────┘ └────────┘ └────────┘    │
├─────────────────────────────────────────────────┤
│ TOP VIDEOS (tabla)                              │
│ Thumbnail | Caption | Views | ER% | Fecha       │
│                                                  │
├─────────────────────────────────────────────────┤
│ CORRELACIÓN TikTok ↔ Ventas                     │
│ [chart línea dual eje]                           │
│ Eje izq: views TikTok (purple)                   │
│ Eje der: ventas (gold)                           │
└─────────────────────────────────────────────────┘
```

---

### 4.8 MARKETING HUB (`/app/marketing-hub`) — NUEVO MÓDULO

Vista unificada. El command center.

```
┌─────────────────────────────────────────────────┐
│ "Marketing Hub"  Semana 15, 2026                │
├──────────────────────┬──────────────────────────┤
│ INVERSIÓN TOTAL      │ VENTAS TOTALES            │
│ $46,000              │ $162,000                  │
│ ROI estimado: 3.5x   │ vs sem ant: ↑7%           │
├──────────────────────┴──────────────────────────┤
│ CANAL GANADOR DE LA SEMANA                       │
│ ┌──────────────────────────────────────────┐    │
│ │  [TikTok icon]  TikTok                   │    │
│ │  Correlación: 0.81  Elasticidad: 4.2x    │    │
│ │  "Mejor semana del trimestre"            │    │
│ └──────────────────────────────────────────┘    │
├─────────────────────────────────────────────────┤
│ RESUMEN IA                                       │
│ "Esta semana tu inversión en TikTok generó      │
│  el mayor retorno desde enero. Tu contenido     │
│  de recetas funcionó 3x mejor que los demos     │
│  de producto. ¿Quieres profundizar?"            │
│                                          [Chat] │
└─────────────────────────────────────────────────┘
```

---

## 5. COMPONENTES REUTILIZABLES

### MetricCard

```
bg-white/5 border border-white/10 rounded-2xl p-6
├─ Label: text-white/40 text-xs uppercase tracking-wider
├─ Value: text-3xl font-black text-white
├─ Delta: badge ↑/↓ verde/rojo · text-sm
└─ Sparkline mini (opcional)
```

### ChannelBadge

```
inline-flex items-center gap-1.5 px-3 py-1
bg-[color]/10 border border-[color]/20 rounded-full
text-[color] text-xs font-semibold
```

### CorrelationBadge

```
Valor -1 a 1 mapeado a color:
< 0.3  → text-red-400 / bg-red-500/10
0.3-0.6 → text-yellow-400 / bg-yellow-500/10
> 0.6  → text-green-400 / bg-green-500/10
```

### DataTable

```
thead: bg-white/5 text-white/40 text-xs uppercase tracking-wider
tbody rows: border-b border-white/5 hover:bg-white/3
numbers: font-mono text-right
```

### DiagnosticQuestion

```
bg-[#fbbf24]/5 border border-[#fbbf24]/20 rounded-xl p-4
├─ Icono ❓ en gold
├─ Pregunta: text-white/80 font-medium
└─ [Responder en chat →]  text-[#fbbf24] text-sm
```

---

## 6. MICRO-ANIMACIONES Y ESTADOS

### Transiciones de página

- Entrada de contenido: `animate-fade-in` 200ms ease-out
- Cards: `transition-all duration-200`
- Hover en cards: no hay transform, solo `border-color` change

### Estados de carga

- Skeleton: `bg-white/5 rounded animate-pulse` — mismo tamaño que el contenido
- Spinner: anillo indigo rotando 1s linear infinite
- Full page loader: Logo LOADING en el centro, fondo oscuro

### Notificaciones Toast

- Posición: bottom-right, z-50
- Success: borde verde izquierdo
- Error: borde rojo izquierdo
- Info: borde indigo izquierdo
- Warning: borde gold izquierdo

### Streaming de texto

- Cursor: `|` parpadeando en `text-[#fbbf24]` al final del texto
- El texto aparece caracter por caracter con ligera aceleración

---

## 7. RESPONSIVE BREAKPOINTS

| Breakpoint | Ancho    | Comportamiento                             |
|------------|----------|--------------------------------------------|
| mobile     | < 768px  | Sin sidebar · Bottom nav visible · 1 col   |
| tablet     | 768-1024 | Sidebar colapsable · 2 cols                |
| desktop    | > 1024px | Sidebar fija · 3 cols donde aplique        |

**Mobile-first always.** El diseño se expande de abajo hacia arriba.

---

## 8. FLUJOS DE USUARIO CRÍTICOS

### Flujo A: Primera vez en la app

```
Landing → Register → Onboarding (nombre negocio) → Chat vacío
                                                    ↓
                                            "Sube tus primeros archivos"
                                            [CTA → /app/archivos]
```

### Flujo B: Análisis MMM

```
Marketing Hub → "Analizar mi mix" → MMM Engine → Upload CSV
                                                  ↓
                                            Procesando... (progress bar)
                                                  ↓
                                            Resultados: gráficas + tabla + preguntas
                                                  ↓
                                            Click en pregunta → Chat con contexto cargado
```

### Flujo C: TikTok Intelligence

```
TikTok Intel → Conectar cuenta → Auth OAuth TikTok
                                  ↓
                             Dashboard con métricas
                                  ↓
                             Cron sync diario automático
                                  ↓
                             Datos disponibles en MMM como canal "TikTok"
```

---

## 9. BRIEF ESPECÍFICO PARA FIGMA

### Frames a crear (prioridad)

1. **Logo Showcase** — todas las variantes del logo animado en sus contextos (hero, header, minimal, loading)
2. **Landing Page** — full desktop + mobile
3. **Auth (Login/Register)** — mobile-first
4. **App Shell** — sidebar + header + content area con el nav actualizado (incluyendo nuevos módulos)
5. **Chat** — estado vacío + conversación activa + streaming
6. **MMM Upload** — el drop zone del CSV
7. **MMM Resultados** — gráficas + tabla + preguntas diagnósticas
8. **TikTok Dashboard** — métricas + correlación
9. **Marketing Hub** — command center unificado
10. **Component Library** — tokens, cards, buttons, badges, inputs, tables

### Estilo de diseño

- **Dark mode only** (sin toggle de light mode por ahora)
- **Glassmorphism sutil** — `backdrop-blur + bg-white/5` en elementos flotantes
- **No bordes duros** — todo `rounded-xl` o `rounded-2xl`
- **Jerarquía por luminancia** — lo más importante es más brillante
- **El gold (#fbbf24) es escaso** — solo para lo que realmente importa

### Tono visual

Profesional pero accesible. No es un Bloomberg terminal (frío, denso).
Es una herramienta para emprendedores que no son data scientists.
La información debe sentirse **empoderador**, no intimidante.

---

## 10. PANTALLA LOGO — ANIMACIÓN "INCREÍBLE"

Esta es la pieza hero. Lo que el usuario ve primero.

### Capas (de atrás hacia adelante):

```
z-0   Background orbes del sistema (estáticos, ya en el fondo de la página)

z-1   HALO EXTERIOR
      w: logo + 120px · rounded-full
      bg: radial-gradient(#fbbf24/3, transparent 70%)
      animation: spin 35s linear infinite REVERSE
      blur: blur-3xl

z-2   ANILLO ROTATORIO
      w: logo + 48px · rounded-full
      bg: gradient-to-r from-[#fbbf24]/20 via-transparent to-[#fbbf24]/20
      animation: spin 20s linear infinite
      blur: blur-xl

z-3   GLOW PULSANTE
      w: logo + 32px · rounded-full
      bg: [#fbbf24]/10
      animation: pulse 3s ease-in-out infinite
      blur: blur-2xl

z-4   LOGO (la imagen)
      mix-blend-mode: lighten
      filter: drop-shadow-[0_0_30px_rgba(251,191,36,0.4)]
      animation: float 4s ease-in-out infinite
      + logo-reveal al montar (1x)

z-5   PARTÍCULA 1 (horaria)
      position: orbit 8s
      punto de inicio: top-center
      w-2 h-2 · bg-[#fbbf24] · rounded-full
      blur: [1px] · shadow: [0_0_10px_rgba(251,191,36,0.8)]

z-6   PARTÍCULA 2 (anti-horaria)
      position: orbit-reverse 6s
      punto de inicio: bottom-center
      w-1.5 h-1.5 · bg-[#fbbf24]/60 · rounded-full
      blur: [1px]

z-7   PARTÍCULA 3 (diagonal, nueva)
      position: rotate(45deg) orbit 11s
      w-1 h-1 · bg-[#fbbf24]/40 · rounded-full

z-8   GLITCH (ocasional, JS)
      Cada 8-12s aleatorio: scale(1.02) durante 80ms → scale(1)
      Simultáneo: opacity de partículas a 1 brevemente
```

### Timing del reveal inicial (en cascada):

```
t=0ms    Logo aparece con logo-reveal (blur→clear + scale + translateY)
t=300ms  Partículas empiezan a orbitar (opacity: 0→1 en 300ms)
t=600ms  Anillos de fondo hacen fade-in (opacity: 0→1 en 400ms)
t=1000ms Todo en estado idle, animaciones continuas activas
t=1200ms H1 hace fade-in + translateY(12px→0)
t=1400ms Subtitle fade-in
t=1600ms CTAs fade-in
```

---

*Brief generado automáticamente desde el código fuente de Runtu.tech v2.0*
*Stack actual: Next.js 16 · Supabase · Tailwind CSS 4 · Google Gemini 2.0 Flash*
