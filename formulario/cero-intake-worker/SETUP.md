# CERO STUDIO — Intake System Setup

## Arquitectura

```
Cliente llena formulario
        ↓
   POST /submit
        ↓
┌──────────────────────┐
│  Cloudflare Worker    │──→ Email notificación (MailChannels)
│  intake.cerostudio.ai │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│  Cloudflare D1       │
│  Base de datos SQL    │
│  (tabla: briefs)     │
└──────────────────────┘
```

Costo total: **$0 USD** (Cloudflare free tier)

---

## Paso 1 — Instalar Wrangler (si no lo tienes)

```bash
npm install -g wrangler
wrangler login
```

## Paso 2 — Crear la base de datos D1

```bash
cd cero-intake-worker
wrangler d1 create cero-intake
```

Esto te dará un output como:
```
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Copia ese `database_id`** y pégalo en `wrangler.toml` donde dice `PASTE_YOUR_D1_DATABASE_ID_HERE`.

## Paso 3 — Crear la tabla

```bash
wrangler d1 execute cero-intake --remote --file=./schema.sql
```

## Paso 4 — Configurar API key

En `wrangler.toml`, cambia `CHANGE_THIS_TO_A_SECURE_KEY` por una key segura.
Puedes generar una con:

```bash
openssl rand -hex 32
```

## Paso 5 — Deploy

```bash
wrangler deploy
```

El worker estará disponible en:
`https://cero-intake.TU_SUBDOMAIN.workers.dev`

## Paso 6 — (Opcional) Custom domain

Si quieres `intake.cerostudio.ai`:

1. En Cloudflare Dashboard → Workers → cero-intake → Settings → Triggers
2. Add Custom Domain → `intake.cerostudio.ai`
3. Descomentar la sección `routes` en `wrangler.toml`

## Paso 7 — Actualizar el formulario

En el componente React del intake form, cambia la URL del Worker:

```javascript
const WORKER_URL = "https://intake.cerostudio.ai"; // o tu URL de workers.dev
```

---

## API Endpoints

### Público (sin auth)

**POST /submit** — Enviar nuevo brief
```bash
curl -X POST https://intake.cerostudio.ai/submit \
  -H "Content-Type: application/json" \
  -d '{"name":"Juan","email":"juan@test.com","phone":"+1555000"}'
```

### Protegido (requiere X-API-Key header)

**GET /briefs** — Listar últimos 50 briefs
```bash
curl https://intake.cerostudio.ai/briefs \
  -H "X-API-Key: TU_API_KEY"
```

**GET /briefs/:id** — Ver brief específico
```bash
curl https://intake.cerostudio.ai/briefs/CS-M5X2Y \
  -H "X-API-Key: TU_API_KEY"
```

**PATCH /briefs/:id/status** — Actualizar status
```bash
curl -X PATCH https://intake.cerostudio.ai/briefs/CS-M5X2Y/status \
  -H "X-API-Key: TU_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"status":"reviewed"}'
```

Status posibles: `new` → `reviewed` → `proposal_sent` → `approved` → `in_progress` → `delivered` → `archived`

---

## Sobre el email

El Worker usa **MailChannels** para enviar notificaciones. MailChannels es gratuito desde Cloudflare Workers (no necesitas cuenta).

**Requisito:** Necesitas configurar un registro DNS SPF para que los emails no caigan en spam:

En Cloudflare DNS → Add record:
- Type: TXT
- Name: `_mailchannels`  
- Content: `v=mc1 cfid=TU_ACCOUNT_ID.workers.dev`

Y asegurarte que tu SPF record incluya:
`v=spf1 include:relay.mailchannels.net -all`

**Nota:** Si MailChannels da problemas, el Worker igual guarda el brief en D1. El email es solo notificación — los datos nunca se pierden.
