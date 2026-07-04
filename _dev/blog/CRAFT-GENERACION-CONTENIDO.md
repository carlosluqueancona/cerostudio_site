# Blog Tomate.MX — Generacion Automatica de Posts y Portadas

## Arquitectura del sistema

```
blog/
  contenido-propuesta.json   ← Fuente de datos (posts en JSON)
  import.php                 ← Importa JSON → MySQL
  gen-covers.php             ← Genera SVG covers para posts sin imagen
  install.php                ← Crea tablas + usuario admin
  config.php                 ← Credenciales DB y constantes
  includes/
    db.php                   ← PDO singleton (utf8mb4)
    functions.php            ← slugify(), get_posts(), get_category_by_slug()...
```

---

## 1. Esquema de base de datos

### Tabla `blog_posts`

```sql
CREATE TABLE blog_posts (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) NOT NULL UNIQUE,
    excerpt         TEXT,
    content         LONGTEXT,
    featured_image  VARCHAR(500) DEFAULT NULL,
    featured_image_alt VARCHAR(255) DEFAULT '',
    category        VARCHAR(100) DEFAULT '',
    meta_title      VARCHAR(255) DEFAULT '',
    meta_description VARCHAR(320) DEFAULT '',
    status          ENUM('draft','published') DEFAULT 'draft',
    author_id       INT UNSIGNED,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at    DATETIME DEFAULT NULL,
    INDEX idx_slug (slug),
    INDEX idx_status_published (status, published_at),
    INDEX idx_category (category)
);
```

### Tabla `blog_users`

```sql
CREATE TABLE blog_users (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name  VARCHAR(100) NOT NULL DEFAULT '',
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 2. Formato JSON para importacion masiva

Cada post es un objeto con estos campos. **Todos son obligatorios** excepto `featured_image`.

```json
{
  "title": "Titulo del articulo",
  "slug": "titulo-del-articulo",
  "category": "diseno web",
  "status": "draft",
  "meta_title": "Titulo SEO — max 60 chars recomendado",
  "meta_description": "Descripcion SEO — max 155 chars recomendado",
  "featured_image_alt": "Texto alternativo de la imagen destacada",
  "excerpt": "Resumen corto para listado y meta description. 1-3 oraciones.",
  "content": "<h2>Contenido HTML completo</h2><p>Con formato.</p>"
}
```

### Campos detallados

| Campo | Tipo | Limite | Notas |
|-------|------|--------|-------|
| `title` | string | 255 chars | Titulo visible del post |
| `slug` | string | 255 chars | URL amigable. Solo `a-z`, `0-9`, `-`. Sin acentos. Unico. |
| `category` | string | 100 chars | **Texto libre en minusculas** con acentos: `"diseno web"`, `"ecommerce"`, `"seo"`, `"marketing digital"`, `"casos de exito"` |
| `status` | enum | `draft` o `published` | `draft` = no visible en blog. `published` = visible + fecha de publicacion auto. |
| `meta_title` | string | 255 chars | Override del `<title>`. Si vacio, usa `title`. Recomendado: 50-60 chars. |
| `meta_description` | string | 320 chars | Override del meta description. Si vacio, usa `excerpt`. Recomendado: 120-155 chars. |
| `featured_image_alt` | string | 255 chars | Alt text para la imagen destacada. Descriptivo, con keyword si es natural. |
| `excerpt` | text | sin limite | Resumen corto. Se trunca a 160 chars en el listado. 1-3 oraciones. |
| `content` | longtext | sin limite | HTML completo del articulo. Ver seccion "Tags HTML permitidos". |
| `featured_image` | string | 500 chars | **Opcional.** Ruta relativa: `/blog/uploads/imagen.webp`. Si se omite, `gen-covers.php` genera un SVG placeholder. |

### Tags HTML permitidos en `content`

El blog renderiza HTML directamente. Estos tags tienen estilos definidos en `header.php`:

```html
<h2>       Subtitulo principal (24px, 800 weight)
<h3>       Subtitulo secundario (19px, 700 weight)
<p>        Parrafo (17px, line-height 1.8)
<ul> <ol>  Listas (17px, line-height 1.8)
<li>       Elementos de lista
<strong>   Negritas
<em>       Italicas
<a href>   Enlaces (color rojo Tomate)
<blockquote> Cita (borde izquierdo rojo, italica)
<img>      Imagen (100% width, border-radius 8px, margin 2em)
<code>     Codigo inline (fondo warm, padding)
<pre>      Bloque de codigo (fondo ink, color cream)
```

### Categorias actuales

```
diseno web          → slug: diseno-web
ecommerce           → slug: ecommerce
seo                 → slug: seo
marketing digital   → slug: marketing-digital
casos de exito      → slug: casos-de-exito
```

Las categorias son **texto libre** — se pueden crear nuevas simplemente escribiendo un nuevo valor. Los botones de filtro se generan automaticamente desde las categorias existentes en posts publicados.

**Importante**: Las categorias se almacenan con su nombre real (con espacios y acentos: `"diseno web"`) y se convierten a slug solo para las URLs. La funcion `get_category_by_slug()` hace la resolucion inversa.

---

## 3. Proceso de importacion (`import.php`)

### Flujo

```
contenido-propuesta.json
        |
        v
   json_decode()
        |
        v
  Para cada post:
    1. Verifica si el slug ya existe en DB
       Si existe → skip (no duplica)
       Si no existe → INSERT
    2. Si status = "published" → published_at = NOW()
       Si status = "draft" → published_at = NULL
    3. author_id = primer usuario de blog_users
        |
        v
   Resultado: X insertados, Y omitidos
