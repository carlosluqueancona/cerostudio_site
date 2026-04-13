<?php
/**
 * Limpia covers SVG placeholder de posts que los tengan.
 * Los posts sin imagen real ahora usan tarjetas text-only con acento de color.
 * Visitar: 2026.tomate.mx/blog/gen-covers.php
 * ELIMINAR después.
 */
define('BLOG_APP', true);
require __DIR__ . '/config.php';
require __DIR__ . '/includes/db.php';

$db = getDB();

// Find posts that have SVG placeholder covers
$posts = $db->query("SELECT id, title, featured_image FROM blog_posts WHERE featured_image LIKE '%cover_%' ORDER BY id")->fetchAll();

$cleaned = 0;
$deleted_files = [];

foreach ($posts as $p) {
    // Remove SVG file from disk
    $filepath = __DIR__ . $p['featured_image'];
    if (file_exists($filepath)) {
        unlink($filepath);
        $deleted_files[] = basename($p['featured_image']);
    }

    // Set featured_image to NULL so the card uses text-only design
    $stmt = $db->prepare("UPDATE blog_posts SET featured_image = NULL WHERE id = :id");
    $stmt->execute([':id' => $p['id']]);
    $cleaned++;
}

// Also check for orphan cover_ files in uploads
$orphans = glob(__DIR__ . '/uploads/cover_*.svg');
foreach ($orphans as $f) {
    unlink($f);
    $deleted_files[] = basename($f);
}

echo "<pre style='font-family:Helvetica Neue,sans-serif;padding:40px;max-width:600px;'>";
echo "✓ $cleaned posts limpiados (featured_image → NULL)\n";
echo "✓ " . count($deleted_files) . " archivos SVG eliminados\n\n";
if ($deleted_files) {
    echo "Archivos eliminados:\n";
    foreach ($deleted_files as $f) echo "  - $f\n";
}
echo "\nLos posts sin imagen real ahora muestran tarjetas text-only\n";
echo "con borde de color según su categoría.\n\n";
echo "<a href='/blog/' style='color:#E81323;'>→ Ver blog</a>\n\n";
echo "⚠ Elimina gen-covers.php del servidor.";
echo "</pre>";
