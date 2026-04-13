<?php
error_reporting(E_ALL);
ini_set('display_errors', '1');

define('BLOG_APP', true);
require __DIR__ . '/config.php';
require __DIR__ . '/includes/db.php';
require __DIR__ . '/includes/functions.php';

$page     = max(1, (int)($_GET['page'] ?? 1));
$cat_slug = isset($_GET['categoria']) ? trim($_GET['categoria']) : null;
$category = $cat_slug ? get_category_by_slug($cat_slug) : null;

// If slug provided but no matching category found, 404
if ($cat_slug && !$category) {
    http_response_code(404);
    $page_title = 'Categoría no encontrada — Blog ' . SITE_NAME;
    $meta_description = '';
    $canonical_url = BLOG_URL;
    require __DIR__ . '/includes/header.php';
    echo '<div class="blog-empty"><p>Categoría no encontrada. <a href="/blog/">Ver todas las publicaciones</a></p></div>';
    require __DIR__ . '/includes/footer.php';
    exit;
}

$data     = get_posts($page, $category);
$categories = get_categories();

if ($category) {
    $page_title      = ucfirst($category) . ' — Blog ' . SITE_NAME;
    $meta_description = 'Artículos sobre ' . $category . ' en el blog de ' . SITE_NAME;
    $canonical_url    = BLOG_URL . '/categoria/' . urlencode($category) . ($page > 1 ? '/pagina/' . $page : '');
} else {
    $page_title      = 'Blog — ' . SITE_NAME . ' | Diseño Web, Marketing Digital y SEO';
    $meta_description = 'Artículos, guías y consejos sobre diseño web, tiendas online, SEO y marketing digital para negocios en México.';
    $canonical_url    = BLOG_URL . ($page > 1 ? '/pagina/' . $page : '');
}

$extra_head = '<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Blog",
  "name": "Blog de ' . SITE_NAME . '",
  "url": "' . BLOG_URL . '",
  "description": "' . addslashes($meta_description) . '",
  "publisher": {
    "@type": "Organization",
    "name": "' . SITE_NAME . '",
    "logo": "' . SITE_URL . '/Tomate_2026_Final.svg"
  }
}
</script>';

require __DIR__ . '/includes/header.php';
?>

<div class="blog-breadcrumb">
  <a href="/">Inicio</a> <span>›</span>
  <?php if ($category): ?>
    <a href="/blog/">Blog</a> <span>›</span> <?= e(ucfirst($category)) ?>
  <?php else: ?>
    Blog
  <?php endif; ?>
</div>

<section class="blog-hero reveal">
  <h1><?= $category ? e(ucfirst($category)) : 'Blog' ?></h1>
  <p><?php if ($category): ?>
    Artículos sobre <?= e($category) ?>
  <?php else: ?>
    Consejos prácticos sobre diseño web, marketing digital, SEO y ecommerce para hacer crecer tu negocio.
  <?php endif; ?></p>

  <?php if (!empty($categories)): ?>
  <div class="cat-filters">
    <a href="/blog/" class="<?= !$category ? 'active' : '' ?>">Todos</a>
    <?php foreach ($categories as $cat): ?>
      <a href="/blog/categoria/<?= e(slugify($cat)) ?>" class="<?= $category === $cat ? 'active' : '' ?>"><?= e(ucfirst($cat)) ?></a>
    <?php endforeach; ?>
  </div>
  <?php endif; ?>
</section>

<?php if (empty($data['posts'])): ?>
  <div class="blog-empty">
    <p>Aún no hay artículos<?= $category ? ' en esta categoría' : '' ?>. ¡Pronto publicaremos contenido!</p>
  </div>
<?php else: ?>
  <div class="blog-grid">
    <?php foreach ($data['posts'] as $i => $post): ?>
      <?php $hasImg = !empty($post['featured_image']); $catSlug = slugify($post['category'] ?: ''); ?>
      <a href="/blog/<?= e($post['slug']) ?>" class="post-card reveal d<?= min($i + 1, 3) ?><?= $hasImg ? '' : ' post-card--no-img post-card--cat-' . e($catSlug) ?>">
        <?php if ($hasImg): ?>
          <img class="post-card-img" src="<?= e($post['featured_image']) ?>" alt="<?= e($post['featured_image_alt'] ?: $post['title']) ?>" loading="lazy" />
        <?php endif; ?>
        <div class="post-card-body">
          <?php if ($post['category']): ?>
            <div class="post-card-cat"><?= e($post['category']) ?></div>
          <?php endif; ?>
          <h2 class="post-card-title"><?= e($post['title']) ?></h2>
          <p class="post-card-excerpt"><?= e(excerpt_truncate($post['excerpt'] ?: strip_tags($post['content']))) ?></p>
          <div class="post-card-meta">
            <span><?= format_date($post['published_at'] ?: $post['created_at']) ?></span>
            <span>·</span>
            <span><?= reading_time($post['content']) ?> min de lectura</span>
          </div>
        </div>
      </a>
    <?php endforeach; ?>
  </div>

  <?php if ($data['total_pages'] > 1): ?>
    <div class="pagination">
      <?php
      $base = $category ? '/blog/categoria/' . urlencode($category) : '/blog';
      if ($page > 1): ?>
        <a href="<?= $base . ($page - 1 > 1 ? '/pagina/' . ($page - 1) : '') ?>">← Anterior</a>
      <?php endif;
      for ($p = 1; $p <= $data['total_pages']; $p++):
        if ($p === $page): ?>
          <span class="current"><?= $p ?></span>
        <?php else: ?>
          <a href="<?= $base . ($p > 1 ? '/pagina/' . $p : '') ?>"><?= $p ?></a>
        <?php endif;
      endfor;
      if ($page < $data['total_pages']): ?>
        <a href="<?= $base . '/pagina/' . ($page + 1) ?>">Siguiente →</a>
      <?php endif; ?>
    </div>
  <?php endif; ?>
<?php endif; ?>

<?php require __DIR__ . '/includes/footer.php'; ?>
