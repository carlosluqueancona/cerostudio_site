import { useState, useEffect, useRef, useCallback } from "react";

/*
  CERO STUDIO — CLIENT INTAKE FORM (Phase 0)
  Feeds into: Google Stitch (design) → UI UX Pro Max (design system) → Claude Code (build)
  Stack context: HTML+Tailwind+GSAP | Shopify | Astro+CMS — all hosted on Cloudflare Pages
*/

const BRAND = {
  black: "#0a0a0a",
  white: "#ffffff",
  lime: "#B8FF00",
  gray1: "#111111",
  gray2: "#1a1a1a",
  gray3: "#2a2a2a",
  grayText: "#777777",
  grayLight: "#aaaaaa",
};

// ─── STEP DEFINITIONS ───────────────────────────────────────────

const STEPS = [
  { id: "welcome", label: "Inicio" },
  { id: "contact", label: "Contacto" },
  { id: "business", label: "Negocio" },
  { id: "project", label: "Proyecto" },
  { id: "design", label: "Dirección Visual" },
  { id: "content", label: "Contenido & Assets" },
  { id: "timeline", label: "Timeline & Budget" },
  { id: "review", label: "Revisión" },
];

// ─── FIELD DEFINITIONS ──────────────────────────────────────────

const FIELDS = {
  contact: [
    { key: "name", label: "Nombre completo", type: "text", required: true, placeholder: "Tu nombre y apellido" },
    { key: "email", label: "Correo electrónico", type: "email", required: true, placeholder: "tu@correo.com" },
    { key: "phone", label: "Teléfono / WhatsApp", type: "tel", required: true, placeholder: "+1 (555) 000-0000" },
    { key: "company", label: "Empresa o negocio", type: "text", required: false, placeholder: "Si aplica" },
    { key: "lang", label: "¿En qué idioma prefieres comunicarte?", type: "radio", required: true, options: ["Español", "English", "Ambos — bilingüe"] },
  ],
  business: [
    { key: "businessName", label: "Nombre del negocio (como aparecerá en el sitio)", type: "text", required: true, placeholder: "Nombre comercial" },
    { key: "industry", label: "Giro o industria", type: "text", required: true, placeholder: "Ej: Restaurante, Consultoría legal, Retail..." },
    { key: "location", label: "Ubicación principal del negocio", type: "text", required: true, placeholder: "Ciudad, Estado (Ej: Houston, TX)" },
    { key: "targetAudience", label: "¿Quiénes son tus clientes ideales?", type: "textarea", required: true, placeholder: "Describe a quién le vendes: edad, ubicación, idioma, nivel socioeconómico, qué buscan..." },
    { key: "competitors", label: "Competidores o negocios similares que admires", type: "textarea", required: false, placeholder: "Nombres o URLs de negocios en tu industria cuya presencia digital te guste" },
    { key: "usp", label: "¿Qué hace diferente a tu negocio?", type: "textarea", required: true, placeholder: "Tu ventaja competitiva — lo que tus clientes dicen que los hizo elegirte" },
  ],
  project: [
    { key: "projectType", label: "¿Qué necesitas?", type: "check", required: true, options: [
      "Sitio web profesional (informativo)",
      "Tienda en línea (eCommerce)",
      "Sitio web + Blog / CMS",
      "Landing page (una sola página)",
      "Rediseño de sitio existente",
      "No estoy seguro — necesito asesoría",
    ]},
    { key: "currentSite", label: "URL de tu sitio actual (si tienes uno)", type: "text", required: false, placeholder: "https://..." },
    { key: "currentSitePain", label: "Si ya tienes sitio, ¿qué no funciona?", type: "textarea", required: false, placeholder: "¿Qué te frustra de tu sitio actual? ¿Qué falla?" },
    { key: "pages", label: "¿Qué secciones necesita tu sitio?", type: "check", required: false, options: [
      "Inicio (Home)",
      "Sobre Nosotros / Quiénes Somos",
      "Servicios",
      "Portafolio / Galería",
      "Tienda / Catálogo de productos",
      "Blog / Noticias",
      "Contacto",
      "Reservaciones / Agendar cita",
      "Menú (Restaurante)",
      "Testimonios / Reseñas",
      "FAQ",
      "Área de clientes / Login",
    ]},
    { key: "features", label: "Funcionalidades que necesitas", type: "check", required: false, options: [
      "Formulario de contacto",
      "WhatsApp directo",
      "Sistema de reservaciones / citas",
      "Carrito de compras / pagos en línea",
      "Blog que yo pueda actualizar",
      "Multi-idioma (Español / Inglés)",
      "Integración con redes sociales",
      "Google Maps",
      "Email marketing / Newsletter",
      "SEO optimizado",
      "Google Analytics / métricas",
      "Chat en vivo",
    ]},
    { key: "ecommProducts", label: "Si es tienda en línea: ¿cuántos productos?", type: "radio", required: false, options: [
      "No aplica",
      "1–20",
      "20–50",
      "50–200",
      "Más de 200",
    ]},
  ],
  design: [
    { key: "visualDirection", label: "¿Qué estilo visual te atrae más?", type: "check", required: true, options: [
      "Oscuro y premium (negro, contrastes fuertes)",
      "Limpio y minimalista (mucho espacio blanco)",
      "Colorido y enérgico",
      "Elegante y sofisticado",
      "Moderno y tecnológico",
      "Cálido y cercano",
      "Rústico / artesanal",
      "Confío en la dirección creativa de Cero Studio",
    ]},
    { key: "referenceSites", label: "Comparte 2-3 sitios web que te gusten y dinos por qué", type: "textarea", required: false, placeholder: "URLs y qué te gusta de cada uno: ¿el diseño? ¿la estructura? ¿cómo se siente?" },
    { key: "avoidance", label: "¿Hay algo que NO quieras en tu sitio?", type: "textarea", required: false, placeholder: "Colores que odias, estilos que no van con tu marca, cosas que has visto en otros sitios y no te gustan..." },
    { key: "hasLogo", label: "¿Tienes logotipo?", type: "radio", required: true, options: [
      "Sí — profesional y listo para usar",
      "Sí — pero necesita actualizarse",
      "No — necesito uno",
    ]},
    { key: "hasBrandColors", label: "¿Tienes colores de marca definidos?", type: "radio", required: true, options: [
      "Sí — tengo paleta definida",
      "Tengo idea pero no está formalizado",
      "No — necesito que me propongan",
    ]},
    { key: "brandColorsDetail", label: "Si tienes colores, compártelos aquí", type: "text", required: false, placeholder: "Ej: Azul marino #1B3A5C y dorado #C9A84C" },
  ],
  content: [
    { key: "contentStatus", label: "¿Qué contenido tienes listo?", type: "radio", required: true, options: [
      "Todo listo (textos, fotos, videos)",
      "Parcial — tengo fotos pero me faltan textos",
      "Parcial — tengo textos pero me faltan fotos",
      "Nada — necesito que Cero Studio genere todo",
    ]},
    { key: "photoStatus", label: "Fotografía de tu negocio / productos", type: "radio", required: true, options: [
      "Tengo fotos profesionales de alta calidad",
      "Tengo fotos pero no son profesionales",
      "No tengo — pueden usar stock o IA",
      "Necesito servicio de fotografía (cotización aparte)",
    ]},
    { key: "hasExistingContent", label: "¿Tienes materiales existentes que quieras reutilizar?", type: "check", required: false, options: [
      "Logotipo en alta resolución",
      "Manual de marca / guía de identidad",
      "Fotos de productos",
      "Fotos del negocio / equipo",
      "Textos ya redactados",
      "Videos",
      "Menú / catálogo en PDF",
      "Nada de lo anterior",
    ]},
    { key: "contentNotes", label: "Notas sobre contenido", type: "textarea", required: false, placeholder: "¿Hay algo específico que quieras comunicar? ¿Un mensaje clave? ¿Un tono particular?" },
  ],
  timeline: [
    { key: "goal", label: "Objetivo principal del sitio", type: "radio", required: true, options: [
      "Generar clientes / leads",
      "Vender productos en línea",
      "Dar presencia profesional a mi negocio",
      "Reemplazar mi sitio actual",
      "Posicionarme en Google (SEO)",
      "Informar y educar a mis clientes",
    ]},
    { key: "budget", label: "Presupuesto aproximado (USD)", type: "radio", required: true, options: [
      "Menos de $800",
      "$800 – $1,500",
      "$1,500 – $3,000",
      "$3,000 – $5,000",
      "Más de $5,000",
      "No estoy seguro — necesito cotización",
    ]},
    { key: "timeline", label: "¿Cuándo necesitas el sitio listo?", type: "radio", required: true, options: [
      "Lo antes posible (urgente)",
      "2 a 4 semanas",
      "1 a 2 meses",
      "Sin prisa — quiero que quede perfecto",
      "Tengo fecha específica",
    ]},
    { key: "deadlineDetail", label: "Si tienes fecha específica, ¿cuál es?", type: "text", required: false, placeholder: "Ej: Antes del 15 de junio — lanzamiento de producto" },
    { key: "maintenance", label: "¿Te interesa mantenimiento mensual después del lanzamiento?", type: "radio", required: false, options: [
      "Sí — quiero que Cero Studio lo mantenga",
      "Tal vez — quiero saber más",
      "No — yo me encargo después",
    ]},
    { key: "additionalNotes", label: "¿Algo más que debamos saber?", type: "textarea", required: false, placeholder: "Cualquier detalle, preocupación o pregunta..." },
  ],
};

