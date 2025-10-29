-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  basalam_user_id VARCHAR(255) UNIQUE NOT NULL,
  vendor_id INTEGER NOT NULL,
  username VARCHAR(255),
  name VARCHAR(255),
  email VARCHAR(255),
  access_token TEXT,
  refresh_token TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on basalam_user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_basalam_user_id ON users(basalam_user_id);

-- Create index on vendor_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_vendor_id ON users(vendor_id);