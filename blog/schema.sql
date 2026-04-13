-- Cero Studio Blog Schema (Cloudflare D1)

DROP TABLE IF EXISTS posts;
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT,
  status TEXT DEFAULT 'published',
  meta_title TEXT,
  meta_description TEXT,
  featured_image TEXT,
  featured_image_alt TEXT,
  excerpt TEXT,
  content TEXT,
  published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster slug lookups
CREATE INDEX idx_posts_slug ON posts(slug);
-- Index for category filtering
CREATE INDEX idx_posts_category ON posts(category);