// ─── COMPONENTS ─────────────────────────────────────────────────

function TerminalDot({ size = 32, pulse = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={pulse ? { animation: "dotPulse 2.4s ease-in-out infinite" } : undefined}>
      <circle cx="50" cy="50" r="42" fill="none" stroke="white" strokeWidth="7" />
      <circle cx="50" cy="50" r="7.5" fill="white" />
    </svg>
  );
}

function StepIndicator({ current, total }) {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? 24 : 6,
            height: 3,
            borderRadius: 2,
            background: i === current ? BRAND.lime : i < current ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.08)",
            transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      ))}
    </div>
  );
}

function InputField({ field, value, onChange }) {
  const baseStyle = {
    width: "100%",
    padding: "13px 0",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    color: BRAND.white,
    fontSize: 15,
    fontFamily: "'Syne', sans-serif",
    outline: "none",
    transition: "border-color 0.3s ease",
    letterSpacing: "0.01em",
  };

  const focusHandler = (e) => (e.target.style.borderBottomColor = BRAND.lime);
  const blurHandler = (e) => (e.target.style.borderBottomColor = "rgba(255,255,255,0.1)");

  if (field.type === "textarea") {
    return (
      <textarea
        value={value || ""}
        onChange={(e) => onChange(field.key, e.target.value)}
        placeholder={field.placeholder}
        rows={3}
        style={{ ...baseStyle, resize: "vertical", minHeight: 72 }}
        onFocus={focusHandler}
        onBlur={blurHandler}
      />
    );
  }

  return (
    <input
      type={field.type === "tel" ? "tel" : field.type === "email" ? "email" : "text"}
      value={value || ""}
      onChange={(e) => onChange(field.key, e.target.value)}
      placeholder={field.placeholder}
      style={baseStyle}
      onFocus={focusHandler}
      onBlur={blurHandler}
    />
  );
}

