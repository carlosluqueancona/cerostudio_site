-- ─────────────────────────────────────────────────────────────────────────────
-- Cero Studio Blog · Seed
-- Post: "Cómo elegir agencia de diseño web en México (sin perder dinero)"
-- Cluster: TRANSVERSAL (sin vertical específico — equilibra la mezcla del blog)
-- Pillar destino: ninguno específico; cross-linkea a /servicios/* y /brief/
--
-- Run remote (production D1):
--   wrangler d1 execute DB --remote --file=blog/seeds/como-elegir-agencia-diseno-web-mexico.sql
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO posts (
  title,
  slug,
  category,
  status,
  meta_title,
  meta_description,
  featured_image,
  featured_image_alt,
  excerpt,
  content,
  published_at
) VALUES (
  'Cómo elegir agencia de diseño web en México (sin perder dinero)',
  'como-elegir-agencia-diseno-web-mexico',
  'Estrategia Digital',
  'published',
  'Cómo Elegir Agencia de Diseño Web en México · Guía Honesta 2026 | Cero Studio',
  'Guía honesta para elegir agencia de diseño web en México. Red flags, preguntas correctas, comparativas y errores que cuestan caro. Sin tecnicismos.',
  '/images/CERO_Studio_SocialShare.png',
  'Cómo elegir agencia de diseño web en México · Cero Studio',
  'Guía honesta para elegir agencia de diseño web en México sin perder dinero. Las preguntas que tienes que hacer, las señales de alerta antes de firmar y los errores que vemos cada semana en proyectos rotos.',
  '<p class="post-lede">Elegir mal una agencia digital te cuesta más que el proyecto mismo. Vas a perder tiempo, dinero, y peor: oportunidades de negocio mientras tu sitio actual sigue sin convertir. Esta guía es lo que diríamos a un amigo si nos preguntara cómo elegir — sin marketing, sin tecnicismos, con criterio real.</p>

<h2>Por qué elegir mal te cuesta más que el proyecto en sí</h2>

<p>Una agencia mal elegida tiene tres costos invisibles:</p>

<ol>
  <li><strong>El costo del proyecto</strong> — lo que pagaste y no llevó a nada. Doloroso pero contable.</li>
  <li><strong>El costo de oportunidad</strong> — los meses que tu sitio actual siguió perdiendo clientes mientras esperabas. Esto suele ser 3 a 10 veces el costo del proyecto.</li>
  <li><strong>El costo de la confianza</strong> — la próxima vez que necesites algo digital, vas a dudar. Vas a postergar. Vas a tomar decisiones más conservadoras de las que tu negocio necesita.</li>
</ol>

<p>El estudio Standish CHAOS Report indica que más del <strong>60% de los proyectos digitales fallan o se entregan con retrasos significativos</strong>. La mayoría de esas fallas no son técnicas — son fallas de elección de proveedor.</p>

<h2>Los 4 tipos de proveedor que vas a evaluar</h2>

<p>Antes de buscar nombres, decide qué tipo de proveedor encaja con tu situación:</p>

<h3>Plataformas DIY (Wix, Squarespace, GoDaddy, Shopify)</h3>
<p><strong>Para quién:</strong> emprendedores recién iniciando, presupuesto cercano a cero, sitios muy simples. <strong>Pros:</strong> rápido, barato, sin desarrolladores. <strong>Contras:</strong> diseño genérico, SEO limitado, dependencia total de la plataforma. Si la plataforma sube precios o cambia política, no tienes alternativa fácil.</p>

<h3>Freelancer junior</h3>
<p><strong>Para quién:</strong> presupuesto ajustado, dispuesto a invertir tiempo en evaluar. <strong>Pros:</strong> trato directo, costo bajo, flexibilidad. <strong>Contras:</strong> calidad muy variable, soporte post-lanzamiento incierto, riesgo de "freelancer fantasma" que desaparece cuando algo se rompe. Cuando funciona, funciona muy bien. Cuando falla, te deja con un sitio que nadie más entiende.</p>

<h3>Freelancer senior o estudio pequeño (1-3 personas)</h3>
<p><strong>Para quién:</strong> negocios establecidos que valoran la atención personalizada y la calidad de ejecución. <strong>Pros:</strong> mejor calidad, proceso más maduro, relación directa con quien ejecuta. <strong>Contras:</strong> capacidad limitada para proyectos grandes, único punto de falla si la persona se enferma o renuncia.</p>

<h3>Agencia digital especializada</h3>
<p><strong>Para quién:</strong> empresas establecidas, proyectos con múltiples integraciones, negocios que ven el sitio como motor de adquisición. <strong>Pros:</strong> proceso estructurado, equipo multidisciplinario, soporte continuo, escalable a medida que creces. <strong>Contras:</strong> inversión inicial mayor que las opciones anteriores.</p>

<p><em>Nota:</em> "agencia" no significa "grande". Las mejores agencias son <strong>boutique</strong> — equipos pequeños y senior, sin la burocracia de una agencia grande pero con la madurez de proceso que un freelancer no tiene. Es donde se ubica Cero Studio.</p>

<h2>7 señales de alerta antes de firmar contrato</h2>

<p>Si la agencia que estás considerando muestra cualquiera de estas, frena:</p>

<ol>
  <li><strong>No tiene portafolio público o solo muestra mockups</strong>. Los proyectos reales cuestan tiempo y esfuerzo — si no pueden mostrar trabajo terminado y publicado, sospecha.</li>
  <li><strong>Te cotiza sin entender tu negocio.</strong> Si te dan un precio fijo en la primera llamada antes de saber qué vendes, a quién y qué problema resuelves, están vendiendo plantillas con tu logo.</li>
  <li><strong>"Garantizamos primera página de Google"</strong>. Nadie puede garantizar eso. Si lo prometen, están mintiendo o usando técnicas que pueden penalizar tu sitio.</li>
  <li><strong>El precio es sospechosamente bajo.</strong> Un sitio profesional toma entre 80 y 200 horas de trabajo real. Si el precio total dividido entre 200 horas da menos de 100 MXN/hora, alguien está perdiendo dinero — y ese alguien suele ser tu proyecto en calidad.</li>
  <li><strong>No te explican qué tecnología usarán y por qué.</strong> "Te hago un sitio bonito" no es una respuesta. WordPress, sitio estático, framework moderno — cada opción tiene tradeoffs reales que afectan tu mantenimiento futuro.</li>
  <li><strong>El contrato no menciona la propiedad intelectual.</strong> ¿Quién es dueño del código y los archivos al final? ¿Puedes irte con tu sitio si dejas la agencia? Si esto no está claro por escrito, asume lo peor.</li>
  <li><strong>No hay un plan de soporte post-lanzamiento.</strong> Tu sitio no es un evento — es un proceso continuo. Plugins se desactualizan, navegadores cambian, contenido se renueva. Si la agencia desaparece después del lanzamiento, vas a estar pagando emergencias técnicas a desarrolladores random.</li>
</ol>

<h2>Las 8 preguntas que tienes que hacer en la primera llamada</h2>

<p>Lleva esta lista a tu primera reunión. Si no responden con claridad cualquiera de las 8, considera otra opción:</p>

<ol>
  <li><strong>¿Pueden mostrarme 3 proyectos similares al mío con resultados reales?</strong> No mockups, no plantillas — sitios vivos con métricas si es posible.</li>
  <li><strong>¿Quién va a trabajar específicamente en mi proyecto y cuál es su experiencia?</strong> No te asignan al senior que vendió y te dejan con un junior.</li>
  <li><strong>¿Qué tecnología usarán y por qué esa y no otra?</strong> Las decisiones técnicas tienen consecuencias a 3 años — pide justificación.</li>
  <li><strong>¿Quién es dueño del código, dominio y hosting al final del proyecto?</strong> Respuesta correcta: tú, en todos.</li>
  <li><strong>¿Cuántas rondas de revisión están incluidas y qué pasa si necesito más?</strong> Evita sorpresas en la factura.</li>
  <li><strong>¿Qué incluye el soporte post-lanzamiento y por cuánto tiempo?</strong> "Lo dejamos funcionando" no es soporte. Pide específicos: actualizaciones de seguridad, cambios de contenido, monitoreo.</li>
  <li><strong>¿Cómo manejan los datos personales de mis clientes (LFPDPPP / aviso de privacidad)?</strong> Si no saben qué es esto, busca otro proveedor.</li>
  <li><strong>¿Puedo hablar con un cliente actual?</strong> Una agencia con clientes contentos no tendrá problema en conectarte con uno.</li>
</ol>

<h2>¿Agencia, freelancer o tú mismo?</h2>

<p>Decide según estos tres criterios:</p>

<ul>
  <li><strong>Tu tiempo</strong> — ¿puedes invertir 40+ horas tú mismo en aprender una plataforma, escribir contenido y resolver problemas técnicos? Si tu hora vale más que lo que pagarías a una agencia, contratar es la decisión obvia.</li>
  <li><strong>Tu nivel de complejidad</strong> — ¿necesitas integración con sistemas internos, ecommerce, agendamiento, multi-idioma? Esa complejidad multiplicada por tu falta de experiencia técnica = proyecto fallido.</li>
  <li><strong>Tu tolerancia al riesgo</strong> — un freelancer es más barato pero asume el 100% del riesgo de proceso. Una agencia cobra más pero te entrega un proceso probado y un equipo respaldando.</li>
</ul>

<p>Regla práctica: si tu negocio factura más de <strong>500,000 MXN al año</strong> y el sitio web es central a tu modelo (genera leads, ventas, recurrencia), contratar agencia es la decisión racional. Por debajo de eso, evalúa freelancer senior con referencias verificables.</p>

<h2>Comparativa: precio fijo vs. por hora</h2>

<p>La mayoría de las agencias serias trabajan con <strong>precio fijo por proyecto</strong>. La razón: te quita el riesgo de scope creep, las horas mal estimadas o cambios que se desbordan.</p>

<p>El por-hora tiene sentido en dos casos: <strong>(1)</strong> proyectos con mucha incertidumbre donde nadie puede definir el alcance al inicio, o <strong>(2)</strong> mantenimiento ongoing. Para un sitio web con alcance claro, exige precio fijo.</p>

<p>Cuidado con los "paquetes mensuales" que no especifican entregables. Si pagas 5,000 MXN al mes pero nadie define qué recibes a cambio, terminas pagando indefinidamente sin claridad.</p>

<h2>Cuándo NO necesitas agencia</h2>

<p>No todos los negocios necesitan agencia digital. Considera no contratar si:</p>

<ul>
  <li>Apenas estás validando un negocio y necesitas algo en línea para test rápido (usa una plantilla DIY hasta validar)</li>
  <li>Tu negocio es 100% offline y el sitio web es solo "tarjeta digital" — no necesitas agencia premium para eso</li>
  <li>Ya tienes equipo interno técnico y solo necesitas asesoría puntual (contrata <a href="/servicios/consultoria-digital/">consultoría</a>, no implementación)</li>
  <li>Estás en una situación temporal y necesitas algo "de aquí al año" — invertir en agencia para algo que vas a tirar es desperdicio</li>
</ul>

<h2>Cómo abordamos esto en Cero Studio</h2>

<p>Si te sirve la transparencia, así trabajamos nosotros — para que compares contra cualquier alternativa con criterios reales:</p>

<ul>
  <li><strong>Portafolio público y verificable</strong> en <a href="/#portafolio">cerostudio.ai</a> — cada proyecto con nombre del cliente y URL del sitio vivo. Sin mockups, sin plantillas.</li>
  <li><strong>Equipo boutique, contacto directo</strong> con quien ejecuta. No call center, no juniors disfrazados de seniors.</li>
  <li><strong>Precio único, sin mensualidades ocultas</strong> — desde $499 USD para un sitio profesional básico, $2,500 USD regular para sitio profesional completo, $4,500 USD para tienda en línea o proyectos complejos. <a href="/#precios">Ver precios</a>.</li>
  <li><strong>Tú eres dueño de todo al final</strong> — código, dominio, hosting, datos. Sin candados, sin "renta" de tu propio sitio.</li>
  <li><strong>Cumplimiento legal mexicano incluido</strong> — aviso de privacidad LFPDPPP, banner de cookies, HTTPS, schema markup correcto.</li>
  <li><strong>Soporte post-lanzamiento incluido</strong> en todos los planes para resolver dudas y ajustes menores. Para soporte continuo (actualizaciones, monitoreo, backups), tenemos <a href="/servicios/mantenimiento/">mantenimiento</a> aparte.</li>
  <li><strong>Primera consulta gratis</strong> — incluso si terminas contratando a otra agencia, te ayudamos a evaluar correctamente. <a href="/servicios/consultoria-digital/">Ver servicio de consultoría</a>.</li>
</ul>

<p>Si quieres saber qué tipo de proyecto encaja con tu caso, <a href="/brief/">envíanos tu brief</a> y respondemos en menos de 24 horas con una propuesta concreta.</p>

<h2>Preguntas frecuentes</h2>

<h3>¿Cuánto debería invertir en mi sitio web?</h3>
<p>Depende de qué espera el sitio resolver. Si es solo presencia digital básica, una plataforma DIY te sirve por menos de $5,000 MXN al año. Si el sitio debe generar leads o ventas continuamente, considera entre <strong>$25,000 y $100,000 MXN</strong> como rango razonable para un proyecto profesional. Por debajo de eso vas a sacrificar SEO, cumplimiento legal, o calidad de proceso. Por encima, asegúrate que la inversión incluye estrategia, no solo desarrollo.</p>

<h3>¿Cuánto tarda un sitio profesional?</h3>
<p>Entre <strong>1 y 6 semanas</strong> dependiendo del alcance. Sitios simples (1-3 páginas) en 5 a 10 días. Sitios completos con blog y SEO en 3-4 semanas. Tiendas en línea en 4-8 semanas. Cualquiera que prometa "te lo entrego en 24 horas" probablemente está vendiendo plantilla con tu logo encima.</p>

<h3>¿Cómo evalúo si una agencia tiene experiencia real?</h3>
<p>Pide URLs de proyectos vivos. Visítalos. Verifica que carguen rápido (<a href="https://pagespeed.web.dev/" rel="nofollow">PageSpeed Insights</a> en verde es buena señal). Habla con uno o dos clientes actuales. Si la agencia tiene blog propio, lee artículos — la calidad de su contenido refleja la calidad de su pensamiento.</p>

<h3>¿Las agencias mexicanas son tan buenas como las internacionales?</h3>
<p>Las mejores agencias mexicanas compiten directamente en calidad con cualquier agencia internacional, con dos ventajas: <strong>(1)</strong> entienden el mercado mexicano (hábitos de compra, regulación LFPDPPP, integraciones locales como OXXO Pay y Mercado Pago), y <strong>(2)</strong> el costo es típicamente 50-70% menor que en EE.UU. o Europa para calidad equivalente. La diferencia importante no es el país — es la calidad del equipo.</p>

<h3>¿Qué pasa si la agencia que elijo desaparece a mitad del proyecto?</h3>
<p>Por eso el contrato es crítico. Asegúrate de que dice: <strong>(a)</strong> tú eres dueño del código y archivos en cualquier estado del proyecto, <strong>(b)</strong> hay hitos de pago vinculados a entregables específicos (no pagas 100% por adelantado), y <strong>(c)</strong> existe una cláusula de transición que obliga a la agencia a documentar y entregar todo lo construido si el proyecto se interrumpe. Una agencia seria firma esto sin problema.</p>

<h3>¿Necesito firmar contrato con una agencia o un acuerdo simple es suficiente?</h3>
<p><strong>Siempre contrato.</strong> Para proyectos chicos puede ser un contrato simple de 2-3 páginas, pero debe incluir: alcance, hitos, plazos, propiedad intelectual, confidencialidad, y qué pasa si una de las partes incumple. Si una agencia se resiste a firmar contrato, es la peor red flag posible.</p>

<h2>El siguiente paso</h2>

<p>Si después de leer esto sientes que necesitas una segunda opinión sobre tu situación específica, <a href="/brief/">envíanos tu brief</a>. Te respondemos en 24 horas con una propuesta honesta — y si no somos la opción correcta para ti, te lo decimos.</p>

<p>Si prefieres explorar primero qué incluyen nuestros planes, <a href="/#precios">consulta los precios</a> o <a href="/servicios/desarrollo-web/">conoce el servicio de desarrollo web</a>.</p>',
  CURRENT_TIMESTAMP
)
ON CONFLICT(slug) DO UPDATE SET
  title              = excluded.title,
  category           = excluded.category,
  status             = excluded.status,
  meta_title         = excluded.meta_title,
  meta_description   = excluded.meta_description,
  featured_image     = excluded.featured_image,
  featured_image_alt = excluded.featured_image_alt,
  excerpt            = excluded.excerpt,
  content            = excluded.content;
