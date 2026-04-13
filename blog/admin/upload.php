<?php
define('BLOG_APP', true);
require dirname(__DIR__) . '/config.php';
require dirname(__DIR__) . '/includes/auth.php';
require dirname(__DIR__) . '/includes/functions.php';

header('Content-Type: application/json');

if (!is_logged_in()) {
    echo json_encode(['ok' => false, 'error' => 'No autenticado']);
    exit;
}

if (!verify_csrf($_POST['csrf_token'] ?? '')) {
    echo json_encode(['ok' => false, 'error' => 'Token CSRF inválido']);
    exit;
}

if (empty($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['ok' => false, 'error' => 'No se recibió archivo']);
    exit;
}

$file = $_FILES['image'];

// Validate size (max 5MB)
if ($file['size'] > 5 * 1024 * 1024) {
    echo json_encode(['ok' => false, 'error' => 'Archivo demasiado grande (máx 5MB)']);
    exit;
}

// Validate MIME type
$allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
$finfo   = finfo_open(FILEINFO_MIME_TYPE);
$mime    = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!in_array($mime, $allowed)) {
    echo json_encode(['ok' => false, 'error' => 'Tipo de archivo no permitido']);
    exit;
}

// Validate extension
$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif'])) {
    echo json_encode(['ok' => false, 'error' => 'Extensión no permitida']);
    exit;
}

// Generate safe filename
$filename = uniqid('img_', true) . '.' . $ext;
$dest     = UPLOADS_DIR . '/' . $filename;

// Ensure uploads directory exists
if (!is_dir(UPLOADS_DIR)) {
    mkdir(UPLOADS_DIR, 0755, true);
}

if (move_uploaded_file($file['tmp_name'], $dest)) {
    echo json_encode([
        'ok'  => true,
        'url' => '/blog/uploads/' . $filename,
    ]);
} else {
    echo json_encode(['ok' => false, 'error' => 'Error al mover archivo']);
}
