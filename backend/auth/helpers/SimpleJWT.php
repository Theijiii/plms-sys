<?php
class SimpleJWT {
    private static $secret = "eplms_goserveph_secret_key_2024_@#$%^&*";
    private static $issuer = "goserveph_api";
    private static $audience = "goserveph_client";
    
    public static function generate($payload, $expiry_hours = 24) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload['iss'] = self::$issuer;
        $payload['aud'] = self::$audience;
        $payload['iat'] = time();
        $payload['exp'] = time() + ($expiry_hours * 3600);
        
        $base64UrlHeader = self::base64UrlEncode($header);
        $base64UrlPayload = self::base64UrlEncode(json_encode($payload));
        
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, self::$secret, true);
        $base64UrlSignature = self::base64UrlEncode($signature);
        
        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }
    
    public static function verify($jwt) {
        $parts = explode('.', $jwt);
        
        if (count($parts) != 3) {
            return ['valid' => false, 'error' => 'Invalid token format'];
        }
        
        list($header, $payload, $signature) = $parts;
        
        // Verify signature
        $validSignature = hash_hmac('sha256', $header . "." . $payload, self::$secret, true);
        $validSignatureBase64 = self::base64UrlEncode($validSignature);
        
        if ($signature !== $validSignatureBase64) {
            return ['valid' => false, 'error' => 'Invalid signature'];
        }
        
        $decodedPayload = json_decode(self::base64UrlDecode($payload), true);
        
        // Check expiration
        if (isset($decodedPayload['exp']) && $decodedPayload['exp'] < time()) {
            return ['valid' => false, 'error' => 'Token expired'];
        }
        
        // Check issuer and audience
        if ($decodedPayload['iss'] !== self::$issuer || $decodedPayload['aud'] !== self::$audience) {
            return ['valid' => false, 'error' => 'Invalid token issuer/audience'];
        }
        
        return [
            'valid' => true,
            'data' => $decodedPayload
        ];
    }
    
    public static function decode($jwt) {
        $parts = explode('.', $jwt);
        if (count($parts) != 3) return null;
        
        $payload = json_decode(self::base64UrlDecode($parts[1]), true);
        return $payload;
    }
    
    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    private static function base64UrlDecode($data) {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
?>