```

### Ejecucion

```
1. Subir contenido-propuesta.json al servidor en /blog/
2. Subir import.php al servidor en /blog/
3. Visitar: https://tomate.mx/blog/import.php
4. Verificar resultado
5. ELIMINAR import.php y contenido-propuesta.json del servidor
```

### Proteccion contra duplicados

`import.php` verifica el `slug` antes de insertar. Si ya existe un post con ese slug, lo salta. Esto permite re-ejecutar el script sin riesgo de duplicar contenido.

### Ejemplo completo de JSON con 2 posts

```json
[
  {
    "title": "Cuanto cuesta una pagina web en Mexico en 2026?",
    "slug": "cuanto-cuesta-pagina-web-mexico",
    "category": "diseno web",
    "status": "published",
    "meta_title": "Cuanto cuesta una pagina web en Mexico? Guia de precios 2026",
    "meta_description": "Conoce los precios reales de diseno web en Mexico en 2026. Desde $4,499 hasta proyectos a medida.",
    "featured_image_alt": "Comparativa de precios de paginas web en Mexico 2026",
    "excerpt": "El precio de un sitio web profesional en Mexico varia entre $4,499 y $50,000+ MXN.",
    "content": "<h2>Por que los precios varian tanto?</h2><p>Contenido completo aqui...</p>"
  },
  {
    "title": "SEO para PyMEs: como aparecer en Google sin publicidad",
    "slug": "seo-pymes-aparecer-google-gratis",
    "category": "seo",
    "status": "draft",
    "meta_title": "SEO para PyMEs: como aparecer en Google sin publicidad",
    "meta_description": "Guia practica de SEO para pequenos negocios en Mexico.",
    "featured_image_alt": "Guia SEO para PyMEs en Mexico",
    "excerpt": "El SEO organico es la forma mas rentable de atraer clientes a largo plazo.",
    "content": "<h2>Google Business Profile</h2><p>Si solo puedes hacer UNA cosa de SEO...</p>"
  }
]
```

---

## 4. Generacion automatica de portadas (`gen-covers.php`)

### Que hace

Genera imagenes SVG placeholder para **todos los posts que no tienen `featured_image`** (campo NULL o vacio). Cada SVG se personaliza con:

- Color de fondo segun la categoria
- Color de acento segun la categoria
- Titulo del post (truncado a 60 chars, dividido en lineas de ~28 chars)
- Etiqueta de categoria en mayusculas
- Marca "tomate.mx/blog" en el footer

### Paleta de colores por categoria

```php
$colors = [
    'diseno web'        => ['#E81323', '#111010'],  // bg: rojo,    accent: ink
    'ecommerce'         => ['#C42A12', '#111010'],  // bg: rojo dk, accent: ink
    'seo'               => ['#111010', '#E81323'],  // bg: ink,     accent: rojo
    'marketing digital' => ['#1a1a2e', '#E81323'],  // bg: azul dk, accent: rojo
    'casos de exito'    => ['#2d1810', '#E81323'],  // bg: marron,  accent: rojo
];
// Default (categoria no reconocida): ['#111010', '#E81323']
```

### Estructura del SVG generado

```
1200 x 630 px (proporcion OG image / tarjeta social)

