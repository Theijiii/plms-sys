<?php
require 'vendor/autoload.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'eplmsgoserveph@gmail.com';
    $mail->Password = 'avqq pdeh hgbc ocyw';
    $mail->SMTPSecure = 'tls';
    $mail->Port = 587;

    $mail->setFrom('eplmsgoserveph@gmail.com', 'Test Email');
    $mail->addAddress('orilla.maaltheabalcos@gmail.com');
    $mail->isHTML(true);
    $mail->Subject = 'PHPMailer Test';
    $mail->Body = 'This is a test email from PHPMailer.';

    $mail->send();
    echo "Test email sent successfully!";
} catch (Exception $e) {
    echo "Mailer Error: " . $mail->ErrorInfo;
}
