// ============================================
// Report Prompts
// ============================================
// Prompts especializados para cada tipo de reporte

import type { ReportType } from "@/types/reports";

interface PromptVariables {
  businessName: string;
  periodLabel: string;
  context: string;
  date: string;
  language?: "es" | "en";
}

// ============================================
// System Prompts
// ============================================

export const REPORT_SYSTEM_PROMPT = `Eres un experto en análisis de negocios y generación de reportes profesionales.

REGLAS:
1. Genera reportes en formato Markdown bien estructurado
2. Usa datos REALES del contexto proporcionado - NO inventes números
3. Si no hay datos suficientes para una sección, indícalo profesionalmente
4. Mantén un tono profesional y objetivo
5. Los reportes deben ser presentables a terceros (bancos, socios, inversores)
6. Usa formato consistente con encabezados, listas y énfasis apropiados
7. Incluye siempre la fecha de generación y período analizado
8. Si hay tendencias o cambios notables, destácalos
9. Las recomendaciones deben ser específicas y accionables`;

// ============================================
// Report Type Prompts
// ============================================

export const EXECUTIVE_REPORT_PROMPT = `Genera un **RESUMEN EJECUTIVO** de UNA PÁGINA para este negocio.

**NEGOCIO:** {businessName}
**PERÍODO:** {periodLabel}
**FECHA DE GENERACIÓN:** {date}

**INFORMACIÓN DISPONIBLE:**
{context}

**ESTRUCTURA DEL REPORTE (usa exactamente este formato):**

# Resumen Ejecutivo
## {businessName}
**Período analizado:** {periodLabel}

---

### Situación General
[2-3 oraciones resumiendo el estado general del negocio basándote SOLO en los datos proporcionados]

---

### Indicadores Clave

| Indicador | Valor | Observación |
|-----------|-------|-------------|
| [Indicador 1] | [Valor real del contexto] | [Breve nota] |
| [Indicador 2] | [Valor real del contexto] | [Breve nota] |
| [Indicador 3] | [Valor real del contexto] | [Breve nota] |

*Si no hay datos numéricos específicos, describe los indicadores cualitativamente*

---

### Logros del Período
- [Logro o hito identificado en los datos]
- [Otro logro si existe]

### Áreas de Atención
- [Área que requiere atención basada en los datos]
- [Otra área si aplica]

---

### Recomendaciones Prioritarias
1. **[Recomendación principal]:** [Descripción breve]
2. **[Recomendación secundaria]:** [Descripción breve]

---

*Reporte generado automáticamente por Runtu el {date}*
*Basado en documentos y datos proporcionados por el negocio*`;

export const DETAILED_REPORT_PROMPT = `Genera un **REPORTE DETALLADO** completo para este negocio.

**NEGOCIO:** {businessName}
**PERÍODO:** {periodLabel}
**FECHA DE GENERACIÓN:** {date}

**INFORMACIÓN DISPONIBLE:**
{context}

**ESTRUCTURA DEL REPORTE:**

# Reporte Detallado
## {businessName}
**Período:** {periodLabel} | **Generado:** {date}

---

## 1. Resumen Ejecutivo
[Párrafo resumiendo los hallazgos más importantes]

---

## 2. Análisis de Actividad

### 2.1 Actividad General
[Descripción de la actividad del negocio durante el período]

### 2.2 Tendencias Observadas
[Tendencias identificadas en los datos]

### 2.3 Comparativa con Períodos Anteriores
[Si hay datos comparativos, inclúyelos. Si no, indícalo]

---

## 3. Análisis por Área

### 3.1 Ventas e Ingresos
[Análisis de ventas si hay datos]

### 3.2 Operaciones
[Análisis operativo si hay datos]

### 3.3 Clientes
[Análisis de clientes si hay datos]

### 3.4 Inventario/Productos
[Análisis de inventario si hay datos]

---

## 4. Indicadores de Desempeño

| Indicador | Valor | Tendencia | Observación |
|-----------|-------|-----------|-------------|
| [KPI 1] | [Valor] | [↑/↓/→] | [Nota] |
| [KPI 2] | [Valor] | [↑/↓/→] | [Nota] |

---

## 5. Hallazgos Principales

### Fortalezas Identificadas
- [Fortaleza 1]
- [Fortaleza 2]

### Oportunidades de Mejora
- [Oportunidad 1]
- [Oportunidad 2]

### Riesgos Potenciales
- [Riesgo 1 si se identifica]

---

## 6. Recomendaciones

### Corto Plazo (0-30 días)
1. [Recomendación inmediata]

### Mediano Plazo (1-3 meses)
1. [Recomendación de mediano plazo]

### Largo Plazo (3+ meses)
1. [Recomendación estratégica]

---

## 7. Conclusiones
[Párrafo de cierre con las conclusiones principales]

---

*Este reporte fue generado automáticamente por Runtu*
*Fecha: {date}*
*Los datos provienen de documentos proporcionados por el negocio*`;

