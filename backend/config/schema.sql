-- BAM Studio Database Schema
CREATE DATABASE IF NOT EXISTS bam_studio;
USE bam_studio;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(20),
  password VARCHAR(255) NOT NULL,
  role ENUM('customer', 'admin') DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  customer_name VARCHAR(100),
  customer_email VARCHAR(150),
  customer_phone VARCHAR(20),
  service VARCHAR(100) NOT NULL,
  room VARCHAR(100),
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration INT NOT NULL DEFAULT 1,
  price DECIMAL(12,2) NOT NULL,
  payment_status ENUM('pending','completed','failed','cancelled') DEFAULT 'pending',
  status ENUM('pending','approved','rejected','cancelled') DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  paystack_reference VARCHAR(255) UNIQUE,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- Insert default admin user (password: admin123)
INSERT IGNORE INTO users (name, email, phone, password, role)
VALUES ('Admin', 'admin@bamstudio.com', '08000000000',
  '$2a$12$9.vCRk4hFO3OTdKRDd1x2.kJkjspEhKbT/ymqPT4Y8yBDAyM9bkhu', 'admin');
