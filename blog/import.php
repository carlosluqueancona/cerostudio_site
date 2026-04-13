<?php
/**
 * Importa artículos desde contenido-propuesta.json
 * Ejecutar UNA VEZ después de install.php
 * Visitar: https://tomate.mx/blog/import.php
 * ELIMINAR después de usar.
 */
define('BLOG_APP', true);
require __DIR__ . '/config.php';
require __DIR__ . '/includes/db.php';
require __DIR__ . '/includes/functions.php';

$json = file_get_contents(__DIR__ . '/contenido-propuesta.json');
$posts = json_decode($json, true);

if (!$posts) {
    die('Error: no se pudo leer contenido-propuesta.json');
}

$db = getDB();

// Get first admin user ID
$stmt = $db->query("SELECT id FROM blog_users ORDER BY id ASC LIMIT 1");
$author_id = (int) $stmt->fetchColumn();

if (!$author_id) {
    die('Error: no hay usuarios en la base de datos. Ejecuta install.php primero.');
}

$inserted = 0;
$skipped  = 0;

foreach ($posts as $p) {
    // Check if slug already exists
    $stmt = $db->prepare("SELECT id FROM blog_posts WHERE slug = :slug LIMIT 1");
    $stmt->execute([':slug' => $p['slug']]);
    if ($stmt->fetch()) {
        $skipped++;
        continue;
    }

    $now = date('Y-m-d H:i:s');
    $pub = $p['status'] === 'published' ? $now : null;

    $stmt = $db->prepare("INSERT INTO blog_posts
        (title, slug, excerpt, content, featured_image, featured_image_alt, category, meta_title, meta_description, status, author_id, published_at, created_at)
        VALUES (:title, :slug, :excerpt, :content, :fi, :fa, :cat, :mt, :md, :status, :aid, :pa, :ca)");

    $stmt->execute([
        ':title'   => $p['title'],
        ':slug'    => $p['slug'],
        ':excerpt' => $p['excerpt'],
        ':content' => $p['content'],
        ':fi'      => $p['featured_image'] ?? null,
        ':fa'      => $p['featured_image_alt'] ?? '',
        ':cat'     => $p['category'],
        ':mt'      => $p['meta_title'],
        ':md'      => $p['meta_description'],
        ':status'  => $p['status'],
        ':aid'     => $author_id,
        ':pa'      => $pub,
        ':ca'      => $now,
    ]);

    $inserted++;
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Importación — Blog Tomate.MX</title>
  <style>
    body { font-family:'Helvetica Neue',sans-serif; background:#F2EFE7; color:#111; padding:60px; max-width:600px; margin:0 auto; }
    h1 { font-size:24px; margin-bottom:24px; }
    .msg { padding:12px 16px; margin-bottom:8px; border-radius:6px; font-size:14px; background:#fff; border:1px solid rgba(0,0,0,.08); }
    .ok { background:#E8F5E9; border-color:#A5D6A7; }
    .skip { background:#FFF3E0; border-color:#FFCC80; }
    .warn { background:#FEE; border-color:#FCC; font-weight:700; }
  </style>
</head>
<body>
  <h1>Importación de artículos</h1>
  <div class="msg ok">✓ <?= $inserted ?> artículos importados</div>
  <?php if ($skipped): ?>
    <div class="msg skip">→ <?= $skipped ?> artículos omitidos (slug ya existente)</div>
  <?php endif; ?>
  <div class="msg">Total en JSON: <?= count($posts) ?></div>
  <div class="msg warn">⚠ ELIMINA este archivo (import.php) y contenido-propuesta.json del servidor</div>
  <div class="msg"><a href="admin/dashboard.php" style="color:#E81323;">Ir al dashboard →</a></div>
</body>
</html>
