<?php
define('BLOG_APP', true);
require dirname(__DIR__) . '/config.php';
require dirname(__DIR__) . '/includes/db.php';
require dirname(__DIR__) . '/includes/auth.php';
require dirname(__DIR__) . '/includes/functions.php';

require_auth();
$db = getDB();

$id   = (int)($_GET['id'] ?? 0);
$post = null;
$msg  = '';

// Load existing post
if ($id) {
    $stmt = $db->prepare("SELECT * FROM blog_posts WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $post = $stmt->fetch();
    if (!$post) { header('Location: dashboard.php'); exit; }
}

// Handle save
if ($_SERVER['REQUEST_METHOD'] === 'POST' && verify_csrf($_POST['csrf_token'] ?? '')) {
    $title       = trim($_POST['title'] ?? '');
    $slug        = slugify(trim($_POST['slug'] ?? '') ?: $title);
    $excerpt     = trim($_POST['excerpt'] ?? '');
    $content     = $_POST['content'] ?? '';
    $category    = trim($_POST['category'] ?? '');
    $meta_title  = trim($_POST['meta_title'] ?? '');
    $meta_desc   = trim($_POST['meta_description'] ?? '');
    $status      = in_array($_POST['status'] ?? '', ['draft','published']) ? $_POST['status'] : 'draft';
    $featured    = trim($_POST['featured_image'] ?? '');
    $featured_alt = trim($_POST['featured_image_alt'] ?? '');

    if (!$title) {
        $msg = 'El título es obligatorio.';
    } else {
        if ($id) {
            // Update
            $pub = ($status === 'published' && $post['status'] !== 'published') ? date('Y-m-d H:i:s') : $post['published_at'];
            $stmt = $db->prepare("UPDATE blog_posts SET title=:t, slug=:s, excerpt=:e, content=:c, category=:cat, meta_title=:mt, meta_description=:md, status=:st, featured_image=:fi, featured_image_alt=:fa, published_at=:pa WHERE id=:id");
            $stmt->execute([
                ':t'=>$title, ':s'=>$slug, ':e'=>$excerpt, ':c'=>$content,
                ':cat'=>$category, ':mt'=>$meta_title, ':md'=>$meta_desc,
                ':st'=>$status, ':fi'=>$featured, ':fa'=>$featured_alt,
                ':pa'=>$pub, ':id'=>$id
            ]);
            $msg = 'Artículo actualizado.';
            // Reload
            $stmt = $db->prepare("SELECT * FROM blog_posts WHERE id = :id");
            $stmt->execute([':id' => $id]);
            $post = $stmt->fetch();
        } else {
            // Insert
            $pub = $status === 'published' ? date('Y-m-d H:i:s') : null;
            $stmt = $db->prepare("INSERT INTO blog_posts (title, slug, excerpt, content, category, meta_title, meta_description, status, featured_image, featured_image_alt, author_id, published_at) VALUES (:t,:s,:e,:c,:cat,:mt,:md,:st,:fi,:fa,:aid,:pa)");
            $stmt->execute([
                ':t'=>$title, ':s'=>$slug, ':e'=>$excerpt, ':c'=>$content,
                ':cat'=>$category, ':mt'=>$meta_title, ':md'=>$meta_desc,
                ':st'=>$status, ':fi'=>$featured, ':fa'=>$featured_alt,
                ':aid'=>$_SESSION['user_id'], ':pa'=>$pub
            ]);
            $id = (int)$db->lastInsertId();
            $msg = 'Artículo creado.';
            header("Location: editor.php?id=$id&saved=1");
            exit;
        }
    }
}

if (isset($_GET['saved'])) $msg = 'Artículo guardado.';

$v = fn($f) => e($post[$f] ?? ($_POST[$f] ?? ''));
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title><?= $id ? 'Editar' : 'Nuevo' ?> artículo — Blog Admin</title>
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
    .container { max-width:900px; margin:0 auto; padding:32px 24px; }
    .msg { padding:12px 16px; border-radius:6px; background:#E8F5E9; color:#2E7D32; font-size:13px; margin-bottom:20px; }
    .msg-error { background:#FEE; color:#C00; border:1px solid #FCC; }
    .form-grid { display:grid; grid-template-columns:1fr 320px; gap:28px; align-items:start; }
    .form-main, .form-sidebar { background:#fff; padding:28px; border-radius:10px; box-shadow:0 2px 12px rgba(0,0,0,0.04); }
    label { display:block; font-size:11px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:#888; margin-bottom:6px; margin-top:18px; }
    label:first-child { margin-top:0; }
    input[type="text"], textarea, select {
      width:100%; padding:10px 12px; border:1px solid #E5E7EB; border-radius:6px;
      font-size:14px; font-family:inherit; background:#F9FAFB;
      transition:border-color .2s;
    }
    input:focus, textarea:focus, select:focus { outline:none; border-color:var(--red); }
    textarea { resize:vertical; min-height:100px; }
    .slug-row { display:flex; align-items:center; gap:8px; }
    .slug-prefix { font-size:12px; color:#888; white-space:nowrap; }
    .btn { padding:12px 24px; border-radius:6px; font-size:14px; font-weight:700; cursor:pointer; border:none; font-family:inherit; transition:background .2s, transform .16s; text-decoration:none; display:inline-block; }
    .btn-primary { background:var(--ink); color:var(--cream); }
    .btn-primary:hover { background:var(--red); }
    .btn-primary:active { transform:scale(0.97); }
    .btn-outline { background:none; border:1px solid var(--border); color:var(--ink); }
    .btn-outline:hover { border-color:var(--ink); }
    .actions-bar { display:flex; gap:12px; margin-top:24px; }
    .img-preview { margin-top:8px; max-width:100%; border-radius:6px; }
    .upload-area { margin-top:8px; padding:16px; border:2px dashed #E5E7EB; border-radius:8px; text-align:center; font-size:13px; color:#888; cursor:pointer; transition:border-color .2s; }
    .upload-area:hover { border-color:var(--red); }
    .help { font-size:11px; color:#888; margin-top:4px; }
    .toolbar { display:flex; gap:4px; flex-wrap:wrap; margin-bottom:6px; }
    .toolbar button { padding:5px 10px; border:1px solid #E5E7EB; border-radius:4px; background:#fff; font-size:11px; font-weight:700; font-family:inherit; cursor:pointer; transition:background .15s; }
    .toolbar button:hover { background:var(--ink); color:var(--cream); }
    #content { font-family:'SF Mono',Consolas,'Courier New',monospace; font-size:13px; line-height:1.6; tab-size:2; }
    @media(max-width:768px) { .form-grid { grid-template-columns:1fr; } }
  </style>
</head>
<body>
  <div class="admin-nav">
    <h1><?= $id ? 'Editar artículo' : 'Nuevo artículo' ?></h1>
    <div class="admin-nav-links">
      <a href="dashboard.php">← Dashboard</a>
      <?php if ($id && ($post['status'] ?? '') === 'published'): ?>
        <a href="/blog/<?= e($post['slug']) ?>" target="_blank">Ver ↗</a>
      <?php endif; ?>
    </div>
  </div>
  <div class="container">
    <?php if ($msg): ?>
      <div class="msg <?= str_contains($msg, 'obligatorio') ? 'msg-error' : '' ?>"><?= e($msg) ?></div>
    <?php endif; ?>
    <form method="POST" class="form-grid">
      <?= csrf_field() ?>
      <div class="form-main">
        <label for="title">Título</label>
        <input type="text" id="title" name="title" value="<?= $v('title') ?>" required placeholder="Ej: Cuánto cuesta una página web en México" />

        <label for="slug">URL</label>
        <div class="slug-row">
          <span class="slug-prefix">/blog/</span>
          <input type="text" id="slug" name="slug" value="<?= $v('slug') ?>" placeholder="se-genera-automaticamente" />
        </div>

        <label for="excerpt">Extracto</label>
        <textarea id="excerpt" name="excerpt" rows="3" placeholder="Resumen corto para listado y meta description..."><?= $v('excerpt') ?></textarea>

        <label for="content">Contenido (HTML)</label>
        <div class="toolbar">
          <button type="button" onclick="wrap('h2')">H2</button>
          <button type="button" onclick="wrap('h3')">H3</button>
          <button type="button" onclick="wrap('p')">P</button>
          <button type="button" onclick="wrap('strong')">B</button>
          <button type="button" onclick="wrap('em')">I</button>
          <button type="button" onclick="insertTag('ul')">Lista</button>
          <button type="button" onclick="insertTag('blockquote')">Cita</button>
          <button type="button" onclick="insertLink()">Link</button>
          <button type="button" onclick="insertImg()">Imagen</button>
          <button type="button" onclick="togglePreview()">Vista previa</button>
        </div>
        <textarea id="content" name="content" rows="24"><?= $v('content') ?></textarea>
        <div id="preview-pane" style="display:none;padding:24px;background:#fff;border:1px solid #E5E7EB;border-radius:6px;margin-top:8px;font-size:16px;line-height:1.8;max-height:500px;overflow-y:auto;"></div>
      </div>

      <div class="form-sidebar">
        <label for="status">Estado</label>
        <select id="status" name="status">
          <option value="draft" <?= ($post['status'] ?? 'draft') === 'draft' ? 'selected' : '' ?>>Borrador</option>
          <option value="published" <?= ($post['status'] ?? '') === 'published' ? 'selected' : '' ?>>Publicado</option>
        </select>

        <label for="category">Categoría</label>
        <input type="text" id="category" name="category" value="<?= $v('category') ?>" placeholder="Ej: diseño web, seo, ecommerce" />

        <label for="featured_image">Imagen destacada</label>
        <input type="text" id="featured_image" name="featured_image" value="<?= $v('featured_image') ?>" placeholder="/blog/uploads/imagen.webp" />
        <div class="upload-area" id="upload-area">
          Arrastra una imagen o haz clic para subir
          <input type="file" id="file-input" accept="image/*" style="display:none;" />
        </div>
        <div id="img-preview-wrap" style="<?= ($post && $post['featured_image']) ? '' : 'display:none;' ?>margin-top:8px;position:relative;">
          <img id="img-preview" src="<?= e($post['featured_image'] ?? '') ?>" class="img-preview" alt="Preview" style="width:100%;border-radius:6px;" />
          <button type="button" id="img-remove" style="position:absolute;top:6px;right:6px;width:28px;height:28px;border-radius:50%;background:rgba(0,0,0,0.7);color:#fff;border:none;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;" title="Eliminar imagen">×</button>
        </div>

        <label for="featured_image_alt">Alt de imagen</label>
        <input type="text" id="featured_image_alt" name="featured_image_alt" value="<?= $v('featured_image_alt') ?>" placeholder="Descripción de la imagen" />

        <label for="meta_title">Meta título (SEO)</label>
        <input type="text" id="meta_title" name="meta_title" value="<?= $v('meta_title') ?>" placeholder="Override para <title>" />
        <p class="help">Dejar vacío usa el título del artículo.</p>

        <label for="meta_description">Meta descripción (SEO)</label>
        <textarea id="meta_description" name="meta_description" rows="2" placeholder="Override para meta description"><?= $v('meta_description') ?></textarea>
        <p class="help">Dejar vacío usa el extracto.</p>

        <div class="actions-bar">
          <button type="submit" class="btn btn-primary"><?= $id ? 'Guardar' : 'Crear artículo' ?></button>
          <a href="dashboard.php" class="btn btn-outline">Cancelar</a>
        </div>
      </div>
    </form>
  </div>

  <script>
    // Auto-generate slug from title
    const titleInput = document.getElementById('title');
    const slugInput  = document.getElementById('slug');
    let slugEdited = slugInput.value.length > 0;

    slugInput.addEventListener('input', () => { slugEdited = slugInput.value.length > 0; });

    titleInput.addEventListener('input', () => {
      if (slugEdited) return;
      let s = titleInput.value.toLowerCase();
      const map = {'á':'a','é':'e','í':'i','ó':'o','ú':'u','ñ':'n','ü':'u'};
      for (const [k,v] of Object.entries(map)) s = s.replaceAll(k, v);
      s = s.replace(/[^a-z0-9\-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      slugInput.value = s;
    });

    // Toolbar helpers
    const ta = document.getElementById('content');

    function wrap(tag) {
      const start = ta.selectionStart, end = ta.selectionEnd;
      const sel = ta.value.substring(start, end) || 'texto aquí';
      const replacement = '<' + tag + '>' + sel + '</' + tag + '>';
      ta.setRangeText(replacement, start, end, 'end');
      ta.focus();
    }

    function insertTag(tag) {
      const start = ta.selectionStart;
      let html = '';
      if (tag === 'ul') html = '<ul>\n  <li>Elemento 1</li>\n  <li>Elemento 2</li>\n  <li>Elemento 3</li>\n</ul>';
      if (tag === 'blockquote') html = '<blockquote><p>Cita aquí</p></blockquote>';
      ta.setRangeText(html, start, start, 'end');
      ta.focus();
    }

    function insertLink() {
      const url = prompt('URL del enlace:', 'https://');
      if (!url) return;
      const start = ta.selectionStart, end = ta.selectionEnd;
      const text = ta.value.substring(start, end) || 'texto del enlace';
      ta.setRangeText('<a href="' + url + '">' + text + '</a>', start, end, 'end');
      ta.focus();
    }

    function insertImg() {
      const url = prompt('URL de la imagen:', '/blog/uploads/');
      if (!url) return;
      const alt = prompt('Alt text:', '') || '';
      const start = ta.selectionStart;
      ta.setRangeText('<img src="' + url + '" alt="' + alt + '" />', start, start, 'end');
      ta.focus();
    }

    function togglePreview() {
      const pane = document.getElementById('preview-pane');
      if (pane.style.display === 'none') {
        pane.innerHTML = ta.value;
        pane.style.display = 'block';
      } else {
        pane.style.display = 'none';
      }
    }

    // Tab key inserts spaces in textarea
    ta.addEventListener('keydown', function(e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.selectionStart;
        this.setRangeText('  ', start, start, 'end');
      }
    });

    // Image upload
    const uploadArea  = document.getElementById('upload-area');
    const fileInput   = document.getElementById('file-input');
    const imgField    = document.getElementById('featured_image');
    const imgPreview  = document.getElementById('img-preview');
    const imgWrap     = document.getElementById('img-preview-wrap');
    const imgRemove   = document.getElementById('img-remove');

    function showPreview(url) {
      imgPreview.src = url;
      imgWrap.style.display = 'block';
    }

    function hidePreview() {
      imgField.value = '';
      imgPreview.src = '';
      imgWrap.style.display = 'none';
      uploadArea.innerHTML = 'Arrastra una imagen o haz clic para subir<input type="file" id="file-input" accept="image/*" style="display:none;" />';
      // Re-bind file input
      const newInput = document.getElementById('file-input');
      newInput.addEventListener('change', () => {
        if (newInput.files.length) uploadFile(newInput.files[0]);
      });
    }

    imgRemove.addEventListener('click', hidePreview);

    uploadArea.addEventListener('click', () => {
      document.getElementById('file-input').click();
    });
    uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.style.borderColor = '#E81323'; });
    uploadArea.addEventListener('dragleave', () => { uploadArea.style.borderColor = '#E5E7EB'; });
    uploadArea.addEventListener('drop', e => {
      e.preventDefault();
      uploadArea.style.borderColor = '#E5E7EB';
      if (e.dataTransfer.files.length) uploadFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length) uploadFile(fileInput.files[0]);
    });

    function uploadFile(file) {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('csrf_token', document.querySelector('[name=csrf_token]').value);
      uploadArea.textContent = 'Subiendo...';

      fetch('upload.php', { method: 'POST', body: fd })
        .then(r => r.json())
        .then(data => {
          if (data.ok) {
            imgField.value = data.url;
            uploadArea.textContent = '✓ Imagen subida — arrastra otra para reemplazar';
            showPreview(data.url);
          } else {
            uploadArea.textContent = 'Error: ' + (data.error || 'Fallo al subir');
          }
        })
        .catch(() => { uploadArea.textContent = 'Error de conexión'; });
    }
  </script>
</body>
</html>
