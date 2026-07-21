# Runtu — Incubadora de agentes

Runtu convierte un proceso concreto en un agente probado, gobernado y desplegable.

> Primero se prueba. Después se despliega.

## Producto

La experiencia se organiza en cuatro compuertas:

1. **Radiografía:** proceso, usuarios, datos, riesgo y resultado.
2. **Arquitectura:** conocimiento, instrucciones, herramientas, permisos y excepciones.
3. **Escala:** evaluaciones, costo, latencia y aprobación humana.
4. **Siembra:** versión trazable, despliegue gradual y rollback.

## Stack

- Vite + React + TypeScript
- CSS propio con identidad Runtu
- Vercel

La página pública no requiere base de datos, autenticación ni secretos.

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
