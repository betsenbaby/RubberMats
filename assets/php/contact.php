<?php
/**
 * RubberMats.ch — Contact Form Handler
 * Sends form submissions using PHPMailer with external config.
 */

// Load mail configuration
require_once __DIR__ . '/mail-config.php';

// Headers
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// ── Required fields ──────────────────────────────────────────────────
$name    = trim(filter_input(INPUT_POST, 'name',    FILTER_SANITIZE_SPECIAL_CHARS) ?? '');
$email   = trim(filter_input(INPUT_POST, 'email',   FILTER_SANITIZE_EMAIL)         ?? '');
$message = trim(filter_input(INPUT_POST, 'message', FILTER_SANITIZE_SPECIAL_CHARS) ?? '');

if ($name === '' || $email === '' || $message === '') {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'Name, email, and message are required.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'Invalid email address.']);
    exit;
}

// ── Optional fields ──────────────────────────────────────────────────
$company = trim(filter_input(INPUT_POST, 'company', FILTER_SANITIZE_SPECIAL_CHARS) ?? '');
$phone   = trim(filter_input(INPUT_POST, 'phone',   FILTER_SANITIZE_SPECIAL_CHARS) ?? '');
$product = trim(filter_input(INPUT_POST, 'product',  FILTER_SANITIZE_SPECIAL_CHARS) ?? '');
$subject = trim(filter_input(INPUT_POST, 'subject',  FILTER_SANITIZE_SPECIAL_CHARS) ?? '');

// ── Language-aware subject line ──────────────────────────────────────
$acceptLang = $_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? 'fr';
if (stripos($acceptLang, 'de') === 0) {
    $subjectLine = 'Neue Anfrage — rubbermats.ch';
} elseif (stripos($acceptLang, 'en') === 0) {
    $subjectLine = 'New enquiry — rubbermats.ch';
} else {
    $subjectLine = 'Nouvelle demande — rubbermats.ch';
}
if ($subject !== '') $subjectLine .= ' — ' . $subject;

// ── Build email body ─────────────────────────────────────────────────
$body  = "<h2>" . htmlspecialchars($subjectLine) . "</h2>";
$body .= "<table style='border-collapse:collapse;width:100%;max-width:600px;'>";
$rows = [
    ['Name', $name],
    ['Email', $email],
];
if ($company !== '') $rows[] = ['Company', $company];
if ($phone !== '')   $rows[] = ['Phone', $phone];
if ($product !== '') $rows[] = ['Product', $product];
$rows[] = ['Message', nl2br(htmlspecialchars($message))];

foreach ($rows as $row) {
    $body .= "<tr><td style='padding:8px;border:1px solid #ddd;font-weight:bold;width:120px;'>"
           . htmlspecialchars($row[0]) . "</td><td style='padding:8px;border:1px solid #ddd;'>"
           . ($row[0] === 'Message' ? $row[1] : htmlspecialchars($row[1]))
           . "</td></tr>";
}
$body .= "</table>";

// ── Development mode: log instead of send ────────────────────────────
if (getenv('PHP_ENV') === 'development' || SMTP_PASS === 'CHANGE_ME') {
    error_log("=== rubbermats.ch contact form ===\n" .
              "To: " . MAIL_TO . "\n" .
              "From: {$name} <{$email}>\n" .
              "Subject: {$subjectLine}\n" .
              "Product: {$product}\n" .
              "Message: {$message}\n");
    echo json_encode(['success' => true, 'dev' => true]);
    exit;
}

// ── Send via PHPMailer ───────────────────────────────────────────────
$phpmailerBase = __DIR__ . '/../../litho-template/html/email-templates/phpmailer/';
if (!file_exists($phpmailerBase . 'PHPMailer.php')) {
    // Fallback: PHP mail()
    $headers  = "MIME-Version: 1.0\r\n";
    $headers .= "Content-type: text/html; charset=UTF-8\r\n";
    $headers .= "From: " . MAIL_FROM . "\r\n";
    $headers .= "Reply-To: " . $email . "\r\n";
    $sent = @mail(MAIL_TO, $subjectLine, $body, $headers);
    echo json_encode(['success' => $sent]);
    exit;
}

require $phpmailerBase . 'Exception.php';
require $phpmailerBase . 'PHPMailer.php';
require $phpmailerBase . 'SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

try {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host       = SMTP_HOST;
    $mail->SMTPAuth   = true;
    $mail->Username   = SMTP_USER;
    $mail->Password   = SMTP_PASS;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;  // port 465 = SMTPS
    $mail->Port       = 465;
    $mail->CharSet    = 'UTF-8';

    $mail->setFrom(MAIL_FROM, 'rubbermats.ch');
    $mail->addAddress(MAIL_TO, 'Rich Nutrition Sàrl');
    $mail->addReplyTo($email, $name);

    $mail->isHTML(true);
    $mail->Subject = $subjectLine;
    $mail->Body    = $body;
    $mail->AltBody = strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $body));

    $mail->send();
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Mail could not be sent.']);
}
