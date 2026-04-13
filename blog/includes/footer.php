<?php defined('BLOG_APP') or die('Acceso denegado'); ?>

<footer>
  <div class="footer-inner">
    <div class="footer-top">
      <div>
        <img src="/images/svg/Cero_Studio_AI.svg" alt="Cero Studio" class="footer-logo-img">
        <p class="footer-tagline">Diseñamos el futuro digital de tu negocio.</p>
      </div>
      <div>
        <p class="footer-col-title">Navegación</p>
        <ul class="footer-links">
          <li><a href="/#servicios">Servicios</a></li>
          <li><a href="/#portafolio">Portafolio</a></li>
          <li><a href="/#nosotros">Nosotros</a></li>
          <li><a href="/blog/">Blog</a></li>
          <li><a href="/#contacto">Contacto</a></li>
        </ul>
      </div>
      <div>
        <p class="footer-col-title">Servicios</p>
        <ul class="footer-links">
          <li><a href="/#servicios">Desarrollo Web</a></li>
          <li><a href="/#servicios">Tiendas eCommerce</a></li>
          <li><a href="/#servicios">Branding Digital</a></li>
          <li><a href="/#servicios">SEO &amp; Visibilidad</a></li>
          <li><a href="/#servicios">Mantenimiento</a></li>
        </ul>
      </div>
      <div>
        <p class="footer-col-title">Contacto</p>
        <ul class="footer-links">
          <li><a href="mailto:hola@cerostudio.ai">hola@cerostudio.ai</a></li>
          <li><a href="https://instagram.com/cerostudioai" target="_blank" rel="noopener">Instagram</a></li>
          <li><a href="https://linkedin.com/company/cerostudio" target="_blank" rel="noopener">LinkedIn</a></li>
          <li><a href="https://wa.me/525531007101" target="_blank" rel="noopener">WhatsApp</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p class="footer-copy">© 2026 Cero Studio. Todos los derechos reservados.</p>
      <p class="footer-credit">Hecho con <span>♥</span> para emprendedores</p>
    </div>
  </div>
</footer>

<!-- WhatsApp floating button -->
<a href="https://wa.me/525531007101?text=Hola%2C%20me%20interesa%20tener%20un%20sitio%20web%20profesional%20para%20mi%20negocio." class="wa-float" target="_blank" rel="noopener" aria-label="Contáctanos por WhatsApp">
  <svg viewBox="0 0 32 32" width="28" height="28" fill="#fff"><path d="M16.004 0h-.008C7.174 0 0 7.176 0 16.004c0 3.498 1.132 6.738 3.058 9.374L1.058 31.12l5.958-1.966A15.9 15.9 0 0 0 16.004 32C24.826 32 32 24.826 32 16.004S24.826 0 16.004 0Zm9.302 22.602c-.388 1.094-1.938 2.002-3.168 2.268-.844.178-1.944.32-5.652-1.214-4.748-1.964-7.804-6.778-8.038-7.094-.226-.316-1.898-2.53-1.898-4.826s1.2-3.426 1.628-3.894c.388-.424.846-.532 1.128-.532.282 0 .564.004.81.014.26.012.608-.098.952.726.356.848 1.214 2.952 1.32 3.168.108.216.18.47.036.756-.144.29-.216.47-.432.724-.216.252-.454.564-.648.756-.216.216-.44.45-.19.884.252.432 1.118 1.846 2.402 2.99 1.65 1.472 3.042 1.928 3.474 2.144.432.216.684.18.936-.108.252-.29 1.082-1.26 1.37-1.692.288-.432.576-.36.97-.216.396.144 2.496 1.178 2.926 1.392.43.216.716.324.824.504.106.178.106 1.038-.282 2.132Z"/></svg>
  <span class="wa-float-label">¿Dudas? Escríbenos</span>
</a>

