/**
 * Cero Studio Blog Engine (SPA)
 * Logic for rendering the blog from JSON for Cloudflare Pages.
 */

const BLOG_DATA_URL = '/api/posts';
const PER_PAGE = 9;
const INITIAL_LOAD = 50; // carga todos los posts actuales de golpe

let currentPage = 1;
let hasMore = false;
let isLoadingMore = false;

async function initBlog() {
  const root = document.getElementById('blog-root');

  // ── SSR fast path: individual post ───────────────────────────────────────
  // If the server already rendered this post (data-ssr-slug attribute is set
  // by functions/blog/[slug].js), skip the initial fetch+render to avoid the
  // "Cargando artículo..." flash and double work. We still warm up the post
  // list cache in the background so clicking "Volver al blog" feels instant.
  if (root && root.getAttribute('data-ssr-slug')) {
    fetch(`${BLOG_DATA_URL}?page=1&per=${INITIAL_LOAD}`)
      .then(r => r.ok ? r.json() : [])
      .then(arr => { window._blogPosts = Array.isArray(arr) ? arr : []; })
      .catch(() => { window._blogPosts = []; });
    window.onpopstate = handleRoute;
    return;
  }

  // ── SSR fast path: blog list ─────────────────────────────────────────────
  // If functions/blog/index.js already rendered the post grid, skip the
  // initial fetch+render. Warm up the cache in the background so client-side
  // pagination ("Ver más artículos") and SPA navigation back to the list
  // still work without a roundtrip.
  if (root && root.getAttribute('data-ssr-list') === 'true') {
    fetch(`${BLOG_DATA_URL}?page=1&per=${INITIAL_LOAD}`)
      .then(r => r.ok ? r.json() : [])
      .then(arr => {
        const posts = Array.isArray(arr) ? arr : [];
        window._blogPosts = posts;
        hasMore = posts.length === INITIAL_LOAD;
        currentPage = 1;
      })
      .catch(() => { window._blogPosts = []; });
    window.onpopstate = handleRoute;
    return;
  }

  // ── Normal path: list view (or SPA-navigated post views) ─────────────────
  try {
    const response = await fetch(`${BLOG_DATA_URL}?page=1&per=${INITIAL_LOAD}`);
    if (!response.ok) {
      throw new Error('API responded with status ' + response.status);
    }
    const firstBatch = await response.json();

    // Defensive: the list endpoint should always return an array. If the API
    // returned an error object (or anything else), fall back to an empty list
    // instead of letting `.map()` blow up later.
    const posts = Array.isArray(firstBatch) ? firstBatch : [];

    // hasMore solo es true si llegamos al límite inicial (50+)
    hasMore = posts.length === INITIAL_LOAD;

    // Seed global posts array for list view
    window._blogPosts = posts;
    currentPage = 1;

    // Simple router based on pathname
    handleRoute();

    // Listen for back/forward navigation
    window.onpopstate = handleRoute;

  } catch (error) {
    console.error('Error loading blog data:', error);
    if (root) {
      root.innerHTML = `<div class="section-inner" style="padding: 100px 0; text-align: center;">Error al cargar el blog.</div>`;
    }
  }
}

function handleRoute() {
  const path = window.location.pathname;
  const segments = path.split('/').filter(s => s !== '');
  
  // /blog/ or /blog/index.html
  if (segments.length === 1 && segments[0] === 'blog') {
    renderList();
  } 
  // /blog/some-slug
  else if (segments.length === 2 && segments[0] === 'blog') {
    const slug = segments[1];
    renderPost(slug);
  }
  // Default to list
  else {
    renderList();
  }
}

function navigate(e, path) {
  if (e) e.preventDefault();
  window.history.pushState({}, '', path);
  handleRoute();
  window.scrollTo(0, 0);
}

/* Cards: thumbnail derivado (480px, ~19KB) en vez del hero completo.
   Solo media propia — todo el bucket tiene thumbs (backfill 6 jul 2026). */
function cardThumbUrl(u) {
  return u && u.startsWith('https://media.cerostudio.ai/') ? u + '.thumb.jpg' : u;
}

