-- SQL Database Schema Initialization for E-Waste Valuation System

-- Create Database
CREATE DATABASE IF NOT EXISTS ewaste_valuation;
USE ewaste_valuation;

-- Scans history log table
CREATE TABLE IF NOT EXISTS scans (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL,
    item_category VARCHAR(50) NOT NULL,
    total_weight_g DOUBLE NOT NULL,
    image_path VARCHAR(255),
    gold_qty_g DOUBLE DEFAULT 0.0,
    silver_qty_g DOUBLE DEFAULT 0.0,
    copper_qty_g DOUBLE DEFAULT 0.0,
    aluminium_qty_g DOUBLE DEFAULT 0.0,
    palladium_qty_g DOUBLE DEFAULT 0.0,
    gross_value DOUBLE DEFAULT 0.0,
    recovery_value DOUBLE DEFAULT 0.0,
    processing_cost DOUBLE DEFAULT 0.0,
    net_profit DOUBLE DEFAULT 0.0,
    recommended_method VARCHAR(50),
    carbon_offset_kg DOUBLE DEFAULT 0.0,
    scan_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Current metal rates lookup table
CREATE TABLE IF NOT EXISTS metal_prices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    metal_name VARCHAR(50) NOT NULL UNIQUE,
    current_price_per_g DOUBLE NOT NULL,
    unit VARCHAR(10) DEFAULT 'g',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Historical prices log table for charts
CREATE TABLE IF NOT EXISTS historical_prices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    metal_name VARCHAR(50) NOT NULL,
    price_per_g DOUBLE NOT NULL,
    recorded_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional seed index rates
INSERT INTO metal_prices (metal_name, current_price_per_g, unit) 
VALUES 
('Gold', 80.5000, 'g'),
('Silver', 0.9500, 'g'),
('Copper', 0.0098, 'g'),
('Aluminium', 0.0026, 'g'),
('Palladium', 33.2000, 'g')
ON DUPLICATE KEY UPDATE current_price_per_g = VALUES(current_price_per_g);
