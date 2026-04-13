# Runtu.tech — Brand Guidelines

---

## 1. DESCRIPCIÓN DE MARCA

### Qué es Runtu
**Runtu** es el **Marketing Operating System** para emprendedores latinoamericanos.
Un sistema que convierte datos caóticos (redes sociales, inversión publicitaria, reviews, competidores) en decisiones claras y accionables.

> *Tagline oficial:* "Tu negocio merece un copiloto."

### Promesa
No es otro dashboard. No es un chatbot genérico.
Es el **socio que recuerda todo, entiende el caos y dice la verdad con cariño.**

### Símbolo — El huevo dorado
El logo es un **huevo dorado con circuitos** emergiendo sobre fondo amarillo.

Significa:
- **Huevo:** el nacimiento de algo valioso — tu negocio, tu decisión, tu claridad
- **Circuitos dorados:** la inteligencia que vive dentro — IA, modelos, datos procesados
- **Brillo interno:** algo vivo, que respira, que emana energía
- **Amarillo exterior:** calidez, optimismo latinoamericano, advertencia-poder

El logo **nunca es estático**. Siempre flota, pulsa o rota.

### Personalidad

| Es | No es |
|----|-------|
| Directo | Corporativo |
| Analítico | Frío |
| Cercano | Cursi |
| Confiable | Arrogante |
| Moderno | Genérico |
| Latinoamericano | Traducido |

### Voz

**✅ Sí**
- "Tu TikTok está 49% sobre benchmark. Facebook cayendo — reduce frecuencia."
- "Sube 15% a TikTok. Aquí el por qué."
- "El negativo es logística, no producto. Mejora comunicación de envíos."

**❌ No**
- "Te sugerimos considerar posiblemente optimizar..."
- "Su campaña ha experimentado un incremento favorable..."
- "Proceder a realizar la gestión correspondiente..."

---

## 2. PALETA DE COLORES

### Filosofía
Runtu 2.0 es **light mode**. Fondo claro limpio, datos en alto contraste, tipografía negra.
El dorado ámbar es el **único color de marca** — se usa con moderación, máximo 5% de la superficie visible.

### Base — Neutros

| Token | Hex | Clase Tailwind | Uso |
|-------|-----|----------------|-----|
| `--background` | `#FAFAFA` | `bg-[#FAFAFA]` | Fondo principal de la app |
| `--card` | `#FFFFFF` | `bg-white` | Cards, modales, sidebar |
| `--gray-900` | `#111827` | `text-gray-900` | Texto principal, botones primarios |
| `--gray-700` | `#374151` | `text-gray-700` | Texto secundario, labels |
| `--gray-500` | `#6B7280` | `text-gray-500` | Texto terciario, subtítulos |
| `--gray-400` | `#9CA3AF` | `text-gray-400` | Placeholders, íconos inactivos |
| `--gray-200` | `#E5E7EB` | `border-gray-200` | Bordes, separadores |
| `--gray-100` | `#F3F4F6` | `bg-gray-100` | Fondos sutiles, hover states |
| `--gray-50` | `#F9FAFB` | `bg-gray-50` | Fondo de inputs, zonas muted |

### Acento principal — Ámbar (dorado)

| Token | Hex | Clase Tailwind | Uso |
|-------|-----|----------------|-----|
| `--amber-700` | `#B45309` | `text-amber-700` | Texto del acento, íconos premium |
| `--amber-600` | `#D97706` | `text-amber-600` | Logo wordmark `.tech`, hover |
| `--amber-500` | `#F59E0B` | `bg-amber-500` | Warning states |
| `--amber-50` | `#FFFBEB` | `bg-amber-50` | Fondos sutiles, badges, avatar |

El ámbar es **el color de marca**. Equivale al dorado del logo pero optimizado para light mode.

### Semánticos (estados y alertas)

