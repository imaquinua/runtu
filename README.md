# Runtu — Incubadora de agentes

Runtu convierte un proceso concreto en un agente probado, gobernado y desplegable.

> Primero se prueba. Después se despliega.

## Producto

La experiencia se organiza en cuatro compuertas:

1. **Radiografía:** proceso, usuarios, datos, riesgo y resultado.
2. **Arquitectura:** conocimiento, instrucciones, herramientas, permisos y excepciones.
3. **Escala:** evaluaciones, costo, latencia y aprobación humana.
4. **Siembra:** versión trazable, despliegue gradual y rollback.

La portada incorpora el plan de ejecución de 12 semanas: elección del proceso, construcción del agente, evaluación y piloto medido.

## Identidad

- Crema como espacio principal: Runtu vive al amanecer.
- Isotipo vectorial abierto para marca, navegación y firma.
- Huevos pixelados únicamente dentro de la interfaz del Laboratorio.
- Fraunces para voz, IBM Plex Sans para cuerpo e IBM Plex Mono para etiquetas.
- Press Start 2P solo como acento retro-técnico del Lab.

## Stack

- Vite + React + TypeScript
- CSS propio con identidad Runtu
- Vercel

La página pública no requiere base de datos, autenticación ni secretos.

## Huevo 0 · Minuta de Comité

La función protegida `POST /api/minuta` ejecuta el primer agente con
`gpt-5-nano`. Requiere `OPENAI_API_KEY` y `RUNTU_LAB_TOKEN` como secretos de
servidor en Vercel. La ruta permanece cerrada si falta el token del laboratorio
y nunca expone la clave de OpenAI al navegador.

## Desarrollo

```bash
npm install
npm run dev
```

## Verificación

```bash
npm run build
npm audit
```

## Despliegue

- Repositorio: `imaquinua/runtu`
- Proyecto Vercel: `chumbis-projects/runtu_app`
- Producción: [runtu.tech](https://runtu.tech)

Cada push a `main` activa un despliegue de producción.
