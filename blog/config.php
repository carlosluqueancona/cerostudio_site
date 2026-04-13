<?php
defined('BLOG_APP') or die('Acceso denegado');

// ── Database ──
define('DB_HOST', 'localhost');
define('DB_NAME', 'dbfmgl3yuzksfu');
define('DB_USER', 'uc1qs06rvoai0');
define('DB_PASS', '$9A51}kqYN7n');

// ── Site ──
define('SITE_URL',    'https://cerostudio.ai');
define('BLOG_URL',    'https://cerostudio.ai/blog');
define('BLOG_PATH',   __DIR__);
define('UPLOADS_DIR', __DIR__ . '/uploads');
define('UPLOADS_URL', BLOG_URL . '/uploads');

// ── Settings ──
define('POSTS_PER_PAGE', 9);
define('SITE_NAME', 'Cero Studio');
define('SITE_TAGLINE', 'Agencia Digital Premium');
define('AUTHOR_DEFAULT', 'Carlos Luque');

// ── Security ──
define('MAX_LOGIN_ATTEMPTS', 5);
define('LOGIN_LOCKOUT_TIME', 900); // 15 minutes