| Uso | Hex | Clase | Aplicación |
|-----|-----|-------|------------|
| **Positivo / Éxito** | `#10B981` | `emerald-500` | Deltas ↑, badges success |
| **Info / Streaming** | `#6366F1` | `indigo-500` | Nav activo, chat IA |
| **Warning** | `#F59E0B` | `amber-500` | Alertas, diagnósticos medios |
| **Error / Negativo** | `#EF4444` | `red-500` | Errores, deltas ↓ |
| **Premium / Estrategia** | `#6D28D9` | `purple-700` | TikTok, elementos estratégicos |

### Colores por canal (charts MMM)

Paleta fija para consistencia en visualizaciones:

| Canal | Hex | Razón |
|-------|-----|-------|
| **TV** | `#111827` | Gray-900 — tradicional, serio, base |
| **Digital** | `#6366F1` | Indigo — tech, digital |
| **TikTok** | `#6D28D9` | Purple — disruptor, nuevo |
| **OOH** | `#10B981` | Emerald — físico, outdoor |
| **Radio** | `#EF4444` | Red — declinante |

### Sombras y elevación

En light mode, la elevación se consigue con **bordes sutiles**, no con sombras pesadas:

```css
/* Card flotante */
border: 1px solid rgba(0,0,0,0.05);

/* Card principal */
border: 1px solid #E5E7EB;  /* border-gray-200 */

/* Separador sutil */
border: 1px solid #F3F4F6;  /* border-gray-100 */

/* Botón primario en hover */
box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);  /* shadow-lg */
```

### Uso del dorado en light mode

El logo **mantiene su dorado original** (el huevo amarillo con circuitos). La UI lo acompaña con:
- Wordmark: `Runtu.tech` donde `.tech` es `amber-600`
- Avatar del negocio: fondo `amber-50` con texto `amber-700`
- Badges premium/PRO: fondo `amber-50` con texto `amber-700`
- Nunca botones completos en gold — el botón primario es siempre **gray-900**

---

## 3. TIPOGRAFÍA

### Familia única
**Montserrat** — Google Fonts. Es la única tipografía del sistema.

```html
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;900&display=swap" rel="stylesheet">
```

### Por qué Montserrat
- Geometría limpia, moderna
- Excelente lectura en tamaños pequeños (data tables)
- Peso 900 para impacto (métricas, números)
- Disponible gratis en todas las plataformas

### Pesos disponibles

| Peso | Valor | Uso |
|------|-------|-----|
| Regular | 400 | Body, texto corrido |
| Medium | 500 | Sub-labels, énfasis leve |
| Semibold | 600 | Labels, botones secundarios, badges |
| Bold | 700 | Titles, wordmark "Runtu" |
| Black | 900 | H1, métricas destacadas, números hero |

### Jerarquía completa

| Nivel | Tamaño | Peso | Tracking | Uso |
|-------|--------|------|----------|-----|
| Hero | 48-60px (`text-5xl→6xl`) | 900 | `tracking-tight` | Landing hero |
| H1 Pantalla | 24-30px (`text-2xl→3xl`) | 900 | `tracking-tight` | Títulos principales |
| H2 Sección | 18-20px (`text-lg→xl`) | 700 | normal | Secciones |
| H3 Sub | 14-16px (`text-sm→base`) | 600 | normal | Sub-secciones |
| **Métrica** | 24-30px | 900 | `font-mono` | KPIs, R², coeficientes |
| Body | 14px (`text-sm`) | 400 | normal | Texto corrido |
| Small | 12px (`text-xs`) | 400 | normal | Captions, metadata |
| Micro | 10-11px | 600 | `uppercase tracking-wider` | Labels de tabla |

### Colores de texto por contexto

```css
/* Título principal */
color: #111827;  /* text-gray-900 */

/* Body */
color: #374151;  /* text-gray-700 */

/* Subtítulos */
color: #6B7280;  /* text-gray-500 */

/* Metadata / Placeholders */
color: #9CA3AF;  /* text-gray-400 */
```

### Monospace
Usa `font-mono` para valores numéricos, fórmulas y data:
```
β = 3.21
R² = 0.94
p-value < 0.001
+18% ROI
```

---

## 4. LOGO — SISTEMA

### Símbolo
La imagen del **huevo dorado con circuitos** sobre fondo blanco/transparente.
Mantener el original, no recolorear.

### Wordmark

