<?php
/**
 * Importa los 30 artículos desde contenido-completo.json con fechas semanales.
 * Si ya hay posts del lote 1 (import.php), los salta por slug.
 * Ejecutar UNA VEZ. Visitar: https://tomate.mx/blog/import-v2.php
 * ELIMINAR después de usar.
 */
define('BLOG_APP', true);
require __DIR__ . '/config.php';
require __DIR__ . '/includes/db.php';
require __DIR__ . '/includes/functions.php';

$json = file_get_contents(__DIR__ . '/contenido-completo.json');
$posts = json_decode($json, true);

if (!$posts) {
    die('Error: no se pudo leer contenido-completo.json — ' . json_last_error_msg());
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
$errors   = [];

foreach ($posts as $i => $p) {
    // Check if slug already exists — if so, update dates only
    $stmt = $db->prepare("SELECT id FROM blog_posts WHERE slug = :slug LIMIT 1");
    $stmt->execute([':slug' => $p['slug']]);
    $existing = $stmt->fetch();
    if ($existing) {
        // Update dates + status for existing posts
        $upd_pub = $p['status'] === 'published' ? ($p['published_at'] ?? date('Y-m-d H:i:s')) : null;
        $upd_created = $p['published_at'] ?? date('Y-m-d H:i:s');
        $stmt = $db->prepare("UPDATE blog_posts SET published_at = :pa, created_at = :ca, status = :st WHERE id = :id");
        $stmt->execute([':pa' => $upd_pub, ':ca' => $upd_created, ':st' => $p['status'], ':id' => $existing['id']]);
        $skipped++;
        continue;
    }

    // Use custom published_at if provided, otherwise use current time
    $pub = null;
    $created = date('Y-m-d H:i:s');

    if ($p['status'] === 'published') {
        $pub = $p['published_at'] ?? $created;
        $created = $p['published_at'] ?? $created;
    } elseif (isset($p['published_at'])) {
        $created = $p['published_at'];
    }

    try {
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
            ':ca'      => $created,
        ]);

        $inserted++;
    } catch (PDOException $e) {
        $errors[] = "Post #{$i} ({$p['slug']}): " . $e->getMessage();
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Importación Lote 2 — Blog Tomate.MX</title>
  <style>
    body { font-family:'Helvetica Neue',sans-serif; background:#F2EFE7; color:#111; padding:60px; max-width:700px; margin:0 auto; }
    h1 { font-size:24px; margin-bottom:24px; }
    .msg { padding:12px 16px; margin-bottom:8px; border-radius:6px; font-size:14px; background:#fff; border:1px solid rgba(0,0,0,.08); }
    .ok { background:#E8F5E9; border-color:#A5D6A7; }
    .skip { background:#FFF3E0; border-color:#FFCC80; }
    .err { background:#FEE; border-color:#FCC; color:#C00; }
    .warn { background:#FEE; border-color:#FCC; font-weight:700; }
    table { width:100%; border-collapse:collapse; margin:16px 0; font-size:13px; }
    th, td { text-align:left; padding:8px 12px; border-bottom:1px solid rgba(0,0,0,.06); }
    th { font-size:11px; text-transform:uppercase; letter-spacing:0.05em; color:#888; }
    td:first-child { font-weight:600; }
    .date { color:#888; font-size:12px; }
  </style>
</head>
<body>
  <h1>Importación — <?= count($posts) ?> artículos</h1>

  <div class="msg ok">✓ <?= $inserted ?> artículos importados</div>
  <?php if ($skipped): ?>
    <div class="msg skip">→ <?= $skipped ?> artículos omitidos (slug ya existente)</div>
  <?php endif; ?>
  <?php foreach ($errors as $err): ?>
    <div class="msg err">✗ <?= htmlspecialchars($err) ?></div>
  <?php endforeach; ?>

  <h2 style="font-size:16px;margin-top:32px;">Artículos importados</h2>
  <table>
    <tr><th>Título</th><th>Categoría</th><th>Fecha</th></tr>
    <?php
    // Show what was imported
    $stmt = $db->query("SELECT title, category, published_at, status FROM blog_posts ORDER BY published_at ASC");
    while ($row = $stmt->fetch()):
    ?>
    <tr>
      <td><?= htmlspecialchars($row['title']) ?></td>
      <td><?= htmlspecialchars($row['category']) ?></td>
      <td class="date">
        <?= $row['published_at'] ? date('d/m/Y', strtotime($row['published_at'])) : '<em>draft</em>' ?>
        <?= $row['status'] === 'published' ? '✓' : '' ?>
      </td>
    </tr>
    <?php endwhile; ?>
  </table>

  <div class="msg warn">⚠ ELIMINA import-v2.php y contenido-completo.json del servidor</div>
  <div class="msg">
    <a href="/blog/" style="color:#E81323;font-weight:700;">→ Ver blog</a> &nbsp;|&nbsp;
    <a href="/blog/admin/dashboard.php" style="color:#E81323;">→ Dashboard</a> &nbsp;|&nbsp;
    <a href="gen-covers.php" style="color:#E81323;">→ Generar portadas</a>
  </div>
</body>
</html>
