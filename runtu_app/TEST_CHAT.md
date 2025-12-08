# Test de Chat - Fase 3

**Fecha:** ___________
**Tester:** ___________
**Ambiente:** [ ] Local [ ] Staging [ ] Production
**URL:** ___________

---

## Smoke Test (5 min)

Prueba rápida para verificar que las funciones principales funcionan:

- [ ] Abrir /app/chat
- [ ] Enviar "Hola"
- [ ] Recibir respuesta con streaming
- [ ] Enviar pregunta sobre negocio
- [ ] Ver fuentes citadas (si aplica)
- [ ] Abrir sidebar de conversaciones
- [ ] Crear nueva conversación

**Smoke Test:** PASS / FAIL

---

## 1. UI de Chat

### 1.1 Carga Inicial
- [ ] Página /app/chat carga correctamente
- [ ] Estado vacío muestra mensaje de bienvenida ("¡Hola! Soy Runtu")
- [ ] Icono de Runtu con Sparkles aparece
- [ ] No hay errores en consola

### 1.2 Sugerencias Iniciales
- [ ] 4 cards de sugerencias aparecen
- [ ] Cada card tiene icono, texto y descripción
- [ ] Click en sugerencia llena el input
- [ ] Sugerencias contextuales aparecen (lunes/fin de mes si aplica)

### 1.3 Input de Mensaje
- [ ] Input de mensaje funciona y es responsive
- [ ] Placeholder muestra texto correcto
- [ ] Enter envía mensaje
- [ ] Shift+Enter crea nueva línea
- [ ] Botón de enviar cambia a activo cuando hay texto
- [ ] Input se deshabilita durante respuesta
- [ ] Input se limpia después de enviar

### 1.4 Mensajes
- [ ] Mensaje del usuario aparece inmediatamente (burbuja derecha)
- [ ] Indicador de "escribiendo" aparece mientras espera
- [ ] Respuesta de Runtu aparece (burbuja izquierda con avatar)
- [ ] Scroll automático al nuevo mensaje
- [ ] Markdown se renderiza correctamente (negritas, listas, etc.)

### 1.5 Mobile
- [ ] Layout funciona en pantalla pequeña
- [ ] Sidebar se colapsa/oculta en mobile
- [ ] Teclado virtual no tapa el input
- [ ] Touch en sugerencias funciona

---

## 2. Streaming

- [ ] Respuesta aparece token por token (no todo de golpe)
- [ ] Cursor parpadeante mientras streaming
- [ ] Texto "Generando respuesta..." aparece abajo
- [ ] Botón "Detener" aparece durante streaming
- [ ] Click en "Detener" cancela el stream
- [ ] Mensaje parcial se conserva tras cancelar
- [ ] Error de stream se maneja gracefully (mensaje de error)

---

## 3. RAG y Contexto

### 3.1 Con Datos del Negocio
- [ ] Preguntas sobre datos del negocio dan respuestas relevantes
- [ ] Runtu menciona información específica de los archivos
- [ ] Números y datos citados son correctos
- [ ] Respuestas son útiles y accionables

### 3.2 Sin Datos
- [ ] Preguntas sin datos relevantes indican "no tengo información"
- [ ] No inventa datos que no existen
- [ ] Sugiere qué tipo de archivo subir para responder

### 3.3 Preguntas Generales
- [ ] Preguntas fuera de contexto reciben respuesta breve
- [ ] Redirige amablemente hacia temas del negocio

---

## 4. Fuentes

- [ ] Fuentes aparecen debajo de respuestas relevantes
- [ ] Sección "Fuentes consultadas" es colapsable
- [ ] Indicador de confianza (color) es visible
- [ ] Click en fuente abre modal con contenido completo
- [ ] Modal muestra: nombre, tipo, preview, contenido
- [ ] Botón "Copiar" funciona
- [ ] Botón "Ver archivo original" lleva al archivo
- [ ] Modal se cierra con X o click afuera

---

## 5. Historial de Conversaciones

### 5.1 Sidebar
- [ ] Sidebar muestra lista de conversaciones
- [ ] Conversación actual está destacada
- [ ] Botón "Nueva conversación" funciona
- [ ] Click en conversación anterior la carga
- [ ] Hover muestra botón de eliminar
- [ ] Eliminar conversación muestra confirmación
- [ ] Eliminar remueve de la lista

### 5.2 Persistencia
- [ ] Conversaciones se guardan en BD
- [ ] Recargar página mantiene conversación actual
- [ ] URL cambia con ID de conversación (?id=xxx)
- [ ] Navegar a URL con ID carga esa conversación
- [ ] Mensajes anteriores se cargan correctamente

### 5.3 Títulos
- [ ] Título se genera automáticamente tras primer intercambio
- [ ] Título es descriptivo y corto
- [ ] Título se muestra en sidebar

---

## 6. Sugerencias de Seguimiento (Follow-ups)

- [ ] Después de respuesta, aparece "Pensando sugerencias..."
- [ ] 2-3 pills de sugerencias aparecen
- [ ] Sugerencias son relevantes al tema
- [ ] Click en sugerencia la envía como mensaje
- [ ] Sugerencias desaparecen al enviar nuevo mensaje
- [ ] Sugerencias se limpian al cambiar de conversación

