// ============================================
// RAG - Query Utilities
// ============================================
// Funciones para análisis, normalización y mejora de queries

import {
  type QueryAnalysis,
  type QueryIntent,
  type QueryCategory,
  type QueryEntity,
} from "./types";

// ============================================
// Query Normalization
// ============================================

/**
 * Normaliza una query para búsqueda
 */
export function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .trim()
    // Normalizar espacios
    .replace(/\s+/g, " ")
    // Remover puntuación excepto acentos
    .replace(/[^\w\sáéíóúñü¿?¡!]/gi, " ")
    // Normalizar otra vez después de remover puntuación
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Expande abreviaciones comunes en español
 */
export function expandAbbreviations(query: string): string {
  const abbreviations: Record<string, string> = {
    "q": "que",
    "xq": "porque",
    "pq": "porque",
    "d": "de",
    "dl": "del",
    "pa": "para",
    "tb": "también",
    "tmb": "también",
    "x": "por",
    "k": "que",
    "c/u": "cada uno",
    "aprox": "aproximadamente",
    "cant": "cantidad",
    "prod": "producto",
    "inv": "inventario",
    "fac": "factura",
    "cte": "cliente",
    "prov": "proveedor",
  };

  let expanded = query;
  for (const [abbr, full] of Object.entries(abbreviations)) {
    const regex = new RegExp(`\\b${abbr}\\b`, "gi");
    expanded = expanded.replace(regex, full);
  }

  return expanded;
}

// ============================================
// Keyword Extraction
// ============================================

// Stopwords en español
const STOPWORDS = new Set([
  "el", "la", "los", "las", "un", "una", "unos", "unas",
  "de", "del", "al", "a", "en", "con", "por", "para",
  "que", "qué", "cual", "cuál", "quien", "quién",
  "como", "cómo", "cuando", "cuándo", "donde", "dónde",
  "y", "o", "u", "e", "pero", "sino", "ni", "si",
  "no", "sí", "ya", "muy", "más", "menos", "tan",
  "es", "son", "está", "están", "fue", "fueron", "ser", "estar",
  "mi", "mis", "tu", "tus", "su", "sus", "nuestro", "nuestra",
  "me", "te", "se", "le", "les", "lo", "nos",
  "este", "esta", "estos", "estas", "ese", "esa", "esos", "esas",
  "aquel", "aquella", "aquellos", "aquellas",
  "todo", "toda", "todos", "todas", "algo", "alguien", "alguno",
  "cada", "otro", "otra", "otros", "otras",
  "hay", "tener", "tengo", "tiene", "tienen", "tenemos",
  "hacer", "hago", "hace", "hacen", "hicieron",
  "poder", "puedo", "puede", "pueden", "podemos",
  "ir", "voy", "va", "van", "vamos",
  "ver", "veo", "ve", "ven", "vemos",
  "dar", "doy", "da", "dan", "damos",
  "decir", "digo", "dice", "dicen", "decimos",
  "saber", "sé", "sabe", "saben", "sabemos",
  "querer", "quiero", "quiere", "quieren", "queremos",
  "deber", "debo", "debe", "deben", "debemos",
]);

/**
 * Extrae palabras clave de una query
 */
export function extractKeywords(query: string): string[] {
  const normalized = normalizeQuery(query);
  const words = normalized.split(" ");

  const keywords = words.filter((word) => {
    // Filtrar stopwords
    if (STOPWORDS.has(word)) return false;
    // Filtrar palabras muy cortas
    if (word.length < 3) return false;
    // Filtrar solo números
    if (/^\d+$/.test(word)) return false;
    return true;
  });

  // Eliminar duplicados manteniendo orden
  return [...new Set(keywords)];
}

/**
 * Extrae n-gramas de una query (bigramas y trigramas)
 */
