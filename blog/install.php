<?php
/**
 * One-time installer. DELETE THIS FILE after running it.
 * Visit: https://tomate.mx/blog/install.php
 */
define('BLOG_APP', true);
require __DIR__ . '/config.php';
require __DIR__ . '/includes/db.php';

$messages = [];

try {
    $db = getDB();

    // Create blog_users table
    $db->exec("CREATE TABLE IF NOT EXISTS blog_users (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(100) NOT NULL DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $messages[] = '✓ Tabla blog_users creada';

    // Create blog_posts table
    $db->exec("CREATE TABLE IF NOT EXISTS blog_posts (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        excerpt TEXT,
        content LONGTEXT,
        featured_image VARCHAR(500) DEFAULT NULL,
        featured_image_alt VARCHAR(255) DEFAULT '',
        category VARCHAR(100) DEFAULT '',
        meta_title VARCHAR(255) DEFAULT '',
        meta_description VARCHAR(320) DEFAULT '',
        status ENUM('draft','published') DEFAULT 'draft',
        author_id INT UNSIGNED,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        published_at DATETIME DEFAULT NULL,
        INDEX idx_slug (slug),
        INDEX idx_status_published (status, published_at),
        INDEX idx_category (category),
        FOREIGN KEY (author_id) REFERENCES blog_users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $messages[] = '✓ Tabla blog_posts creada';

    // Create admin user
    $stmt = $db->prepare("SELECT COUNT(*) FROM blog_users");
    $stmt->execute();
    if ((int)$stmt->fetchColumn() === 0) {
        $username = 'admin';
        $password = 'tomate2026!';  // CAMBIAR inmediatamente después de instalar
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $db->prepare("INSERT INTO blog_users (username, password_hash, display_name) VALUES (:u, :p, :d)");
        $stmt->execute([':u' => $username, ':p' => $hash, ':d' => 'Carlos Luque']);
        $messages[] = "✓ Usuario admin creado (user: $username / pass: $password)";
        $messages[] = '⚠ CAMBIA LA CONTRASEÑA inmediatamente';
    } else {
        $messages[] = '→ Ya existe un usuario admin, no se creó otro';
    }

    $messages[] = '';
    $messages[] = '🎉 Instalación completa. ELIMINA ESTE ARCHIVO (install.php) ahora.';

} catch (PDOException $e) {
    $messages[] = '✗ Error: ' . $e->getMessage();
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Instalación Blog — Tomate.MX</title>
  <style>
    body { font-family: 'Helvetica Neue', sans-serif; background:#F2EFE7; color:#111; padding:60px; max-width:600px; margin:0 auto; }
    h1 { font-size:24px; margin-bottom:24px; }
    .msg { padding:12px 16px; margin-bottom:8px; border-radius:6px; font-size:14px; background:#fff; border:1px solid rgba(0,0,0,.08); }
    .msg:last-child { font-weight:700; }
  </style>
</head>
<body>
  <h1>Instalación — Blog Tomate.MX</h1>
  <?php foreach ($messages as $m): ?>
    <div class="msg"><?= htmlspecialchars($m) ?></div>
  <?php endforeach; ?>
</body>
</html>
