import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add site wrapper
text = re.sub(r'<body>\n', '<body>\n\n  <div class="site-wrapper">\n', text)
text = re.sub(r'  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>', '  </div><!-- /site-wrapper -->\n\n  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>', text)

# 2. Add site wrapper CSS
css_to_add = "    .site-wrapper { overflow-x: hidden; width: 100%; position: relative; }\n"
text = re.sub(r'(    /\* ============================================================ NOISE \*/)', r'\1\n' + css_to_add, text)

# 3. Add identifiers and translations for portfolio
translations = [
    ("Agencia · Modelos & Producción BTL", "port-c1", "Agency · Models & BTL Production"),
    ("Plataforma digital para agencia de modelos, edecanes y producción de eventos corporativos.", "port-d1", "Digital platform for modeling agency, promotional staff and corporate event production."),
    
    ("Imprenta · Cotizaciones en línea", "port-c2", "Print Shop · Online Quoting"),
    ("Sitio corporativo para imprenta offset con cotizador de productos integrado.", "port-d2", "Corporate site for offset printing with integrated product quoter."),
    
    ("Automotriz · Inventario en línea", "port-c3", "Automotive · Online Inventory"),
    ("Catálogo digital de vehículos con buscador avanzado y fichas técnicas detalladas.", "port-d3", "Digital vehicle catalog with advanced search and detailed technical specs."),
    
    ("Agencia · Talento & Activaciones BTL", "port-c4", "Agency · Talent & BTL Activations"),
    ("Sitio para agencia de talento profesional con activaciones BTL e infraestructura para eventos.", "port-d4", "Site for professional talent agency with BTL activations and event infrastructure."),
    
    ("Industrial · Soluciones antivibratorias", "port-c5", "Industrial · Anti-vibration Solutions"),
    ("Catálogo y tienda online para distribuidora de productos de mantenimiento industrial.", "port-d5", "Catalog and online store for industrial maintenance products distributor."),
    
    ("Manufactura · Estanterías y exhibidores", "port-c6", "Manufacturing · Racks & Displays"),
    ("Tienda multimarca con sistema de inventario en tiempo real y catálogo dinámico.", "port-d6", "Multi-brand store with real-time inventory system and dynamic catalog."),
    
    ("Tienda online · Mascotas", "port-c7", "Online Store · Pets"),
    ("Tienda online de alta calidad para el cuidado y bienestar de mascotas.", "port-d7", "High-quality online store for pet care and well-being."),
    
    ("Educación · Inscripciones digitales", "port-c8", "Education · Digital Enrollment"),
    ("Portal institucional para centro de investigación con gestión editorial avanzada.", "port-d8", "Institutional portal for research center with advanced editorial management."),
    
    ("Industrial · Fabricación metálica", "port-c9", "Industrial · Metal Fabrication"),
    ("Portal empresarial con presentación institucional y gestión de proyectos activos.", "port-d9", "Business portal with institutional presentation and active project management."),
    
    ("Tienda online · Gatos", "port-c10", "Online Store · Cats"),
    ("E-commerce especializado en productos y accesorios premium para gatos.", "port-d10", "Specialized e-commerce for premium cat products and accessories."),
    
    ("Salud · Neumología", "port-c11", "Health · Pulmonology"),
    ("Plataforma de salud respiratoria con recursos educativos y consultas en línea.", "port-d11", "Respiratory health platform with educational resources and online consultations."),
]

# Add ids to tags
for es_text, tid, en_text in translations:
    # Handle HTML tags specifically
    if "port-c" in tid:
        text = text.replace(f'<span class="port-card-cat">{es_text}</span>', f'<span class="port-card-cat" id="{tid}">{es_text}</span>')
    else:
        text = text.replace(f'<p class="port-card-desc">{es_text}</p>', f'<p class="port-card-desc" id="{tid}">{es_text}</p>')

# Replace Ver Proyecto badge
text = text.replace('<div class="port-card-badge">Ver Proyecto →</div>', '<div class="port-card-badge"><span data-i18n="port-badge">Ver Proyecto →</span></div>')

# 4. Add translations to CS_I18N object
# ES part
es_add = r"        'port-cta-btn':   { t: 'Iniciar Proyecto' },\n        'port-badge':     { t: 'Ver Proyecto →' },\n"
for es_text, tid, en_text in translations:
    es_add += f"        '{tid}': {{ t: '{es_text}' }},\n"

text = re.sub(r"        'port-cta-btn':   { t: 'Iniciar Proyecto' },", es_add, text)

# EN part
en_add = r"        'port-cta-btn':   { t: 'Start a Project' },\n        'port-badge':     { t: 'View Project →' },\n"
for es_text, tid, en_text in translations:
    en_add += f"        '{tid}': {{ t: '{en_text}' }},\n"

text = re.sub(r"        'port-cta-btn':   { t: 'Start a Project' },", en_add, text)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Done modifications")