export function extractNgrams(query: string, n: number = 2): string[] {
  const words = normalizeQuery(query).split(" ");
  const ngrams: string[] = [];

  for (let i = 0; i <= words.length - n; i++) {
    const ngram = words.slice(i, i + n).join(" ");
    // Solo incluir si al menos una palabra no es stopword
    const hasKeyword = words
      .slice(i, i + n)
      .some((w) => !STOPWORDS.has(w) && w.length >= 3);
    if (hasKeyword) {
      ngrams.push(ngram);
    }
  }

  return ngrams;
}

// ============================================
// Entity Extraction
// ============================================

/**
 * Extrae entidades de una query
 */
export function extractEntities(query: string): QueryEntity[] {
  const entities: QueryEntity[] = [];

  // Detectar fechas (dd/mm/yyyy, dd-mm-yyyy, etc.)
  const datePatterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g,
    /\b(hoy|ayer|mañana|semana|mes|año)\b/gi,
    /\b(lunes|martes|miércoles|jueves|viernes|sábado|domingo)\b/gi,
    /\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/gi,
  ];

  for (const pattern of datePatterns) {
    const matches = query.matchAll(pattern);
    for (const match of matches) {
      entities.push({
        type: "date",
        value: match[0],
      });
    }
  }

  // Detectar dinero (pesos, dólares)
  const moneyPattern = /\$?\s?(\d{1,3}(?:[,.\s]?\d{3})*(?:[.,]\d{2})?)\s?(pesos|mxn|usd|dólares|dolares)?/gi;
  const moneyMatches = query.matchAll(moneyPattern);
  for (const match of moneyMatches) {
    entities.push({
      type: "money",
      value: match[0].trim(),
      normalized: match[1].replace(/[,\s]/g, ""),
    });
  }

  // Detectar números simples
  const numberPattern = /\b(\d+(?:\.\d+)?)\s*(kg|kilos?|gr|gramos?|lt|litros?|pzas?|piezas?|unidades?)?\b/gi;
  const numberMatches = query.matchAll(numberPattern);
  for (const match of numberMatches) {
    // Evitar duplicados con dinero
    if (!entities.some((e) => e.value.includes(match[1]))) {
      entities.push({
        type: "number",
        value: match[0].trim(),
        normalized: match[1],
      });
    }
  }

  return entities;
}

// ============================================
// Intent Detection
// ============================================

// Patrones para detectar intención
const INTENT_PATTERNS: Record<QueryIntent, RegExp[]> = {
  informational: [
    /^(qué|cual|cuales|quién|dónde|cómo)\s/i,
    /(información|info|datos|detalles)/i,
    /\b(es|son|significa)\b/i,
  ],
  analytical: [
    /(cuánto|cuántos|cuántas|total|suma|promedio|porcentaje)/i,
    /(estadísticas|métricas|análisis|reporte)/i,
    /(comparar|diferencia|vs|versus)/i,
  ],
  procedural: [
    /^(cómo|como)\s+(se\s+)?(hace|hago|puedo)/i,
    /(pasos|proceso|procedimiento|instrucciones)/i,
    /(guía|tutorial|manual)/i,
  ],
  comparative: [
    /(mejor|peor|más|menos)\s+\w+\s+(que|de)/i,
    /(comparar|comparación|diferencia|vs)/i,
    /(entre|versus)/i,
  ],
  temporal: [
    /(hoy|ayer|mañana|semana|mes|año|fecha)/i,
    /(cuándo|cuando|desde|hasta|durante)/i,
    /(último|pasado|próximo|siguiente)/i,
  ],
  specific: [
    /\b(precio|costo|valor)\s+de\b/i,
    /\b(nombre|dirección|teléfono|contacto)\b/i,
    /^(dame|dime|muestra)\s/i,
  ],
  exploratory: [
    /^(muéstrame|lista|enumera|cuáles son)/i,
    /(todos|todas|lista|listado)/i,
    /(explorar|buscar|encontrar)/i,
  ],
};

/**
 * Detecta la intención de una query
 */
export function detectIntent(query: string): QueryIntent {
  const normalized = normalizeQuery(query);

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(query) || pattern.test(normalized)) {
        return intent as QueryIntent;
      }
    }
  }

  return "informational"; // Default
}

