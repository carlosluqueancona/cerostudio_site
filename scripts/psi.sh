#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Cero Studio · PageSpeed Insights runner
#
# Setup (una sola vez):
#   1. Obtén una API key gratis (25,000 queries/día):
#        a. https://console.cloud.google.com/apis/library/pagespeedonline.googleapis.com
#           → "Enable"
#        b. https://console.cloud.google.com/apis/credentials
#           → "Create Credentials" → "API key" → copia la key (AIzaSy...)
#        c. (Recomendado) En "Restrict key" elige API restrictions →
#           solo "PageSpeed Insights API".
#   2. Crea el archivo .env en la raíz del proyecto:
#        echo 'PSI_API_KEY=AIzaSy...tu-key-aqui...' > .env
#      ※ .env ya está en .gitignore — nunca se commitea.
#
# Uso:
#   ./scripts/psi.sh                        → testea las 4 URLs principales
#   ./scripts/psi.sh https://cerostudio.ai  → testea una URL específica
#   ./scripts/psi.sh url1 url2 url3         → testea múltiples URLs
# ─────────────────────────────────────────────────────────────────────────────

set -e

# Carga .env si existe
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  . "$ROOT_DIR/.env"
  set +a
fi

if [ -z "${PSI_API_KEY:-}" ]; then
  echo "❌ PSI_API_KEY no está configurada."
  echo
  echo "Crea $ROOT_DIR/.env con tu API key:"
  echo "  echo 'PSI_API_KEY=AIzaSy...tu-key-aqui...' > $ROOT_DIR/.env"
  echo
  echo "Ver instrucciones completas en el header de este script."
  exit 1
fi

# URLs por default (las 4 más relevantes del audit)
if [ $# -eq 0 ]; then
  URLS=(
    "https://cerostudio.ai/"
    "https://cerostudio.ai/servicios/tiendas-ecommerce/"
    "https://cerostudio.ai/servicios/seo/"
    "https://cerostudio.ai/nosotros/"
  )
else
  URLS=("$@")
fi

# Python runner (usa stdlib, no necesita instalar nada)
PSI_API_KEY="$PSI_API_KEY" python3 - "${URLS[@]}" <<'PYEOF'
import os, sys, urllib.request, urllib.parse, json, time

API = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
KEY = os.environ['PSI_API_KEY']
URLS = sys.argv[1:]

def psi(url, strategy):
    q = urllib.parse.urlencode({
        'url': url, 'strategy': strategy, 'key': KEY,
        'category': ['performance', 'accessibility', 'best-practices', 'seo'],
    }, doseq=True)
    req = urllib.request.Request(f"{API}?{q}", headers={'User-Agent':'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:300]
        return {'error': f"HTTP {e.code}: {body}"}
    except Exception as e:
        return {'error': str(e)}

def fmt(s):
    if s is None: return "  -"
    v = int(s*100)
    color = "\033[32m" if v >= 90 else ("\033[33m" if v >= 50 else "\033[31m")
    return f"{color}{v:>3}\033[0m"

def core_metric(audits, key, fmt_unit=None):
    a = audits.get(key, {})
    val = a.get('displayValue', '-')
    return val

print(f"\033[1m{'URL':<55} {'Device':<8} {'Perf':>5} {'A11y':>5} {'BP':>5} {'SEO':>5}   {'LCP':>7} {'CLS':>5} {'TBT':>6}\033[0m")
print('-' * 110)

for url in URLS:
    short = url.replace("https://cerostudio.ai", "") or "/"
    for strategy in ['mobile', 'desktop']:
        result = psi(url, strategy)
        if 'error' in result:
            print(f"{short:<55} {strategy:<8} ❌ {result['error'][:60]}")
            continue
        lh = result.get('lighthouseResult', {})
        cats = lh.get('categories', {})
        audits = lh.get('audits', {})
        scores = {
            'perf': cats.get('performance', {}).get('score'),
            'a11y': cats.get('accessibility', {}).get('score'),
            'bp':   cats.get('best-practices', {}).get('score'),
            'seo':  cats.get('seo', {}).get('score'),
        }
        lcp = core_metric(audits, 'largest-contentful-paint')
        cls = core_metric(audits, 'cumulative-layout-shift')
        tbt = core_metric(audits, 'total-blocking-time')
        print(f"{short:<55} {strategy:<8} {fmt(scores['perf'])} {fmt(scores['a11y'])} {fmt(scores['bp'])} {fmt(scores['seo'])}   {lcp:>7} {cls:>5} {tbt:>6}")
        time.sleep(1)  # pequeño delay para evitar rate burst

print()
print("Leyenda: 90+ verde · 50-89 amarillo · <50 rojo")
print("LCP = Largest Contentful Paint · CLS = Cumulative Layout Shift · TBT = Total Blocking Time")
PYEOF
