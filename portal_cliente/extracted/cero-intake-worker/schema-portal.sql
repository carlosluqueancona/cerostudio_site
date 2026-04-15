-- CERO STUDIO — Portal de Cliente: Schema Adicional
-- Run: wrangler d1 execute cero-intake --remote --file=./schema-portal.sql

-- Fases/Milestones del proyecto (lo que ve el cliente)
CREATE TABLE IF NOT EXISTS milestones (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  brief_id      TEXT NOT NULL,
  phase         INTEGER NOT NULL,              -- 0-4
  title         TEXT NOT NULL,                 -- "Propuesta enviada", "Diseño aprobado", etc.
  description   TEXT,
  status        TEXT DEFAULT 'pending',        -- pending | active | completed
  target_date   TEXT,                          -- Fecha objetivo ISO
  completed_at  TEXT,                          -- Fecha real de completado
  created_at    TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (brief_id) REFERENCES briefs(brief_id)
);

-- Archivos del proyecto (cotización, contrato, entregables)
CREATE TABLE IF NOT EXISTS files (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  brief_id      TEXT NOT NULL,
  file_name     TEXT NOT NULL,                 -- "Cotización La Cocina de María.pdf"
  file_type     TEXT NOT NULL,                 -- quotation | contract | deliverable | other
  file_url      TEXT NOT NULL,                 -- URL al archivo (R2, Drive, o cualquier CDN)
  description   TEXT,
  visible       INTEGER DEFAULT 1,             -- 1 = visible al cliente, 0 = interno
  uploaded_at   TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (brief_id) REFERENCES briefs(brief_id)
);

-- Registro de entregas / actualizaciones (timeline de actividad)
CREATE TABLE IF NOT EXISTS activity_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  brief_id      TEXT NOT NULL,
  entry_type    TEXT NOT NULL,                 -- update | delivery | payment | note | approval
  title         TEXT NOT NULL,                 -- "Preview del sitio enviado"
  description   TEXT,
  date          TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (brief_id) REFERENCES briefs(brief_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_milestones_brief ON milestones(brief_id);
CREATE INDEX IF NOT EXISTS idx_files_brief ON files(brief_id);
CREATE INDEX IF NOT EXISTS idx_activity_brief ON activity_log(brief_id);

-- Agregar campos al brief para el portal
-- (D1 soporta ALTER TABLE ADD COLUMN)
ALTER TABLE briefs ADD COLUMN client_access_key TEXT;
ALTER TABLE briefs ADD COLUMN portal_enabled INTEGER DEFAULT 0;
ALTER TABLE briefs ADD COLUMN current_phase INTEGER DEFAULT 0;
ALTER TABLE briefs ADD COLUMN total_amount REAL;
ALTER TABLE briefs ADD COLUMN paid_amount REAL DEFAULT 0;