+--------------------------------------------------+
|  [bg color]                                      |
|                                    O (accent 15%)|
|  CATEGORIA (accent, 13px, tracking 0.15em)       |
|  ————————                                        |
|                                                  |
|  Titulo del Post en                              |
|  Lineas de ~28 Chars                             |
|  Maximo 3 Lineas...                              |
|                                                  |
|  O (accent 10%)                                  |
|  tomate.mx/blog (cream 30%)              o (acc) |
+--------------------------------------------------+
```

### Tipografia

- Titulo: 36px, weight 800, letter-spacing -0.02em, color `#F2EFE7` (cream)
- Categoria: 13px, weight 700, letter-spacing 0.15em, uppercase
- Marca: 14px, weight 600, opacity 0.3
- Font stack: `Helvetica Neue, Helvetica, Arial, sans-serif`

### Algoritmo de wrapping del titulo

```
1. Truncar titulo a 60 caracteres (agregar "..." si excede)
2. Dividir en palabras
3. Acumular palabras en linea hasta que exceda 28 chars
4. Cuando excede, crear nueva linea
5. Maximo 3 lineas (descartar el resto)
6. Calcular Y base: 200 - (num_lineas * 22)
7. Cada linea a Y_base + (indice * 48px)
```

### Archivos generados

```
/blog/uploads/cover_{id}.svg

Ejemplos:
  /blog/uploads/cover_1.svg
  /blog/uploads/cover_2.svg
  ...
  /blog/uploads/cover_10.svg
```

### Flujo de ejecucion

```
gen-covers.php
      |
      v
  SELECT id, title, category
  FROM blog_posts
  WHERE featured_image IS NULL
     OR featured_image = ''
      |
      v
  Para cada post:
    1. Determinar par de colores segun category
    2. Truncar titulo → dividir en lineas
    3. Generar SVG string
    4. file_put_contents → /blog/uploads/cover_{id}.svg
    5. UPDATE blog_posts SET featured_image = '/blog/uploads/cover_{id}.svg'
      |
      v
  Output: "X covers generados y asignados"
```

### Ejecucion

```
1. Subir gen-covers.php al servidor en /blog/
2. Asegurar que /blog/uploads/ existe y tiene permisos de escritura
3. Visitar: https://tomate.mx/blog/gen-covers.php
4. Verificar que los SVGs se crearon en /blog/uploads/
5. Verificar que las tarjetas del blog muestran las portadas
6. ELIMINAR gen-covers.php del servidor
```

### Reemplazar covers con imagenes reales

Los SVG son placeholders. Para reemplazar con imagenes reales:

1. Ir a `/blog/admin/editor.php?id={N}`
2. Usar el area de upload para subir una imagen real (.webp, .jpg, .png)
3. El campo `featured_image` se actualiza automaticamente
4. El SVG anterior queda en `/uploads/` pero ya no se referencia

---

## 5. Pipeline completo: de JSON a blog publicado

