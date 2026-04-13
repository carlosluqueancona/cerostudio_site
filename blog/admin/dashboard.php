<?php
define('BLOG_APP', true);
require dirname(__DIR__) . '/config.php';
require dirname(__DIR__) . '/includes/db.php';
require dirname(__DIR__) . '/includes/auth.php';
require dirname(__DIR__) . '/includes/functions.php';

require_auth();
$db = getDB();

// Handle actions
if ($_SERVER['REQUEST_METHOD'] === 'POST' && verify_csrf($_POST['csrf_token'] ?? '')) {
    $action = $_POST['action'] ?? '';
    $id     = (int)($_POST['id'] ?? 0);

    if ($action === 'publish_all') {
        $db->exec("UPDATE blog_posts SET status = 'published', published_at = COALESCE(published_at, NOW()) WHERE status = 'draft'");
        $msg = 'Todos los artículos publicados.';
    }

    if ($action === 'fix_dates') {
        $db->exec("UPDATE blog_posts SET published_at = created_at WHERE status = 'published' AND published_at IS NULL");
        $msg = 'Fechas de publicación corregidas.';
    }

    if ($action === 'delete' && $id) {
        $stmt = $db->prepare("DELETE FROM blog_posts WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $msg = 'Artículo eliminado.';
    }
    if ($action === 'toggle' && $id) {
        $stmt = $db->prepare("SELECT status FROM blog_posts WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $current = $stmt->fetchColumn();
        $new = $current === 'published' ? 'draft' : 'published';
        if ($new === 'published') {
            $stmt = $db->prepare("UPDATE blog_posts SET status = 'published', published_at = :p WHERE id = :id");
            $stmt->execute([':p' => date('Y-m-d H:i:s'), ':id' => $id]);
        } else {
            $stmt = $db->prepare("UPDATE blog_posts SET status = 'draft' WHERE id = :id");
            $stmt->execute([':id' => $id]);
        }
        $msg = $new === 'published' ? 'Artículo publicado.' : 'Artículo pasado a borrador.';
    }
}

$stmt = $db->query("SELECT * FROM blog_posts ORDER BY created_at DESC");
$posts = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>Dashboard — Blog Admin</title>
  <link rel="icon" type="image/svg+xml" href="/images/Tomate_2026_Final.svg" />
  <style>
    :root { --red:#E81323; --ink:#111010; --cream:#F2EFE7; --border:rgba(17,16,16,0.08); }
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; background:var(--cream); color:var(--ink); }
    .admin-nav { display:flex; justify-content:space-between; align-items:center; padding:20px 32px; background:#fff; border-bottom:1px solid var(--border); }
    .admin-nav h1 { font-size:16px; font-weight:800; }
    .admin-nav-links { display:flex; gap:16px; align-items:center; }
    .admin-nav-links a { font-size:13px; color:var(--ink); text-decoration:none; opacity:.5; }
    .admin-nav-links a:hover { opacity:1; }
    .container { max-width:1000px; margin:0 auto; padding:32px 24px; }
    .top-bar { display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; }
    .top-bar h2 { font-size:22px; font-weight:800; }
    .btn { padding:10px 20px; border-radius:6px; font-size:13px; font-weight:700; text-decoration:none; cursor:pointer; border:none; font-family:inherit; transition:background .2s, transform .16s; }
    .btn-primary { background:var(--ink); color:var(--cream); }
    .btn-primary:hover { background:var(--red); }
    .btn-primary:active { transform:scale(0.97); }
    .btn-sm { padding:6px 12px; font-size:11px; }
    .btn-outline { background:none; border:1px solid var(--border); color:var(--ink); }
    .btn-outline:hover { border-color:var(--ink); }
    .btn-danger { background:none; border:1px solid #FCC; color:#C00; }
    .btn-danger:hover { background:#FEE; }
    .msg { padding:12px 16px; border-radius:6px; background:#E8F5E9; color:#2E7D32; font-size:13px; margin-bottom:20px; }
    table { width:100%; background:#fff; border-radius:10px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.04); border-collapse:collapse; }
    th { text-align:left; font-size:11px; letter-spacing:0.08em; text-transform:uppercase; color:#888; padding:14px 16px; border-bottom:1px solid var(--border); }
    td { padding:14px 16px; border-bottom:1px solid var(--border); font-size:14px; vertical-align:middle; }
    tr:last-child td { border-bottom:none; }
    .badge { display:inline-block; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:700; letter-spacing:0.04em; }
    .badge-pub { background:#E8F5E9; color:#2E7D32; }
    .badge-draft { background:#FFF3E0; color:#E65100; }
    .actions { display:flex; gap:6px; }
    .empty { text-align:center; padding:60px 24px; color:#888; }
  </style>
</head>
<body>
  <div class="admin-nav">
    <h1>Tomate.MX — Blog Admin</h1>
    <div class="admin-nav-links">
      <a href="/blog/" target="_blank">Ver blog ↗</a>
      <a href="logout.php">Cerrar sesión</a>
    </div>
  </div>
  <div class="container">
    <?php if (!empty($msg)): ?><div class="msg"><?= e($msg) ?></div><?php endif; ?>
    <div class="top-bar">
      <h2>Artículos (<?= count($posts) ?>)</h2>
      <div style="display:flex;gap:8px;align-items:center;">
        <form method="POST" style="display:inline;" onsubmit="return confirm('¿Publicar todos los borradores?')">
          <?= csrf_field() ?>
          <input type="hidden" name="action" value="publish_all">
          <button type="submit" class="btn btn-outline">Publicar todos</button>
        </form>
        <form method="POST" style="display:inline;">
          <?= csrf_field() ?>
          <input type="hidden" name="action" value="fix_dates">
          <button type="submit" class="btn btn-outline">Corregir fechas</button>
        </form>
        <a href="editor.php" class="btn btn-primary">+ Nuevo artículo</a>
      </div>
    </div>

    <?php if (empty($posts)): ?>
      <div class="empty">
        <p>No hay artículos todavía.</p>
        <p style="margin-top:12px;"><a href="editor.php" style="color:var(--red);">Crear el primero →</a></p>
      </div>
    <?php else: ?>
      <table>
        <thead>
          <tr>
            <th>Título</th>
            <th>Categoría</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($posts as $p): ?>
            <tr>
              <td><strong><?= e($p['title']) ?></strong><br><span style="font-size:11px;color:#888;">/blog/<?= e($p['slug']) ?></span></td>
              <td><?= e($p['category'] ?: '—') ?></td>
              <td><span class="badge <?= $p['status'] === 'published' ? 'badge-pub' : 'badge-draft' ?>"><?= $p['status'] === 'published' ? 'Publicado' : 'Borrador' ?></span></td>
              <td style="font-size:12px;color:#888;"><?= format_date($p['created_at']) ?></td>
              <td>
                <div class="actions">
                  <a href="editor.php?id=<?= $p['id'] ?>" class="btn btn-sm btn-outline">Editar</a>
                  <form method="POST" style="display:inline;">
                    <?= csrf_field() ?>
                    <input type="hidden" name="id" value="<?= $p['id'] ?>">
                    <input type="hidden" name="action" value="toggle">
                    <button type="submit" class="btn btn-sm btn-outline"><?= $p['status'] === 'published' ? 'Despublicar' : 'Publicar' ?></button>
                  </form>
                  <form method="POST" style="display:inline;" onsubmit="return confirm('¿Eliminar este artículo?')">
                    <?= csrf_field() ?>
                    <input type="hidden" name="id" value="<?= $p['id'] ?>">
                    <input type="hidden" name="action" value="delete">
                    <button type="submit" class="btn btn-sm btn-danger">Eliminar</button>
                  </form>
                </div>
              </td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    <?php endif; ?>
  </div>
</body>
</html>
