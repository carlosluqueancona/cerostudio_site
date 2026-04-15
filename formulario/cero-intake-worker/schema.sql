-- CERO STUDIO — Intake Briefs Database Schema
-- Run: wrangler d1 execute cero-intake --file=./schema.sql

CREATE TABLE IF NOT EXISTS briefs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  brief_id      TEXT UNIQUE NOT NULL,           -- CS-XXXXXX (human-readable ID)
  status        TEXT DEFAULT 'new',             -- new | reviewed | proposal_sent | approved | in_progress | delivered | archived

  -- Contact
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT NOT NULL,
  company       TEXT,
  lang          TEXT,                           -- Español | English | Ambos

  -- Business
  business_name TEXT,
  industry      TEXT,
  location      TEXT,
  target_audience TEXT,
  competitors   TEXT,
  usp           TEXT,

  -- Project
  project_type  TEXT,                           -- JSON array
  current_site  TEXT,
  current_site_pain TEXT,
  pages         TEXT,                           -- JSON array
  features      TEXT,                           -- JSON array
  ecomm_products TEXT,

  -- Design Direction
  visual_direction TEXT,                        -- JSON array
  reference_sites TEXT,
  avoidance     TEXT,
  has_logo      TEXT,
  has_brand_colors TEXT,
  brand_colors_detail TEXT,

  -- Content & Assets
  content_status TEXT,
  photo_status  TEXT,
  existing_content TEXT,                        -- JSON array
  content_notes TEXT,

  -- Timeline & Budget
  goal          TEXT,
  budget        TEXT,
  timeline      TEXT,
  deadline_detail TEXT,
  maintenance   TEXT,
  additional_notes TEXT,

  -- Full brief text
  brief_text    TEXT,

  -- Payments
  total_amount  REAL,                             -- Total agreed (USD)
  paid_amount   REAL,                             -- Amount paid to date (USD)

  -- Metadata
  submitted_at  TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now'))
);

-- Migration: add payment columns if upgrading from earlier schema
-- Run: wrangler d1 execute cero-intake --command="ALTER TABLE briefs ADD COLUMN total_amount REAL"
-- Run: wrangler d1 execute cero-intake --command="ALTER TABLE briefs ADD COLUMN paid_amount REAL"

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_briefs_status ON briefs(status);
CREATE INDEX IF NOT EXISTS idx_briefs_submitted ON briefs(submitted_at);
CREATE INDEX IF NOT EXISTS idx_briefs_email ON briefs(email);
