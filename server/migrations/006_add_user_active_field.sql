-- Add active field to users table for admin management
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing users to be active by default
UPDATE users SET is_active = true WHERE is_active IS NULL;

-- Add index for better performance on active user queries
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Add admin field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Add index for admin queries
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);