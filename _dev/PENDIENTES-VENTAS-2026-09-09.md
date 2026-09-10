# Pendientes · cerostudio.ai
**Actualizado:** 9 sep 2026 · Documento vivo: marca la casilla cuando cierres cada punto.

> Contexto técnico completo en `_dev/HANDOFF-IMPLEMENTACION-2026-09-07.md` (secciones 6, 7 y 8).
> Plan de mejora original en `_dev/PLAN-MEJORA-VENTAS-2026-09-06.md`.

---

## 🔴 Bloquean trabajo (solo tú puedes resolverlos)

- [ ] **Precios del Sistema de clientes.** `/ventas/` está publicada con `noindex` y sin enlaces,
      esperando tu OK. Propuesta actual: Esencial **instalación desde $8,900 MXN + $1,900 MXN/mes**;
      Pro **instalación desde $19,900 MXN + $3,500 MXN/mes**; sin contrato anual, cancela con 30 días.
      *Al aprobar:* se quita el `noindex`, se enlaza en navbar, footer, sitemap y llms.txt.
      → Decide: ¿esos precios, otros, o cambio la estructura (más instalación / menos mensualidad)?

- [ ] **Creativo de la campaña Meta.** Ya decidiste **$150 MXN/día**, creada **en pausa**, cuenta
      *Cero Studio Agencia* (`445058470900401`). Falta el creativo.
      Propuesta: video corto de pantalla del simulador `/ia/` respondiendo, o captura fija.
      El copy y los públicos están en el brief de la sesión (van en el handoff).

- [ ] **Tiempo de entrega de una tienda Tiendanube.** No está publicado en ningún lado y la ficha
      de tiendas lo pide (hoy dice "se confirma en tu propuesta").

- [ ] **Fuentes de dos cifras** que hoy se publican sin cita, a diferencia del resto:
      93 % ("las experiencias en línea empiezan con un buscador", ficha SEO) y
      78 % ("compras online en México desde el celular", ficha de tiendas).
      Si no hay fuente verificable, se cambian o se retiran.

- [ ] **Garantías con número** (para la sección de precios): ¿cuántas rondas de ajustes por etapa?
      ¿esquema de pago (50/50 u otro)? ¿la penalización por atraso es el plan de mantenimiento
      completo de $3,500 o el básico de $800? ¿aplica a Cero Premium y a proyectos por cotización?

- [ ] **Letra chica que falta:** costo de renovación de dominio + hosting a partir del año 2,
      política de cambios de contenido en Cero Launch, y si el copywriting va incluido en Launch.

---

## 🟠 Insumos de prueba social (pídelos por WhatsApp, cuestan cero)

- [ ] **Testimonio de Sergio Luque.** Su caso se publicó con un texto de relleno; lo retiramos y
      la página quedó sin cita. Plantilla sugerida:
      *"Sergio, ¿me regalas dos líneas sobre cómo fue trabajar en sergioluque.com y qué cambió con
      el sitio nuevo? Las publico tal cual, con tu nombre y el link a tu sitio."*
- [ ] **Testimonio del Dr. César Salas** sobre trabajar con Cero Studio. Hoy el caso solo tiene una
      reseña de una paciente sobre él (ya reencuadrada como tal). Es el único caso del nicho salud
      y alimenta la landing de clínicas.
- [ ] **Reseñas en Google Business** de Gustavo (IMVEC), Jesús (Mainoflex) y Ricardo (Seminuevos Coapa).
- [ ] **Caso o testimonio de una tienda Tiendanube** y de un cliente de mantenimiento: las fichas de
      esos dos servicios son las únicas sin prueba propia.
- [ ] *(opcional)* Métrica dura del proyecto Respirar es Vivir: citas agendadas por el sitio,
      consultas por WhatsApp o posición en Google. Hoy sus resultados son palabras, no números.

---

## 🟡 Listo para ejecutar (dime y lo hago)