function postCardHtml(post) {
  const thumbHtml = post.featured_image
    ? '<div class="post-card-thumb"><img src="' + cardThumbUrl(post.featured_image) + '" alt="' + post.title + '" loading="lazy"></div>'
    : '';
  return '<article class="post-card' + (post.featured_image ? ' has-thumb' : '') + '" data-route="/blog/' + post.slug + '" style="cursor: pointer;">'
    + thumbHtml
    + '<div class="post-card-body">'
    + '<div class="post-card-cat">' + (post.category || 'General') + '</div>'
    + '<h2 class="post-card-title">' + post.title + '</h2>'
    + '<p class="post-card-excerpt">' + (post.excerpt || '') + '</p>'
    + '<div class="post-card-meta">' + formatDate(post.published_at) + '</div>'
    + '</div>'
    + '</article>';
}

async function renderList() {
  const root = document.getElementById('blog-root');
  let posts = Array.isArray(window._blogPosts) ? window._blogPosts : null;

  // Lazy-fetch the list if it hasn't been loaded yet — happens when the user
  // arrives via an SSR'd post page and then clicks "Volver al blog" before
  // the background warm-up completes.
  if (posts === null) {
    root.innerHTML = `<div class="section-inner" style="padding: 100px 0; text-align: center;">Cargando blog...</div>`;
    try {
      const r = await fetch(`${BLOG_DATA_URL}?page=1&per=${INITIAL_LOAD}`);
      const data = r.ok ? await r.json() : [];
      posts = Array.isArray(data) ? data : [];
      window._blogPosts = posts;
      hasMore = posts.length === INITIAL_LOAD;
    } catch {
      posts = [];
    }
  }

  const cardsHtml = posts.length
    ? posts.map(postCardHtml).join('')
    : '<p style="grid-column: 1 / -1; text-align: center; padding: 60px 0; color: rgba(255,255,255,.6);">Próximamente nuevos artículos.</p>';

  root.innerHTML = `
    <header class="blog-hero">
      <div class="section-inner">
        <div class="eyebrow">Blog · Para dueños de negocio</div>
        <h1 class="section-title">Lo que nadie te explica <br class="pc-only">antes de invertir en tu sitio</h1>
        <p class="blog-hero-sub">Precios reales, comparativas sin comisión y lo que sí mueve ventas en México. Escrito por Carlos Luque, sin tecnicismos.</p>
        <a class="blog-hero-res" href="/recursos/5-errores-web/"><span class="code">REC-01 · Guía gratis</span><span>5 errores que le cuestan a tu web ahora mismo — PDF, sin registro</span><span class="arrow">→</span></a>
      </div>
    </header>

    <div class="section-inner">
      <div class="blog-grid" id="blog-grid">
        ${cardsHtml}
      </div>
      <div class="load-more-wrap" id="load-more-wrap" style="${hasMore ? '' : 'display:none'}">
        <button class="load-more-btn" id="load-more-btn" data-action="load-more">Ver más artículos</button>
      </div>
    </div>
  `;

  document.title = 'Blog · Precios reales y guías para vender más en línea | Cero Studio';
}

async function loadMore() {
  if (isLoadingMore) return;
  isLoadingMore = true;

  const btn = document.getElementById('load-more-btn');
  if (btn) btn.textContent = 'Cargando...';

  try {
    const nextPage = currentPage + 1;
    const response = await fetch(`${BLOG_DATA_URL}?page=${nextPage}&per=${INITIAL_LOAD}`);
    if (!response.ok) throw new Error('API responded with status ' + response.status);
    const raw = await response.json();
    const newPosts = Array.isArray(raw) ? raw : [];

    currentPage = nextPage;
    hasMore = newPosts.length === INITIAL_LOAD;
    window._blogPosts = (window._blogPosts || []).concat(newPosts);

    const grid = document.getElementById('blog-grid');
    if (grid) {
      newPosts.forEach(post => {
        grid.insertAdjacentHTML('beforeend', postCardHtml(post));
      });
    }

    const wrap = document.getElementById('load-more-wrap');
    if (wrap) wrap.style.display = hasMore ? '' : 'none';

  } catch (e) {
    console.error('Error cargando más artículos:', e);
    if (btn) btn.textContent = 'Error — intentar de nuevo';
  } finally {
    isLoadingMore = false;
    const btn2 = document.getElementById('load-more-btn');
    if (btn2 && hasMore) btn2.textContent = 'Ver más artículos';
  }
}

