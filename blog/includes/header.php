<?php defined('BLOG_APP') or die('Acceso denegado');
$_title       = $page_title ?? 'Blog — ' . SITE_NAME;
$_description = $meta_description ?? 'Artículos sobre diseño web, marketing digital, SEO y ecommerce. Consejos prácticos de ' . SITE_NAME . '.';
$_canonical   = $canonical_url ?? BLOG_URL;
$_og_image    = $og_image ?? SITE_URL . '/images/CERO_Studio_SocialShare.png';
$_og_type     = $og_type ?? 'website';
$_extra_head  = $extra_head ?? '';
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <!-- Google Tag Manager -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-PDS8GXPB');</script>

  <title><?= e($_title) ?></title>
  <meta name="description" content="<?= e($_description) ?>" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="<?= e($_canonical) ?>" />

  <meta property="og:type"        content="<?= e($_og_type) ?>" />
  <meta property="og:url"         content="<?= e($_canonical) ?>" />
  <meta property="og:title"       content="<?= e($_title) ?>" />
  <meta property="og:description" content="<?= e($_description) ?>" />
  <meta property="og:image"       content="<?= e($_og_image) ?>" />
  <meta property="og:locale"      content="es_MX" />
  <meta property="og:site_name"   content="<?= SITE_NAME ?>" />

  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="<?= e($_title) ?>" />
  <meta name="twitter:description" content="<?= e($_description) ?>" />
  <meta name="twitter:image"       content="<?= e($_og_image) ?>" />

  <link rel="icon" type="image/svg+xml" href="/images/svg/CS_Favicon.svg" />

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload"
    href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500&display=swap"
    as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
  </noscript>

  <?= $_extra_head ?>

  <style>
    :root {
      --bg:             #131313;
      --white:          #fff;
      --lime:           #b2f700;
      --lime-dim:       #9cd900;
      --on-lime:        #131f00;
      --surface:        #131313;
      --surface-low:    #1b1b1c;
      --surface-lowest: #0e0e0e;
      --surface-high:   #2a2a2a;
      --surface-highest:#353535;
      --gt:             #888;
      --border:         rgba(255,255,255,0.08);
      --fd: 'Space Grotesk', sans-serif;
      --fb: 'Inter', sans-serif;
    }

    *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
    html { scroll-behavior:smooth; overflow-x:hidden; }
    body {
      font-family: var(--fb);
      background: var(--bg);
      color: var(--white);
      overflow-x: hidden;
      cursor: none;
    }

    img { display:block; max-width:100%; }
    a { text-decoration:none; color:inherit; }

    /* ── Mobile Nav Overlay ── */
    #mobileNav {
      position:fixed; inset:0;
      background:var(--bg); z-index:998;
      display:flex; flex-direction:column;
      align-items:center; justify-content:center; gap:28px;
      transform:translateY(-100%);
      transition:transform .6s cubic-bezier(.76,0,.24,1);
    }
    #mobileNav.open { transform:translateY(0); }
    #mobileNav a {
      font-family:var(--fd);
      font-size:clamp(32px,8vw,52px); font-weight:900;
      text-transform:uppercase; color:var(--white); transition:color .2s;
    }
    #mobileNav a:hover { color:var(--lime); }
    #mobileNav .mnav-cta {
      font-family:var(--fd); font-size:14px; font-weight:700;
      letter-spacing:.1em; text-transform:uppercase;
      color:var(--on-lime);
      background:linear-gradient(135deg, var(--lime) 0%, var(--lime-dim) 100%);
      padding:12px 32px; margin-top:8px;
    }

    /* ── Cursor ── */
    .cursor-dot {
      width:6px; height:6px; background:var(--lime); border-radius:50%;
      position:fixed; top:0; left:0; pointer-events:none; z-index:9999;
      transform:translate(-50%,-50%);
    }
    .cursor-ring {
      width:36px; height:36px;
      border:1px solid rgba(178,247,0,.4); border-radius:50%;
      position:fixed; top:0; left:0; pointer-events:none; z-index:9998;
      transform:translate(-50%,-50%);
      transition:width .3s, height .3s, border-color .3s, background .3s;
    }
    .cursor-ring.on {
      width:56px; height:56px;
      border-color:var(--lime); background:rgba(178,247,0,.06);
    }
    @media(pointer:coarse),(max-width:900px) {
      body { cursor:auto; }
      .cursor-dot, .cursor-ring { display:none; }
    }

    /* ── Nav ── */
    nav {
      position:fixed; top:0; left:0; right:0; z-index:999;
      height:72px; padding:0 48px;
      display:flex; align-items:center; justify-content:space-between;
      transition:background .4s;
    }
    nav.scrolled {
      background:rgba(19,19,19,.88);
      backdrop-filter:blur(40px);
      -webkit-backdrop-filter:blur(40px);
    }
    .nav-logo { height:34px; width:auto; }
    .nav-links { display:flex; gap:36px; list-style:none; }
    .nav-links a {
      font-size:12px; font-weight:400; letter-spacing:.08em;
      text-transform:uppercase; color:var(--gt); transition:color .2s;
    }
    .nav-links a:hover { color:var(--white); }
    .nav-cta {
      font-family:var(--fd); font-size:13px; font-weight:700;
      letter-spacing:.1em; text-transform:uppercase;
      color:var(--on-lime);
      background:linear-gradient(135deg, var(--lime) 0%, var(--lime-dim) 100%);
      box-shadow:0 0 16px rgba(178,247,0,.25);
      padding:10px 26px; display:inline-block;
      transition:background .15s ease-out, color .15s ease-out, box-shadow .15s ease-out;
    }
    .nav-cta:hover { background:#fff; color:#000; box-shadow:none; }
    .nav-ham {
      display:none; flex-direction:column; gap:5px;
      cursor:pointer; padding:4px; background:none; border:none;
    }
    .nav-ham span {
      display:block; width:24px; height:2px;
      background:var(--white); transition:all .35s; transform-origin:center;
    }
    .nav-ham.open span:nth-child(1) { transform:translateY(7px) rotate(45deg); }
    .nav-ham.open span:nth-child(2) { opacity:0; transform:scaleX(0); }
    .nav-ham.open span:nth-child(3) { transform:translateY(-7px) rotate(-45deg); }

    /* ── Breadcrumb ── */
    .blog-breadcrumb {
      padding:100px 56px 0;
      font-size:12px; letter-spacing:.06em; color:var(--gt);
    }
    .blog-breadcrumb a { color:var(--gt); transition:color .15s; }
    .blog-breadcrumb a:hover { color:var(--lime); }
    .blog-breadcrumb span { margin:0 8px; opacity:.4; }

    /* ── Blog Hero ── */
    .blog-hero {
      padding:140px 56px 60px;
      text-align:center;
    }
    .blog-hero h1 {
      font-family:var(--fd);
      font-size:clamp(36px,5vw,56px); font-weight:700;
      letter-spacing:-0.03em; line-height:1.1; margin-bottom:16px;
    }
    .blog-hero p {
      font-size:17px; color:var(--gt); max-width:560px; margin:0 auto;
      line-height:1.6;
    }

    /* ── Blog Grid ── */
    .blog-grid {
      display:grid; grid-template-columns:repeat(3,1fr);
      gap:24px; padding:48px 56px 80px; max-width:1280px; margin:0 auto;
    }

    /* ── Post Card ── */
    .post-card {
      background:var(--surface-low); border-radius:8px; overflow:hidden;
      border:1px solid var(--border);
      transition:transform .25s cubic-bezier(.22,1,.36,1), border-color .25s;
      text-decoration:none; color:inherit; display:flex; flex-direction:column;
    }
    .post-card:hover {
      transform:translateY(-4px);
      border-color:rgba(178,247,0,.25);
    }
    .post-card-img {
      width:100%; aspect-ratio:16/9; object-fit:cover;
      display:block; border-bottom:1px solid var(--border);
    }
    .post-card-body { padding:24px; display:flex; flex-direction:column; flex:1; }
    .post-card-cat {
      font-family:var(--fd); font-size:11px; letter-spacing:.12em; text-transform:uppercase;
      color:var(--lime); font-weight:700; margin-bottom:10px;
    }
    .post-card-title {
      font-family:var(--fd); font-size:18px; font-weight:700; color:var(--white);
      line-height:1.3; margin-bottom:10px; letter-spacing:-0.01em;
    }
    .post-card-excerpt {
      font-size:13px; color:var(--gt); line-height:1.7;
      display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden;
      margin-bottom:14px; flex:1;
    }
    .post-card-meta {
      font-size:11px; color:var(--gt); letter-spacing:.04em;
      display:flex; gap:12px; align-items:center;
    }
    /* No-image card: lime top accent */
    .post-card--no-img { border-top:2px solid var(--lime); }
    .post-card--no-img .post-card-body { padding:28px 24px 24px; }
    .post-card--no-img .post-card-title { font-size:20px; }
    .post-card--no-img .post-card-excerpt { -webkit-line-clamp:4; }
    /* Category color variants */
    .post-card--cat-ecommerce { border-top-color:#F97316; }
    .post-card--cat-ecommerce .post-card-cat { color:#F97316; }
    .post-card--cat-seo { border-top-color:#4FC3F7; }
    .post-card--cat-seo .post-card-cat { color:#4FC3F7; }
    .post-card--cat-marketing-digital { border-top-color:#A78BFA; }
    .post-card--cat-marketing-digital .post-card-cat { color:#A78BFA; }
    .post-card--cat-casos-de-exito { border-top-color:#34D399; }
    .post-card--cat-casos-de-exito .post-card-cat { color:#34D399; }

    /* ── Category filter pills ── */
    .cat-filters {
      display:flex; gap:8px; justify-content:center;
      margin-top:24px; flex-wrap:wrap;
    }
    .cat-filters a {
      font-family:var(--fd); font-size:11px; letter-spacing:.08em;
      text-transform:uppercase; font-weight:600;
      padding:6px 16px; border-radius:2px;
      border:1px solid var(--border); color:var(--gt);
      transition:border-color .2s, color .2s, background .2s;
    }
    .cat-filters a:hover { border-color:var(--lime); color:var(--white); }
    .cat-filters a.active {
      background:var(--lime); color:var(--on-lime);
      border-color:var(--lime);
    }

    /* ── Article ── */
    .article-header {
      padding:140px 24px 48px;
      max-width:780px; margin:0 auto; text-align:center;
    }
    .article-header h1 {
      font-family:var(--fd);
      font-size:clamp(32px,5vw,52px); font-weight:700;
      letter-spacing:-0.03em; line-height:1.1; margin-bottom:20px;
    }
    .article-meta {
      font-size:13px; color:var(--gt);
      display:flex; justify-content:center; gap:16px; align-items:center;
    }
    .article-featured {
      max-width:900px; margin:0 auto 48px; padding:0 24px;
    }
    .article-featured img {
      width:100%; border-radius:8px; display:block;
    }
    .article-body {
      max-width:720px; margin:0 auto; padding:0 24px 80px;
    }
    .article-body p {
      font-size:17px; line-height:1.8; color:rgba(255,255,255,.82); margin-bottom:1.5em;
    }
    .article-body h2 {
      font-family:var(--fd);
      font-size:26px; font-weight:700; letter-spacing:-0.02em;
      margin:2em 0 0.8em; color:var(--white);
    }
    .article-body h3 {
      font-family:var(--fd);
      font-size:20px; font-weight:600; margin:1.6em 0 0.6em; color:var(--white);
    }
    .article-body ul, .article-body ol {
      font-size:17px; line-height:1.8; margin:0 0 1.5em 1.5em;
      color:rgba(255,255,255,.82);
    }
    .article-body blockquote {
      border-left:3px solid var(--lime); padding-left:20px;
      font-style:italic; color:var(--gt); margin:1.5em 0;
    }
    .article-body img {
      width:100%; border-radius:8px; margin:2em 0;
    }
    .article-body a { color:var(--lime); }
    .article-body code {
      background:var(--surface-high); color:var(--lime);
      padding:2px 6px; border-radius:3px; font-size:15px;
    }
    .article-body pre {
      background:var(--surface-lowest); border:1px solid var(--border);
      padding:20px; border-radius:8px; overflow-x:auto;
      margin:1.5em 0; font-size:14px; line-height:1.6;
    }
    .article-body pre code {
      background:none; padding:0; color:var(--white);
    }

    /* ── Author box ── */
    .author-box {
      max-width:720px; margin:0 auto 60px; padding:32px 24px 0;
      display:flex; gap:20px; align-items:center;
      border-top:1px solid var(--border);
    }
    .author-box img { width:56px; height:56px; border-radius:50%; object-fit:cover; }
    .author-box-name { font-family:var(--fd); font-weight:700; font-size:15px; }
    .author-box-label { font-size:12px; color:var(--gt); margin-top:2px; }

    /* ── Related ── */
    .related-section {
      max-width:1000px; margin:0 auto; padding:0 24px 80px;
    }
    .related-section h3 {
      font-family:var(--fd); font-size:20px; font-weight:700;
      margin-bottom:24px; letter-spacing:-0.02em;
    }
    .related-grid {
      display:grid; grid-template-columns:repeat(3,1fr); gap:24px;
    }

    /* ── Pagination ── */
    .pagination {
      display:flex; justify-content:center; gap:8px;
      padding:0 56px 80px;
    }
    .pagination a, .pagination span {
      display:inline-flex; align-items:center; justify-content:center;
      min-width:40px; height:40px; padding:0 12px;
      border-radius:4px; font-family:var(--fd); font-size:13px; font-weight:600;
      text-decoration:none; transition:all .15s ease-out;
    }
    .pagination a {
      background:var(--surface-low); color:var(--gt);
      border:1px solid var(--border);
    }
    .pagination a:hover { background:var(--surface-high); color:var(--white); }
    .pagination a:active { transform:scale(0.97); }
    .pagination .current {
      background:var(--lime); color:var(--on-lime); border:none;
    }

    /* ── Empty state ── */
    .blog-empty {
      text-align:center; padding:80px 24px;
      color:var(--gt); font-size:17px;
    }
    .blog-empty a { color:var(--lime); }

    /* ── Animations ── */
    .reveal { opacity:0; transform:translateY(32px); transition:opacity .6s cubic-bezier(.22,1,.36,1), transform .6s cubic-bezier(.22,1,.36,1); }
    .reveal.visible { opacity:1; transform:translateY(0); }
    .d1{transition-delay:.07s} .d2{transition-delay:.15s} .d3{transition-delay:.23s}

    @media(prefers-reduced-motion:reduce){
      *, *::before, *::after {
        animation-duration:0.01ms !important;
        animation-iteration-count:1 !important;
        transition-duration:0.01ms !important;
        scroll-behavior:auto !important;
      }
      .reveal { opacity:1; transform:none; }
    }

    /* ── Mobile ── */
    @media(max-width:900px){
      .blog-hero { padding:120px 24px 40px; }
      .blog-grid { grid-template-columns:1fr 1fr; padding:32px 24px 60px; gap:16px; }
      .blog-breadcrumb { padding:88px 24px 0; }
      .related-grid { grid-template-columns:1fr; }
    }
    @media(max-width:768px){
      nav { padding:0 24px; }
      .nav-links, .nav-cta { display:none; }
      .nav-ham { display:flex; }
    }
    @media(max-width:480px){
      .blog-grid { grid-template-columns:1fr; }
    }
  </style>
</head>
<body>
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-PDS8GXPB"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>

<div class="cursor-dot" id="cursorDot"></div>
<div class="cursor-ring" id="cursorRing"></div>

<div id="mobileNav">
  <a href="/" onclick="closeNav()">Inicio</a>
  <a href="/blog/" onclick="closeNav()">Blog</a>
  <a href="https://wa.me/525531007101?text=Hola%2C%20me%20interesa%20tener%20un%20sitio%20web%20profesional%20para%20mi%20negocio." class="mnav-cta" target="_blank" rel="noopener" onclick="closeNav()">Hablemos →</a>
</div>

<nav id="navbar" aria-label="Navegación principal">
  <a href="/" aria-label="Cero Studio — inicio">
    <img src="/images/svg/Cero_Studio_AI_Horizontal.svg" alt="Cero Studio" class="nav-logo" />
  </a>
  <ul class="nav-links" role="list">
    <li><a href="/">← Inicio</a></li>
    <li><a href="/blog/">Blog</a></li>
  </ul>
  <a href="https://wa.me/525531007101?text=Hola%2C%20me%20interesa%20tener%20un%20sitio%20web%20profesional%20para%20mi%20negocio." class="nav-cta" target="_blank" rel="noopener">Hablemos →</a>
  <button class="nav-ham" id="navHam" onclick="toggleNav()" aria-label="Menú" aria-expanded="false"><span></span><span></span><span></span></button>
</nav>