- [ ] **Grabar los 3 loops de hover** del portafolio: IMVEC, Mainoflex y Seminuevos Coapa.
      Se suben desde el admin → Portafolio → campo "Video de hover". Especificaciones y comando de
      ffmpeg en `images/portafolio/video/LEEME.md`.
      Qué debe mostrar cada uno: Seminuevos → el buscador de inventario en acción;
      Mainoflex → scroll del catálogo hasta el botón de contacto; IMVEC → scroll del home con la
      identidad. El primer cuadro debe verse igual que la imagen de la card.
- [ ] **Crear la campaña Meta** a `/ia/` (en cuanto haya creativo).
- [ ] **Bot piloto de WhatsApp** (Twilio + Workers AI) en tu propio número, antes de venderlo.
      Necesito: Account SID y el número de WhatsApp; el Auth Token lo pegas tú como secret en Pages.
      Nota: ya existe una campaña *"Cero Studio · CTWA · Bot Twilio +1385"* en la cuenta — revisar
      qué se hizo ahí antes de duplicar trabajo.
- [ ] **`/en/free-audit/`** (y decidir si el blog tendrá versión en inglés). Hoy el chrome en inglés
      dice "(in Spanish)" porque la auditoría y el blog solo existen en español.

---

## 🟢 Configuración pendiente (minutos, en el panel)

- [ ] **GA4: marcar `ia_simulacion` como evento clave.** Administrar → Eventos, cuando ya tenga datos
      (unas horas después de la primera simulación real). GTM ya publica el evento (versión 8).
- [ ] **Probar el video de hover end-to-end**: subir un video desde el admin, guardar el proyecto y
      verlo en `cerostudio.ai/?cb=1` desde computadora con mouse (no funciona en celular, es intencional).
- [ ] **Orden del portafolio.** Hoy las primeras 5 cards son Patitas Peludas, Sergio Luque, Modelle,
      Seminuevos Coapa y Patitas Felinas; solo esas se ven sin dar clic en "ver todos".
      Mainoflex (+40 %) e IMVEC (3×) están en las posiciones 6 y 11. Si quieres que los casos con
      resultado se vean de entrada, súbelos en el admin. Impresiones 2M sigue con etiqueta `home`:
      quítasela si su salida del ticker fue a petición del cliente.

---

## 🐞 Corregido después de publicar

- **Textos del portafolio intercambiados entre cards** (9 sep). Al reordenar en el admin, la categoría
  y la descripción quedaban en la card equivocada. Causa: el SSR mandaba los textos del CMS en un
  script en línea y la CSP del sitio los bloqueaba desde julio; sin ellos, `home.js` aplicaba un
  diccionario viejo con el orden anterior. Ahora los textos viajan en un bloque de datos JSON y se
  retiraron las 56 claves obsoletas. Verificado en español, inglés y fichas de servicio.

## ✅ Cerrado en esta ronda (para referencia)

- Plan de mejora de ventas completo aplicado en producción: embudo con CTA transicional, prueba social
  junto a la decisión, precios coherentes entre home y fichas, chrome móvil en todo el sitio,
  casos y blog como activos de venta.
- Tipografía viva del hero: muro tipográfico que reacciona al cursor, numerales fantasma por sección,
  títulos fijos en stakes y proceso, campo de líneas que rodea el titular y late al cambiar la palabra.
- Simulador de AI Search `/ia/` y `/en/ai/` con Workers AI (Llama 3.3 70B), medido en GTM (versión 8).
- Landing `/ventas/` del Sistema de clientes (en `noindex`, esperando precios).
- Ficha de clínicas alineada con los precios del home.
- Hover con video del portafolio, administrable desde el CMS (columna en la base, subida a R2,
  campo con vista previa en el admin).
- Logo de Seminuevos Coapa en su testimonio; los tres testimonios del home ya tienen logo y enlace al caso.