// CTA final por categoría — mismo markup y mapa que functions/blog/[slug].js (SSR).
// Primario = siguiente paso natural del tema; secundario = ficha; WhatsApp siempre.
const CTA_BY_CAT = {
  'Diseño Web': { t: '¿Tu sitio se ve bien <em>pero no vende?</em>', p: 'Revisamos tu sitio actual gratis y en 48 horas te decimos qué lo está frenando. Y si lo que necesitas es uno nuevo, tienes propuesta en menos de 24 horas.', b1: ['Auditoría gratis de mi sitio', '/auditoria-gratis/'], b2: ['Ver planes de desarrollo web', '/servicios/desarrollo-web/'] },
  'SEO': { t: '¿Google y la IA <em>te encuentran?</em>', p: 'Te decimos gratis, en 48 horas, si tu sitio aparece donde tus clientes buscan — y qué le falta para rankear en Google y salir en ChatGPT.', b1: ['Auditoría SEO + IA gratis', '/auditoria-gratis/'], b2: ['Ver servicio SEO + AI Search', '/servicios/seo/'] },
  'eCommerce': { t: '¿Tu tienda recibe visitas <em>y no vende?</em>', p: 'Somos Agencia Tiendanube Partner certificada. Te decimos si te conviene Tiendanube o una tienda a la medida — y qué arreglar hoy en la que ya tienes.', b1: ['Cotizar mi tienda', '/servicios/tiendas-ecommerce/'], b2: ['Auditoría gratis de mi tienda', '/auditoria-gratis/'] },
  'Estrategia Digital': { t: 'Antes de invertir, <em>un segundo par de ojos.</em>', p: 'Primera consulta gratis con Carlos: te decimos qué sí vale la pena hacer en tu caso y qué no. Sin compromiso.', b1: ['Agendar consulta gratis', 'https://calendar.app.google/Mk3sTdFWsaaaUNnj6'], b2: ['Ver consultoría digital', '/servicios/consultoria-digital/'] },
  'Casos de Éxito': { t: '¿Quieres resultados así <em>en tu negocio?</em>', p: 'Cuéntanos qué vendes y a quién. Recibes una propuesta clara en menos de 24 horas.', b1: ['Cotizar mi proyecto', '/#contacto'], b2: ['Ver más casos de éxito', '/casos-de-exito/'] }
};
CTA_BY_CAT['Inteligencia Artificial'] = CTA_BY_CAT['SEO'];
CTA_BY_CAT['Marketing Digital'] = CTA_BY_CAT['Estrategia Digital'];
const CTA_DEFAULT = { t: '¿Tu sitio se ve bien <em>pero no vende?</em>', p: 'Diseñamos sitios que convierten visitas en clientes. Cuéntanos tu proyecto y recibe una propuesta clara en menos de 24 horas.', b1: ['Cotizar mi proyecto', '/#contacto'], b2: ['Auditoría gratis de mi sitio', '/auditoria-gratis/'] };

function ctaEndFor(cat) {
  const c = CTA_BY_CAT[cat] || CTA_DEFAULT;
  return `<aside class="article-cta" data-label="Siguiente paso"><h2 class="article-cta-title">${c.t}</h2><p class="article-cta-text">${c.p}</p><div class="article-cta-row"><a href="${c.b1[1]}" class="article-cta-btn">${c.b1[0]} →</a><a href="${c.b2[1]}" class="article-cta-wa">${c.b2[0]}</a><a href="https://wa.me/525531007101?text=Hola%2C%20le%C3%AD%20un%20art%C3%ADculo%20de%20su%20blog%20y%20quiero%20cotizar%20mi%20proyecto." class="article-cta-wa" target="_blank" rel="noopener">WhatsApp directo</a></div></aside>`;
}

// CTA inline: transicional (auditoría gratis), nunca cotización a media lectura
const ARTICLE_CTA_MID = '<div class="article-cta-inline"><span>¿No sabes si esto le pasa a tu sitio?</span> <a href="/auditoria-gratis/">Pídenos la auditoría exprés gratis — 5 hallazgos en 48 horas →</a></div>';

