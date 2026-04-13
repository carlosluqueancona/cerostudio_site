<?php
/**
 * Debug + fix script. Visita 2026.tomate.mx/blog/fix.php
 * ELIMINAR después de usar.
 */
error_reporting(E_ALL);
ini_set('display_errors', '1');

define('BLOG_APP', true);
require __DIR__ . '/config.php';
require __DIR__ . '/includes/db.php';
require __DIR__ . '/includes/functions.php';

header('Content-Type: text/html; charset=utf-8');

echo "<h2>1. Test get_posts()</h2>";
try {
    $data = get_posts(1);
    echo "<p>Total: {$data['total']}, Pages: {$data['total_pages']}, Current: {$data['current']}</p>";
    echo "<p>Posts returned: " . count($data['posts']) . "</p>";
    if (!empty($data['posts'])) {
        echo "<ul>";
        foreach ($data['posts'] as $p) {
            echo "<li><strong>{$p['title']}</strong> — status: {$p['status']} — published_at: " . ($p['published_at'] ?? 'NULL') . "</li>";
        }
        echo "</ul>";
    } else {
        echo "<p style='color:red;'>NO POSTS RETURNED — this is the bug</p>";
    }
} catch (Exception $e) {
    echo "<p style='color:red;'>ERROR: " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<pre>" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
}

echo "<h2>2. Test get_categories()</h2>";
try {
    $cats = get_categories();
    echo "<p>Categories: " . (empty($cats) ? 'none' : implode(', ', $cats)) . "</p>";
} catch (Exception $e) {
    echo "<p style='color:red;'>ERROR: " . htmlspecialchars($e->getMessage()) . "</p>";
}

echo "<h2>3. Direct query test</h2>";
try {
    $db = getDB();
    $stmt = $db->query("SELECT id, title, status FROM blog_posts WHERE status = 'published' LIMIT 3");
    $rows = $stmt->fetchAll();
    echo "<p>Direct query returned: " . count($rows) . " rows</p>";
    foreach ($rows as $r) {
        echo "<p>  [{$r['id']}] {$r['title']}</p>";
    }
} catch (Exception $e) {
    echo "<p style='color:red;'>ERROR: " . htmlspecialchars($e->getMessage()) . "</p>";
}

echo "<h2>4. File versions check</h2>";
echo "<p>functions.php contains COALESCE: " . (str_contains(file_get_contents(__DIR__ . '/includes/functions.php'), 'COALESCE') ? 'YES ✓' : 'NO ✗ — OLD VERSION!') . "</p>";
echo "<p>index.php contains error_reporting: " . (str_contains(file_get_contents(__DIR__ . '/index.php'), 'error_reporting') ? 'YES ✓' : 'NO ✗ — OLD VERSION!') . "</p>";

echo "<hr><p><strong>ELIMINA este archivo después de usarlo.</strong></p>";
