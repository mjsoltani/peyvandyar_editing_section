-- Create payment_requests table
CREATE TABLE IF NOT EXISTS payment_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  subscription_plan VARCHAR(50) NOT NULL CHECK (subscription_plan IN ('1_month', '3_month', '6_month')),
  amount INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  payment_method VARCHAR(50) DEFAULT 'card_to_card',
  admin_card_number VARCHAR(20),
  transaction_reference VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  approved_by INTEGER REFERENCES users(id)
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id ON payment_requests(user_id);

-- Create index on status for filtering pending requests
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);

-- Create index on created_at for chronological ordering
CREATE INDEX IF NOT EXISTS idx_payment_requests_created_at ON payment_requests(created_at);