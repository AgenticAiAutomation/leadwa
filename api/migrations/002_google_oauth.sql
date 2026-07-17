-- Add Google OAuth support

-- Add google_id column to users table
ALTER TABLE users ADD COLUMN google_id TEXT;

-- Make password_hash nullable (Google OAuth users won't have a password)
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Add index on google_id for faster lookups
CREATE INDEX idx_users_google_id ON users(google_id);
