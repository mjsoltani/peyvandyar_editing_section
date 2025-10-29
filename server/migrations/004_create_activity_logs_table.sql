-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index on user_id for user activity tracking
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);

-- Create index on action for filtering by action type
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);

-- Create index on created_at for chronological queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- Create GIN index on details JSONB column for efficient JSON queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_details ON activity_logs USING GIN (details);