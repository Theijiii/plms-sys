<?php
class Database {
    private $host = "localhost";
    private $db_name = "eplms_users_management";
    private $username = "root"; // Change as needed
    private $password = "mypassword"; 
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new mysqli($this->host, $this->username, $this->password, $this->db_name);
            
            if ($this->conn->connect_error) {
                throw new Exception("Connection failed: " . $this->conn->connect_error);
            }
            
            $this->conn->set_charset("utf8mb4");
            
        } catch (Exception $exception) {
            throw new Exception("Database connection error: " . $exception->getMessage());
        }
        return $this->conn;
    }
}
?>