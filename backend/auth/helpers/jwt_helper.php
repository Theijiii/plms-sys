<?php
require_once 'vendor/autoload.php'; // You'll need to install firebase/php-jwt via composer

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class JWT_Helper {
    private static $secret_key = "eplms_secret_key_2024_change_this_in_production";
    private static $algorithm = 'HS256';
    private static $issuer = "eplms_auth_server";
    private static $audience = "eplms_client";
    
    public static function generateToken($user_id, $user_type, $email) {
        $issued_at = time();
        $expiration_time = $issued_at + (60 * 60 * 24); // 24 hours
        
        $payload = array(
            "iss" => self::$issuer,
            "aud" => self::$audience,
            "iat" => $issued_at,
            "exp" => $expiration_time,
            "data" => array(
                "user_id" => $user_id,
                "user_type" => $user_type,
                "email" => $email
            )
        );
        
        return JWT::encode($payload, self::$secret_key, self::$algorithm);
    }
    
    public static function validateToken($token) {
        try {
            $decoded = JWT::decode($token, new Key(self::$secret_key, self::$algorithm));
            
            // Check if token is expired
            if ($decoded->exp < time()) {
                return false;
            }
            
            // Check issuer and audience
            if ($decoded->iss !== self::$issuer || $decoded->aud !== self::$audience) {
                return false;
            }
            
            return (array) $decoded->data;
            
        } catch (Exception $e) {
            return false;
        }
    }
    
    public static function refreshToken($token) {
        $data = self::validateToken($token);
        if (!$data) {
            return false;
        }
        
        return self::generateToken($data['user_id'], $data['user_type'], $data['email']);
    }
}
?>