# Jesús Delgado · Fotografía — Landing Page

Landing page de lujo y portafolio de alta conversión. Sitio estático (HTML/CSS/JS, sin compilación) con leads guardados en Supabase.

---

## Arquitectura

```
index.html               Todo el contenido (SEO): hero, artista, portafolio, historia
                         destacada, servicios, testimonios, FAQ, reserva, footer.
                         Incluye el set de íconos SVG propio (sprite) al inicio del <body>.
css/styles.css           Sistema de diseño "Luxury Editorial Dark" (tokens en :root)
js/config.js             ⚙️ Claves de Supabase + número de WhatsApp
js/supabase-client.js    Cliente Supabase + LeadService.submit()
js/main.js               Solo comportamiento: slider, filtros, lightbox, modal, formularios
supabase/schema.sql      Tabla lead_cotizaciones + seguridad RLS
assets/img/<sesión>/     Fotos WebP: grande (1800 px) y "-sm" (760 px)
assets/img/og-cover.jpg  Imagen de preview para WhatsApp / Facebook (1200×630)
assets/favicon.svg       Monograma JD
robots.txt, sitemap.xml  SEO (el sitemap incluye las 30 imágenes del portafolio)
404.html                 Página de error con enlace de vuelta al inicio
site.webmanifest         Nombre e íconos al guardar la web en el celular (icon-180/512.png)
vercel.json              Caché de imágenes (30 días) y cabeceras de seguridad
```

**Decisiones clave**
- **Contenido en HTML, no en JavaScript.** Google lee el portafolio, los testimonios y las preguntas frecuentes sin ejecutar JS.
- **Íconos SVG propios** (`<symbol>` en index.html) con retícula de 24 px y trazo de 1.25. No dependen de ninguna librería de íconos. Uso: `<svg class="ic"><use href="#i-calendar"/></svg>`.
- **WebP** en todas las imágenes: pesan un 35 % menos que en JPG.
- **Sin Tailwind**: el CSS propio es más liviano y no muestra avisos en consola.
- Scripts con `defer` y versiones fijas en el CDN.

---

## Pasos para ponerla en producción

### 1. Verla en local
```bash
cd "Ldin Page JESUS DELGADO"
python -m http.server 8080
# Abrir http://localhost:8080
```
Sin Supabase, el formulario funciona en **modo demo**: simula el envío y muestra el mensaje de éxito.

### 2. Conectar Supabase (base de datos de clientes)
1. Crear una cuenta y un proyecto gratuito en https://supabase.com (región: São Paulo, la más cercana a Perú).
2. Ir a **SQL Editor → New query**, pegar todo `supabase/schema.sql` y pulsar **Run**.
3. Ir a **Project Settings → API** y copiar:
   - **Project URL** → `SUPABASE_URL` en `js/config.js`
   - **anon / publishable key** → `SUPABASE_ANON_KEY` en `js/config.js`
4. Enviar una solicitud de prueba desde la web y comprobar que aparece en **Table Editor → lead_cotizaciones**.

> La anon key es pública por diseño. La seguridad RLS solo permite **insertar**: desde el navegador nadie puede leer, editar ni borrar los leads. Jesús los ve desde el panel de Supabase.

**Avisos por correo de cada lead nuevo (opcional):** Supabase → Database → Webhooks → crear un webhook en `INSERT` de `lead_cotizaciones` hacia Zapier, Make o n8n, que envía el email o WhatsApp a Jesús.

### 3. Personalizar el contenido (antes de publicar)
- [ ] **Testimonios** (index.html, sección `#testimonios`): son de ejemplo. Reemplazarlos por reseñas reales, con permiso del cliente.
- [ ] **Métricas** (`data-count` en la sección `#artista`): confirmar años de experiencia y eventos cubiertos.
- [ ] **Preguntas frecuentes**: confirmar plazos, adelanto y políticas. Si cambian, actualizar también el bloque `FAQPage` del JSON-LD en el `<head>`.
- [ ] **Paquetes**: confirmar los ítems incluidos (drone, fotolibro, etc.).
- [ ] **Ciudad**: añadir `addressLocality` (ciudad) y `addressRegion` en el JSON-LD → `PostalAddress`. Es clave para aparecer en búsquedas locales.
- [ ] **Comercial**: sumar fotos de trabajos comerciales reales (hoy solo hay 2 de detalle).

### 4. Dominio y publicación
1. Comprar el dominio (ej. `jesusdelgadofotografia.com`, o `.pe` en punto.pe).
2. **Buscar y reemplazar** `jesusdelgado.vercel.app` (dominio actual) por el dominio propio en `index.html`, `robots.txt` y `sitemap.xml`.
3. Publicar en **Vercel** o **Netlify** (gratis): arrastrar la carpeta, o conectar un repositorio de GitHub. No subir las carpetas originales de fotos (solo `assets/`, `css/`, `js/` y los archivos de la raíz).
4. Conectar el dominio desde el panel del hosting (el HTTPS se activa automáticamente).

### 5. SEO: lo que más impacto tiene
1. **Google Business Profile** (https://business.google.com). Es lo más importante para el SEO local:
   - Categoría principal: *Fotógrafo de bodas*. Secundarias: *Fotógrafo*, *Estudio fotográfico*.
   - Mismo nombre, teléfono y web que en la landing.
   - Subir 20 o más fotos del portafolio y pedir reseñas a cada cliente (copiar el enlace "Pedir reseñas").
2. **Google Search Console** (https://search.google.com/search-console):
   - Añadir la propiedad del dominio y verificarla (registro DNS o etiqueta HTML).
   - Enviar `https://TU-DOMINIO/sitemap.xml`.
   - Con "Inspección de URL", pedir la indexación de la página principal.
3. **Validar** los datos estructurados en https://search.google.com/test/rich-results y la vista previa al compartir en https://developers.facebook.com/tools/debug/.
4. **Rendimiento**: medir en https://pagespeed.web.dev (objetivo: 90 o más en móvil).
5. **Constancia**: en la bio de Instagram y en Facebook, poner el enlace a la web.

### 6. Medición (opcional pero recomendado)
- **Google Analytics 4** o **Meta Pixel**: pegar su script antes de `</head>`.
- Eventos útiles: clic en WhatsApp y envío del formulario. En `js/main.js` → `sendLead()`, añadir `gtag('event','generate_lead')` cuando `res.ok` sea verdadero.

---

## Mantenimiento

### Agregar fotos al portafolio
1. Exportar en **WebP**: versión grande (~1800 px de lado mayor, calidad 80) y versión `-sm` (~760 px). Herramienta gratuita: https://squoosh.app
2. Copiarlas a `assets/img/<carpeta>/`.
3. En `index.html`, dentro de `<div class="masonry" id="gallery">`, duplicar un bloque `<figure class="tile">` y cambiar:
   `data-cat` (bodas | sociales | retratos | comercial), `href`, `src`, `alt`, `width`/`height` de la miniatura, `data-title` y los textos.
4. Opcional: añadir la imagen a `sitemap.xml`.

Los contadores de cada filtro se calculan solos.

### Cambiar colores o tipografía
Todo está en las variables de `:root`, al inicio de `css/styles.css`.
