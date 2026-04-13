<?php
define('BLOG_APP', true);
require dirname(__DIR__) . '/config.php';
require dirname(__DIR__) . '/includes/db.php';
require dirname(__DIR__) . '/includes/auth.php';
require dirname(__DIR__) . '/includes/functions.php';

if (is_logged_in()) { header('Location: dashboard.php'); exit; }

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!check_login_attempts()) {
        $error = 'Demasiados intentos. Espera 15 minutos.';
    } else {
        $username = trim($_POST['username'] ?? '');
        $password = $_POST['password'] ?? '';

        $db = getDB();
        $stmt = $db->prepare("SELECT id, password_hash FROM blog_users WHERE username = :u LIMIT 1");
        $stmt->execute([':u' => $username]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password_hash'])) {
            login_user($user['id']);
            header('Location: dashboard.php');
            exit;
        } else {
            record_failed_login();
            $error = 'Usuario o contraseña incorrectos.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>Admin — Blog Cero Studio</title>
  <link rel="icon" type="image/svg+xml" href="/images/svg/CS_Favicon.svg" />
  <style>
    :root { --red:#E81323; --ink:#111010; --cream:#F2EFE7; }
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; background:var(--cream); color:var(--ink); min-height:100vh; display:flex; align-items:center; justify-content:center; }
    .login-card { background:#fff; border-radius:12px; padding:48px 40px; width:100%; max-width:400px; box-shadow:0 4px 24px rgba(0,0,0,0.06); }
    .login-card h1 { font-size:22px; font-weight:800; margin-bottom:8px; letter-spacing:-0.02em; }
    .login-card p { font-size:13px; color:#888; margin-bottom:28px; }
    label { display:block; font-size:12px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:#888; margin-bottom:6px; }
    input[type="text"], input[type="password"] {
      width:100%; padding:12px 14px; border:1px solid #E5E7EB; border-radius:6px;
      font-size:15px; font-family:inherit; background:#F9FAFB;
      margin-bottom:20px; transition:border-color .2s;
    }
    input:focus { outline:none; border-color:var(--red); }
    .btn {
      width:100%; padding:14px; background:var(--ink); color:var(--cream);
      border:none; border-radius:6px; font-size:15px; font-weight:700;
      cursor:pointer; transition:background .2s ease-out, transform .16s ease-out;
    }
    .btn:hover { background:var(--red); }
    .btn:active { transform:scale(0.97); }
    .error { background:#FEE; color:#C00; padding:10px 14px; border-radius:6px; font-size:13px; margin-bottom:20px; border:1px solid #FCC; }
    .back { display:block; text-align:center; margin-top:20px; font-size:12px; color:#888; text-decoration:none; }
    .back:hover { color:var(--red); }
  </style>
</head>
<body>
  <div class="login-card">
    <img src="/images/svg/Cero_Studio_AI_Horizontal.svg" alt="Cero Studio" style="height:28px;margin-bottom:24px;display:block;" />
    <h1>Blog Admin</h1>
    <p>Cero Studio — Panel de contenido</p>
    <?php if ($error): ?><div class="error"><?= e($error) ?></div><?php endif; ?>
    <form method="POST">
      <label for="username">Usuario</label>
      <input type="text" id="username" name="username" required autocomplete="username" />
      <label for="password">Contraseña</label>
      <input type="password" id="password" name="password" required autocomplete="current-password" />
      <button type="submit" class="btn">Entrar</button>
    </form>
    <a href="/blog/" class="back">← Volver al blog</a>
  </div>
</body>
</html>
