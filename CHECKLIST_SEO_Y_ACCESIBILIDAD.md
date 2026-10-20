# Synclothe — Auditoría y checklist de Clase 1

**Proyecto:** Paso 4, diseño de cuatro páginas del embudo de marketing.  
**Fecha de revisión:** 19 de octubre de 2026.  
**Alcance:** revisión de los archivos HTML, CSS, JS y SVG entregados. Se aplica un checklist de SEO on-page, SEO técnico, UX/accesibilidad y rendimiento. **El documento original de “Clase 1” no fue adjuntado**; se usaron los criterios enumerados en la consigna y prácticas habituales del área.

## 1. Verificación por página

| Criterio | Conciencia `index.html` | Consideración `consideracion.html` | Conversión `conversion.html` | Lealtad `lealtad.html` |
| --- | --- | --- | --- | --- |
| Etiqueta `<title>` propia y descriptiva | ✅ | ✅ | ✅ | ✅ |
| Meta descripción única orientada a intención | ✅ | ✅ | ✅ | ✅ |
| Idioma `<html lang="es">` | ✅ | ✅ | ✅ | ✅ |
| Un solo `<h1>` y secuencia `<h2>/<h3>` sin saltos | ✅ | ✅ | ✅ | ✅ |
| Estructura semántica `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>` | ✅ | ✅ | ✅ | ✅ |
| Atributos `alt` en imágenes | 5/5 | 3/3* | N/A: no hay `<img>` | 8/8 |
| Imágenes SVG estáticas con `width`, `height`, `decoding` y `loading` | 5/5 | 2/2* | N/A | 8/8 |
| Enlace «Saltar al contenido», foco y `aria-current` | ✅ | ✅ | ✅ | ✅ |
| Enlaces internos y recursos locales verificados | ✅ | ✅ | ✅ | ✅ |
| Diseño responsive y movimiento reducido en CSS | ✅ | ✅ | ✅ | ✅ |
| JavaScript compartido cargado con `defer` | ✅ | ✅ | ✅ | ✅ |
| Etiquetas accesibles para formularios y controles | N/A | ✅ | ✅ | ✅ |
| Metadatos sociales básicos OG/Twitter | ✅ | ✅ | ✅ | ✅ |

\* En consideración, la tercera imagen es la vista previa dinámica de un archivo elegido por el usuario. No tiene URL ni dimensiones de archivo hasta que se selecciona una foto; permanece oculta y recibe un `alt` descriptivo al cargarla.

**Resultado de la validación estática:** 0 incidencias de los criterios automatizados. También pasó `node --check app.js` y el análisis sintáctico de CSS. Esto **no equivale** a una auditoría de Lighthouse/WCAG ni garantiza posiciones en Google.

## 2. SEO on-page aplicado

**Conciencia**
- **Title:** `Outfits con tu ropa y armario digital | Synclothe`
- **Meta description:** «Descubre Synclothe: transforma una prenda en cuatro looks, aprovecha tu armario y ahorra tiempo al vestir con apoyo de un estilista humano e IA.»
- **H1:** `Repite tu ropa. No tus looks.`
- **Intención:** descubrimiento de combinaciones y «1 prenda, 4 looks».
- **CTA:** del reto y sus ejemplos a «Cómo funciona».

**Consideración**
- **Title:** `Cómo funciona el armario digital | Synclothe`
- **Meta description:** «Aprende cómo Synclothe combina asesoría de imagen humana e inteligencia artificial para crear outfits con tu propia ropa. Explora la demostración interactiva.»
- **H1:** `Tu armario. Reimaginado.`
- **Intención:** entender el funcionamiento, probar los looks e imaginar el valor/ahorro.
- **CTA:** demostración interactiva → registro.

**Conversión**
- **Title:** `Suscripción y registro de demostración | Synclothe`
- **Meta description:** «Explora la suscripción de Synclothe y crea un perfil de demostración sin pagar ni usar tarjeta bancaria. Conoce la privacidad de este prototipo.»
- **H1:** `Menos estrés. Más tiempo. Más tú.`
- **Intención:** explicar beneficio y resolver dudas de privacidad antes de registrarse.
- **CTA:** crear un perfil simulado sin cargo.

**Lealtad**
- **Title:** `Calendario semanal de outfits y referidos | Synclothe`
- **Meta description:** «Explora un calendario semanal de outfits, guarda tus combinaciones favoritas y conoce el programa de referidos de Synclothe en este dashboard de ejemplo.»
- **H1:** `Tu semana, sin complicaciones.` (si hay un perfil creado, se personaliza con su nombre).
- **Intención:** retención con calendario, favoritos y referidos.
- **CTA:** guardar looks y copiar invitación.

Todas las páginas contienen enlaces hacia otras etapas y metadatos Open Graph/Twitter (`og:title`, `og:description`, `og:locale`, etc.). No se inventaron cifras, precios, reseñas, dominio oficial ni datos de IA reales.

## 3. SEO técnico

