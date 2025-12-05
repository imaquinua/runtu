# Run2 - Design System & Components

Documentación de la estructura de componentes y sistema de diseño de Run2.

## 📁 Estructura del Proyecto

```
runtu.tech/
├── index.html                      # Landing page principal
├── img/                            # Recursos de imágenes
│   ├── runtu_logo.png             # Logo principal de Run2
│   ├── h.png                       # Imagen auxiliar
│   └── h2.png                      # Imagen auxiliar
├── components/                     # Componentes reutilizables
│   ├── logo.html                  # Templates HTML del logo
│   └── logo-animations.css        # Animaciones del logo
├── docs/                          # Documentación
│   └── logo-component.md          # Documentación completa del logo
└── README-COMPONENTS.md           # Este archivo
```

## 🎨 Sistema de Diseño

### Paleta de Colores

```css
/* Colores principales */
--dark: #020617          /* Fondo oscuro principal */
--accent: #fbbf24        /* Dorado - Color principal de marca */
--accent-dark: #f59e0b   /* Dorado oscuro - Hover states */

/* Colores de texto */
--text-primary: #ffffff      /* Blanco - Texto principal */
--text-secondary: #ffffff99  /* Blanco 60% - Texto secundario */
--text-muted: #ffffff66      /* Blanco 40% - Texto terciario */
```

### Tipografía

**Fuente principal**: Montserrat

```css
/* Jerarquía tipográfica */
font-family: 'Montserrat', sans-serif;

/* Pesos disponibles */
- 300: Light (subtítulos sutiles)
- 400: Regular (texto body)
- 500: Medium (énfasis leve)
- 600: SemiBold (labels, botones)
- 700: Bold (headings secundarios)
- 800: ExtraBold (headings principales)
- 900: Black (mega headings, hero text)
```

### Espaciado

Sistema basado en Tailwind CSS con espaciado de 4px (0.25rem):

```
- Micro: 2px (0.5)
- Pequeño: 4px (1), 8px (2), 12px (3)
- Mediano: 16px (4), 20px (5), 24px (6)
- Grande: 32px (8), 48px (12), 64px (16)
- Extra grande: 96px (24), 128px (32)
```

## 🧩 Componentes Disponibles

### 1. Logo Animado

**Ubicación**: `components/logo.html` + `components/logo-animations.css`

**Variantes disponibles**:
- **Hero**: Para landing pages y coming soon
- **Header**: Para navegación y headers
- **Minimal**: Para footers y contextos pequeños
- **Loading**: Para splash screens y estados de carga

**Documentación completa**: [`docs/logo-component.md`](docs/logo-component.md)

**Quick Start**:

```html
<!-- Incluir CSS -->
<link rel="stylesheet" href="components/logo-animations.css">

<!-- Usar componente (Variante Hero) -->
<div class="mb-16 animate-logo-reveal">
    <div class="relative inline-block">
        <div class="absolute inset-0 -m-6 animate-spin-slow">
            <div class="absolute inset-0 rounded-full bg-gradient-to-r from-accent/20 via-transparent to-accent/20 blur-xl"></div>
        </div>
        <div class="absolute inset-0 -m-4 animate-pulse-glow">
            <div class="absolute inset-0 rounded-full bg-accent/10 blur-2xl"></div>
        </div>
        <div class="relative animate-float">
            <div class="relative inline-block">
                <div class="absolute inset-0 blur-xl opacity-60 bg-accent/30 rounded-full"></div>
                <img src="img/runtu_logo.png" alt="Run2 Logo"
                     class="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 object-contain">
            </div>
        </div>
        <div class="absolute inset-0 animate-orbit">
            <div class="absolute top-0 left-1/2 w-2 h-2 bg-accent rounded-full -ml-1"></div>
        </div>
        <div class="absolute inset-0 animate-orbit-reverse">
            <div class="absolute bottom-0 left-1/2 w-1.5 h-1.5 bg-accent/60 rounded-full -ml-1"></div>
        </div>
    </div>
</div>
```

## 🎬 Animaciones

### Sistema de Animaciones

Todas las animaciones están optimizadas para GPU y respetan `prefers-reduced-motion`.

**Animaciones disponibles**:

| Animación | Duración | Loop | Uso |
|-----------|----------|------|-----|
| `logo-reveal` | 1.2s | No | Aparición inicial |
| `float` | 4s | Infinito | Flotación sutil |
| `spin-slow` | 20s | Infinito | Rotación lenta |
| `pulse-glow` | 3s | Infinito | Respiración de glow |
| `orbit` | 8s | Infinito | Órbita horaria |
| `orbit-reverse` | 6s | Infinito | Órbita anti-horaria |

**Clases CSS**:
```css
.animate-logo-reveal
.animate-float
.animate-spin-slow
.animate-pulse-glow
.animate-orbit
.animate-orbit-reverse
```

## 🚀 Uso en Diferentes Frameworks

### Vanilla HTML/CSS
Ver ejemplos en `components/logo.html`

### React/Next.js

```jsx
import './components/logo-animations.css';

export default function Run2Logo({ variant = 'hero', size = 'md' }) {
  return (
    <div className="animate-logo-reveal">
      {/* Ver componente completo en logo.html */}
    </div>
  );
}
```

