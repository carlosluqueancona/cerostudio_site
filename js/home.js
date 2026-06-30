    document.addEventListener('DOMContentLoaded', function () {
      gsap.registerPlugin(ScrollTrigger);

      /* ── LOGO TICKER (setTimeout → no bloquea DOMContentLoaded) ── */
      setTimeout(function () {
        const track = document.querySelector('.ticker-track');
        if (!track) return;
        gsap.fromTo(track,
          { xPercent: 0 },
          { xPercent: -50, duration: 28, ease: 'none', repeat: -1, force3D: true }
        );
      }, 0);

      /* ── TEXT SCRAMBLE ─────────────────────────────────────────── */
      class TextScramble {
        constructor(el) {
          this.el = el;
          this.el.style.opacity = 1; // Reveal element when beginning scramble
          this.chars = '!<>-_\\/[]{}—=+*^?#@ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
          this.update = this.update.bind(this);
        }
        run(text) {
          return new Promise(resolve => {
            this.resolve = resolve; this.queue = []; this.frame = 0;
            for (let i = 0; i < text.length; i++) {
              const start = Math.floor(i * 1.6);
              this.queue.push({ to: text[i], start, end: start + 8 + Math.floor(Math.random() * 6), char: '' });
            }
            cancelAnimationFrame(this.raf);
            this.update();
          });
        }
        update() {
          let html = '', complete = 0;
          for (const item of this.queue) {
            if (this.frame >= item.end) { complete++; html += item.to; }
            else if (this.frame >= item.start) {
              if (!item.char || Math.random() < .3) item.char = this.chars[Math.floor(Math.random() * this.chars.length)];
              html += `<span class="scramble-char">${item.char}</span>`;
            } else { html += `<span class="scramble-char" style="opacity:0">${item.to}</span>`; }
          }
          this.el.innerHTML = html;
          if (complete === this.queue.length) { this.resolve(); return; }
          this.frame++;
          this.raf = requestAnimationFrame(this.update);
        }
      }

      /* ── LOADER → HERO ─────────────────────────────────────────── */
      /* Skip loader on repeat visits — LCP improvement for returning users */
      if (sessionStorage.getItem('cs_v')) {
        document.getElementById('loader').style.display = 'none';
        setTimeout(runHeroEntrance, 0); /* diferir para que CS_HERO_TEXTS y CS_LANG estén inicializados */
      } else {
        sessionStorage.setItem('cs_v', '1');
        gsap.timeline({ onComplete: runHeroEntrance })
          .to('#ldLogo', { opacity: 1, duration: .4, ease: 'power2.out' })
          .to('#ldBar', { width: '100%', duration: .5, ease: 'power2.inOut' }, '-=.1')
          .to('#loader', { opacity: 0, duration: .6, ease: 'power2.out' }, '+=.1')
          .set('#loader', { display: 'none' });
      }

      function runHeroEntrance() {
        gsap.set('.hero-static-title', { opacity: 1 });   /* revelamos el contenedor */
        gsap.to('#heroEyebrow', { opacity: 1, duration: .8, ease: 'power2.out' });

        var _heroT = (typeof CS_HERO_TEXTS !== 'undefined' && typeof CS_LANG !== 'undefined') ? CS_HERO_TEXTS[CS_LANG] : [
          { el: 'scrL1',  text: 'PRESENCIA', delay: 200 },
          { el: 'scrL2a', text: 'DIGITAL',   delay: 340 },
          { el: 'scrL2b', text: 'QUE',       delay: 520 },
          { el: 'scrL3',  text: 'VENDE.',    delay: 660 },
        ];
        _heroT.forEach(({ el, text, delay }) => {
          var node = typeof el === 'string' ? document.getElementById(el) : el;
          if (node) setTimeout(() => new TextScramble(node).run(text), delay);
        });

        setTimeout(() => {
          gsap.to('#heroSub', { opacity: 1, duration: .85, ease: 'power3.out' });
          gsap.to('#heroActions', { opacity: 1, duration: .75, ease: 'power3.out', delay: .18 });
        }, 1600);
      }



      /* ── NAV ───────────────────────────────────────────────────── */
      window.addEventListener('scroll', () => {
        var nb = document.getElementById('navbar');
        if (nb) nb.classList.toggle('scrolled', window.scrollY > 60);
      }, { passive: true });

      /* ── MOBILE NAV ────────────────────────────────────────────── */
      let navOpen = false;
      function toggleNav() {
        navOpen = !navOpen;
        const ham = document.getElementById('navHam');
        document.getElementById('mobileNav').classList.toggle('open', navOpen);
        ham.classList.toggle('open', navOpen);
        ham.setAttribute('aria-expanded', String(navOpen));
        ham.setAttribute('aria-label', navOpen ? 'Cerrar menú' : 'Abrir menú');
        document.body.style.overflow = navOpen ? 'hidden' : '';
      }
      function closeNav() {
        navOpen = false;
        const ham = document.getElementById('navHam');
        document.getElementById('mobileNav').classList.remove('open');
        ham.classList.remove('open');
        ham.setAttribute('aria-expanded', 'false');
        ham.setAttribute('aria-label', 'Abrir menú');
        document.body.style.overflow = '';
      }

      /* ── SMOOTH SCROLL ─────────────────────────────────────────── */
      document.querySelectorAll('a[href^="#"]:not(.port-card)').forEach(a => {
        a.addEventListener('click', e => {
          const id = a.getAttribute('href');
          if (id === '#') return;
          const t = document.querySelector(id);
          if (!t) return;
          e.preventDefault();
          const nh = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nh'));
          window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - nh, behavior: 'smooth' });
        });
      });

      /* ── SCROLL REVEALS + COUNTERS (idle — no bloquean LCP) ───── */
      (window.requestIdleCallback || (cb => setTimeout(cb, 200)))(function () {
        gsap.utils.toArray('.sr').forEach(el => {
          gsap.fromTo(el, { opacity: 0, y: 48 }, {
            opacity: 1, y: 0, duration: .95, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' }
          });
        });

        gsap.utils.toArray('.port-card').forEach((card, i) => {
          gsap.fromTo(card, { opacity: 0, y: 40 }, {
            opacity: 1, y: 0, duration: .8, ease: 'power3.out',
            delay: (i % 4) * .07,
            scrollTrigger: { trigger: card, start: 'top 90%', toggleActions: 'play none none none' }
          });
        });

        document.querySelectorAll('.stat-num').forEach(el => {
          const target = parseInt(el.dataset.target), suffix = el.dataset.suffix || '';
          let started = false;
          ScrollTrigger.create({
            trigger: el, start: 'top 88%', onEnter() {
              if (started) return; started = true;
              const t0 = performance.now();
              (function step(now) {
                const p = Math.min((now - t0) / 1600, 1);
                el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target) + suffix;
                if (p < 1) requestAnimationFrame(step);
              })(t0);
            }
          });
        });
      });

      /* ── CURSOR (rAF — sin tweens GSAP por mousemove) ─────────── */
      const dot = document.getElementById('cDot'), ring = document.getElementById('cRing');
      let _mx = 0, _my = 0, _rx = 0, _ry = 0, _craf = null;
      document.addEventListener('mousemove', e => {
        _mx = e.clientX; _my = e.clientY;
        if (!_craf) _craf = requestAnimationFrame(_stepCursor);
      });
      function _stepCursor() {
        _craf = null;
        dot.style.transform  = 'translate(calc(' + _mx + 'px - 50%), calc(' + _my + 'px - 50%))';
        _rx += (_mx - _rx) * 0.18;
        _ry += (_my - _ry) * 0.18;
        ring.style.transform = 'translate(calc(' + _rx + 'px - 50%), calc(' + _ry + 'px - 50%))';
        if (Math.abs(_mx - _rx) > 0.5 || Math.abs(_my - _ry) > 0.5)
          _craf = requestAnimationFrame(_stepCursor);
      }
      document.querySelectorAll('.ht').forEach(el => {
        el.addEventListener('mouseenter', () => ring.classList.add('on'));
        el.addEventListener('mouseleave', () => ring.classList.remove('on'));
      });





      /* ── HERO — MAGNETIC FIELD LINES (idle — decorativo) ─────── */
      (window.requestIdleCallback || (cb => setTimeout(cb, 200)))(function () {
      (function () {
        const canvas = document.getElementById('heroCanvas');
        if (!canvas) return;

        // Respect prefers-reduced-motion: skip animation entirely, render a static frame
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const ctx = canvas.getContext('2d');
        let W, H, t = 0, seeds = [];

        // More poles than hero3 (8 vs 6), tighter spread for wilder crossings
        const poles = [
          { fx: .18, fy: .28, q: 1 },
          { fx: .82, fy: .72, q: -1 },
          { fx: .55, fy: .12, q: 1 },
          { fx: .35, fy: .82, q: -1 },
          { fx: .74, fy: .24, q: 1 },
          { fx: .26, fy: .76, q: -1 },
          { fx: .50, fy: .50, q: 1 },  // central attractor
          { fx: .88, fy: .42, q: -1 },  // right-side extra
        ];

        function resize() {
          W = canvas.width = window.innerWidth;
          H = canvas.height = window.innerHeight;
        }

        function buildSeeds() {
          const isMobile = W < 768;
          const LINES = isMobile ? 60 : 130;  // more lines for density
          seeds = [];

          // Perimeter seeds
          for (let i = 0; i < LINES; i++) {
            const a = (i / LINES) * Math.PI * 2;
            const lime = Math.random() < (i % 4 === 0 ? .75 : .22);  // varied lime ratio
            // Each seed gets its own step size and drift amplitude for variety
            seeds.push({
              x: W * .5 + Math.cos(a) * W * .47,
              y: H * .5 + Math.sin(a) * H * .45,
              lime,
              step: (isMobile ? 11 : 6) + Math.random() * 8,          // 6–14 px per step (was fixed 5)
              steps: (isMobile ? 70 : 140) + Math.floor(Math.random() * (isMobile ? 60 : 120)), // 140–260 steps (was fixed 200)
              drift: 30 + Math.random() * 55,         // drift amplitude 30–85px
              driftSpd: .3 + Math.random() * .5,     // drift speed per seed
              lw: lime ? .8 + Math.random() * 1.6 : .4 + Math.random() * .8,
              alpha: lime ? .28 + Math.random() * .25 : .08 + Math.random() * .12,
            });
          }

          // Extra seeds near each pole for chaotic density
          for (const p of poles) {
            const innerLines = isMobile ? 3 : 6;
            for (let k = 0; k < innerLines; k++) {
              const a = (k / innerLines) * Math.PI * 2;
              const lime = p.q > 0;
              seeds.push({
                x: p.fx * W + Math.cos(a) * 90,
                y: p.fy * H + Math.sin(a) * 90,
                lime,
                step: (isMobile ? 12 : 8) + Math.random() * 10,
                steps: (isMobile ? 50 : 100) + Math.floor(Math.random() * (isMobile ? 40 : 80)),
                drift: 15 + Math.random() * 35,
                driftSpd: .5 + Math.random() * .7,
                lw: lime ? 1.0 + Math.random() * 1.8 : .5 + Math.random() * .6,
                alpha: lime ? .35 + Math.random() * .30 : .07 + Math.random() * .10,
              });
            }
          }
        }

        let currentPoles = [];

        function field(x, y) {
          let fx = 0, fy = 0;
          for (let i = 0; i < currentPoles.length; i++) {
            const p = currentPoles[i];
            const dx = x - p.px, dy = y - p.py;
            const d2 = dx * dx + dy * dy;
            const d = Math.sqrt(d2) + 1;
            const force = p.q / (d2 * .0008 + d);
            fx += dx * force;
            fy += dy * force;
          }
          const mag = Math.sqrt(fx * fx + fy * fy) + .0001;
          return { vx: fx / mag, vy: fy / mag };
        }

        let rafId;
        // 30 fps cap on mobile, 60 fps on desktop (reduces CPU/GPU ~50% on phones)
        const targetFPS = (W && W < 768) ? 30 : 60;
        let frameInterval = 1000 / targetFPS;
        let lastFrameTime = 0;

        function renderFrame() {
          ctx.clearRect(0, 0, W, H);
          ctx.globalCompositeOperation = 'lighter';
          t += .0085;  // ~2× faster time than hero3 (.004)

          currentPoles = poles.map(p => ({
            px: p.fx * W + Math.sin(t * 1.1 + p.fy * 5) * 85,
            py: p.fy * H + Math.cos(t * .85 + p.fx * 5) * 72,
            q: p.q
          }));

          for (const seed of seeds) {
            const drift = t * seed.driftSpd;
            let x = seed.x + Math.sin(drift + seed.x * .002) * seed.drift;
            let y = seed.y + Math.cos(drift * .8 + seed.y * .002) * seed.drift * .7;

            ctx.beginPath(); ctx.moveTo(x, y);
            for (let s = 0; s < seed.steps; s++) {
              const { vx, vy } = field(x, y);
              x += vx * seed.step;
              y += vy * seed.step;
              if (x < -80 || x > W + 80 || y < -80 || y > H + 80) break;
              ctx.lineTo(x, y);
            }

            ctx.strokeStyle = seed.lime
              ? `rgba(184,255,0,${seed.alpha})`
              : `rgba(255,255,255,${seed.alpha})`;
            ctx.lineWidth = seed.lw;
            ctx.stroke();
          }
        }

        function draw(now) {
          rafId = requestAnimationFrame(draw);
          if (now - lastFrameTime < frameInterval) return;
          lastFrameTime = now;
          renderFrame();
        }

        resize(); buildSeeds();
        // Recompute target FPS after resize knows dimensions
        frameInterval = 1000 / ((W < 768) ? 30 : 60);

        if (prefersReducedMotion) {
          // Render a single static frame and exit — no animation loop
          renderFrame();
        } else {
          new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
              if (!rafId) { lastFrameTime = 0; rafId = requestAnimationFrame(draw); }
            } else if (rafId) {
              cancelAnimationFrame(rafId); rafId = null;
            }
          }, { threshold: 0 }).observe(canvas.parentElement);
        }
        window.addEventListener('resize', () => {
          resize(); buildSeeds();
          frameInterval = 1000 / ((W < 768) ? 30 : 60);
          if (prefersReducedMotion) renderFrame();
        });
      })();
      }); /* end requestIdleCallback */




      /* ══════════════════════════════════════════════════════════════
         SISTEMA BILINGÜE — ES / EN
         setLang(lang) aplica todas las traducciones al DOM.
         toggleLang()  alterna y persiste en localStorage.
         Al cargar: lee localStorage, si no existe detecta navigator.language.
      ══════════════════════════════════════════════════════════════ */

      var CS_LANG = 'es'; /* estado activo */

      var CS_I18N = {
        es: {
          /* ── LOADER */
          'ldLbl': { t: 'Cargando' },
          /* ── NAV */
          'nav-servicios': { t: 'Servicios' },
          'nav-portafolio': { t: 'Portafolio' },
          'nav-nosotros': { t: 'Nosotros' },
          'nav-precios': { t: 'Precios' },
          'nav-contacto': { t: 'Contacto' },
          'nav-blog': { t: 'Blog' },
          'nav-cta': { t: 'Hablemos' },
          'mnav-servicios': { t: 'Servicios' },
          'mnav-portafolio': { t: 'Portafolio' },
          'mnav-nosotros': { t: 'Nosotros' },
          'mnav-precios': { t: 'Precios' },
          'mnav-contacto': { t: 'Contacto' },
          'mnav-blog': { t: 'Blog' },
          /* ── HERO */
          'heroEyebrow': { t: 'Agencia Digital Premium · cerostudio.ai' },
          'heroSub': { t: 'Desarrollamos sitios web y tiendas online para emprendedores y negocios. Diseño de nivel internacional, resultados reales.' },
          'hero-btn-portfolio': { t: 'Ver Portafolio' },
          'hero-btn-quote': { t: 'Solicitar Cotización' },
          /* ── MARQUEE */
          'marquee-1': { h: 'Diseño Web <em>·</em> eCommerce <em>·</em> Branding <em>·</em> SEO <em>·</em> Desarrollo <em>·</em> Consultoría <em>·</em> Mantenimiento <em>·</em> Identidad Visual <em>·</em>' },
          'marquee-2': { h: 'Diseño Web <em>·</em> eCommerce <em>·</em> Branding <em>·</em> SEO <em>·</em> Desarrollo <em>·</em> Consultoría <em>·</em> Mantenimiento <em>·</em> Identidad Visual <em>·</em>' },
          /* ── SERVICIOS */
          'srv-eyebrow': { t: 'Servicios' },
          'srv-title': { h: 'Todo lo que necesitas<br>para <span class="t-outline">crecer</span> en línea' },
          'srv-desc': { t: 'Desde el diseño hasta el lanzamiento, cubrimos cada aspecto de tu presencia digital con estándares de nivel internacional.' },
          'srv-t1': { t: 'Desarrollo Web' }, 'srv-d1': { t: 'Sitios rápidos, modernos y optimizados que generan confianza y convierten visitantes en clientes desde el primer clic.' },
          'srv-t2': { t: 'Tiendas eCommerce' }, 'srv-d2': { t: 'Tu negocio abierto 24/7. Tiendas online completas con pasarelas de pago, inventario y experiencia de compra fluida.' },
          'srv-t3': { t: 'Branding Digital' }, 'srv-d3': { t: 'Identidad visual profesional que diferencia tu marca y genera la confianza que tu audiencia necesita ver.' },
          'srv-t4': { t: 'SEO + AI Search' }, 'srv-d4': { t: 'Posicionamiento en Google + visibilidad en ChatGPT, Claude, Gemini y Perplexity. Que tus clientes te encuentren — buscando o preguntando.' },
          'srv-t5': { t: 'Mantenimiento' }, 'srv-d5': { t: 'Soporte técnico continuo, actualizaciones de seguridad y optimización para que tu sitio funcione perfecto siempre.' },
          'srv-t6': { t: 'Consultoría Digital' }, 'srv-d6': { t: 'Estrategia digital personalizada para escalar tu negocio. Tomamos las decisiones correctas antes de escribir código.' },
          /* ── PORTAFOLIO */
          'port-eyebrow': { t: 'Portafolio' },
          'port-title': { h: 'Proyectos que hacen<br>la <span class="t-outline">diferencia</span>' },
          'port-start-btn': { t: 'Iniciar Proyecto' },
          'port-cta-q': { h: '¿Tu negocio<br>aquí?' },
          'port-cta-sub': { t: 'Únete a +150 negocios exitosos' },
          'port-cta-btn': { t: 'Iniciar Proyecto' },
          'port-badge': { t: 'Ver Proyecto →' },
          'port-c1': { t: 'Agencia · Modelos & Producción BTL' },
          'port-d1': { t: 'Plataforma digital para agencia de modelos, edecanes y producción de eventos corporativos.' },
          'port-c2': { t: 'Imprenta · Cotizaciones en línea' },
          'port-d2': { t: 'Sitio corporativo para imprenta offset con cotizador de productos integrado.' },
          'port-c3': { t: 'Automotriz · Inventario en línea' },
          'port-d3': { t: 'Catálogo digital de vehículos con buscador avanzado y fichas técnicas detalladas.' },
          'port-c4': { t: 'Agencia · Talento & Activaciones BTL' },
          'port-d4': { t: 'Sitio para agencia de talento profesional con activaciones BTL e infraestructura para eventos.' },
          'port-c5': { t: 'Industrial · Soluciones antivibratorias' },
          'port-d5': { t: 'Catálogo y tienda online para distribuidora de productos de mantenimiento industrial.' },
          'port-c6': { t: 'Manufactura · Estanterías y exhibidores' },
          'port-d6': { t: 'Tienda multimarca con sistema de inventario en tiempo real y catálogo dinámico.' },
          'port-c7': { t: 'Tienda online · Mascotas' },
          'port-d7': { t: 'Tienda online de alta calidad para el cuidado y bienestar de mascotas.' },
          'port-c8': { t: 'Educación · Inscripciones digitales' },
          'port-d8': { t: 'Portal institucional para centro de investigación con gestión editorial avanzada.' },
          'port-c9': { t: 'Industrial · Fabricación metálica' },
          'port-d9': { t: 'Portal empresarial con presentación institucional y gestión de proyectos activos.' },
          'port-c10': { t: 'Tienda online · Gatos' },
          'port-d10': { t: 'E-commerce especializado en productos y accesorios premium para gatos.' },
          'port-c11': { t: 'Salud · Neumología' },
          'port-d11': { t: 'Plataforma de salud respiratoria con recursos educativos y consultas en línea.' },
          'port-c12': { t: 'Bienestar · Sanación Holística' },
          'port-d12': { t: 'Sitio para practicante holística con terapia de duelo, ceremonias sagradas y retiros del alma.' },
          'port-c13': { t: 'Salud Mental · Psicoterapia Online' },
          'port-d13': { t: 'Plataforma de psicoterapia en línea especializada en recuperación de adicciones y sanación emocional.' },
          'port-c14': { t: 'Agropecuario · Consultoría Avícola' },
          'port-d14': { t: 'Asesoría especializada en bioseguridad, sanidad animal y optimización de producción avícola.' },

          /* ── NOSOTROS */
          'nos-eyebrow': { t: 'Nosotros' },
          'nos-title': { h: 'La agencia detrás de tu crecimiento <span class="t-lime">digital</span>' },
          'nos-desc': { h: 'Somos <strong>Cero Studio</strong>, una agencia digital fundada con una misión clara: ayudar a emprendedores y negocios a competir y ganar en el mundo digital.<br><br>Combinamos diseño de nivel internacional con una comprensión profunda de las necesidades del mercado multicultural. No hacemos sitios genéricos — construimos <strong>herramientas de negocio</strong> que trabajan mientras tú descansas.' },
          'stat-l1': { t: 'Clientes atendidos' },
          'stat-l2': { t: 'Años de experiencia' },
          'stat-l3': { t: 'Proyectos entregados' },
          'stat-l4': { t: 'Satisfacción garantizada' },
          'nos-btn': { t: 'Trabajemos Juntos' },
          'nos-historia': { t: 'Mi historia completa →' },
          'nos-quote': { h: 'Un sitio web no es un gasto. Es el vendedor más trabajador que nunca te pide vacaciones.' },
          /* ── PROCESO */
          'proc-eyebrow': { t: 'Cómo Trabajamos' },
          'proc-headline': { h: 'Sin sorpresas,<br><span class="t-outline">sin rodeos.</span>' },
          'proc-t1': { t: 'Diagnóstico' }, 'proc-d1': { t: 'Analizamos tu negocio, tu competencia y tu mercado. Identificamos exactamente qué está funcionando, qué está fallando y por qué.' },
          'proc-t2': { t: 'Estrategia' }, 'proc-d2': { t: 'Plan a medida: qué servicios necesitas, en qué orden y con qué presupuesto para maximizar el retorno desde el primer mes.' },
          'proc-t3': { t: 'Ejecución' }, 'proc-d3': { t: 'Diseño, desarrollo, SEO y lo que haga falta. Tú apruebas, nosotros entregamos en tiempo y forma. Sin cobros sorpresa.' },
          'proc-t4': { t: 'Resultados' }, 'proc-d4': { t: 'Reportes claros cada mes: visitas, leads generados, conversiones y ventas. Sin tecnicismos — solo los números que importan a tu negocio.' },
          /* ── PRECIOS */
          'precios-eyebrow': { t: 'Inversión' },
          'precios-headline': { h: 'Precios<br><em>sin letra chica.</em>' },
          'precios-urgency': { t: 'Solo disponible para los primeros 5 clientes del mes' },
          'precios-trust-text': { h: 'Pago único. Sin mensualidades ocultas.<br>Sin sorpresas al final.' },
          'dominate-headline': { h: '¿Listo<br>para<br>dominar?' },
          'dominate-sub': { h: 'Primera consulta gratis.<br>Sin compromisos.' },
          'dominate-cta': { t: 'Iniciar Proyecto' },
          'launch-old-price': { t: 'Precio regular: $499 USD' },
          'launch-delivery': { t: 'pago único · entrega 5 días hábiles' },
          'launch-features': { h: '<li><strong>Identidad visual básica incluida</strong> — logo, paleta, tipografía</li><li>Una página de alto impacto con 4 secciones (hero, servicios, sobre ti, contacto)</li><li>Diseño responsive — celular y computadora</li><li>SEO básico configurado desde el inicio</li><li>Formulario de contacto incluido</li><li>Dominio <strong>.com</strong> incluido el primer año (o conectamos el tuyo si ya lo tienes)</li><li>Cambios de contenido a través de Cero Studio</li>' },
          'launch-note': { t: 'Ideal para: restaurantes, consultorios, salones, servicios locales.' },
          'launch-cta': { t: 'Quiero empezar →' },
          'pro-badge': { t: 'Más solicitado' },
          'pro-old-price': { t: 'Precio regular: $2,500 USD' },
          'pro-delivery': { t: 'pago único · entrega 21 días hábiles' },
          'pro-features': { h: '<li><strong>Identidad profesional incluida</strong> — logo, paleta, tipografía + guidelines mini</li><li>4 a 6 páginas con diseño de nivel internacional</li><li>Tú editas el contenido — sin depender de nosotros</li><li>Blog incluido para posicionarte como experto</li><li>Animaciones y microinteracciones premium</li><li>SEO avanzado + Google Search Console</li><li>Google Analytics + Tag Manager configurados</li><li>Botón de WhatsApp integrado</li><li>Dominio <strong>.com</strong> incluido el primer año (o conectamos el tuyo si ya lo tienes)</li><li>Responsive — celular, tablet y escritorio</li><li>Formulario de contacto profesional</li>' },
          'pro-note': { t: 'Ideal para: negocios establecidos, profesionales independientes, empresas listas para crecer.' },
          'pro-cta': { t: 'Quiero el Cero Pro →' },
          'premium-price-display': { h: 'Desde $1,800<span>USD</span>' },
          'premium-old-price': { t: 'Precio regular: desde $4,500 USD' },
          'premium-delivery': { t: 'cotización personalizada · entrega a convenir' },
          'premium-features': { h: '<li>Todo lo del plan Cero Pro</li><li>Funciones avanzadas a la medida</li><li>Estrategia digital incluida</li><li>Account manager dedicado</li>' },
          'premium-note': { t: 'Ideal para: negocios con múltiples servicios y necesidades a la medida.' },
          'premium-cta': { t: 'Pedir cotización →' },
          'precios-condition': { t: 'Precios especiales de lanzamiento. Condición: Cero Studio publica el proyecto en su portafolio con nombre del negocio y resultados reales.' },
          /* ── TIENDAS EN LÍNEA */
          'tiendas-eyebrow': { t: 'Tiendas en línea' },
          'tiendas-headline': { h: 'Vende<br><em>en línea.</em>' },
          'tiendas-urgency': { t: 'Tu tienda lista para cobrar, no solo para verse bien' },
          'tiendas-trust-text': { h: 'Pago único por el desarrollo.<br>La plataforma y la pasarela las cubre tu negocio.' },
          'tiendas-partner-caption': { h: 'Agencia <strong style="font-weight:600;color:#fff;">Tiendanube Partner</strong><br>Empresa certificada' },
          'tienda-esencial-name': { t: 'Tienda Esencial' },
          'tienda-esencial-delivery': { t: 'pago único · marcas que empiezan' },
          'tienda-esencial-features': { h: '<li>Tienda en TiendaNube con template configurado a tu marca</li><li>Cargas y administras tu catálogo desde el panel, sin depender de nosotros</li><li>Pasarela de pago + envíos configurados</li><li>Conexión a Instagram + botón de WhatsApp</li><li>Dominio incluido (primer año)</li>' },
          'tienda-esencial-note': { t: 'Ideal para: marcas que empiezan, catálogo chico.' },
          'tienda-esencial-cta': { t: 'Quiero empezar →' },
          'tienda-pro-badge': { t: 'Más solicitado' },
          'tienda-pro-name': { t: 'Tienda Pro' },
          'tienda-pro-delivery': { t: 'pago único · catálogo en crecimiento' },
          'tienda-pro-features': { h: '<li>Todo lo de Tienda Esencial</li><li>Diseño alineado a tu marca</li><li>SEO básico + categorías organizadas</li><li>Integraciones (Instagram Shopping)</li>' },
          'tienda-pro-note': { t: 'Ideal para: catálogo mediano en crecimiento.' },
          'tienda-pro-cta': { t: 'Quiero la Tienda Pro →' },
          'tienda-premium-name': { t: 'Tienda Premium' },
          'tienda-premium-delivery': { t: 'pago único · marca establecida' },
          'tienda-premium-features': { h: '<li>Todo lo de Tienda Pro</li><li>Diseño 100% personalizado</li><li>Branding completo</li><li>SEO avanzado + automatizaciones (carrito abandonado, correos)</li>' },
          'tienda-premium-note': { t: 'Ideal para: marca establecida.' },
          'tienda-premium-cta': { t: 'Pedir cotización →' },
          'tiendas-condition': { t: 'Mensualidad opcional de soporte y carga de producto desde $800 MXN/mes. El plan de TiendaNube (~$99–249/mes) y la comisión de la pasarela de pago (~3.8% + IVA por venta) los cubre el cliente.' },
          /* ── CONTACTO */
          'contact-eyebrow': { t: 'Contacto' },
          'contact-title': { h: '¿Listo para el<br><span class="t-outline">siguiente</span> nivel?' },
          'contact-sub': { t: 'Cuéntanos sobre tu proyecto. Respondemos en menos de 24 horas y la primera consulta es completamente gratis.' },
          'submitBtnLabel': { t: 'Enviar Mensaje' },
          'agenda-link': { t: 'O agenda una llamada →' },
          /* ── FOOTER */
          'footer-tagline': { t: 'Diseñamos el futuro digital de tu negocio.' },
          'fcol-nav-title': { t: 'Navegación' },
          'fcol-srv-title': { t: 'Servicios' },
          'fcol-contact-title': { t: 'Contacto' },
          'fnav-srv': { t: 'Servicios' }, 'fnav-port': { t: 'Portafolio' },
          'fnav-nos': { t: 'Nosotros' }, 'fnav-proc': { t: 'Proceso' },
          'fnav-contact': { t: 'Contacto' }, 'fnav-privacy': { t: 'Privacidad y Cookies' },
          'fsrv-1': { t: 'Desarrollo Web' }, 'fsrv-2': { t: 'Tiendas eCommerce' },
          'fsrv-3': { t: 'Branding Digital' }, 'fsrv-4': { t: 'SEO + AI Search' },
          'fsrv-5': { t: 'Mantenimiento' },
          'footer-copy': { t: '© 2026 Cero Studio. Todos los derechos reservados.' },
          'footer-credit': { h: 'Hecho con <span>♥</span> para emprendedores' },
          'cs-bar-msg': { t: 'Usamos cookies propias y de terceros (Google Analytics) para analizar el tráfico y mejorar tu experiencia.' },
          'cs-bar-link': { t: 'Política de cookies' },
          'cs-bar-reject': { t: 'Solo esenciales' },
          'cs-bar-accept': { t: 'Aceptar todo' },
        },
        en: {
          /* ── LOADER */
          'ldLbl': { t: 'Loading' },
          /* ── NAV */
          'nav-servicios': { t: 'Services' },
          'nav-portafolio': { t: 'Portfolio' },
          'nav-nosotros': { t: 'About' },
          'nav-precios': { t: 'Pricing' },
          'nav-contacto': { t: 'Contact' },
          'nav-cta': { t: "Let's Talk" },
          'mnav-servicios': { t: 'Services' },
          'mnav-portafolio': { t: 'Portfolio' },
          'mnav-nosotros': { t: 'About' },
          'mnav-precios': { t: 'Pricing' },
          'mnav-contacto': { t: 'Contact' },
          /* ── HERO */
          'heroEyebrow': { t: 'Premium Digital Agency · cerostudio.ai' },
          'heroSub': { t: 'We build websites and online stores for entrepreneurs and businesses. International-level design, real results.' },
          'hero-btn-portfolio': { t: 'View Portfolio' },
          'hero-btn-quote': { t: 'Request a Quote' },
          /* ── MARQUEE */
          'marquee-1': { h: 'Web Design <em>·</em> eCommerce <em>·</em> Branding <em>·</em> SEO <em>·</em> Development <em>·</em> Consulting <em>·</em> Maintenance <em>·</em> Visual Identity <em>·</em>' },
          'marquee-2': { h: 'Web Design <em>·</em> eCommerce <em>·</em> Branding <em>·</em> SEO <em>·</em> Development <em>·</em> Consulting <em>·</em> Maintenance <em>·</em> Visual Identity <em>·</em>' },
          /* ── SERVICIOS */
          'srv-eyebrow': { t: 'Services' },
          'srv-title': { h: 'Everything you need<br>to <span class="t-outline">grow</span> online' },
          'srv-desc': { t: 'From design to launch, we cover every aspect of your digital presence to international standards.' },
          'srv-t1': { t: 'Web Development' }, 'srv-d1': { t: 'Fast, modern, optimized websites that build trust and convert visitors into customers from the first click.' },
          'srv-t2': { t: 'eCommerce Stores' }, 'srv-d2': { t: 'Your business open 24/7. Complete online stores with payment gateways, inventory, and seamless shopping experience.' },
          'srv-t3': { t: 'Digital Branding' }, 'srv-d3': { t: 'Professional visual identity that sets your brand apart and builds the trust your audience needs to see.' },
          'srv-t4': { t: 'SEO + AI Search' }, 'srv-d4': { t: 'Google rankings + visibility in ChatGPT, Claude, Gemini and Perplexity. So your customers find you — searching or asking.' },
          'srv-t5': { t: 'Maintenance' }, 'srv-d5': { t: 'Continuous technical support, security updates, and optimization so your site runs perfectly at all times.' },
          'srv-t6': { t: 'Digital Consulting' }, 'srv-d6': { t: 'Personalized digital strategy to scale your business. We make the right decisions before writing a single line of code.' },
          /* ── PORTAFOLIO */
          'port-eyebrow': { t: 'Portfolio' },
          'port-title': { h: 'Projects that make<br>a <span class="t-outline">difference</span>' },
          'port-start-btn': { t: 'Start a Project' },
          'port-cta-q': { h: 'Your business<br>here?' },
          'port-cta-sub': { t: 'Join +150 successful businesses' },
          'port-cta-btn': { t: 'Start a Project' },
          'port-badge': { t: 'View Project →' },
          'port-c1': { t: 'Agency · Models & BTL Production' },
          'port-d1': { t: 'Digital platform for modeling agency, promotional staff and corporate event production.' },
          'port-c2': { t: 'Print Shop · Online Quoting' },
          'port-d2': { t: 'Corporate site for offset printing with integrated product quoter.' },
          'port-c3': { t: 'Automotive · Online Inventory' },
          'port-d3': { t: 'Digital vehicle catalog with advanced search and detailed technical specs.' },
          'port-c4': { t: 'Agency · Talent & BTL Activations' },
          'port-d4': { t: 'Site for professional talent agency with BTL activations and event infrastructure.' },
          'port-c5': { t: 'Industrial · Anti-vibration Solutions' },
          'port-d5': { t: 'Catalog and online store for industrial maintenance products distributor.' },
          'port-c6': { t: 'Manufacturing · Racks & Displays' },
          'port-d6': { t: 'Multi-brand store with real-time inventory system and dynamic catalog.' },
          'port-c7': { t: 'Online Store · Pets' },
          'port-d7': { t: 'High-quality online store for pet care and well-being.' },
          'port-c8': { t: 'Education · Digital Enrollment' },
          'port-d8': { t: 'Institutional portal for research center with advanced editorial management.' },
          'port-c9': { t: 'Industrial · Metal Fabrication' },
          'port-d9': { t: 'Business portal with institutional presentation and active project management.' },
          'port-c10': { t: 'Online Store · Cats' },
          'port-d10': { t: 'Specialized e-commerce for premium cat products and accessories.' },
          'port-c11': { t: 'Health · Pulmonology' },
          'port-d11': { t: 'Respiratory health platform with educational resources and online consultations.' },
          'port-c12': { t: 'Wellness · Holistic Healing' },
          'port-d12': { t: 'Website for a holistic practitioner offering grief therapy, sacred ceremonies, and soul retreats.' },
          'port-c13': { t: 'Mental Health · Online Psychotherapy' },
          'port-d13': { t: 'Online psychotherapy platform specialized in addiction recovery and emotional healing.' },
          'port-c14': { t: 'Agriculture · Poultry Consulting' },
          'port-d14': { t: 'Specialized advisory in biosecurity, animal health, and poultry production optimization.' },

          /* ── NOSOTROS */
          'nos-eyebrow': { t: 'About Us' },
          'nos-title': { h: 'The agency behind your <span class="t-lime">digital</span> growth' },
          'nos-desc': { h: "We are <strong>Cero Studio</strong>, a digital agency founded with a clear mission: to help entrepreneurs and businesses compete and win in the digital world.<br><br>We combine international-level design with a deep understanding of the multicultural and bilingual market. We don't build generic sites — we build <strong>business tools</strong> that work while you rest." },
          'stat-l1': { t: 'Clients served' },
          'stat-l2': { t: 'Years of experience' },
          'stat-l3': { t: 'Projects delivered' },
          'stat-l4': { t: 'Satisfaction guaranteed' },
          'nos-btn': { t: "Let's Work Together" },
          'nos-historia': { t: 'Read My Full Story →' },
          'nos-quote': { h: "A website isn't an expense. It's the hardest-working employee you'll never have to pay overtime." },
          /* ── PROCESO */
          'proc-eyebrow': { t: 'How We Work' },
          'proc-headline': { h: 'No surprises,<br><span class="t-outline">no detours.</span>' },
          'proc-t1': { t: 'Discovery' }, 'proc-d1': { t: 'We analyze your business, competition, and market. We identify exactly what is working, what is not, and why.' },
          'proc-t2': { t: 'Strategy' }, 'proc-d2': { t: 'A custom plan: which services you need, in what order, and with what budget to maximize returns from month one.' },
          'proc-t3': { t: 'Execution' }, 'proc-d3': { t: 'Design, development, SEO — whatever it takes. You approve, we deliver on time. No surprise charges.' },
          'proc-t4': { t: 'Results' }, 'proc-d4': { t: 'Clear monthly reports: visits, leads generated, conversions, and sales. No jargon — just the numbers that matter to your business.' },
          /* ── PRECIOS */
          'precios-eyebrow': { t: 'Investment' },
          'precios-headline': { h: 'Pricing<br><em>no hidden fees.</em>' },
          'precios-urgency': { t: 'Available for the first 5 clients' },
          'precios-trust-text': { h: 'One-time payment. No hidden subscriptions.<br>No surprises at the end.' },
          'dominate-headline': { h: 'Ready<br>to<br>dominate?' },
          'dominate-sub': { h: 'Free first consultation.<br>No commitments.' },
          'dominate-cta': { t: 'Start Your Project' },
          'launch-old-price': { t: 'Regular price: $499 USD' },
          'launch-delivery': { t: 'one-time payment · delivered in 5 business days' },
          'launch-features': { h: '<li><strong>Basic visual identity included</strong> — logo, palette, typography</li><li>A high-impact one-page site with 4 sections (hero, services, about, contact)</li><li>Responsive design — phone and desktop</li><li>Basic SEO configured from day one</li><li>Contact form included</li><li><strong>.com</strong> domain included the first year (or we connect yours if you already have one)</li><li>Content updates handled by Cero Studio</li>' },
          'launch-note': { t: 'Best for: restaurants, clinics, salons, local service businesses.' },
          'launch-cta': { t: 'Get started →' },
          'pro-badge': { t: 'Most popular' },
          'pro-old-price': { t: 'Regular price: $2,500 USD' },
          'pro-delivery': { t: 'one-time payment · delivered in 21 business days' },
          'pro-features': { h: '<li><strong>Professional identity included</strong> — logo, palette, typography + mini guidelines</li><li>4 to 6 pages with international-level design</li><li>You edit your content — no waiting on us</li><li>Blog included to position you as an expert</li><li>Premium animations and microinteractions</li><li>Advanced SEO + Google Search Console</li><li>Google Analytics + Tag Manager setup</li><li>WhatsApp button integrated</li><li><strong>.com</strong> domain included the first year (or we connect yours if you already have one)</li><li>Responsive — phone, tablet, and desktop</li><li>Professional contact form</li>' },
          'pro-note': { t: 'Best for: established businesses, independent professionals, companies ready to grow.' },
          'pro-cta': { t: 'I want Cero Pro →' },
          'premium-price-display': { h: 'From $1,800<span>USD</span>' },
          'premium-old-price': { t: 'Regular price: from $4,500 USD' },
          'premium-delivery': { t: 'custom quote · timeline to be agreed' },
          'premium-features': { h: '<li>Everything in Cero Pro</li><li>Custom advanced features</li><li>Digital strategy included</li><li>Dedicated account manager</li>' },
          'premium-note': { t: 'Best for: businesses with multiple services and custom needs.' },
          'premium-cta': { t: 'Request a quote →' },
          'precios-condition': { t: 'Special launch pricing. Condition: Cero Studio may feature the project in its portfolio with the business name and real results.' },
          /* ── TIENDAS EN LÍNEA */
          'tiendas-eyebrow': { t: 'Online stores' },
          'tiendas-headline': { h: 'Sell<br><em>online.</em>' },
          'tiendas-urgency': { t: 'A store built to sell, not just to look good' },
          'tiendas-trust-text': { h: 'One-time payment for the build.<br>The platform and payment gateway are covered by your business.' },
          'tiendas-partner-caption': { h: 'Certified <strong style="font-weight:600;color:#fff;">Tiendanube Partner</strong><br>Agency' },
          'tienda-esencial-name': { t: 'Store Essential' },
          'tienda-esencial-delivery': { t: 'one-time payment · brands just starting out' },
          'tienda-esencial-features': { h: '<li>TiendaNube store with a template configured to your brand</li><li>You load and manage your catalog from the panel — no waiting on us</li><li>Payment gateway + shipping configured</li><li>Instagram connection + WhatsApp button</li><li>Domain included (first year)</li>' },
          'tienda-esencial-note': { t: 'Best for: brands just starting out, small catalog.' },
          'tienda-esencial-cta': { t: 'I want to start →' },
          'tienda-pro-badge': { t: 'Most popular' },
          'tienda-pro-name': { t: 'Store Pro' },
          'tienda-pro-delivery': { t: 'one-time payment · growing catalog' },
          'tienda-pro-features': { h: '<li>Everything in Store Essential</li><li>Design aligned with your brand</li><li>Basic SEO + organized categories</li><li>Integrations (Instagram Shopping)</li>' },
          'tienda-pro-note': { t: 'Best for: medium, growing catalog.' },
          'tienda-pro-cta': { t: 'I want Store Pro →' },
          'tienda-premium-name': { t: 'Store Premium' },
          'tienda-premium-delivery': { t: 'one-time payment · established brand' },
          'tienda-premium-features': { h: '<li>Everything in Store Pro</li><li>100% custom design</li><li>Full branding</li><li>Advanced SEO + automations (abandoned cart, emails)</li>' },
          'tienda-premium-note': { t: 'Best for: established brands.' },
          'tienda-premium-cta': { t: 'Request a quote →' },
          'tiendas-condition': { t: 'Optional support and product-upload retainer from $800 MXN/month. The TiendaNube plan (~$99–249/month) and the payment gateway fee (~3.8% + tax per sale) are covered by the client.' },
          /* ── CONTACTO */
          'contact-eyebrow': { t: 'Contact' },
          'contact-title': { h: 'Ready for the<br><span class="t-outline">next</span> level?' },
          'contact-sub': { t: 'Tell us about your project. We respond in under 24 hours and the first consultation is completely free.' },
          'submitBtnLabel': { t: 'Send Message' },
          'agenda-link': { t: 'Or schedule a call →' },
          /* ── FOOTER */
          'footer-tagline': { t: 'We design the digital future of your business.' },
          'fcol-nav-title': { t: 'Navigation' },
          'fcol-srv-title': { t: 'Services' },
          'fcol-contact-title': { t: 'Contact' },
          'fnav-srv': { t: 'Services' }, 'fnav-port': { t: 'Portfolio' },
          'fnav-nos': { t: 'About Us' }, 'fnav-proc': { t: 'Process' },
          'fnav-contact': { t: 'Contact' }, 'fnav-privacy': { t: 'Privacy & Cookies' },
          'fsrv-1': { t: 'Web Development' }, 'fsrv-2': { t: 'eCommerce Stores' },
          'fsrv-3': { t: 'Digital Branding' }, 'fsrv-4': { t: 'SEO + AI Search' },
          'fsrv-5': { t: 'Maintenance' },
          'footer-copy': { t: '© 2026 Cero Studio. All rights reserved.' },
          'footer-credit': { h: 'Made with <span>♥</span> for visionary businesses' },
          'cs-bar-msg': { t: 'We use first-party and third-party cookies (Google Analytics) to analyze traffic and improve your experience.' },
          'cs-bar-link': { t: 'Cookie policy' },
          'cs-bar-reject': { t: 'Essential only' },
          'cs-bar-accept': { t: 'Accept all' },
        }
      };

      /* Hero scramble texts per language */
      var CS_HERO_TEXTS = {
        es: [
          { el: 'scrL1',  text: 'PRESENCIA', delay: 200 },
          { el: 'scrL2a', text: 'DIGITAL',   delay: 340 },
          { el: 'scrL2b', text: 'QUE',       delay: 520 },
          { el: 'scrL3',  text: 'VENDE.',    delay: 660 },
        ],
        en: [
          { el: 'scrL1',  text: 'DIGITAL',   delay: 200 },
          { el: 'scrL2a', text: 'PRESENCE',  delay: 340 },
          { el: 'scrL2b', text: 'THAT',      delay: 520 },
          { el: 'scrL3',  text: 'SELLS.',    delay: 660 },
        ]
      };

      /* Form placeholders + select options per language */
      var CS_FORM = {
        es: {
          nombre: 'Nombre *',
          email: 'Email *',
          empresa: 'Empresa / Negocio',
          servicio: '¿Qué servicio necesitas?',
          mensaje: 'Cuéntanos sobre tu proyecto *',
          opts: ['Desarrollo Web', 'Tienda eCommerce', 'Branding Digital', 'SEO & Visibilidad', 'Mantenimiento', 'Consultoría Digital', 'Otro']
        },
        en: {
          nombre: 'Name *',
          email: 'Email *',
          empresa: 'Company / Business',
          servicio: 'What service do you need?',
          mensaje: 'Tell us about your project *',
          opts: ['Web Development', 'eCommerce Store', 'Digital Branding', 'SEO & Visibility', 'Maintenance', 'Digital Consulting', 'Other']
        }
      };

      function setLang(lang) {
        CS_LANG = lang;
        var dict = CS_I18N[lang];
        var g = function (id) { return document.getElementById(id); };

        /* Apply all text/html translations (id + data-i18n for hero duplicates) */
        Object.keys(dict).forEach(function (id) {
          var val = dict[id];
          var apply = function (el) {
            if (!el) return;
            if (val.h !== undefined) el.innerHTML = val.h;
            else el.textContent = val.t;
          };
          apply(g(id));
          document.querySelectorAll('[data-i18n="' + id + '"]').forEach(apply);
        });

        /* Hero titulares — solo actualiza texto, sin tocar opacity.
           La opacidad la maneja exclusivamente TextScramble al animar. */
        if (typeof CS_HERO_TEXTS !== 'undefined' && CS_HERO_TEXTS[lang]) {
          CS_HERO_TEXTS[lang].forEach(function (item) {
            var txt = item.text;
            var sync = function (el) { if (el) el.textContent = txt; };
            sync(g(item.el));
            document.querySelectorAll('[data-hero-line="' + item.el + '"]').forEach(sync);
          });
        }

        /* heroLine3b ya no se usa en ningún idioma */
        var line3b = document.getElementById('heroLine3b');
        if (line3b) line3b.style.display = 'none';

        /* Form placeholders */
        var form = CS_FORM[lang];
        var f = document.getElementById('contactForm');
        if (f) {
          f.querySelector('[name="nombre"]').placeholder = form.nombre;
          f.querySelector('[name="email"]').placeholder = form.email;
          f.querySelector('[name="empresa"]').placeholder = form.empresa;
          f.querySelector('[name="mensaje"]').placeholder = form.mensaje;
          var sel = f.querySelector('[name="servicio"]');
          if (sel) {
            sel.options[0].text = form.servicio;
            var vals = ['web', 'ecommerce', 'branding', 'seo', 'mantenimiento', 'consultoria', 'otro'];
            vals.forEach(function (v, i) {
              var opt = sel.querySelector('[value="' + v + '"]');
              if (opt) opt.text = form.opts[i];
            });
          }
        }

        /* Toggle button label */
        var btn = g('langToggle'), mbtn = g('mnav-lang');
        if (btn) { btn.textContent = lang === 'es' ? 'EN' : 'ES'; btn.classList.toggle('active-en', lang === 'en'); }
        if (mbtn) { mbtn.textContent = lang === 'es' ? 'EN' : 'ES'; }

        /* Portfolio i18n (injected server-side via SSR) */
        if (window.CS_PORTFOLIO_I18N && window.CS_PORTFOLIO_I18N[lang]) {
          var portDict = window.CS_PORTFOLIO_I18N[lang];
          Object.keys(portDict).forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.textContent = portDict[id].t;
          });
        }

        /* WhatsApp links */
        document.querySelectorAll('[data-wa-es]').forEach(function (el) {
          el.href = lang === 'en' ? el.dataset.waEn : el.dataset.waEs;
        });

        /* Lang-aware internal links (e.g. /nosotros/ ↔ /en/about-us/) */
        document.querySelectorAll('[data-href-es]').forEach(function (el) {
          el.href = lang === 'en' ? el.dataset.hrefEn : el.dataset.hrefEs;
        });

        /* html lang attribute */
        document.documentElement.lang = lang;

        /* Privacy link href */
        var pl = document.getElementById('fnav-privacy');
        if (pl) pl.href = lang === 'en' ? '/privacidad/?lang=en' : '/privacidad/';

        /* Persist */
        try { localStorage.setItem('cs-lang', lang); } catch (e) { }

        /* Re-inject navbar + footer partials in the target language.
           El middleware SSR los inyectó al cargar según URL; cuando el user
           togglea en HOME el footer/navbar quedan en el idioma original y los
           hrefs (e.g. /servicios/* vs /en/services/*) no se actualizan con
           el i18n loop. Re-fetch y replace garantiza labels + hrefs correctos.
           Skip en initial load (window._csLangReady true después del primer toggle). */
        if (window._csLangReady) {
          ['navbar', 'footer'].forEach(function (kind) {
            var ph = document.getElementById(kind + '-placeholder');
            if (!ph) return;
            var url = '/components/' + kind + (lang === 'en' ? '-en' : '') + '.html';
            fetch(url, { credentials: 'omit' })
              .then(function (r) { return r.ok ? r.text() : null; })
              .then(function (html) {
                if (!html) return;
                ph.innerHTML = html;
                /* Re-aplicar estado de scroll al navbar nuevo (sino el bg
                   transparente desaparece hasta que el user vuelve a scrollear). */
                if (kind === 'navbar') {
                  var nb = document.getElementById('navbar');
                  if (nb) nb.classList.toggle('scrolled', window.scrollY > 60);
                }
              })
              .catch(function () { /* no-op */ });
          });
        }
        window._csLangReady = true;
      }

      function toggleLang() {
        setLang(CS_LANG === 'es' ? 'en' : 'es');
      }

      /* Init on DOMContentLoaded */
      window.addEventListener('DOMContentLoaded', function () {
        var saved = null;
        try { saved = localStorage.getItem('cs-lang'); } catch (e) { }
        var navLang = navigator.language || navigator.userLanguage || '';
        var detected = navLang.toLowerCase().startsWith('es') ? 'es' : 'en';
        setLang(saved || detected);
      });

      /* Re-apply lang to navbar once components are injected */
      document.addEventListener('csComponentsReady', function () {
        setLang(CS_LANG);
      });

      /* ── FORM ──────────────────────────────────────────────────── */
      /* Envío propio via /api/contact → D1 + email vía Cloudflare Email Workers */

      var CONTACT_URL = '/api/contact';

      /* Mensajes de UI por idioma */
      var FORM_MSGS = {
        es: {
          sending: 'Enviando...',
          success: '¡Mensaje enviado! Te contactaremos en menos de 24 horas.',
          error: 'Hubo un problema al enviar. Intenta de nuevo o escríbenos a hola@cerostudio.ai.',
          errRequired: 'Por favor completa todos los campos obligatorios (*).',
          errEmail: 'Ingresa un email válido.',
          send: 'Enviar Mensaje',
        },
        en: {
          sending: 'Sending...',
          success: 'Message sent! We will get back to you within 24 hours.',
          error: 'Something went wrong. Try again or reach us at hola@cerostudio.ai.',
          errRequired: 'Please fill in all required fields (*).',
          errEmail: 'Please enter a valid email address.',
          send: 'Send Message',
        }
      };

      function validateForm(form) {
        var lang = (typeof CS_LANG !== 'undefined' ? CS_LANG : 'es');
        var msgs = FORM_MSGS[lang];
        var valid = true;

        /* Clear previous invalid marks */
        form.querySelectorAll('.invalid').forEach(function (el) { el.classList.remove('invalid'); });

        /* Required fields */
        var required = form.querySelectorAll('[required]');
        required.forEach(function (field) {
          if (!field.value.trim()) { field.classList.add('invalid'); valid = false; }
        });
        if (!valid) return { ok: false, msg: msgs.errRequired };

        /* Email format */
        var emailField = form.querySelector('[name="email"]');
        if (emailField && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value.trim())) {
          emailField.classList.add('invalid');
          return { ok: false, msg: msgs.errEmail };
        }

        return { ok: true };
      }

      function setFeedback(type, msg) {
        var fb = document.getElementById('formFeedback');
        if (!fb) return;
        fb.className = 'form-feedback ' + type;
        fb.textContent = msg;
        fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      function clearFeedback() {
        var fb = document.getElementById('formFeedback');
        if (fb) { fb.className = 'form-feedback'; fb.textContent = ''; }
      }

      function handleSubmit(e) {
        e.preventDefault();
        var form = e.target;
        var btn = document.getElementById('submitBtn');
        var label = document.getElementById('submitBtnLabel');
        var lang = (typeof CS_LANG !== 'undefined' ? CS_LANG : 'es');
        var msgs = FORM_MSGS[lang];

        /* Honeypot check (filled by bots) */
        if (form.querySelector('[name="_gotcha"]') && form.querySelector('[name="_gotcha"]').value) return;

        /* Client-side validation */
        clearFeedback();
        var check = validateForm(form);
        if (!check.ok) { setFeedback('error', check.msg); return; }

        /* Submit */
        btn.classList.add('loading');
        label.textContent = msgs.sending;
        btn.disabled = true;

        var fd = new FormData(form);
        var payload = {};
        fd.forEach(function(v, k) { payload[k] = v; });

        fetch(CONTACT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
          .then(function (res) {
            btn.classList.remove('loading');
            btn.disabled = false;
            label.textContent = msgs.send;
            if (res.ok) {
              setFeedback('success', msgs.success);
              form.reset();
            } else {
              return res.json().then(function (data) {
                var errMsg = (data && data.errors) ? data.errors.map(function (x) { return x.message; }).join(', ') : msgs.error;
                setFeedback('error', errMsg);
              });
            }
          })
          .catch(function () {
            btn.classList.remove('loading');
            btn.disabled = false;
            label.textContent = msgs.send;
            setFeedback('error', msgs.error);
          });
      }

      // Expose needed functions to global scope for inline event listeners
      window.toggleNav = toggleNav;
      window.closeNav = closeNav;
      window.toggleLang = toggleLang;
      window.handleSubmit = handleSubmit;
    }); // end DOMContentLoaded
