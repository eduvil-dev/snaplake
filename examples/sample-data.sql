-- Snaplake Sample Database
-- This script creates sample tables and data for demonstrating Snaplake features.

CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    plan VARCHAR(20) NOT NULL DEFAULT 'free',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    ordered_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Customers
INSERT INTO customers (name, email, plan, created_at) VALUES
('Alice Johnson', 'alice@example.com', 'pro', '2025-01-15 09:00:00'),
('Bob Smith', 'bob@example.com', 'free', '2025-02-20 14:30:00'),
('Charlie Lee', 'charlie@example.com', 'enterprise', '2025-03-05 11:00:00'),
('Diana Park', 'diana@example.com', 'pro', '2025-04-10 16:45:00'),
('Eve Kim', 'eve@example.com', 'free', '2025-05-22 08:15:00'),
('Frank Chen', 'frank@example.com', 'pro', '2025-06-18 13:00:00'),
('Grace Liu', 'grace@example.com', 'enterprise', '2025-07-01 10:30:00'),
('Henry Wang', 'henry@example.com', 'free', '2025-08-14 15:20:00');

-- Products
INSERT INTO products (name, category, price, stock, created_at) VALUES
('Cloud Storage 100GB', 'storage', 9.99, 999, '2025-01-01 00:00:00'),
('API Gateway Pro', 'networking', 29.99, 500, '2025-01-01 00:00:00'),
('Database Backup Tool', 'database', 19.99, 300, '2025-02-01 00:00:00'),
('Monitoring Dashboard', 'observability', 14.99, 750, '2025-02-01 00:00:00'),
('SSL Certificate', 'security', 49.99, 200, '2025-03-01 00:00:00'),
('CDN Accelerator', 'networking', 39.99, 400, '2025-03-01 00:00:00');

-- Orders
INSERT INTO orders (customer_id, product_id, quantity, total_price, status, ordered_at) VALUES
(1, 1, 2, 19.98, 'completed', '2025-06-01 10:00:00'),
(1, 3, 1, 19.99, 'completed', '2025-06-15 11:30:00'),
(2, 2, 1, 29.99, 'completed', '2025-07-02 09:00:00'),
(3, 5, 3, 149.97, 'completed', '2025-07-10 14:00:00'),
(4, 4, 1, 14.99, 'shipped', '2025-08-01 16:00:00'),
(5, 1, 1, 9.99, 'pending', '2025-08-20 08:30:00'),
(6, 6, 2, 79.98, 'completed', '2025-09-05 12:00:00'),
(7, 2, 1, 29.99, 'shipped', '2025-09-18 10:45:00'),
(3, 3, 2, 39.98, 'completed', '2025-10-01 15:00:00'),
(1, 4, 1, 14.99, 'pending', '2025-10-15 09:20:00'),
(4, 5, 1, 49.99, 'completed', '2025-11-02 11:00:00'),
(8, 1, 3, 29.97, 'pending', '2025-11-20 14:30:00');
