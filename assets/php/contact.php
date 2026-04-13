<?php
/**
 * RubberMats.ch — Contact Form Handler
 * Sends form submissions using PHPMailer with external config.
 */

require_once __DIR__ . '/mail-config.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

const RATE_LIMIT_WINDOW_SECONDS = 600;
const RATE_LIMIT_MAX_REQUESTS = 6;
const ABUSE_BLOCK_SECONDS = 86400;
const MIN_FORM_SECONDS = 3;

function jsonError(int $status, string $message, array $extra = []): void
{
    http_response_code($status);
    echo json_encode(array_merge(['success' => false, 'error' => $message], $extra));
    exit;
}

function getClientIp(): string
{
    $forwarded = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
    if ($forwarded !== '') {
        $parts = explode(',', $forwarded);
        $candidate = trim($parts[0]);
        if (filter_var($candidate, FILTER_VALIDATE_IP)) {
            return $candidate;
        }
    }

    $remote = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    return filter_var($remote, FILTER_VALIDATE_IP) ? $remote : '0.0.0.0';
}

function isCaptchaConfigured(): bool
{
    return (bool) (getenv('CAPTCHA_SECRET') ?: '');
}

function getCaptchaSiteKey(): string
{
    return getenv('CAPTCHA_SITE_KEY') ?: '';
}

function verifyCaptcha(string $token, string $ip): bool
{
    $secret = getenv('CAPTCHA_SECRET') ?: '';
    if ($secret === '' || $token === '') {
        return false;
    }

    $provider = strtolower(getenv('CAPTCHA_PROVIDER') ?: 'turnstile');
    $endpoint = $provider === 'recaptcha'
        ? 'https://www.google.com/recaptcha/api/siteverify'
        : 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    $payload = http_build_query([
        'secret' => $secret,
        'response' => $token,
        'remoteip' => $ip,
    ]);

    $raw = false;
    if (function_exists('curl_init')) {
        $ch = curl_init($endpoint);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 8);
        $raw = curl_exec($ch);
        curl_close($ch);
    }

    if ($raw === false) {
        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
                'content' => $payload,
                'timeout' => 8,
            ],
        ]);
        $raw = @file_get_contents($endpoint, false, $context);
    }

    if ($raw === false) {
        return false;
    }

    $decoded = json_decode($raw, true);
    return is_array($decoded) && !empty($decoded['success']);
}

function evaluateRateLimit(string $ip): array
{
    $now = time();
    $key = hash('sha256', $ip);
    $file = sys_get_temp_dir() . '/rm-contact-rate-limit.json';

    $all = [];
    if (file_exists($file)) {
        $decoded = json_decode((string) file_get_contents($file), true);
        if (is_array($decoded)) {
            $all = $decoded;
        }
    }

    $entry = $all[$key] ?? ['timestamps' => [], 'blocked_until' => 0, 'breaches' => 0];
    $entry['timestamps'] = array_values(array_filter($entry['timestamps'], static function ($ts) use ($now) {
        return is_numeric($ts) && ($now - (int) $ts) < RATE_LIMIT_WINDOW_SECONDS;
    }));

    if (($entry['blocked_until'] ?? 0) > $now) {
        $captchaRequired = isCaptchaConfigured();
        return ['blocked' => true, 'captcha_required' => $captchaRequired, 'site_key' => getCaptchaSiteKey()];
    }

    $entry['timestamps'][] = $now;

    if (count($entry['timestamps']) > RATE_LIMIT_MAX_REQUESTS) {
        $entry['breaches'] = (int) ($entry['breaches'] ?? 0) + 1;
        $entry['timestamps'] = [];
        $entry['blocked_until'] = $now + ABUSE_BLOCK_SECONDS;
        $all[$key] = $entry;
        file_put_contents($file, json_encode($all));

        $captchaRequired = isCaptchaConfigured();
        return ['blocked' => true, 'captcha_required' => $captchaRequired, 'site_key' => getCaptchaSiteKey()];
    }

    $all[$key] = $entry;
    file_put_contents($file, json_encode($all));

    return ['blocked' => false, 'captcha_required' => false, 'site_key' => ''];
}

$honeypot = trim((string) (filter_input(INPUT_POST, 'website', FILTER_UNSAFE_RAW) ?? ''));
if ($honeypot !== '') {
    jsonError(422, 'Spam detected.');
}

$formTs = (int) (filter_input(INPUT_POST, 'form_ts', FILTER_VALIDATE_INT) ?? 0);
if ($formTs > 0) {
    $elapsed = (int) floor((time() * 1000 - $formTs) / 1000);
    if ($elapsed < MIN_FORM_SECONDS) {
        jsonError(429, 'Please wait a moment before submitting.');
    }
}

$clientIp = getClientIp();
$rateStatus = evaluateRateLimit($clientIp);