**Runtu.tech**
- `Runtu` → peso **700**, color `text-gray-900`
- `.tech` → peso **700**, color `text-amber-600`
- Sin espacio entre ambos
- Tagline opcional debajo: `MARKETING OS` en uppercase, `tracking-widest`, peso 500, color `text-gray-400`

### Variantes

| Variante | Tamaño | Aplicación |
|----------|--------|------------|
| **HERO** | 56-96px | Landing, auth pages, splash |
| **HEADER** | 28-32px | Navbar, sidebar |
| **MINIMAL** | 20-24px | Footer, favicon contexts |

### Animaciones recomendadas

Aunque estamos en light mode, el logo **respira**:
- **Float**: `translateY(-6px)` en 4s ease-in-out infinite
- **Pulse**: `opacity 0.8→1` en 3s (solo en hero)
- **Reveal inicial** al montar: fade + scale desde 0.9→1 en 600ms

---

## 5. COMPONENTES CLAVE

### Card estándar
```css
bg-white border border-gray-200/80 rounded-2xl p-5
hover: border-gray-300 transition-colors
```

### Card con elevación sutil
```css
bg-white border border-gray-200 rounded-2xl p-5
shadow-sm
```

### Botón primario (negro, no gold)
```css
bg-gray-900 hover:bg-gray-800 text-white
rounded-xl px-4 py-2.5 text-sm font-semibold
transition-all hover:shadow-lg
disabled: bg-gray-400
```

### Botón secundario
```css
bg-white border border-gray-200 text-gray-700
hover:bg-gray-50 rounded-xl px-4 py-2.5 text-sm
transition-colors
```

### Botón terciario (ghost)
```css
text-gray-500 hover:text-gray-900
rounded-lg px-3 py-2 text-sm
```

### Input
```css
bg-white border border-gray-200 rounded-xl px-4 py-3
text-gray-900 placeholder-gray-400 text-sm
focus: border-gray-400 ring-2 ring-gray-200 outline-none
```

### Badge de estado
```css
inline-flex items-center gap-1.5 px-2 py-1
rounded-full text-[10px] font-semibold

Success:  bg-emerald-50 text-emerald-600
Warning:  bg-amber-50 text-amber-600
Error:    bg-red-50 text-red-500
Info:     bg-indigo-50 text-indigo-600
Premium:  bg-amber-50 text-amber-700
```

### MetricCard
```
bg-white border border-gray-200/80 rounded-2xl p-4
├─ Label:   text-gray-400 text-[10px] uppercase tracking-wider
├─ Value:   text-2xl font-black text-gray-900 font-mono
├─ Delta:   ↑/↓ emerald-500 / red-500 · text-xs
└─ Sparkline mini (opcional)
```

### Pregunta diagnóstica (MMM)
```
Severidad "high":    bg-amber-50/50 border-amber-200 rounded-xl p-4
Severidad "medium":  bg-indigo-50/50 border-indigo-200
Severidad "low":     bg-gray-50 border-gray-200

├─ Icono ⚠️/ℹ️
├─ Pregunta: text-gray-600 text-sm
└─ [Explorar en chat →]  text-gray-900 text-xs font-semibold
```

### Tab bar
```css
/* Container */
bg-gray-100 rounded-xl p-1 flex gap-1

/* Tab activo */
bg-white text-gray-900 shadow-sm font-semibold

/* Tab inactivo */
text-gray-400 hover:text-gray-600
```

---

## 6. LAYOUT Y ESPACIADO

### Radios

| Clase | Valor | Uso |
|-------|-------|-----|
| `rounded-lg` | 8px | Botones pequeños, tags, separadores |
| `rounded-xl` | 12px | Inputs, botones principales, cards pequeñas |
| `rounded-2xl` | 16px | Cards principales, modales |
| `rounded-full` | 999px | Pills, avatars, botones circulares |

### Espaciado estándar

| Contexto | Padding |
|----------|---------|
| Card | `p-5` (20px) |
| Card compacta | `p-4` (16px) |
| Section | `p-4 md:p-6 lg:p-8` |
| Gap entre items | `gap-3` (12px) o `gap-4` (16px) |
| Gap entre secciones | `space-y-6` (24px) |