- ✅ UTF-8, viewport responsivo, HTML5 y `lang="es"`.
- ✅ Una navegación primaria y una navegación secundaria del embudo identificadas mediante etiquetas semánticas y `aria-label`.
- ✅ Rutas internas locales revisadas: no hay HTML, enlaces de fragmentos o recursos SVG inexistentes.
- ✅ CSS/JS externos compartidos entre las cuatro páginas; script `defer`.
- ✅ Sitio accesible sin frameworks ni servidor de aplicación; ideal para demo académica.
- ⚠️ **Canonical URL:** pendiente de conocer el dominio y la URL pública definitiva. No es correcto inventar una URL canónica mientras se abre desde archivos locales.
- ⚠️ **Sitemap XML, robots.txt y meta robots de producción:** configurar al publicar en un dominio. Si el dashboard contiene datos personales reales, deberá requerir autenticación y no ser indexable.
- ⚠️ **HTTPS, cabeceras CSP, política de caché, redirecciones, compresión y respuestas HTTP:** dependen del hosting. No se pueden verificar desde archivos estáticos en ZIP.
- ⚠️ **Seguimiento de conversiones e indexación real:** requiere una web publicada y, si procede, Search Console/analytics.

## 4. UX y accesibilidad

- ✅ `alt` descriptivos en todas las imágenes; las imágenes creadas dinámicamente reciben texto alternativo cuando existen.
- ✅ Un único `h1` y orden de encabezados lógico.
- ✅ Enlace para saltar navegación repetitiva, visible con teclado.
- ✅ Estilos `:focus-visible` para enlaces, botones, entradas, selectores y desplegables.
- ✅ Controles con etiquetas (`label`, `aria-label`) y uso de `aria-pressed`, `aria-expanded`, `aria-current` en el menú, selección de looks y calendario.
- ✅ Estados y mensajes con `aria-live` para informar de cambios del look o del registro.
- ✅ Menú móvil cerrable mediante la tecla Escape; se devuelve el foco al botón al usar Escape.
- ✅ Respeta `prefers-reduced-motion`; quien lo activa no recibe animaciones de entrada.
- ✅ Las secciones animadas quedan visibles aunque no se ejecute JavaScript.
- ✅ Formulario con validación del navegador y botón para **eliminar el perfil y los favoritos locales de Synclothe**. El correo no se almacena al registrarse.
- ✅ Refuerzo del contraste en algunos textos pequeños, sin eliminar la paleta visual.
- ⚠️ **Pendiente antes de publicación:** prueba manual completa con lector de pantalla, zoom 200–400 %, navegación de teclado en todos los tamaños, matriz de contraste WCAG 2.2 AA y pruebas reales en Safari/iOS/Android. Esta revisión estática no certifica WCAG.

## 5. Rendimiento

- ✅ Imágenes de diseño en formato SVG ligero, incluidas en el proyecto.
- ✅ Atributos `width` y `height` de todas las imágenes estáticas para facilitar reserva de espacio y reducir CLS.
- ✅ `loading="lazy"` y `decoding="async"` fuera de la imagen principal; las ilustraciones principales usan carga prioritaria.
- ✅ Google Fonts solicitadas en el HTML usando `preconnect`, quitando el `@import` de la hoja CSS; `display=swap` para reducir bloqueo por fuentes.
- ✅ JavaScript con `defer`, sin dependencias externas y listeners de scroll pasivos.
- ✅ Alternativa para usuarios con movimiento reducido y textos visibles sin JS.
- ⚠️ **Falta medir:** LCP, INP y CLS reales, Lighthouse móvil/escritorio, costos de fuentes y peso transferido con una URL pública. El código está optimizado, pero no se atribuyen puntuaciones inventadas.

## 6. Evidencia y pasos finales para la entrega

1. Abre las cuatro páginas usando **VS Code → Live Server** o directamente desde `index.html`.
2. Para demostrar SEO en clase: abre el código fuente de cada página y señala `<title>`, `<meta name="description">`, `<h1>`, `<main>`, `<img alt="...">` y los enlaces a la siguiente etapa.
3. Para demostrar accesibilidad: presiona **Tab** hasta «Saltar al contenido principal»; activa el menú móvil, usa **Escape** y prueba los controles de selección de outfits.
4. En **Conversión**, completa el registro simulado y presiona «Borrar mis datos de demostración».
5. Cuando esté publicada con una URL definitiva, agrega las etiquetas `canonical`, crea `sitemap.xml`/`robots.txt` según lo que deba indexarse y ejecuta Lighthouse/PageSpeed Insights y un validador de accesibilidad.

**Conclusión:** el prototipo cumple estáticamente los criterios solicitados de metadatos únicos, imágenes con `alt`, jerarquía de encabezados, HTML semántico, navegación y controles básicos. Las comprobaciones de servidor, indexación, Web Vitals y certificación de accesibilidad son tareas de despliegue y pruebas reales, no resultados verificables en un ZIP local.
