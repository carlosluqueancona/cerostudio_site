<?php
define('BLOG_APP', true);
require __DIR__ . '/config.php';
require __DIR__ . '/includes/db.php';

header('Content-Type: text/plain; charset=utf-8');

try {
    $db = getDB();
    echo "=== CONEXION OK ===\n\n";

    // Check tables exist
    $tables = $db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "TABLAS: " . implode(', ', $tables) . "\n\n";

    // Count posts
    $total = $db->query("SELECT COUNT(*) FROM blog_posts")->fetchColumn();
    echo "TOTAL POSTS: $total\n";

    $published = $db->query("SELECT COUNT(*) FROM blog_posts WHERE status = 'published'")->fetchColumn();
    echo "PUBLICADOS: $published\n";

    $drafts = $db->query("SELECT COUNT(*) FROM blog_posts WHERE status = 'draft'")->fetchColumn();
    echo "BORRADORES: $drafts\n\n";

    // List all posts with key fields
    $posts = $db->query("SELECT id, title, slug, status, published_at, created_at FROM blog_posts ORDER BY id")->fetchAll();
    echo "=== DETALLE DE POSTS ===\n\n";
    foreach ($posts as $p) {
        echo "ID: {$p['id']}\n";
        echo "  title: {$p['title']}\n";
        echo "  slug: {$p['slug']}\n";
        echo "  status: [{$p['status']}]\n";
        echo "  published_at: " . ($p['published_at'] ?? 'NULL') . "\n";
        echo "  created_at: {$p['created_at']}\n\n";
    }

    // Test the exact query used by index.php
    echo "=== QUERY DE INDEX.PHP ===\n";
    $stmt = $db->prepare("SELECT id, title, status, published_at FROM blog_posts WHERE status = 'published' ORDER BY COALESCE(published_at, created_at) DESC LIMIT 9 OFFSET 0");
    $stmt->execute();
    $results = $stmt->fetchAll();
    echo "Resultados: " . count($results) . "\n";
    foreach ($results as $r) {
        echo "  [{$r['id']}] {$r['title']} (status={$r['status']}, pub={$r['published_at']})\n";
    }

} catch (PDOException $e) {
    echo "ERROR DB: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}

echo "\n\n=== PHP VERSION: " . PHP_VERSION . " ===\n";
echo "ELIMINA ESTE ARCHIVO DESPUES DE USARLO\n";
