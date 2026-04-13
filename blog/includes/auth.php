<?php
defined('BLOG_APP') or die('Acceso denegado');

function init_session(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/blog/admin/',
        'secure'   => true,
        'httponly'  => true,
        'samesite'  => 'Strict',
    ]);
    session_start();
}

function is_logged_in(): bool {
    init_session();
    return !empty($_SESSION['user_id']);
}

function require_auth(): void {
    if (!is_logged_in()) {
        header('Location: login.php');
        exit;
    }
}

function login_user(int $user_id): void {
    session_regenerate_id(true);
    $_SESSION['user_id'] = $user_id;
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

function logout_user(): void {
    init_session();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
}

function generate_csrf(): string {
    init_session();
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verify_csrf(string $token): bool {
    init_session();
    return !empty($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

function csrf_field(): string {
    return '<input type="hidden" name="csrf_token" value="' . htmlspecialchars(generate_csrf()) . '">';
}

function check_login_attempts(): bool {
    init_session();
    if (empty($_SESSION['login_attempts'])) return true;
    if ($_SESSION['login_attempts'] >= MAX_LOGIN_ATTEMPTS) {
        if (time() - $_SESSION['login_last_attempt'] < LOGIN_LOCKOUT_TIME) {
            return false;
        }
        $_SESSION['login_attempts'] = 0;
    }
    return true;
}

function record_failed_login(): void {
    init_session();
    $_SESSION['login_attempts'] = ($_SESSION['login_attempts'] ?? 0) + 1;
    $_SESSION['login_last_attempt'] = time();
}
