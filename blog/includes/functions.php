<?php
defined('BLOG_APP') or die('Acceso denegado');

function e(string $str): string {
    return htmlspecialchars($str, ENT_QUOTES, 'UTF-8');
}

function slugify(string $text): string {
    $text = mb_strtolower($text, 'UTF-8');
    $map = ['á'=>'a','é'=>'e','í'=>'i','ó'=>'o','ú'=>'u','ñ'=>'n','ü'=>'u'];
    $text = strtr($text, $map);
    $text = preg_replace('/[^a-z0-9\-]/', '-', $text);
    $text = preg_replace('/-+/', '-', $text);
    return trim($text, '-');
}

function reading_time(string $content): int {
    $words = str_word_count(strip_tags($content));
    return max(1, (int) ceil($words / 200));
}

function format_date(string $date): string {
    $months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    $ts = strtotime($date);
    $day = date('j', $ts);
    $month = $months[(int)date('n', $ts) - 1];
    $year = date('Y', $ts);
    return "$day de $month, $year";
}

function get_posts(int $page = 1, ?string $category = null): array {
    $db = getDB();
    $offset = ($page - 1) * POSTS_PER_PAGE;

    $where = "WHERE status = 'published'";
    $params = [];
    if ($category) {
        $where .= " AND category = :category";
        $params[':category'] = $category;
    }

    // Count
    $stmt = $db->prepare("SELECT COUNT(*) FROM blog_posts $where");
    $stmt->execute($params);
    $total = (int) $stmt->fetchColumn();

    // Posts
    $stmt = $db->prepare("SELECT * FROM blog_posts $where ORDER BY COALESCE(published_at, created_at) DESC LIMIT :limit OFFSET :offset");
    foreach ($params as $k => $v) $stmt->bindValue($k, $v);
    $stmt->bindValue(':limit', POSTS_PER_PAGE, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $posts = $stmt->fetchAll();

    return [
        'posts'       => $posts,
        'total'       => $total,
        'total_pages' => (int) ceil($total / POSTS_PER_PAGE),
        'current'     => $page,
    ];
}

function get_post_by_slug(string $slug): ?array {
    $db = getDB();
    $stmt = $db->prepare("SELECT p.*, u.display_name as author_name FROM blog_posts p LEFT JOIN blog_users u ON p.author_id = u.id WHERE p.slug = :slug AND p.status = 'published' LIMIT 1");
    $stmt->execute([':slug' => $slug]);
    $result = $stmt->fetch();
    return $result ?: null;
}

function get_related_posts(int $post_id, string $category, int $limit = 3): array {
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM blog_posts WHERE status = 'published' AND category = :cat AND id != :id ORDER BY published_at DESC LIMIT :lim");
    $stmt->bindValue(':cat', $category);
    $stmt->bindValue(':id', $post_id, PDO::PARAM_INT);
    $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll();
}

function get_categories(): array {
    $db = getDB();
    $stmt = $db->query("SELECT DISTINCT category FROM blog_posts WHERE status = 'published' AND category != '' ORDER BY category");
    return $stmt->fetchAll(PDO::FETCH_COLUMN);
}

/**
 * Resolve a URL slug back to the real category name from DB.
 * e.g. "diseno-web" → "diseño web"
 */
function get_category_by_slug(string $slug): ?string {
    $categories = get_categories();
    foreach ($categories as $cat) {
        if (slugify($cat) === $slug) {
            return $cat;
        }
    }
    return null;
}

function excerpt_truncate(string $text, int $length = 160): string {
    $text = strip_tags($text);
    if (mb_strlen($text) <= $length) return $text;
    return mb_substr($text, 0, $length) . '...';
}
