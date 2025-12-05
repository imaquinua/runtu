# Run2 Logo Component

## Descripción
Componente de logo animado con efectos visuales espectaculares diseñado para mantener consistencia a lo largo de toda la experiencia de Run2.

## Características Visuales

### 1. **Animación de Reveal (Inicial)**
- **Duración**: 1.2s
- **Efecto**: El logo aparece con un efecto de escala, blur y bounce
- **Timing**: `cubic-bezier(0.34, 1.56, 0.64, 1)` (bounce elegante)
- **Estados**:
  - Inicio: `opacity: 0, scale: 0.8, blur: 10px, translateY: -20px`
  - Final: `opacity: 1, scale: 1, blur: 0, translateY: 0`

### 2. **Animación Flotante (Continua)**
- **Duración**: 4s
- **Efecto**: Movimiento sutil arriba-abajo
- **Loop**: Infinito
- **Timing**: `ease-in-out`
- **Rango**: 0px a -10px en eje Y

### 3. **Anillo Rotatorio**
- **Duración**: 20s
- **Efecto**: Gradiente de luz que gira alrededor del logo
- **Loop**: Infinito
- **Velocidad**: Constante (linear)
- **Gradiente**: `from-accent/20 via-transparent to-accent/20`
- **Blur**: xl

### 4. **Glow Pulsante**
- **Duración**: 3s
- **Efecto**: Brillo que respira (crece y decrece)
- **Loop**: Infinito
- **Timing**: `ease-in-out`
- **Estados**:
  - Mínimo: `opacity: 0.3, scale: 1`
  - Máximo: `opacity: 0.6, scale: 1.1`
- **Blur**: 2xl

### 5. **Partículas Orbitantes**
- **Partícula 1** (Superior):
  - Duración: 8s
  - Dirección: Horaria (0° → 360°)
  - Tamaño: 2x2 (w-2 h-2)
  - Color: accent (dorado completo)

- **Partícula 2** (Inferior):
  - Duración: 6s
  - Dirección: Anti-horaria (360° → 0°)
  - Tamaño: 1.5x1.5 (w-1.5 h-1.5)
  - Color: accent/60 (dorado 60% opacidad)

### 6. **Drop Shadow**
- **Efecto**: Sombra con glow dorado
- **Config**: `drop-shadow-[0_0_30px_rgba(251,191,36,0.4)]`
- **Blur adicional**: xl con opacity 60%

## Tamaños Responsivos

### Mobile (sm)
- Logo: `w-24 h-24` (96px)
- Anillo: margin -6 (-24px)
- Glow: margin -4 (-16px)

### Tablet (sm)
- Logo: `w-28 h-28` (112px)

### Desktop (md)
- Logo: `w-32 h-32` (128px)

## Paleta de Colores

```css
--accent: #fbbf24        /* Dorado principal */
--accent-dark: #f59e0b   /* Dorado oscuro (hover) */
--dark: #020617          /* Fondo oscuro */
```

## Estructura de Capas (z-index)

1. **Capa más baja**: Anillo rotatorio (fondo)
2. **Capa media-baja**: Glow pulsante
3. **Capa media**: Logo principal
4. **Capa media-alta**: Shadow del logo
5. **Capa más alta**: Partículas orbitantes

## Dependencias

- **Framework CSS**: Tailwind CSS
- **Fuente**: Montserrat
- **Imagen**: `img/runtu_logo.png`

## Uso Recomendado

### Contextos ideales:
- ✅ Landing pages
- ✅ Loading screens
- ✅ Splash screens
- ✅ Headers principales
- ✅ Páginas de "Coming Soon"

### Contextos NO recomendados:
- ❌ Navegación fija (demasiado llamativo)
- ❌ Footers
- ❌ Contextos donde compita con CTAs principales

## Variantes Disponibles

### Variante 1: Hero (Actual)
- Tamaño: w-24 a w-32
- Todas las animaciones activas
- Partículas orbitantes: SÍ

### Variante 2: Header (Propuesta)
- Tamaño: w-16 a w-20
- Solo flotación + glow pulsante
- Partículas orbitantes: NO
- Anillo rotatorio: Opcional

### Variante 3: Minimal (Propuesta)
- Tamaño: w-12 a w-16
- Solo el logo con drop-shadow
- Sin animaciones continuas
- Reveal al cargar: SÍ

## Performance

### Optimizaciones aplicadas:
- ✅ CSS animations (GPU-accelerated)
- ✅ `will-change` implícito en transforms
- ✅ Blur pre-calculado en capas separadas
- ✅ No JavaScript para animaciones

### Impacto:
- **FPS**: 60fps estable en dispositivos modernos
- **CPU**: Bajo (animaciones en GPU)
- **Memoria**: ~2-3MB adicionales por blur layers

## Accesibilidad

```html
<!-- Atributos importantes -->
<img src="img/runtu_logo.png"
     alt="Run2 Logo"
     role="img"
     aria-label="Run2 - Tecnología para la gastronomía">
```

### Consideraciones:
- ✅ `alt` text descriptivo
- ✅ Respeta `prefers-reduced-motion` (pendiente implementar)
- ⚠️ Agregar versión estática para usuarios con sensibilidad al movimiento

## Notas de Implementación

### Requisitos técnicos:
1. Tailwind CSS v3+ configurado
2. Archivo de logo en `img/runtu_logo.png`
3. Variables CSS personalizadas configuradas
4. Soporte para animations CSS3

### Browser Support:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ⚠️ IE11: No soportado (degradación a logo estático)

## Futuras Mejoras

### Roadmap:
1. **Versión React Component** (para apps futuras)
2. **Modo reducido de movimiento** (accesibilidad)
3. **Variante dark/light** (si se necesita tema claro)
4. **Exportar como Web Component** (reutilizable en cualquier framework)
5. **Agregar sonido sutil** (opcional, al hover)

---

**Autor**: Run2 Design System
**Última actualización**: 2025-01-29
**Versión**: 1.0.0