export const FINANCIAL_REPORT_PROMPT = `Genera un **REPORTE FINANCIERO** profesional para presentar a una entidad bancaria o financiera.

**NEGOCIO:** {businessName}
**PERÍODO:** {periodLabel}
**FECHA DE GENERACIÓN:** {date}

**INFORMACIÓN DISPONIBLE:**
{context}

**IMPORTANTE:** Este reporte será presentado a un banco. Debe ser:
- Extremadamente profesional y formal
- Basado SOLO en datos verificables del contexto
- Conservador en proyecciones
- Claro sobre limitaciones de información

**ESTRUCTURA DEL REPORTE:**

# Informe de Situación Financiera
## {businessName}

**Período de análisis:** {periodLabel}
**Fecha de elaboración:** {date}
**Clasificación:** Confidencial

---

## 1. Perfil del Negocio

### 1.1 Información General
[Descripción del negocio basada en los datos disponibles]

### 1.2 Actividad Principal
[Tipo de actividad económica]

### 1.3 Antigüedad y Trayectoria
[Si hay información disponible]

---

## 2. Resumen de Actividad Económica

### 2.1 Volumen de Operaciones
[Datos de transacciones, ventas, ingresos - SOLO si están en el contexto]

### 2.2 Estructura de Ingresos
[Fuentes de ingreso identificadas]

### 2.3 Estacionalidad
[Patrones estacionales si se identifican]

---

## 3. Análisis Financiero

### 3.1 Ingresos del Período
| Concepto | Monto | Participación |
|----------|-------|---------------|
| [Fuente 1] | [Monto] | [%] |

*Nota: Datos basados en documentación proporcionada*

### 3.2 Estructura de Costos
[Si hay información de gastos/costos]

### 3.3 Márgenes Operativos
[Si es calculable con los datos disponibles]

---

## 4. Indicadores de Gestión

| Indicador | Valor | Referencia |
|-----------|-------|------------|
| [Indicador 1] | [Valor] | [Benchmark si aplica] |

---

## 5. Historial y Cumplimiento

### 5.1 Consistencia Operativa
[Regularidad de operaciones según los datos]

### 5.2 Historial de Actividad
[Información sobre historial si está disponible]

---

## 6. Proyección y Capacidad

### 6.1 Proyección Conservadora
[Proyección basada en tendencias observadas - SER CONSERVADOR]

### 6.2 Capacidad de Generación
[Evaluación de capacidad basada en datos históricos]

---

## 7. Limitaciones del Análisis

Este informe presenta las siguientes limitaciones:
- [Limitación 1: ej. "Período de análisis limitado"]
- [Limitación 2: ej. "Información parcial de costos"]

---

## 8. Conclusión

[Párrafo profesional resumiendo la situación financiera del negocio]

---

**DECLARACIÓN:**
Este informe fue generado automáticamente basándose en documentación proporcionada por el titular del negocio. Los datos presentados reflejan la información disponible en los documentos analizados y no han sido auditados independientemente.

*Generado por Runtu - {date}*`;