// ============================================
// Category Detection
// ============================================

// Palabras clave por categoría
const CATEGORY_KEYWORDS: Record<QueryCategory, string[]> = {
  ventas: [
    "venta", "ventas", "vendí", "vendió", "vendimos", "vender",
    "factura", "facturas", "ticket", "tickets", "cobrar", "cobré",
    "ingreso", "ingresos", "ganancia", "ganancias",
  ],
  inventario: [
    "inventario", "stock", "producto", "productos", "existencia",
    "almacén", "bodega", "mercancía", "artículo", "artículos",
    "entrada", "salida", "merma", "faltante",
  ],
  clientes: [
    "cliente", "clientes", "comprador", "compradores", "consumidor",
    "pedido", "pedidos", "orden", "órdenes", "encargo",
    "contacto", "teléfono", "dirección",
  ],
  finanzas: [
    "dinero", "efectivo", "caja", "banco", "cuenta",
    "gasto", "gastos", "costo", "costos", "egreso", "egresos",
    "utilidad", "margen", "rentabilidad", "flujo",
    "pago", "pagos", "deuda", "deudas", "préstamo",
  ],
  operaciones: [
    "proceso", "operación", "procedimiento", "tarea", "actividad",
    "turno", "horario", "apertura", "cierre",
    "limpieza", "mantenimiento", "servicio",
  ],
  proveedores: [
    "proveedor", "proveedores", "compra", "compras", "pedido",
    "suministro", "abastecimiento", "distribuidor",
    "factura", "pago", "crédito",
  ],
  menu: [
    "menú", "menu", "platillo", "platillos", "comida", "comidas",
    "bebida", "bebidas", "postre", "postres", "entrada", "entradas",
    "especialidad", "especialidades", "promoción",
  ],
  recetas: [
    "receta", "recetas", "ingrediente", "ingredientes",
    "preparación", "preparar", "cocinar", "cocción",
    "porción", "porciones", "rendimiento",
  ],
  empleados: [
    "empleado", "empleados", "trabajador", "personal", "staff",
    "mesero", "cocinero", "cajero", "gerente",
    "sueldo", "salario", "nómina", "horario",
  ],
  general: [],
};

/**
 * Detecta la categoría de una query
 */
export function detectCategory(query: string): QueryCategory {
  const normalized = normalizeQuery(query);
  const words = normalized.split(" ");

  let bestCategory: QueryCategory = "general";
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === "general") continue;

    let score = 0;
    for (const keyword of keywords) {
      if (words.includes(keyword)) {
        score += 2; // Palabra exacta
      } else if (normalized.includes(keyword)) {
        score += 1; // Subcadena
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestCategory = category as QueryCategory;
    }
  }

  return bestCategory;
}

// ============================================
// Language Detection
// ============================================

/**
 * Detecta el idioma de una query (simplificado)
 */
export function detectLanguage(query: string): "es" | "en" | "other" {
  // Palabras comunes en español
  const spanishIndicators = [
    "qué", "cómo", "cuándo", "dónde", "por qué", "cuál",
    "el", "la", "los", "las", "de", "del", "en", "con",
    "es", "son", "está", "hay", "tiene", "hace",
    "hoy", "ayer", "mañana", "semana", "mes", "año",
  ];

  // Palabras comunes en inglés
  const englishIndicators = [
    "what", "how", "when", "where", "why", "which",
    "the", "a", "an", "of", "in", "with",
    "is", "are", "was", "were", "has", "have",
    "today", "yesterday", "tomorrow", "week", "month", "year",
  ];

  const normalized = normalizeQuery(query);
  const words = normalized.split(" ");

  let spanishScore = 0;
  let englishScore = 0;

  for (const word of words) {
    if (spanishIndicators.includes(word)) spanishScore++;
    if (englishIndicators.includes(word)) englishScore++;
  }

  // También verificar caracteres típicos del español
  if (/[áéíóúñü¿¡]/i.test(query)) {
    spanishScore += 2;
  }

  if (spanishScore > englishScore) return "es";
  if (englishScore > spanishScore) return "en";
  return "es"; // Default a español para LATAM
}

