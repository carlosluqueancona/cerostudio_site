<?php
define('BLOG_APP', true);
require __DIR__ . '/config.php';
require __DIR__ . '/includes/db.php';

header('Content-Type: application/xml; charset=utf-8');

$db = getDB();
$stmt = $db->query("SELECT slug, updated_at FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC");
$posts = $stmt->fetchAll();

echo '<?xml version="1.0" encoding="UTF-8"?>';
?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc><?= BLOG_URL ?>/</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
<?php foreach ($posts as $p): ?>
  <url>
    <loc><?= BLOG_URL ?>/<?= htmlspecialchars($p['slug']) ?></loc>
    <lastmod><?= date('Y-m-d', strtotime($p['updated_at'])) ?></lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
<?php endforeach; ?>
</urlset>
