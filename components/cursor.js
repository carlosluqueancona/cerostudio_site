/**
 * Cero Studio · Custom Cursor
 *
 * Self-contained module that injects the lime dot + ring cursor on any page
 * that loads this script. Safe to include alongside any inline implementation
 * (idempotent — checks for existing #cDot before initializing). Skips automatically
 * on touch devices.
 *
 * Usage on any HTML page:
 *   <script src="/components/cursor.js" defer></script>
 *
 * Re-attaches `.ht` hover handlers when navbar/footer load via loader.js
 * (listens for the `csComponentsReady` event).
 */
(function () {
  'use strict';

  // ── Skip on touch devices ────────────────────────────────────────────
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.matchMedia && window.matchMedia('(hover: none)').matches) return;

  // ── Skip if cursor is already initialized (e.g. on home) ─────────────
  if (document.getElementById('cDot') || document.getElementById('cRing')) return;

  // ── Inject CSS (idempotent — only if not present) ────────────────────
  if (!document.getElementById('cs-cursor-style')) {
    const style = document.createElement('style');
    style.id = 'cs-cursor-style';
    style.textContent = [
      'body{cursor:none;}',
      '.cs-cursor-dot{width:6px;height:6px;background:var(--lime,#ceff33);border-radius:50%;position:fixed;top:0;left:0;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);will-change:transform;}',
      '.cs-cursor-ring{width:36px;height:36px;border:1px solid rgba(184,255,0,.4);border-radius:50%;position:fixed;top:0;left:0;pointer-events:none;z-index:9998;transform:translate(-50%,-50%);transition:width .3s,height .3s,border-color .3s,background .3s;will-change:transform;}',
      '.cs-cursor-ring.on{width:56px;height:56px;border-color:var(--lime,#ceff33);background:rgba(184,255,0,.06);}',
      '@media (hover: none){body{cursor:auto;}.cs-cursor-dot,.cs-cursor-ring{display:none!important;}}',
    ].join('');
    document.head.appendChild(style);
  }

  // ── Inject HTML elements ─────────────────────────────────────────────
  function bootstrap() {
    if (document.getElementById('cDot')) return;
    const dot = document.createElement('div');
    dot.id = 'cDot';
    dot.className = 'cs-cursor-dot cursor-dot';
    dot.setAttribute('aria-hidden', 'true');

    const ring = document.createElement('div');
    ring.id = 'cRing';
    ring.className = 'cs-cursor-ring cursor-ring';
    ring.setAttribute('aria-hidden', 'true');

    document.body.appendChild(dot);
    document.body.appendChild(ring);

    // ── rAF-driven movement (no GSAP, low CPU) ─────────────────────────
    let mx = 0, my = 0, rx = 0, ry = 0, raf = null;

    function step() {
      raf = null;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
      if (Math.abs(mx - rx) > 0.5 || Math.abs(my - ry) > 0.5) {
        raf = requestAnimationFrame(step);
      }
    }

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX;
      my = e.clientY;
      if (!raf) raf = requestAnimationFrame(step);
    });

    // ── Hover state for `.ht` elements (idempotent re-attach) ──────────
    function attachHovers() {
      const els = document.querySelectorAll('.ht');
      for (let i = 0; i < els.length; i++) {
        const el = els[i];
        if (el.dataset.csHt) continue;
        el.dataset.csHt = '1';
        el.addEventListener('mouseenter', function () { ring.classList.add('on'); });
        el.addEventListener('mouseleave', function () { ring.classList.remove('on'); });
      }
    }

    attachHovers();

    // Re-attach when loader.js injects the navbar/footer (which contain .ht links)
    document.addEventListener('csComponentsReady', attachHovers);

    // Also re-attach on dynamic SPA route changes (best-effort observer)
    if (typeof MutationObserver !== 'undefined') {
      const obs = new MutationObserver(function (mutations) {
        for (let i = 0; i < mutations.length; i++) {
          const m = mutations[i];
          if (m.addedNodes && m.addedNodes.length) {
            attachHovers();
            return;
          }
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });
    }

    // Hide cursor when leaving the window
    document.addEventListener('mouseleave', function () {
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    });
    document.addEventListener('mouseenter', function () {
      dot.style.opacity = '';
      ring.style.opacity = '';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