export const OPERATIONAL_REPORT_PROMPT = `Genera un **REPORTE OPERATIVO** enfocado en productividad y operaciones.

**NEGOCIO:** {businessName}
**PERÍODO:** {periodLabel}
**FECHA DE GENERACIÓN:** {date}

**INFORMACIÓN DISPONIBLE:**
{context}

**ESTRUCTURA DEL REPORTE:**

# Reporte Operativo
## {businessName}
**Período:** {periodLabel}

---

## 1. Resumen de Operaciones
[Vista general de las operaciones del período]

---

## 2. Métricas Operativas

### 2.1 Volumen de Actividad
| Métrica | Valor | vs. Período Anterior |
|---------|-------|---------------------|
| [Métrica 1] | [Valor] | [Comparación] |

### 2.2 Eficiencia
[Análisis de eficiencia operativa]

### 2.3 Tiempos y Velocidad
[Métricas de tiempo si están disponibles]

---

## 3. Análisis de Procesos

### 3.1 Procesos Principales
[Descripción de procesos clave identificados]

### 3.2 Cuellos de Botella
[Identificar si hay problemas operativos]

### 3.3 Mejoras Implementadas
[Si se identifican mejoras durante el período]

---

## 4. Recursos

### 4.1 Utilización de Recursos
[Análisis de uso de recursos]

### 4.2 Capacidad
[Análisis de capacidad operativa]

---

## 5. Incidencias y Problemas
[Problemas operativos identificados en el período]

---

## 6. Recomendaciones Operativas

### Optimizaciones Sugeridas
1. [Mejora operativa 1]
2. [Mejora operativa 2]

### Inversiones Recomendadas
1. [Si aplica según los datos]

---

## 7. Plan de Acción Sugerido

| Acción | Prioridad | Plazo | Responsable |
|--------|-----------|-------|-------------|
| [Acción 1] | Alta/Media/Baja | [Plazo] | [Área] |

---

*Reporte generado por Runtu el {date}*`;

export const CUSTOM_REPORT_PROMPT = `Genera un **REPORTE PERSONALIZADO** según las secciones solicitadas.

**NEGOCIO:** {businessName}
**PERÍODO:** {periodLabel}
**FECHA DE GENERACIÓN:** {date}
**SECCIONES SOLICITADAS:** {sections}

**INFORMACIÓN DISPONIBLE:**
{context}

**INSTRUCCIONES:**
1. Incluye SOLO las secciones solicitadas
2. Mantén formato profesional consistente
3. Cada sección debe tener análisis relevante basado en los datos

**ESTRUCTURA:**

# Reporte: {businessName}
**Período:** {periodLabel} | **Fecha:** {date}

---

[Genera las secciones solicitadas con análisis detallado para cada una]

---

*Reporte personalizado generado por Runtu*
*{date}*`;

// ============================================
// Prompt Selector
// ============================================

const PROMPTS: Record<ReportType, string> = {
  executive: EXECUTIVE_REPORT_PROMPT,
  detailed: DETAILED_REPORT_PROMPT,
  financial: FINANCIAL_REPORT_PROMPT,
  operational: OPERATIONAL_REPORT_PROMPT,
  custom: CUSTOM_REPORT_PROMPT,
};

export function getReportPrompt(
  type: ReportType,
  variables: PromptVariables & { sections?: string[] }
): string {
  let prompt = PROMPTS[type];

  // Reemplazar variables
  prompt = prompt
    .replace(/{businessName}/g, variables.businessName)
    .replace(/{periodLabel}/g, variables.periodLabel)
    .replace(/{context}/g, variables.context)
    .replace(/{date}/g, variables.date);

  // Para custom, agregar secciones
  if (type === "custom" && variables.sections) {
    prompt = prompt.replace(/{sections}/g, variables.sections.join(", "));
  }

  return prompt;
}

export function getSystemPrompt(): string {
  return REPORT_SYSTEM_PROMPT;
}

// ============================================
// Available Sections for Custom Reports
// ============================================

export const AVAILABLE_SECTIONS = [
  { id: "summary", label: "Resumen Ejecutivo" },
  { id: "financial", label: "Análisis Financiero" },
  { id: "sales", label: "Ventas e Ingresos" },
  { id: "operations", label: "Operaciones" },
  { id: "customers", label: "Clientes" },
  { id: "inventory", label: "Inventario" },
  { id: "trends", label: "Tendencias" },
  { id: "recommendations", label: "Recomendaciones" },
  { id: "risks", label: "Riesgos" },
  { id: "projections", label: "Proyecciones" },
];