function RadioField({ field, value, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {field.options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            onClick={() => onChange(field.key, opt)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              background: active ? "rgba(184,255,0,0.06)" : "transparent",
              border: `1px solid ${active ? BRAND.lime : "rgba(255,255,255,0.08)"}`,
              borderRadius: 8,
              cursor: "pointer",
              transition: "all 0.25s ease",
              textAlign: "left",
            }}
          >
            <div style={{
              width: 16, height: 16, borderRadius: "50%",
              border: `2px solid ${active ? BRAND.lime : "rgba(255,255,255,0.2)"}`,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              transition: "border-color 0.25s ease",
            }}>
              {active && <div style={{ width: 7, height: 7, borderRadius: "50%", background: BRAND.lime }} />}
            </div>
            <span style={{
              fontSize: 14, fontFamily: "'Syne', sans-serif",
              color: active ? BRAND.white : BRAND.grayLight,
              transition: "color 0.25s ease",
            }}>{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

function CheckField({ field, value, onChange }) {
  const selected = value || [];
  const toggle = (opt) => {
    const next = selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt];
    onChange(field.key, next);
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {field.options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            style={{
              padding: "9px 16px",
              background: active ? BRAND.lime : "transparent",
              color: active ? BRAND.black : BRAND.grayLight,
              border: `1px solid ${active ? BRAND.lime : "rgba(255,255,255,0.08)"}`,
              borderRadius: 24, cursor: "pointer", fontSize: 13,
              fontFamily: "'Syne', sans-serif",
              transition: "all 0.2s ease",
              fontWeight: active ? 600 : 400,
            }}
          >{opt}</button>
        );
      })}
    </div>
  );
}

