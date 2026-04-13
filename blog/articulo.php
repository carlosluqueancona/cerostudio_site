<?php
define('BLOG_APP', true);
require __DIR__ . '/config.php';
require __DIR__ . '/includes/db.php';
require __DIR__ . '/includes/functions.php';

$slug = trim($_GET['slug'] ?? '');
if (!$slug) { http_response_code(404); exit('Artículo no encontrado'); }

$post = get_post_by_slug($slug);
if (!$post) {
    http_response_code(404);
    $page_title = 'Artículo no encontrado — ' . SITE_NAME;
    $meta_description = 'La página que buscas no existe.';
    require __DIR__ . '/includes/header.php';
    echo '<div class="blog-empty" style="padding-top:160px;"><h1 style="font-family:var(--fd);font-size:48px;font-weight:700;margin-bottom:16px;">404</h1><p>Este artículo no existe o fue eliminado.</p><p style="margin-top:20px;"><a href="/blog/" style="color:var(--lime);">← Volver al blog</a></p></div>';
    require __DIR__ . '/includes/footer.php';
    exit;
}

$author = $post['author_name'] ?: AUTHOR_DEFAULT;
$page_title      = ($post['meta_title'] ?: $post['title']) . ' — ' . SITE_NAME;
$meta_description = $post['meta_description'] ?: excerpt_truncate($post['excerpt'] ?: strip_tags($post['content']), 160);
$canonical_url    = BLOG_URL . '/' . $post['slug'];
$og_type          = 'article';
$og_image         = $post['featured_image'] ? (strpos($post['featured_image'], 'http') === 0 ? $post['featured_image'] : SITE_URL . $post['featured_image']) : SITE_URL . '/og-image.jpg';

$extra_head = '<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "' . addslashes($post['title']) . '",
  "description": "' . addslashes($meta_description) . '",
  "image": "' . addslashes($og_image) . '",
  "datePublished": "' . date('c', strtotime($post['published_at'] ?: $post['created_at'])) . '",
  "dateModified": "' . date('c', strtotime($post['updated_at'] ?: $post['created_at'])) . '",
  "author": {
    "@type": "Person",
    "name": "' . addslashes($author) . '"
  },
  "publisher": {
    "@type": "Organization",
    "name": "' . SITE_NAME . '",
    "logo": {
      "@type": "ImageObject",
      "url": "' . SITE_URL . '/Tomate_2026_Final.svg"
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "' . addslashes($canonical_url) . '"
  }
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Inicio", "item": "' . SITE_URL . '"},
    {"@type": "ListItem", "position": 2, "name": "Blog", "item": "' . BLOG_URL . '"},
    {"@type": "ListItem", "position": 3, "name": "' . addslashes($post['title']) . '", "item": "' . addslashes($canonical_url) . '"}
  ]
}
</script>';

require __DIR__ . '/includes/header.php';
$related = get_related_posts($post['id'], $post['category']);
?>

<div class="blog-breadcrumb">
  <a href="/">Inicio</a> <span>›</span>
  <a href="/blog/">Blog</a> <span>›</span>
  <?= e($post['title']) ?>
</div>

<article>
  <header class="article-header reveal">
    <?php if ($post['category']): ?>
      <div class="post-card-cat"><?= e($post['category']) ?></div>
    <?php endif; ?>
    <h1><?= e($post['title']) ?></h1>
    <div class="article-meta">
      <span><?= e($author) ?></span>
      <span>·</span>
      <span><?= format_date($post['published_at'] ?: $post['created_at']) ?></span>
      <span>·</span>
      <span><?= reading_time($post['content']) ?> min de lectura</span>
    </div>
  </header>

  <?php if ($post['featured_image']): ?>
    <div class="article-featured reveal">
      <img src="<?= e($post['featured_image']) ?>" alt="<?= e($post['featured_image_alt'] ?: $post['title']) ?>" />
    </div>
  <?php endif; ?>

  <div class="article-body reveal">
    <?= $post['content'] ?>
  </div>
</article>

<div class="author-box reveal">
  <img src="/images/Carlos_Luque-Retrato.webp" alt="<?= e($author) ?>" />
  <div>
    <div class="author-box-name"><?= e($author) ?></div>
    <div class="author-box-label">Fundador de <?= SITE_NAME ?></div>
  </div>
</div>

<?php if (!empty($related)): ?>
<section class="related-section reveal">
  <h3>Artículos relacionados</h3>
  <div class="related-grid">
    <?php foreach ($related as $r): ?>
      <?php $rHasImg = !empty($r['featured_image']); $rCatSlug = slugify($r['category'] ?: ''); ?>
      <a href="/blog/<?= e($r['slug']) ?>" class="post-card<?= $rHasImg ? '' : ' post-card--no-img post-card--cat-' . e($rCatSlug) ?>">
        <?php if ($rHasImg): ?>
          <img class="post-card-img" src="<?= e($r['featured_image']) ?>" alt="<?= e($r['featured_image_alt'] ?: $r['title']) ?>" loading="lazy" />
        <?php endif; ?>
        <div class="post-card-body">
          <h2 class="post-card-title"><?= e($r['title']) ?></h2>
          <div class="post-card-meta">
            <span><?= format_date($r['published_at'] ?: $r['created_at']) ?></span>
          </div>
        </div>
      </a>
    <?php endforeach; ?>
  </div>
</section>
<?php endif; ?>

<?php require __DIR__ . '/includes/footer.php'; ?>