```
Paso 1: Preparar JSON
  └─ Crear contenido-propuesta.json con el formato documentado
  └─ Validar: slug unico, category en minusculas, content HTML valido

Paso 2: Importar
  └─ Subir contenido-propuesta.json + import.php
  └─ Ejecutar import.php
  └─ Verificar en /blog/admin/dashboard.php

Paso 3: Publicar (si status era "draft")
  └─ Opcion A: Publicar uno por uno desde el editor
  └─ Opcion B: Usar boton "Publicar todos" en dashboard

Paso 4: Generar portadas
  └─ Subir gen-covers.php
  └─ Ejecutar gen-covers.php
  └─ Solo genera para posts SIN featured_image

Paso 5: Verificar
  └─ /blog/ → muestra grid con portadas
  └─ /blog/categoria/diseno-web → filtra correctamente
  └─ /blog/{slug} → articulo individual con Schema.org
  └─ /blog/sitemap.xml → lista todos los posts publicados

Paso 6: Limpiar
  └─ Eliminar: import.php, contenido-propuesta.json, gen-covers.php
  └─ Eliminar: install.php, check.php, repair*.php
```

---

## 6. Generar nuevos lotes de articulos

Para agregar mas articulos en el futuro:

### Opcion A: Manual (admin)

1. Ir a `/blog/admin/dashboard.php`
2. Click "Nuevo articulo"
3. Llenar campos + subir imagen
4. Publicar

### Opcion B: Importacion masiva (JSON)

1. Crear nuevo JSON con el formato de la seccion 2
2. Subir JSON como `contenido-nuevos.json`
3. Modificar `import.php` linea 13:
   ```php
   $json = file_get_contents(__DIR__ . '/contenido-nuevos.json');
   ```
4. Subir y ejecutar `import.php`
5. Ejecutar `gen-covers.php` si no se incluyeron imagenes
6. Eliminar archivos temporales

### Notas para generacion con IA

Al usar Claude o GPT para generar el JSON:

- Pedir el JSON completo con todos los campos
- Verificar que los slugs sean unicos y no contengan acentos
- Verificar que el HTML en `content` este bien formado
- Usar las categorias existentes para mantener consistencia
- El `status` debe ser `"draft"` para revisar antes de publicar
- Incluir CTA de WhatsApp al final de cada articulo:
  ```html
  <p><a href='https://wa.me/5215531007101?text=Hola...'>Texto CTA →</a></p>
  ```

---

## 7. Estructura de URLs

```
/blog/                              → Listado (index.php)
/blog/pagina/2                      → Paginacion
/blog/categoria/diseno-web          → Filtro por categoria
/blog/categoria/diseno-web/pagina/2 → Categoria + paginacion
/blog/cuanto-cuesta-pagina-web      → Articulo individual
/blog/sitemap.xml                   → Sitemap XML
/blog/admin/                        → Panel de administracion
```

### Resolucion de categorias (slugify)

```
"diseno web"        → diseno-web        (URL)
"marketing digital" → marketing-digital (URL)
"casos de exito"    → casos-de-exito    (URL)
"seo"               → seo               (URL)
"ecommerce"         → ecommerce         (URL)
```

La funcion `slugify()` en `functions.php`:
1. Convierte a minusculas
2. Reemplaza acentos: a→a, e→e, i→i, o→o, u→u, n→n
3. Reemplaza todo lo que no sea `a-z0-9-` con `-`
4. Colapsa guiones multiples
5. Trim guiones al inicio/final

La funcion `get_category_by_slug()` hace la resolucion inversa:
slug de URL → nombre real de categoria en DB.

---

## 8. Checklist de contenido SEO

Para cada articulo nuevo, verificar:

- [ ] Titulo con keyword principal (naturalmente, no forzado)
- [ ] Slug limpio y descriptivo (max 5 palabras)
- [ ] Meta title <= 60 chars con keyword al inicio
- [ ] Meta description <= 155 chars con CTA implicito
- [ ] Excerpt de 1-3 oraciones, autocontenido
- [ ] Content con estructura H2 > H3 > P clara
- [ ] Al menos un enlace interno a otro articulo o servicio
- [ ] CTA de WhatsApp al final
- [ ] Alt text descriptivo para featured image
- [ ] Categoria asignada correctamente