if ($rateStatus['blocked']) {
    if ($rateStatus['captcha_required']) {
        $captchaToken = trim((string) (filter_input(INPUT_POST, 'captcha_token', FILTER_UNSAFE_RAW) ?? ''));
        if (!verifyCaptcha($captchaToken, $clientIp)) {
            jsonError(429, 'Too many attempts. Complete captcha and try again.', [
                'captcha_required' => true,
                'captcha_site_key' => $rateStatus['site_key'],
            ]);
        }
    } else {
        jsonError(429, 'Too many attempts. Please try again later.');
    }
}

$name = trim(filter_input(INPUT_POST, 'name', FILTER_SANITIZE_SPECIAL_CHARS) ?? '');
$email = trim(filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL) ?? '');
$message = trim(filter_input(INPUT_POST, 'message', FILTER_SANITIZE_SPECIAL_CHARS) ?? '');

if ($name === '' || $email === '' || $message === '') {
    jsonError(422, 'Name, email, and message are required.');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonError(422, 'Invalid email address.');
}

$company = trim(filter_input(INPUT_POST, 'company', FILTER_SANITIZE_SPECIAL_CHARS) ?? '');
$phone = trim(filter_input(INPUT_POST, 'phone', FILTER_SANITIZE_SPECIAL_CHARS) ?? '');
$product = trim(filter_input(INPUT_POST, 'product', FILTER_SANITIZE_SPECIAL_CHARS) ?? '');
$subject = trim(filter_input(INPUT_POST, 'subject', FILTER_SANITIZE_SPECIAL_CHARS) ?? '');

$acceptLang = $_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? 'fr';
if (stripos($acceptLang, 'de') === 0) {
    $subjectLine = 'Neue Anfrage — rubbermats.ch';
} elseif (stripos($acceptLang, 'en') === 0) {
    $subjectLine = 'New enquiry — rubbermats.ch';
} else {
    $subjectLine = 'Nouvelle demande — rubbermats.ch';
}
if ($subject !== '') {
    $subjectLine .= ' — ' . $subject;
}

$body = "<h2>" . htmlspecialchars($subjectLine) . "</h2>";
$body .= "<table style='border-collapse:collapse;width:100%;max-width:600px;'>";
$rows = [
    ['Name', $name],
    ['Email', $email],
];
if ($company !== '') {
    $rows[] = ['Company', $company];
}
if ($phone !== '') {
    $rows[] = ['Phone', $phone];
}
if ($product !== '') {
    $rows[] = ['Product', $product];
}
$rows[] = ['Message', nl2br(htmlspecialchars($message))];

foreach ($rows as $row) {
    $body .= "<tr><td style='padding:8px;border:1px solid #ddd;font-weight:bold;width:120px;'>"
        . htmlspecialchars($row[0]) . "</td><td style='padding:8px;border:1px solid #ddd;'>"
        . ($row[0] === 'Message' ? $row[1] : htmlspecialchars($row[1]))
        . "</td></tr>";
}
$body .= '</table>';

if (getenv('PHP_ENV') === 'development' || SMTP_PASS === 'CHANGE_ME') {
    error_log("=== rubbermats.ch contact form ===\n"
        . "To: " . MAIL_TO . "\n"
        . "From: {$name} <{$email}>\n"
        . "Subject: {$subjectLine}\n"
        . "Product: {$product}\n"
        . "Message: {$message}\n");
    echo json_encode(['success' => true, 'dev' => true]);
    exit;
}

$phpmailerBase = __DIR__ . '/../../litho-template/html/email-templates/phpmailer/';
if (!file_exists($phpmailerBase . 'PHPMailer.php')) {
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-type: text/html; charset=UTF-8\r\n";
    $headers .= 'From: ' . MAIL_FROM . "\r\n";
    $headers .= 'Reply-To: ' . $email . "\r\n";
    $sent = @mail(MAIL_TO, $subjectLine, $body, $headers);
    echo json_encode(['success' => $sent]);
    exit;
}

require $phpmailerBase . 'Exception.php';
require $phpmailerBase . 'PHPMailer.php';
require $phpmailerBase . 'SMTP.php';

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

try {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = SMTP_HOST;
    $mail->SMTPAuth = true;
    $mail->Username = SMTP_USER;
    $mail->Password = SMTP_PASS;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port = 465;
    $mail->CharSet = 'UTF-8';

    $mail->setFrom(MAIL_FROM, 'rubbermats.ch');
    $mail->addAddress(MAIL_TO, 'Rich Nutrition Sàrl');
    $mail->addReplyTo($email, $name);

    $mail->isHTML(true);
    $mail->Subject = $subjectLine;
    $mail->Body = $body;
    $mail->AltBody = strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $body));

    $mail->send();
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    jsonError(500, 'Mail could not be sent.');
}