function FormField({ field, value, onChange }) {
  const Comp = field.type === "radio" ? RadioField : field.type === "check" ? CheckField : InputField;
  return (
    <div style={{ marginBottom: 28 }}>
      <label style={{
        display: "block", fontSize: 13, fontWeight: 600,
        fontFamily: "'Syne', sans-serif",
        color: "rgba(255,255,255,0.85)", marginBottom: 10, letterSpacing: "0.01em",
      }}>
        {field.label}
        {field.required && <span style={{ color: BRAND.lime, marginLeft: 4, fontSize: 11 }}>*</span>}
      </label>
      <Comp field={field} value={value} onChange={onChange} />
    </div>
  );
}

function ReviewSection({ stepId, label, data }) {
  const fields = FIELDS[stepId];
  if (!fields) return null;
  const hasData = fields.some((f) => {
    const v = data[f.key];
    return v && (Array.isArray(v) ? v.length > 0 : String(v).length > 0);
  });
  if (!hasData) return null;

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase",
        color: BRAND.lime, marginBottom: 14, fontFamily: "'Syne', sans-serif", fontWeight: 700,
      }}>{label}</div>
      {fields.map((f) => {
        const v = data[f.key];
        if (!v || (Array.isArray(v) && v.length === 0) || String(v).length === 0) return null;
        return (
          <div key={f.key} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: BRAND.grayText, marginBottom: 2, fontFamily: "'Syne', sans-serif" }}>{f.label}</div>
            <div style={{ fontSize: 14, color: BRAND.white, fontFamily: "'Syne', sans-serif", lineHeight: 1.5 }}>
              {Array.isArray(v) ? v.join(" · ") : v}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN APP ───────────────────────────────────────────────────

export default function CeroIntake() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.opacity = "0";
      contentRef.current.style.transform = "translateY(16px)";
      const raf = requestAnimationFrame(() => {
        if (contentRef.current) {
          contentRef.current.style.transition = "opacity 0.45s ease, transform 0.45s cubic-bezier(0.16,1,0.3,1)";
          contentRef.current.style.opacity = "1";
          contentRef.current.style.transform = "translateY(0)";
        }
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [animKey]);

  const onChange = useCallback((key, val) => {
    setData((prev) => ({ ...prev, [key]: val }));
  }, []);

  const currentStep = STEPS[step];
  const fields = FIELDS[currentStep.id] || [];

  const canProceed = () => {
    if (currentStep.id === "welcome" || currentStep.id === "review") return true;
    return fields.filter((f) => f.required).every((f) => {
      const v = data[f.key];
      if (Array.isArray(v)) return v.length > 0;
      return v && String(v).trim().length > 0;
    });
  };

  const go = (dir) => {
    const next = step + dir;
    if (next >= 0 && next < STEPS.length) {
      setStep(next);
      setAnimKey((k) => k + 1);
    }
  };

  const generateBrief = () => {
    const sections = ["contact", "business", "project", "design", "content", "timeline"];
    let t = "══════════════════════════════════════════\n";
    t += "  CERO STUDIO ◉ CLIENT BRIEF\n";
    t += "  cerostudio.ai\n";
    t += "══════════════════════════════════════════\n\n";
    sections.forEach((s) => {
      const sFields = FIELDS[s];
      const sLabel = STEPS.find((st) => st.id === s)?.label || s;
      t += `── ${sLabel.toUpperCase()} ${"─".repeat(Math.max(0, 38 - sLabel.length))}\n\n`;
      sFields.forEach((f) => {
        const v = data[f.key];
        if (v && (Array.isArray(v) ? v.length > 0 : String(v).length > 0)) {
          t += `  ${f.label}\n`;
          t += `  → ${Array.isArray(v) ? v.join(", ") : v}\n\n`;
        }
      });
    });
    t += "══════════════════════════════════════════\n";
    t += `Fecha: ${new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}\n`;
    t += "Generado por Cero Studio Intake System\n";
    return t;
  };

  const [sending, setSending] = useState(false);
  const [briefId, setBriefId] = useState(null);

  // ─── CONFIG: Change for production ───
  const WORKER_URL = "https://intake.cerostudio.ai"; // Your Cloudflare Worker URL
  const WHATSAPP_NUMBER = "521XXXXXXXXXX"; // Replace with real number

  const handleSubmit = async () => {
    setSending(true);
    const briefText = generateBrief();

    try {
      const res = await fetch(`${WORKER_URL}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          briefText,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setBriefId(result.briefId);
        setSubmitted(true);
      } else {
        throw new Error(result.error || "Send failed");
      }
    } catch (err) {
      console.error("Submit error:", err);
      // Fallback: mailto with brief pre-filled
      const subject = encodeURIComponent(`Nuevo Brief — ${data.businessName || data.name || ""}`);
      const body = encodeURIComponent(briefText);
      window.open(`mailto:hola@cerostudio.ai?subject=${subject}&body=${body}`, "_blank");
      setSubmitted(true);
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    const whatsappMsg = encodeURIComponent(
      `Hola, acabo de enviar mi brief de proyecto para ${data.businessName || "mi negocio"}. Mi nombre es ${data.name || ""}. ¿Cuál es el siguiente paso?`
    );

    return (
      <div style={{
        minHeight: "100vh", background: BRAND.black,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Syne', sans-serif", padding: 32,
      }}>
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <div style={{ textAlign: "center", maxWidth: 500 }}>
          <div style={{ marginBottom: 32 }}><TerminalDot size={56} pulse /></div>

          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 16px", borderRadius: 20,
            background: "rgba(184,255,0,0.08)", border: "1px solid rgba(184,255,0,0.2)",
            marginBottom: 20,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: BRAND.lime }} />
            <span style={{ fontSize: 11, color: BRAND.lime, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Syne', sans-serif" }}>
              Brief enviado a Cero Studio{briefId ? ` — ${briefId}` : ""}
            </span>
          </div>

          <h1 style={{ color: BRAND.white, fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 14px" }}>
            ¡Recibimos tu proyecto!
          </h1>
          <p style={{ color: BRAND.grayLight, fontSize: 15, lineHeight: 1.65, margin: "0 0 12px" }}>
            Tu brief ya está en manos de nuestro equipo. Te contactaremos en las próximas <strong style={{ color: BRAND.white }}>24 horas</strong> con una propuesta personalizada.
          </p>
          <p style={{ color: BRAND.grayText, fontSize: 13, lineHeight: 1.5, margin: "0 0 10px" }}>
            ¿Quieres acelerar el proceso? Escríbenos directo por WhatsApp.
          </p>

          <div style={{
            padding: "16px 20px", background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10,
            margin: "24px 0 32px", textAlign: "left",
          }}>
            <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: BRAND.grayText, marginBottom: 10, fontWeight: 600, fontFamily: "'Syne', sans-serif" }}>
              Siguientes pasos
            </div>
            {[
              ["01", "Revisamos tu brief y preparamos una propuesta"],
              ["02", "Llamada de 15 min para alinear dirección visual"],
              ["03", "Diseñamos tu sitio en Google Stitch para tu aprobación"],
              ["04", "Desarrollo e implementación"],
              ["05", "QA, optimización y lanzamiento"],
            ].map(([num, text]) => (
              <div key={num} style={{ display: "flex", gap: 10, alignItems: "baseline", marginBottom: 5 }}>
                <span style={{ fontSize: 10, color: BRAND.lime, fontWeight: 700, minWidth: 18, fontFamily: "'Syne', sans-serif" }}>{num}</span>
                <span style={{ fontSize: 13, color: BRAND.grayLight, fontFamily: "'Syne', sans-serif" }}>{text}</span>
              </div>
            ))}
          </div>

          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "15px 36px", background: BRAND.lime, color: BRAND.black,
              border: "none", borderRadius: 8, fontSize: 13,
              fontFamily: "'Syne', sans-serif", cursor: "pointer",
              letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 800,
              textDecoration: "none", transition: "transform 0.15s ease",
            }}
          >
            Escribir por WhatsApp →
          </a>
        </div>
        <style>{`@keyframes dotPulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: BRAND.black, color: BRAND.white,
      fontFamily: "'Syne', sans-serif", display: "flex", flexDirection: "column",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <header style={{
        padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        position: "sticky", top: 0, background: BRAND.black, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <TerminalDot size={22} />
          <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.01em" }}>CERO</span>
          <span style={{ fontSize: 9, fontWeight: 400, letterSpacing: "0.22em", opacity: 0.4 }}>STUDIO.AI</span>
        </div>
        <StepIndicator current={step} total={STEPS.length} />
      </header>

      {/* CONTENT */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "36px 20px 140px", overflowY: "auto" }}>
        <div ref={contentRef} key={animKey} style={{ maxWidth: 580, width: "100%" }}>

          {currentStep.id !== "welcome" && (
            <div style={{
              fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase",
              color: BRAND.grayText, marginBottom: 6, fontWeight: 600,
            }}>
              {step < STEPS.length - 1 ? `${String(step).padStart(2, "0")} / ${String(STEPS.length - 2).padStart(2, "0")}` : ""}
            </div>
          )}

          <h1 style={{
            fontSize: currentStep.id === "welcome" ? 40 : 28,
            fontWeight: 800, letterSpacing: "-0.035em",
            margin: "0 0 6px", lineHeight: 1.1,
          }}>
            {currentStep.label}
          </h1>

          <p style={{ fontSize: 14, color: BRAND.grayText, margin: "0 0 36px", lineHeight: 1.5 }}>
            {currentStep.id === "welcome" && "Cuéntanos sobre tu proyecto para diseñar algo extraordinario."}
            {currentStep.id === "contact" && "¿Con quién estaremos trabajando?"}
            {currentStep.id === "business" && "Necesitamos entender tu negocio para diseñar algo que funcione."}
            {currentStep.id === "project" && "Define el alcance de lo que necesitas."}
            {currentStep.id === "design" && "Esto alimenta directamente el diseño visual en Google Stitch."}
            {currentStep.id === "content" && "¿Qué materiales tienes listos para arrancar?"}
            {currentStep.id === "timeline" && "Plazos, presupuesto y objetivos."}
            {currentStep.id === "review" && "Revisa que todo esté correcto antes de enviar."}
          </p>

          {/* WELCOME */}
          {currentStep.id === "welcome" && (
            <div style={{ color: BRAND.grayLight, fontSize: 15, lineHeight: 1.75 }}>
              <p style={{ marginBottom: 20 }}>
                Este formulario genera tu <strong style={{ color: BRAND.white }}>brief de proyecto</strong> — el documento
                que guía cada decisión de diseño y desarrollo.
              </p>
              <p style={{ marginBottom: 20 }}>
                Tiempo estimado: <strong style={{ color: BRAND.white }}>10–12 minutos</strong>. Toda la información es confidencial.
              </p>
              <div style={{
                padding: "16px 20px", background: "rgba(184,255,0,0.04)",
                border: "1px solid rgba(184,255,0,0.1)", borderRadius: 10, marginTop: 8,
              }}>
                <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: BRAND.lime, marginBottom: 10, fontWeight: 700 }}>
                  Nuestro proceso
                </div>
                {[
                  ["01", "Brief", "Este formulario"],
                  ["02", "Diseño", "Dirección visual en Google Stitch"],
                  ["03", "Sistema", "Design system con UI UX Pro Max"],
                  ["04", "Desarrollo", "Código de alto rendimiento con Claude Code"],
                  ["05", "Entrega", "QA, optimización y lanzamiento en Cloudflare"],
                ].map(([num, title, desc]) => (
                  <div key={num} style={{ display: "flex", gap: 12, alignItems: "baseline", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: BRAND.lime, fontWeight: 700, minWidth: 20, fontFamily: "'Syne', sans-serif" }}>{num}</span>
                    <span style={{ fontSize: 13, color: BRAND.white, fontWeight: 600 }}>{title}</span>
                    <span style={{ fontSize: 12, color: BRAND.grayText }}>{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FIELDS */}
          {fields.length > 0 && fields.map((field) => (
            <FormField key={field.key} field={field} value={data[field.key]} onChange={onChange} />
          ))}

          {/* REVIEW */}
          {currentStep.id === "review" && ["contact", "business", "project", "design", "content", "timeline"].map((sId) => (
            <ReviewSection key={sId} stepId={sId} label={STEPS.find((s) => s.id === sId)?.label} data={data} />
          ))}
        </div>
      </div>

      {/* FOOTER NAV */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        padding: "16px 24px",
        background: `linear-gradient(transparent, ${BRAND.black} 25%)`,
        display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 100,
      }}>
        <button
          onClick={() => go(-1)}
          disabled={step === 0}
          style={{
            padding: "12px 20px", background: "transparent",
            color: step === 0 ? "rgba(255,255,255,0.1)" : BRAND.grayLight,
            border: `1px solid ${step === 0 ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.08)"}`,
            borderRadius: 8, cursor: step === 0 ? "default" : "pointer",
            fontSize: 12, fontFamily: "'Syne', sans-serif",
            letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600,
          }}
        >← Atrás</button>

        {currentStep.id === "review" ? (
          <button
            onClick={handleSubmit}
            disabled={sending}
            style={{
              padding: "14px 36px", background: sending ? BRAND.gray3 : BRAND.lime,
              color: BRAND.black,
              border: "none", borderRadius: 8,
              cursor: sending ? "wait" : "pointer",
              fontSize: 13, fontWeight: 800, fontFamily: "'Syne', sans-serif",
              letterSpacing: "0.06em", textTransform: "uppercase",
              transition: "all 0.15s ease",
              opacity: sending ? 0.7 : 1,
            }}
            onMouseEnter={(e) => !sending && (e.currentTarget.style.transform = "scale(1.03)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >{sending ? "Enviando..." : "Enviar Brief ◉"}</button>
        ) : (
          <button
            onClick={() => go(1)}
            disabled={!canProceed()}
            style={{
              padding: "14px 28px",
              background: canProceed() ? BRAND.white : "rgba(255,255,255,0.04)",
              color: canProceed() ? BRAND.black : "rgba(255,255,255,0.15)",
              border: "none", borderRadius: 8,
              cursor: canProceed() ? "pointer" : "default",
              fontSize: 13, fontWeight: 700, fontFamily: "'Syne', sans-serif",
              letterSpacing: "0.06em", textTransform: "uppercase",
              transition: "all 0.3s ease",
            }}
          >Siguiente →</button>
        )}
      </div>

      <style>{`
        @keyframes dotPulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        * { box-sizing: border-box; margin: 0; }
        ::placeholder { color: rgba(255,255,255,0.18); }
        textarea:focus, input:focus { outline: none; }
        button { font-family: 'Syne', sans-serif; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
        @media (max-width: 600px) { h1 { font-size: 28px !important; } }
      `}</style>
    </div>
  );
}
