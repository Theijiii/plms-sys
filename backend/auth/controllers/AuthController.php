<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/SimpleJWT.php';

class AuthController {
    private $conn;
    private $adminOtpEmail = "admin.otp@goserveph.com"; // Central admin OTP email
    
    public function __construct() {
        $this->conn = Database::getInstance();
    }
    
    private function getDepartmentFromEmail($email) {
        $adminDepartments = [
            'superadmin@eplms.com'     => 'super',
            'businessadmin@eplms.com'  => 'business',
            'buildingadmin@eplms.com'  => 'building',
            'barangaystaff@eplms.com'  => 'barangay',
            'transportadmin@eplms.com' => 'transport',
            'admin@eplms.com'          => 'super',
        ];
        
        return $adminDepartments[$email] ?? null;
    }
    
    private function isAdminEmail($email) {
        $adminEmails = [
            'superadmin@eplms.com',
            'businessadmin@eplms.com',
            'buildingadmin@eplms.com',
            'barangaystaff@eplms.com',
            'transportadmin@eplms.com',
            'admin@eplms.com'
        ];
        
        return in_array($email, $adminEmails);
    }
    
    private function sendOTPEmail($email, $otp, $context) {
        // Simulate email sending
        // In production, integrate with PHPMailer or other email service
        
        error_log("OTP for $email ($context): $otp");
        
        // If it's an admin email, also log to central admin email
        if ($this->isAdminEmail($email)) {
            error_log("ADMIN OTP Forward to {$this->adminOtpEmail}: $email - $otp");
            
            // Here you would implement actual email sending
            // Example with PHPMailer (commented out):
            /*
            $mail = new PHPMailer(true);
            try {
                $mail->isSMTP();
                $mail->Host = 'smtp.gmail.com';
                $mail->SMTPAuth = true;
                $mail->Username = 'your-email@gmail.com';
                $mail->Password = 'your-app-password';
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
                $mail->Port = 587;

                $mail->setFrom('noreply@goserveph.com', 'GoServePH OTP System');
                $mail->addAddress($this->adminOtpEmail);
                $mail->addAddress($email); // Also send to admin
                
                $mail->isHTML(true);
                $mail->Subject = 'Admin OTP Verification - GoServePH';
                $mail->Body = "
                    <h2>Admin OTP Verification</h2>
                    <p><strong>Admin Email:</strong> $email</p>
                    <p><strong>OTP Code:</strong> <span style='font-size: 24px; font-weight: bold;'>$otp</span></p>
                    <p><strong>Context:</strong> $context</p>
                    <p><strong>Time:</strong> " . date('Y-m-d H:i:s') . "</p>
                    <p><strong>Expires:</strong> 10 minutes</p>
                    <hr>
                    <p style='color: #666; font-size: 12px;'>
                        This is an automated OTP notification. Do not reply to this email.
                    </p>
                ";
                
                $mail->send();
                return true;
            } catch (Exception $e) {
                error_log("Admin OTP email error: " . $mail->ErrorInfo);
                return false;
            }
            */
        }
        
        return true;
    }
    