### Vue.js

```vue
<template>
  <div class="animate-logo-reveal">
    <!-- Ver componente completo en logo.html -->
  </div>
</template>

<style src="./components/logo-animations.css"></style>
```

### Tailwind + AlpineJS

```html
<div x-data="{ variant: 'hero' }" class="animate-logo-reveal">
  <!-- Ver componente completo en logo.html -->
</div>
```

## 📋 Guidelines de Uso

### ✅ DO (Hacer)

- Usar el logo con fondo oscuro para mejor contraste
- Mantener espacio de respiro alrededor del logo (mínimo 24px)
- Usar la variante correcta según el contexto
- Respetar las proporciones del logo
- Incluir alt text descriptivo

### ❌ DON'T (No hacer)

- No cambiar los colores del logo
- No distorsionar las proporciones
- No aplicar filtros adicionales no documentados
- No usar el logo sobre fondos claros sin ajustar
- No remover las animaciones sin usar la variante minimal

## 🔧 Configuración de Tailwind

Asegúrate de tener esta configuración en tu `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        'montserrat': ['Montserrat', 'sans-serif'],
      },
      colors: {
        'dark': '#020617',
        'accent': '#fbbf24',
        'accent-dark': '#f59e0b',
      },
    }
  }
}
```

## 📱 Responsive Design

### Breakpoints de Tailwind

```
sm: 640px   (Mobile landscape, tablets)
md: 768px   (Tablets landscape, small laptops)
lg: 1024px  (Laptops)
xl: 1280px  (Desktops)
2xl: 1536px (Large desktops)
```

### Tamaños Responsivos del Logo

```css
/* Mobile */
w-24 h-24  (96px)

/* Tablet */
sm:w-28 sm:h-28  (112px)

/* Desktop */
md:w-32 md:h-32  (128px)
```

## 🎯 Performance

### Optimizaciones Aplicadas

- ✅ Animaciones en GPU (`transform`, `opacity`)
- ✅ `will-change` en elementos animados
- ✅ Blur pre-calculado en capas separadas
- ✅ No JavaScript para animaciones (solo CSS)
- ✅ Lazy loading de imágenes (cuando aplique)

### Métricas Esperadas

```
FPS: 60fps constante
CPU: <5% en animaciones
Memoria: ~2-3MB adicionales por instancia
Tiempo de carga: <100ms (con imagen optimizada)
```

## ♿ Accesibilidad

### Características Implementadas

- ✅ Alt text descriptivo en todas las imágenes
- ✅ Soporte para `prefers-reduced-motion`
- ⏳ Pendiente: Modo de alto contraste
- ⏳ Pendiente: Dark/Light theme variants

### Ejemplo de Implementación Accesible

```html
<img src="img/runtu_logo.png"
     alt="Run2 - Tecnología de IA para la gastronomía peruana"
     role="img"
     aria-label="Run2 Logo">
```

## 📦 Instalación y Setup

### Opción 1: Copiar archivos

1. Copiar `components/logo-animations.css` a tu proyecto
2. Copiar `img/runtu_logo.png` a tu carpeta de imágenes
3. Incluir el CSS en tu HTML o importar en tu bundle
4. Usar el template de `components/logo.html`

### Opción 2: CDN (futuro)

```html
<!-- Pendiente: Publicar en CDN -->
<link rel="stylesheet" href="https://cdn.run2.tech/components/logo-animations.css">
```

## 🔄 Versionado

**Sistema de versiones**: Semantic Versioning (SemVer)

```
Versión actual: 1.0.0

MAJOR.MINOR.PATCH
  │     │     │
  │     │     └─ Bug fixes, optimizaciones
  │     └─────── Nuevas features, variantes
  └───────────── Breaking changes
```

## 📝 Changelog

### v1.0.0 (2025-01-29)
- ✨ Componente de logo animado inicial
- ✨ 4 variantes: Hero, Header, Minimal, Loading
- ✨ 6 animaciones: Reveal, Float, Spin, Pulse, Orbit x2
- 📚 Documentación completa
- ♿ Soporte básico de accesibilidad

## 🗺️ Roadmap

### Próximas versiones

**v1.1.0**
- [ ] Componente React oficial
- [ ] Componente Vue oficial
- [ ] Variante para tema claro
- [ ] Modo de alto contraste

**v1.2.0**
- [ ] Web Component (framework-agnostic)
- [ ] Variantes con sonido
- [ ] Configuración dinámica vía props/attributes
- [ ] Integración con Storybook

**v2.0.0**
- [ ] Sistema completo de componentes UI
- [ ] Design tokens exportables
- [ ] Figma plugin
- [ ] NPM package

## 🤝 Contribuciones

Este es un proyecto interno de Run2. Para sugerencias o mejoras:

1. Revisar la documentación existente
2. Crear un issue describiendo la mejora
3. Seguir las guidelines de código
4. Mantener backward compatibility

## 📞 Contacto

**Email**: hola@runtu.tech
**Proyecto**: Run2 - Tecnología para la Gastronomía

---

**Última actualización**: 2025-01-29
**Versión**: 1.0.0
**Autor**: Run2 Design System Team