### Breakpoints

| Breakpoint | Ancho | Comportamiento |
|------------|-------|----------------|
| mobile | < 768px | Sin sidebar · Bottom nav visible · 1 col |
| tablet | 768-1024 | Sidebar colapsable · 2 cols |
| desktop | > 1024px | Sidebar fija (252px) · 3+ cols |

**Mobile-first always.** Todo funciona en 375px.

### Estructura App Shell
```
┌──────────────────────────────────────┐
│ Mobile header (h-14, solo mobile)    │
├────────┬─────────────────────────────┤
│        │                             │
│ Side-  │   Main content              │
│ bar    │   (flex-1, overflow-auto)   │
│ 252px  │                             │
│        │                             │
├────────┴─────────────────────────────┤
│ Bottom nav mobile (h-16, solo mobile)│
└──────────────────────────────────────┘
```

---

## 7. PRINCIPIOS DE DISEÑO

### 1. Datos primero, UI después
El componente existe para mostrar el dato. Nunca al revés.

### 2. Jerarquía por contraste y tamaño, no por color
Lo importante es más grande o más oscuro. Nunca más saturado.

### 3. El ámbar es escaso
Úsalo solo para: logo `.tech`, avatar del negocio, badges PRO/premium, íconos de highlight ocasional. **Nunca en botones completos.**

### 4. El vacío comunica
Usa whitespace generoso. Deja respirar entre secciones.

### 5. Densidad sin ruido
Cada pixel justifica su existencia. Sin decoración vacía.

### 6. Mobile-first, desktop-refined
Todo funciona en 375px. Desktop aprovecha el espacio.

### 7. Consistencia > Creatividad
Mismo componente en todas las pantallas.

### 8. Empoderar, no intimidar
Los usuarios no son data scientists. La complejidad se oculta tras claridad.

---

## 8. MICRO-ANIMACIONES

### Transiciones estándar
- Entrada de contenido: `animate-fade-in` 200ms ease-out
- Cards hover: `transition-colors duration-200`
- Botones: `transition-all duration-150`

### Estados de carga
- Skeleton: `bg-gray-100 rounded animate-pulse`
- Spinner: anillo `border-gray-900 border-t-transparent` rotando 1s linear infinite
- Full page loader: Logo + spinner + texto "Cargando..."

### Streaming de texto (Chat IA)
- Cursor `|` parpadeando en `text-gray-400` al final
- Texto aparece caracter por caracter

### Toasts (notificaciones)
- Posición: bottom-right, z-50
- Duración default: 4s
- Success: ícono verde
- Error: ícono rojo
- Info: ícono indigo
- Warning: ícono ámbar

---

## 9. ACCESIBILIDAD

- Contraste mínimo AA: 4.5:1 para body
- Focus visible: ring `ring-gray-200` + border `border-gray-400`
- Tamaños tocables: mínimo 40×40px en mobile
- Nunca comunicar solo con color — usa íconos + texto
- Jerarquía clara con `aria-label` en botones icon-only

---

## 10. NAMING Y LENGUAJE

### Siempre en español (LATAM)
- "Iniciar sesión" (no "Login")
- "Regístrate" (no "Sign up")
- "Cerrar sesión" (no "Log out")
- "Análisis" (no "Analytics" en UI visible)
- "Tu negocio" (no "Su empresa" — tú, no usted)

### Términos técnicos en inglés (nombres propios)
- "MMM Engine", "Marketing OS", "Dashboard"
- "Chat IA" (no "AI Chat")
- Nombres de plataformas: Instagram, TikTok, Meta, LinkedIn, Google Ads

### Números
- Grandes cifras: `150K`, `2.4M`, `$46,000`
- Porcentajes: `+18%`, `↑49%`, `-3%`
- Decimales en data técnica: punto (`R²=0.94`, `p-value=0.003`)
- Moneda: siempre formato local con símbolo (`$46,000 MXN`)

---

*Guidelines actualizadas: abril 2026*
*Basadas en el UX_BRIEF_RUNTU.md + logos oficiales + implementación actual en código*