---

## 7. Manejo de Errores

- [ ] Error de API muestra mensaje amigable (rojo)
- [ ] Se puede reintentar después de error
- [ ] Sin conexión muestra estado apropiado
- [ ] Token expirado redirige a login
- [ ] Rate limiting muestra mensaje de espera

---

## 8. Seguridad

- [ ] Usuario A no puede ver chats de Usuario B
- [ ] API /api/chat requiere autenticación
- [ ] API /api/conversations filtra por business
- [ ] Contexto RAG solo incluye datos del business del usuario
- [ ] No se puede acceder a conversación por ID de otro usuario

---

## 9. Casos de Prueba Específicos

| # | Input | Expected Output | Resultado |
|---|-------|-----------------|-----------|
| 1 | "Hola" | Saludo + pregunta sobre qué quiere saber | [ ] Pass [ ] Fail |
| 2 | "¿Cómo me fue en julio?" (con datos) | Resumen con números reales | [ ] Pass [ ] Fail |
| 3 | "¿Cómo me fue en julio?" (sin datos) | "No tengo información sobre julio" | [ ] Pass [ ] Fail |
| 4 | "¿Cuál es la capital de Francia?" | Respuesta breve + redirigir a negocio | [ ] Pass [ ] Fail |
| 5 | Texto muy largo (5000+ chars) | Se maneja sin error, se trunca si necesario | [ ] Pass [ ] Fail |
| 6 | "¿¡Ñoño ñandú!" (caracteres especiales) | Se procesan correctamente | [ ] Pass [ ] Fail |
| 7 | "" (mensaje vacío) | No se envía, input permanece deshabilitado | [ ] Pass [ ] Fail |
| 8 | Solo espacios "   " | No se envía | [ ] Pass [ ] Fail |
| 9 | XSS: `<script>alert('xss')</script>` | Se escapa, no ejecuta | [ ] Pass [ ] Fail |
| 10 | SQL injection: `'; DROP TABLE messages;--` | Se maneja como texto normal | [ ] Pass [ ] Fail |

---

## 10. Métricas de Performance

| Métrica | Target | Actual | Status |
|---------|--------|--------|--------|
| Tiempo hasta primera respuesta | < 3s | ___s | [ ] OK [ ] Lento |
| Fluidez de streaming | Sin pausas largas | ___ | [ ] OK [ ] Irregular |
| Carga de conversación existente | < 1s | ___s | [ ] OK [ ] Lento |
| Carga de lista de conversaciones | < 1s | ___s | [ ] OK [ ] Lento |
| Similarity promedio RAG | > 0.7 | ___ | [ ] OK [ ] Bajo |

---

## 11. Queries de Diagnóstico (ejecutar en Supabase)

```sql
-- Conversaciones por business
SELECT b.name, COUNT(c.id) as conversations
FROM businesses b
LEFT JOIN conversations c ON b.id = c.business_id
GROUP BY b.id, b.name;

-- Mensajes recientes
SELECT m.role, LEFT(m.content, 50) as preview, m.created_at
FROM messages m
ORDER BY m.created_at DESC
LIMIT 20;

-- Conversaciones sin título
SELECT id, created_at FROM conversations WHERE title IS NULL;

-- Mensajes con fuentes
SELECT COUNT(*) as with_sources FROM messages WHERE sources IS NOT NULL AND sources != '[]';

-- Chunks usados para RAG (últimas 24h)
SELECT COUNT(DISTINCT kc.id) as chunks_used
FROM knowledge_chunks kc
WHERE kc.updated_at > NOW() - INTERVAL '24 hours';
```

---

## Bugs Encontrados

| # | Descripción | Severidad | Archivo/Línea | Status |
|---|-------------|-----------|---------------|--------|
| 1 | | [ ] Critical [ ] High [ ] Medium [ ] Low | | [ ] Open [ ] Fixed |
| 2 | | [ ] Critical [ ] High [ ] Medium [ ] Low | | [ ] Open [ ] Fixed |
| 3 | | [ ] Critical [ ] High [ ] Medium [ ] Low | | [ ] Open [ ] Fixed |
| 4 | | [ ] Critical [ ] High [ ] Medium [ ] Low | | [ ] Open [ ] Fixed |
| 5 | | [ ] Critical [ ] High [ ] Medium [ ] Low | | [ ] Open [ ] Fixed |

---

## Notas y Observaciones

```
(Anotar cualquier comportamiento inesperado, sugerencias de mejora, o cosas a investigar)




```

---

## Resultado Final

**UI Chat:** [ ] PASS [ ] FAIL
**Streaming:** [ ] PASS [ ] FAIL
**RAG:** [ ] PASS [ ] FAIL
**Fuentes:** [ ] PASS [ ] FAIL
**Historial:** [ ] PASS [ ] FAIL
**Follow-ups:** [ ] PASS [ ] FAIL
**Errores:** [ ] PASS [ ] FAIL
**Seguridad:** [ ] PASS [ ] FAIL

---

## RESULTADO FASE 3: [ ] PASS [ ] FAIL

**Firma del tester:** ___________
**Fecha de validación:** ___________
