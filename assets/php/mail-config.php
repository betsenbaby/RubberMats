<?php
/**
 * Mail configuration for rubbermats.ch
 *
 * Copy this file to mail-config.local.php and fill in real values.
 * mail-config.local.php is in .gitignore — never commit real credentials.
 */

// Load local overrides if they exist
$localConfig = __DIR__ . '/mail-config.local.php';
if (file_exists($localConfig)) {
    require_once $localConfig;
}

// Defaults (overridden by environment variables or local config)
define('SMTP_HOST',     'asmtp.mail.hostpoint.ch');
define('SMTP_USER',     'info@rubbermats.ch');
define('SMTP_PASS',     'CHANGE_ME');
define('SMTP_PORT',     465);
define('SMTP_SECURE',   'ssl');   // SSL/TLS on 465, not STARTTLS
define('MAIL_TO',       'info@rubbermats.ch');
if (!defined('MAIL_FROM'))  define('MAIL_FROM',  getenv('MAIL_FROM')  ?: 'noreply@rubbermats.ch');