<style>
/* ── Footer ── */
footer {
  background: var(--surface-lowest);
  padding: 72px 48px 40px;
}
.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
}
.footer-top {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1fr;
  gap: 48px;
  margin-bottom: 72px;
}
.footer-logo-img {
  height: 52px;
  width: auto;
  margin-bottom: 22px;
}
.footer-tagline {
  font-size: 14px;
  font-weight: 300;
  color: var(--gt);
  line-height: 1.7;
  max-width: 260px;
}
.footer-col-title {
  font-family: var(--fd);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .22em;
  text-transform: uppercase;
  color: var(--white);
  margin-bottom: 22px;
}
.footer-links {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.footer-links a {
  font-size: 14px;
  font-weight: 300;
  color: var(--gt);
  transition: color .2s;
}
.footer-links a:hover { color: var(--lime); }
.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 32px;
  border-top: 1px solid var(--border);
}
.footer-copy,
.footer-credit {
  font-size: 12px;
  font-weight: 300;
  color: rgba(255,255,255,.22);
}
.footer-credit span { color: var(--lime); }

/* ── WhatsApp float ── */
.wa-float {
  position:fixed; bottom:24px; right:24px; z-index:9999;
  width:60px; height:60px; border-radius:50%;
  background:#25D366; color:#fff;
  display:flex; align-items:center; justify-content:center;
  box-shadow:0 4px 16px rgba(0,0,0,0.3);
  text-decoration:none;
  opacity:0; transform:translateY(20px);
  animation:waIn .4s 2s cubic-bezier(.22,1,.36,1) forwards;
  transition:transform .16s ease-out, box-shadow .2s ease-out;
}
.wa-float:hover { transform:scale(1.06); box-shadow:0 6px 24px rgba(37,211,102,0.4); }
.wa-float:active { transform:scale(0.95); }
.wa-float-label {
  position:absolute; right:72px; top:50%; transform:translateY(-50%);
  background:var(--surface-low); color:#fff;
  padding:8px 14px; border-radius:6px; font-size:13px; font-weight:600;
  white-space:nowrap; pointer-events:none;
  opacity:0; transition:opacity .25s;
  box-shadow:0 2px 8px rgba(0,0,0,0.3);
  border:1px solid var(--border);
}
.wa-float-label::after {
  content:''; position:absolute; right:-6px; top:50%; transform:translateY(-50%);
  border:6px solid transparent; border-left-color:var(--surface-low);
}
.wa-float:hover .wa-float-label { opacity:1; }
@keyframes waIn { to { opacity:1; transform:translateY(0); } }

/* ── Footer responsive ── */
@media(max-width:900px){
  footer { padding:60px 24px 24px; }
  .footer-top { grid-template-columns:1fr 1fr; gap:28px; }
  .footer-bottom { flex-direction:column; gap:12px; text-align:center; }
  .wa-float { width:54px; height:54px; bottom:20px; right:20px; }
  .wa-float-label { display:none; }
}
@media(max-width:480px){
  .footer-top { grid-template-columns:1fr; }
}
</style>

<script>
  // Cursor
  const dot  = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (dot && ring) {
    document.addEventListener('mousemove', e => {
      dot.style.left  = ring.style.left  = e.clientX + 'px';
      dot.style.top   = ring.style.top   = e.clientY + 'px';
    });
    document.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('on'));
      el.addEventListener('mouseleave', () => ring.classList.remove('on'));
    });
  }

  // Nav scroll effect
  const nav = document.getElementById('navbar');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive:true });
    onScroll();
  }

  // Reveal on scroll
  const obs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('visible'); obs.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
</script>

<!-- GTM: Track CTA clicks -->
<script>
document.addEventListener('click', function(e) {
  var a = e.target.closest('a');
  if (!a) return;
  var href = a.getAttribute('href') || '';
  window.dataLayer = window.dataLayer || [];
  if (href.includes('wa.me')) {
    window.dataLayer.push({ event: 'cta_whatsapp', cta_page: 'blog' });
  } else if (href.startsWith('mailto:')) {
    window.dataLayer.push({ event: 'cta_email', cta_page: 'blog' });
  }
});
</script>
</body>
</html>