// ============================================
// Query Enhancement
// ============================================

/**
 * Mejora una query para mejor recuperación
 */
export function enhanceQuery(query: string): string {
  let enhanced = query;

  // Expandir abreviaciones
  enhanced = expandAbbreviations(enhanced);

  // Agregar sinónimos para términos comunes
  const synonyms: Record<string, string[]> = {
    "ganancia": ["utilidad", "beneficio"],
    "venta": ["ingreso", "facturación"],
    "costo": ["gasto", "precio"],
    "producto": ["artículo", "mercancía"],
    "cliente": ["comprador", "consumidor"],
  };

  for (const [term, syns] of Object.entries(synonyms)) {
    if (enhanced.toLowerCase().includes(term)) {
      // Agregar primer sinónimo entre paréntesis
      enhanced = enhanced.replace(
        new RegExp(`\\b${term}\\b`, "gi"),
        `${term} (${syns[0]})`
      );
      break; // Solo expandir uno para no hacer muy larga la query
    }
  }

  return enhanced;
}

/**
 * Calcula nivel de especificidad de una query (1-5)
 */
export function calculateSpecificity(query: string): number {
  const keywords = extractKeywords(query);
  const entities = extractEntities(query);

  let score = 1;

  // Más keywords = más específico
  if (keywords.length >= 2) score++;
  if (keywords.length >= 4) score++;

  // Entidades añaden especificidad
  if (entities.length >= 1) score++;
  if (entities.length >= 2) score++;

  return Math.min(score, 5);
}

// ============================================
// Full Query Analysis
// ============================================

/**
 * Analiza completamente una query
 */
export function analyzeQuery(query: string): QueryAnalysis {
  const normalized = normalizeQuery(query);

  return {
    originalQuery: query,
    normalizedQuery: normalized,
    keywords: extractKeywords(query),
    entities: extractEntities(query),
    intent: detectIntent(query),
    category: detectCategory(query),
    language: detectLanguage(query),
    specificity: calculateSpecificity(query),
  };
}

// ============================================
// Snippet Generation
// ============================================

/**
 * Genera un snippet relevante del contenido
 */
export function generateSnippet(
  content: string,
  keywords: string[],
  maxLength: number = 200
): string {
  if (content.length <= maxLength) {
    return content;
  }

  // Buscar la primera ocurrencia de cualquier keyword
  const lowerContent = content.toLowerCase();
  let bestPosition = 0;
  let found = false;

  for (const keyword of keywords) {
    const pos = lowerContent.indexOf(keyword.toLowerCase());
    if (pos !== -1) {
      bestPosition = pos;
      found = true;
      break;
    }
  }

  if (!found) {
    // Si no hay keywords, retornar el inicio
    return content.slice(0, maxLength - 3) + "...";
  }

  // Calcular inicio y fin del snippet centrado en el keyword
  const contextBefore = Math.floor(maxLength / 3);
  let start = Math.max(0, bestPosition - contextBefore);
  let end = Math.min(content.length, start + maxLength);

  // Ajustar para no cortar palabras
  if (start > 0) {
    const spacePos = content.indexOf(" ", start);
    if (spacePos !== -1 && spacePos < start + 20) {
      start = spacePos + 1;
    }
  }

  if (end < content.length) {
    const spacePos = content.lastIndexOf(" ", end);
    if (spacePos !== -1 && spacePos > end - 20) {
      end = spacePos;
    }
  }

  let snippet = content.slice(start, end);

  // Agregar elipsis
  if (start > 0) snippet = "..." + snippet;
  if (end < content.length) snippet = snippet + "...";

  return snippet;
}

/**
 * Resalta keywords en un texto (para UI)
 */
export function highlightKeywords(text: string, keywords: string[]): string {
  let highlighted = text;

  for (const keyword of keywords) {
    const regex = new RegExp(`(${keyword})`, "gi");
    highlighted = highlighted.replace(regex, "**$1**");
  }

  return highlighted;
}
