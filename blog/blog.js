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
        <div class="eyebrow">Nuestro Blog</div>
        <h1 class="section-title">Insights sobre diseño <br class="pc-only"> y tecnología</h1>
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

  document.title = 'Blog — Cero Studio';
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

// CTA de conversión de artículos — mismo markup que functions/blog/[slug].js (SSR)
const ARTICLE_CTA_END = `
      <aside class="article-cta" data-label="Cero Studio">
        <h2 class="article-cta-title">¿Tu sitio se ve bien <em>pero no vende?</em></h2>
        <p class="article-cta-text">Diseñamos sitios que convierten visitas en clientes. Cuéntanos tu proyecto y recibe una propuesta clara en menos de 24 horas.</p>
        <div class="article-cta-row">
          <a href="/#contacto" class="article-cta-btn">Cotizar mi proyecto →</a>
          <a href="https://wa.me/525531007101?text=Hola%2C%20le%C3%AD%20un%20art%C3%ADculo%20de%20su%20blog%20y%20quiero%20cotizar%20mi%20proyecto." class="article-cta-wa" target="_blank" rel="noopener">WhatsApp directo</a>
        </div>
      </aside>`;

const ARTICLE_CTA_MID = `<div class="article-cta-inline"><span>¿Necesitas un sitio que venda?</span> <a href="/#contacto">Cotiza gratis — respuesta en 24 horas →</a></div>`;

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
            Publicado el ${formatDate(post.published_at)} • Cero Studio
          </div>
          ${heroImg}
        </header>

        <div class="article-content">
          ${withMidCta(post.content)}
        </div>
${ARTICLE_CTA_END}
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
