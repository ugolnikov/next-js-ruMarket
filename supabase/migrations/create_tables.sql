-- Удаляем существующие таблицы, если они есть
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;
DROP TYPE IF EXISTS order_status;
DROP TYPE IF EXISTS user_role;

-- Удаляем существующие последовательности
DROP SEQUENCE IF EXISTS users_id_seq;
DROP SEQUENCE IF EXISTS products_id_seq;
DROP SEQUENCE IF EXISTS orders_id_seq;
DROP SEQUENCE IF EXISTS order_items_id_seq;
DROP SEQUENCE IF EXISTS cart_items_id_seq;

-- Создаем последовательности для автоинкремента
CREATE SEQUENCE users_id_seq;
CREATE SEQUENCE products_id_seq;
CREATE SEQUENCE orders_id_seq;
CREATE SEQUENCE order_items_id_seq;
CREATE SEQUENCE cart_items_id_seq;

-- Создаем enum для статусов заказа
CREATE TYPE order_status AS ENUM ('pending', 'shipped', 'completed', 'cancelled');

-- Создаем enum для ролей пользователя
CREATE TYPE user_role AS ENUM ('customer', 'seller', 'admin');

-- Users table
CREATE TABLE users (
  id BIGINT PRIMARY KEY DEFAULT nextval('users_id_seq'),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role user_role DEFAULT 'customer',
  phone VARCHAR(255),
  company_name VARCHAR(255),
  inn VARCHAR(255) UNIQUE,
  address TEXT,
  logo VARCHAR(255),
  is_verify BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Products table
CREATE TABLE products (
  id BIGINT PRIMARY KEY DEFAULT nextval('products_id_seq'),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  full_description TEXT,
  price DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) DEFAULT 'шт',
  image_preview VARCHAR(255),
  is_published BOOLEAN DEFAULT true,
  seller_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Orders table
CREATE TABLE orders (
  id BIGINT PRIMARY KEY DEFAULT nextval('orders_id_seq'),
  order_number VARCHAR(255) UNIQUE NOT NULL,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  status order_status DEFAULT 'pending',
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Order items table
CREATE TABLE order_items (
  id BIGINT PRIMARY KEY DEFAULT nextval('order_items_id_seq'),
  order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  is_send BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Cart items table
CREATE TABLE cart_items (
  id BIGINT PRIMARY KEY DEFAULT nextval('cart_items_id_seq'),
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Устанавливаем владельца для последовательностей
ALTER SEQUENCE users_id_seq OWNED BY users.id;
ALTER SEQUENCE products_id_seq OWNED BY products.id;
ALTER SEQUENCE orders_id_seq OWNED BY orders.id;
ALTER SEQUENCE order_items_id_seq OWNED BY order_items.id;
ALTER SEQUENCE cart_items_id_seq OWNED BY cart_items.id; 