// Caja de autor (BLOG-03) — mismo markup que functions/blog/[slug].js.
// Retrato Color; el B/N lo pone blog.css (filter: grayscale) — sin acento de esquina.
const ARTICLE_AUTHOR = '<aside class="article-author"><img src="/images/Carlos_Luque_2026-Color.webp" alt="Carlos Luque — Fundador, Cero Studio" width="88" height="120" loading="lazy"><div><p class="article-author-name">Carlos Luque</p><p class="article-author-bio">Fundador de Cero Studio. Más de 25 años construyendo presencia digital para negocios en México. Escribe esto para que decidas con datos, no con vendedores.</p><a href="/nosotros/" class="article-author-more">Conoce a Carlos →</a></div></aside>';

// Inserta el CTA inline a la mitad del artículo (solo si hay ≥8 párrafos)
function withMidCta(content) {
  const parts = (content || '').split('</p>');
  if (parts.length < 9) return content;
  const mid = Math.ceil((parts.length - 1) / 2);
  return parts.slice(0, mid).join('</p>') + '</p>' + ARTICLE_CTA_MID + parts.slice(mid).join('</p>');
}

async function renderPost(slug) {
  const root = document.getElementById('blog-root');
  
  // Fetch specific post from API
  root.innerHTML = `<div class="section-inner" style="padding: 100px 0; text-align: center;">Cargando artículo...</div>`;
  
  try {
    const response = await fetch(`${BLOG_DATA_URL}?slug=${slug}`);
    if (!response.ok) throw new Error('Not found');
    const post = await response.json();

    const heroImg = post.featured_image
      ? '<div class="article-featured-image"><img src="' + post.featured_image + '" alt="' + (post.featured_image_alt || post.title) + '"></div>'
      : '';

    root.innerHTML = `
      <article class="article-container">
        <a href="/blog/" data-route="/blog/" class="back-link">
          ← Volver al blog
        </a>

        <header class="article-header">
          <div class="post-card-cat" style="margin-bottom: 24px;">${post.category || 'General'}</div>
          <h1 class="article-title">${post.title}</h1>
          <div class="article-meta">
            Por <a href="/nosotros/" class="article-author-link">Carlos Luque</a> · Fundador de Cero Studio · ${formatDate(post.published_at)}
          </div>
          ${heroImg}
        </header>

        <div class="article-content">
          ${withMidCta(post.content)}
        </div>
${ARTICLE_AUTHOR}
${ctaEndFor(post.category)}
      </article>
    `;
    
    document.title = `${post.title} — Blog Cero Studio`;
  } catch (error) {
    root.innerHTML = `<div class="section-inner" style="padding: 100px 0; text-align: center;">Artículo no encontrado. <br><br> <a href="/blog/" data-route="/blog/" class="back-link">Volver al blog</a></div>`;
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  /* Dos formatos conviven en D1: sqlite "YYYY-MM-DD HH:MM:SS" (posts viejos,
     necesita el truco de las diagonales para Safari) e ISO con T/Z (posts
     programados). El replace de guiones ROMPE el ISO → Invalid Date. */
  const d = dateStr.includes('T')
    ? new Date(dateStr)
    : new Date(dateStr.replace(/-/g, '/'));
  if (isNaN(d)) return '';
  return d.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/* Delegación CSP-safe: los templates usan data-route / data-action
   en vez de handlers inline (bloqueados por CSP sin 'unsafe-inline'). */
document.addEventListener('click', function (e) {
  if (!e.target.closest) return;
  if (e.target.closest('[data-action="load-more"]')) { loadMore(); return; }
  var r = e.target.closest('[data-route]');
  if (r) navigate(e, r.getAttribute('data-route'));
});
window.navigate = navigate;
window.loadMore = loadMore;

// --- Navigation Logic ---
function toggleNav() {
  const nav = document.getElementById('mobileNav');
  const ham = document.querySelector('.nav-ham');
  nav.classList.toggle('open');
  ham.classList.toggle('open');
}

function closeNav() {
  const nav = document.getElementById('mobileNav');
  const ham = document.querySelector('.nav-ham');
  nav.classList.remove('open');
  ham.classList.remove('open');
}

// Scroll effects
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (window.scrollY > 50) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
});

// Global exposure
window.toggleNav = toggleNav;
window.closeNav = closeNav;

// Start the engine
document.addEventListener('DOMContentLoaded', initBlog);