    private function generateOTP($email, $context) {
        // Generate 6-digit OTP
        $otp = str_pad(mt_rand(0, 999999), 6, '0', STR_PAD_LEFT);
        $expires_at = date('Y-m-d H:i:s', strtotime('+10 minutes'));
        
        // Store OTP in database
        $stmt = $this->conn->prepare("
            INSERT INTO otp_verifications (email, otp_code, context, expires_at, created_at, is_admin) 
            VALUES (?, ?, ?, ?, NOW(), ?)
            ON DUPLICATE KEY UPDATE 
                otp_code = ?, 
                expires_at = ?, 
                created_at = NOW(),
                attempts = 0,
                verified = 0,
                is_admin = ?
        ");
        
        $is_admin = $this->isAdminEmail($email) ? 1 : 0;
        $stmt->bind_param("ssssissi", 
            $email, $otp, $context, $expires_at, $is_admin,
            $otp, $expires_at, $is_admin
        );
        $stmt->execute();
        
        // Send OTP email
        $this->sendOTPEmail($email, $otp, $context);
        
        return $otp;
    }
    
    public function sendOTP($email, $context) {
        try {
            // Validate email
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return ['success' => false, 'message' => 'Invalid email format'];
            }
            
            // Check if user exists for login context
            if ($context === 'login') {
                $checkStmt = $this->conn->prepare("SELECT id, status FROM users WHERE email = ?");
                $checkStmt->bind_param("s", $email);
                $checkStmt->execute();
                $result = $checkStmt->get_result();
                
                if ($result->num_rows === 0) {
                    return ['success' => false, 'message' => 'Email not registered'];
                }
                
                $user = $result->fetch_assoc();
                if ($user['status'] === 'suspended') {
                    return ['success' => false, 'message' => 'Account suspended'];
                }
            }
            
            // Check if this is an admin email
            $isAdmin = $this->isAdminEmail($email);
            
            // Generate and store OTP
            $otp = $this->generateOTP($email, $context);
            
            return [
                'success' => true,
                'message' => 'OTP sent successfully',
                'is_admin' => $isAdmin,
                'department' => $isAdmin ? $this->getDepartmentFromEmail($email) : null,
                'otp' => $otp // Remove in production
            ];
            
        } catch (Exception $e) {
            error_log("Send OTP Error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to send OTP'];
        }
    }
    
    public function verifyOTP($email, $otp, $context) {
        try {
            $stmt = $this->conn->prepare("
                SELECT id, otp_code, expires_at, attempts, verified, is_admin 
                FROM otp_verifications 
                WHERE email = ? AND context = ?
                ORDER BY created_at DESC LIMIT 1
            ");
            $stmt->bind_param("ss", $email, $context);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows === 0) {
                return ['success' => false, 'message' => 'No OTP request found'];
            }
            
            $otpRecord = $result->fetch_assoc();
            
            // Check if OTP is already verified
            if ($otpRecord['verified']) {
                return ['success' => false, 'message' => 'OTP already used'];
            }
            
            // Check attempts
            if ($otpRecord['attempts'] >= 5) {
                return ['success' => false, 'message' => 'Too many attempts. Request new OTP'];
            }
            
            // Check expiration
            if (strtotime($otpRecord['expires_at']) < time()) {
                return ['success' => false, 'message' => 'OTP expired'];
            }
            
            // Verify OTP
            if ($otpRecord['otp_code'] !== $otp) {
                // Increment attempts
                $updateStmt = $this->conn->prepare("
                    UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = ?
                ");
                $updateStmt->bind_param("i", $otpRecord['id']);
                $updateStmt->execute();
                
                return ['success' => false, 'message' => 'Invalid OTP'];
            }
            
            // Mark OTP as verified
            $updateStmt = $this->conn->prepare("
                UPDATE otp_verifications SET verified = 1, verified_at = NOW() WHERE id = ?
            ");
            $updateStmt->bind_param("i", $otpRecord['id']);
            $updateStmt->execute();
            
            // Log admin OTP verification
            if ($otpRecord['is_admin']) {
                error_log("ADMIN OTP Verified: $email - $context");
            }
            
            return [
                'success' => true, 
                'message' => 'OTP verified successfully',
                'is_admin' => $otpRecord['is_admin'],
                'department' => $otpRecord['is_admin'] ? $this->getDepartmentFromEmail($email) : null
            ];
            
        } catch (Exception $e) {
            error_log("Verify OTP Error: " . $e->getMessage());
            return ['success' => false, 'message' => 'OTP verification failed'];
        }
    }
    
    // ... rest of the methods remain the same ...
    
    public function login($email, $password) {
        try {
            $stmt = $this->conn->prepare("
                SELECT id, email, username, password_hash, role, status, 
                       failed_login_attempts, last_login, created_at 
                FROM users 
                WHERE (email = ? OR username = ?) 
                AND status IN ('active', 'pending')
            ");
            $stmt->bind_param("ss", $email, $email);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows === 0) {
                return ['success' => false, 'message' => 'Invalid credentials'];
            }
            
            $user = $result->fetch_assoc();
            
            // Check if this is an admin email
            $isAdmin = $this->isAdminEmail($user['email']);
            $department = $isAdmin ? $this->getDepartmentFromEmail($user['email']) : null;
            
            // Check account status
            if ($user['status'] === 'suspended') {
                return ['success' => false, 'message' => 'Account suspended'];
            }
            
            if ($user['status'] === 'pending') {
                return ['success' => false, 'message' => 'Account pending verification'];
            }
            
            // Check failed attempts
            if ($user['failed_login_attempts'] >= 5) {
                $this->suspendAccount($user['id']);
                return ['success' => false, 'message' => 'Account locked. Too many failed attempts'];
            }
            
            // Verify password
            if (!password_verify($password, $user['password_hash'])) {
                $this->incrementFailedAttempts($user['id']);
                return ['success' => false, 'message' => 'Invalid credentials'];
            }
            
            // Reset failed attempts
            $this->resetFailedAttempts($user['id']);
            
            // Update last login
            $this->updateLastLogin($user['id']);
            
            // Generate JWT token
            $tokenPayload = [
                'user_id' => $user['id'],
                'email' => $user['email'],
                'role' => $user['role'],
                'status' => $user['status'],
                'is_admin' => $isAdmin,
                'department' => $department
            ];
            
            $token = SimpleJWT::generate($tokenPayload);
            
            // Remove sensitive data
            unset($user['password_hash']);
            unset($user['failed_login_attempts']);
            
            return [
                'success' => true,
                'message' => 'Login successful',
                'token' => $token,
                'user' => $user,
                'is_admin' => $isAdmin,
                'department' => $department
            ];
            
        } catch (Exception $e) {
            error_log("Login Error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Login failed'];
        }
    }
    
    // ... rest of the methods ...
}
?>