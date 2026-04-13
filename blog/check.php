<?php
define('BLOG_APP', true);
require __DIR__ . '/config.php';
require __DIR__ . '/includes/db.php';
header('Content-Type: text/plain; charset=utf-8');

$db = getDB();

echo "=== IMAGENES EN POSTS ===\n\n";
$posts = $db->query("SELECT id, title, featured_image FROM blog_posts ORDER BY id")->fetchAll();
foreach ($posts as $p) {
    $img = $p['featured_image'] ?: 'NULL';
    $exists = ($p['featured_image'] && file_exists(__DIR__ . $p['featured_image'])) ? 'EXISTE' :
              ($p['featured_image'] ? 'NO EXISTE en disco' : '—');
    echo "[{$p['id']}] {$p['title']}\n";
    echo "    featured_image: {$img}\n";
    echo "    archivo: {$exists}\n\n";
}

echo "=== ARCHIVOS EN /uploads/ ===\n";
$files = glob(__DIR__ . '/uploads/*');
if (empty($files)) {
    echo "Carpeta vacía\n";
} else {
    foreach ($files as $f) {
        echo "  " . basename($f) . " (" . round(filesize($f)/1024) . " KB)\n";
    }
}

echo "\n=== INDEX.PHP VERSION ===\n";
echo str_contains(file_get_contents(__DIR__ . '/index.php'), 'error_reporting') ? "NUEVA ✓\n" : "VIEJA ✗\n";

echo "\n=== TEST: ¿Se ven los posts en /blog/? ===\n";
require __DIR__ . '/includes/functions.php';
$data = get_posts(1);
echo "Posts devueltos: " . count($data['posts']) . "\n";
echo $data['total'] > 0 ? "Blog FUNCIONA ✓\n" : "Blog VACIO ✗\n";
