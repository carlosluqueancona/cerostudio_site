<?php
define('BLOG_APP', true);
require dirname(__DIR__) . '/config.php';
require dirname(__DIR__) . '/includes/auth.php';

logout_user();
header('Location: login.php');
exit;
