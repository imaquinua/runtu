# Runtu.tech — Marketing OS

Marketing Operating System para emprendedores latinoamericanos.
Una plataforma que convierte datos caóticos (redes sociales, inversión publicitaria, reviews, competidores) en decisiones claras y accionables.

> *Tu negocio merece un copiloto.*

---

## Stack

- **Frontend:** Vite + React 18 + TypeScript
- **Styling:** Tailwind CSS 4 + Radix UI + shadcn/ui
- **Charts:** Recharts
- **Auth + DB:** Supabase (PostgreSQL, Auth, RLS)
- **IA:** Google Gemini (Fase 3 — pendiente)
- **Deploy:** Vercel (`www.runtu.tech`)

---

## Módulos

| Módulo | Ruta | Estado |
|--------|------|--------|
| Landing | `/` | ✅ UI lista |
| Incubadora de agentes | `/incubadora` | 🟡 Experiencia de validación publicada |
| Auth (Login/Register) | `/login`, `/register` | ✅ Funcional con Supabase |
| Onboarding | `/app/onboarding` | ✅ Guarda en BD |
| Dashboard | `/app` | 🟡 UI lista, datos mock |
| Chat IA | `/app/chat` | 🟡 UI lista, respuestas mock |
| Social Scraping | `/app/social-scraping` | 🟡 UI lista, datos mock |
| Web Scraping | `/app/web-scraping` | 🟡 UI lista, datos mock |
| Social Analytics | `/app/analytics` | 🟡 UI lista, datos mock |
| **MMM Engine** | `/app/mmm` | 🟡 UI lista, regresión pendiente |
| Content Calendar | `/app/calendar` | 🟡 UI lista, datos mock |
| Integrations | `/app/integrations` | 🟡 UI lista, OAuth pendiente |

---

## Desarrollo local

### Requisitos
- Node.js 20+
- Cuenta de Supabase
- Cuenta de Google Cloud (para Gemini, opcional en Fase 1)

### Setup

1. **Instalar dependencias**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno** — crea `.env.local`:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbG...
   GEMINI_API_KEY=AIza...
   ```

3. **Ejecutar migraciones en Supabase**
   Copia el contenido de `supabase/migrations/001_runtu2_schema.sql` y ejecútalo en el SQL Editor de tu proyecto Supabase. Crea las tablas `businesses`, `mmm_analyses`, `conversations`, `messages` con RLS habilitado.

4. **Arrancar dev server**
   ```bash
   npm run dev
   ```
   Abre `http://localhost:5173`.

### Build
```bash
npm run build   # output en /dist
```

---

## Estructura

```
runtu.tech/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── AppShell.tsx          # Layout con sidebar + mobile nav
│   │   │   ├── ProtectedRoute.tsx    # Guard de auth
│   │   │   ├── MetricCard.tsx
│   │   │   ├── RuntuLogo.tsx
│   │   │   └── ui/                   # Componentes shadcn/ui
│   │   ├── pages/                    # Todas las pantallas
│   │   ├── App.tsx
│   │   └── routes.tsx                # React Router
│   ├── lib/
│   │   ├── supabase.ts               # Cliente Supabase
│   │   └── auth-context.tsx          # Context con user/business/sesión
│   ├── imports/                      # Logos + assets
│   └── styles/                       # Tailwind + tokens + fonts
├── supabase/
│   └── migrations/                   # SQL schema
├── guidelines/
│   └── Guidelines.md                 # Brand guidelines
├── investigacion/                    # Research files
├── index.html
├── vite.config.ts
├── vercel.json
└── package.json
```

---

## Deploy

El proyecto está conectado a Vercel (`chumbis-projects/runtu_app`, dominio `www.runtu.tech`).

Cada push a `main` hace deploy automático. Variables de entorno configuradas en Vercel Dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`

Deploy manual:
```bash
vercel --prod
```

---

## Roadmap

### Línea de validación — Incubadora de agentes
- Validar un único agente interno de conocimiento/operaciones
- Convertir Radiografía → Arquitectura → Escala → Siembra en compuertas con evidencia
- Desplegar primero en web; Slack como segundo canal
- Incorporar versiones, evaluaciones, aprobación humana, presupuesto y rollback
- Mantener esta línea separada del Marketing OS hasta validar demanda y posicionamiento

### Fase 2 — MMM Engine real (próximo)
- Parsear CSV del usuario en `src/app/pages/MMMEngine.tsx`
- Regresión lineal múltiple real con `ml-regression` + `csv-parse`
- Calcular coeficientes β, R², F-Statistic, p-values, elasticidades
- Guardar resultados en tabla `mmm_analyses`
- Reemplazar datos mock por datos calculados

### Fase 3 — Chat con Gemini real
- Endpoint `/api/chat` con streaming
- System prompt con contexto del negocio + último análisis MMM
- Persistir conversaciones en tablas `conversations` / `messages`
- Reemplazar el keyword matching de `Chat.tsx`

### Fase 4 — Social Scraping real
- Integrar Apify / ScrapingBee para Instagram, TikTok
- Clasificación automática de sentimiento vía Gemini
- Persistir menciones en Supabase

### Fase 5 — Social Analytics real
- OAuth con Instagram Business API, TikTok Business API, Meta Graph API
- Pull de métricas de engagement por plataforma
- Cálculo de engagement rate con fórmulas nativas

### Fase 6 — Content Calendar con IA
- Generación de posts con Gemini (contexto de negocio + tendencias)
- Publicación automática vía APIs oficiales
- Sugerencias de horarios basadas en engagement histórico

### Fase 7 — Integrations completas
- OAuth flows para Instagram, TikTok, Facebook, LinkedIn, Google Ads, X
- Sync periódico con cron jobs
- Storage de tokens encriptado

### Mejoras técnicas
- Auth hardening: verificar `business` existente y redirigir a onboarding si falta
- CI con GitHub Actions (`npm run build` + ESLint)
- Tests con Vitest
- Monitoring con Sentry

---

## Respaldos

La versión anterior (Runtu v1 — copiloto de negocio con RAG sobre Next.js) está preservada:
- **Tag:** `v1-final`
- **Branch:** `archive/v1-copiloto`

Para recuperar código de v1:
```bash
git show v1-final:runtu_app/src/lib/chat/engine.ts
```

---

*Última actualización: julio 2026*
