/**
 * Cero Studio Blog Engine (SPA)
 * Logic for rendering the blog from JSON for Cloudflare Pages.
 */

const BLOG_DATA_URL = '/api/posts';
let posts = [];

async function initBlog() {
  const root = document.getElementById('blog-root');
  
  try {
    const response = await fetch(BLOG_DATA_URL);
    posts = await response.json();
    
    // Simple router based on pathname
    handleRoute();
    
    // Listen for back/forward navigation
    window.onpopstate = handleRoute;
    
  } catch (error) {
    console.error('Error loading blog data:', error);
    root.innerHTML = `<div class="section-inner" style="padding: 100px 0; text-align: center;">Error al cargar el blog.</div>`;
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

function renderList() {
  const root = document.getElementById('blog-root');
  
  let html = `
    <header class="blog-hero">
      <div class="section-inner">
        <div class="eyebrow">Nuestro Blog</div>
        <h1 class="section-title">Insights sobre diseño <br class="pc-only"> y tecnología</h1>
      </div>
    </header>
    
    <div class="section-inner">
      <div class="blog-grid">
  `;
  
  // Filter for published posts
  const publishedPosts = posts.filter(p => p.status === 'published');
  
  publishedPosts.forEach(post => {
    html += `
      <article class="post-card" onclick="navigate(null, '/blog/${post.slug}')" style="cursor: pointer;">
        <div class="post-card-cat">${post.category || 'General'}</div>
        <h2 class="post-card-title">${post.title}</h2>
        <p class="post-card-excerpt">${post.excerpt || ''}</p>
        <div class="post-card-meta">${formatDate(post.published_at)}</div>
      </article>
    `;
  });
  
  html += `
      </div>
    </div>
  `;
  
  root.innerHTML = html;
  document.title = 'Blog — Cero Studio';
}

async function renderPost(slug) {
  const root = document.getElementById('blog-root');
  
  // Fetch specific post from API
  root.innerHTML = `<div class="section-inner" style="padding: 100px 0; text-align: center;">Cargando artículo...</div>`;
  
  try {
    const response = await fetch(`${BLOG_DATA_URL}?slug=${slug}`);
    if (!response.ok) throw new Error('Not found');
    const post = await response.json();

    root.innerHTML = `
      <article class="article-container">
        <a href="/blog/" onclick="navigate(event, '/blog/')" class="back-link">
          ← Volver al blog
        </a>
        
        <header class="article-header">
          <div class="post-card-cat" style="margin-bottom: 24px;">${post.category || 'General'}</div>
          <h1 class="article-title">${post.title}</h1>
          <div class="article-meta">
            Publicado el ${formatDate(post.published_at)} • Cero Studio
          </div>
        </header>
        
        <div class="article-content">
          ${post.content}
        </div>
      </article>
    `;
    
    document.title = `${post.title} — Blog Cero Studio`;
  } catch (error) {
    root.innerHTML = `<div class="section-inner" style="padding: 100px 0; text-align: center;">Artículo no encontrado. <br><br> <a href="/blog/" onclick="navigate(event, '/blog/')" class="back-link">Volver al blog</a></div>`;
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr.replace(/-/g, '/'));
  return d.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

// Global scope for onclick handlers in strings
window.navigate = navigate;

// Start the engine
document.addEventListener('DOMContentLoaded', initBlog);
