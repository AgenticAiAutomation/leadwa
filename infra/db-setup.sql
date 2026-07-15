-- Leadwa Database Setup
-- Run as postgres user: sudo -u postgres psql -f db-setup.sql

-- Create user (change password!)
CREATE USER leadwa_user WITH PASSWORD 'CHANGE_ME_STRONG_PASSWORD';

-- Create database
CREATE DATABASE leadwa OWNER leadwa_user;

-- Connect to leadwa database and enable extensions
\c leadwa

CREATE EXTENSION IF NOT EXISTS citext;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE leadwa TO leadwa_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO leadwa_user;

-- Verify
\du leadwa_user
\l leadwa
