-- W1-02: Database schema v1

-- Enable citext extension for case-insensitive email
CREATE EXTENSION IF NOT EXISTS citext;

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email CITEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    business_name TEXT,
    whatsapp_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Links table
CREATE TABLE links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slug TEXT UNIQUE NOT NULL,
    dest_number TEXT NOT NULL,
    prefill_text TEXT,
    title TEXT,
    source_tag TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for links
CREATE INDEX idx_links_slug ON links(slug);
CREATE INDEX idx_links_user_id ON links(user_id);

-- Clicks table
CREATE TABLE clicks (
    id BIGSERIAL PRIMARY KEY,
    link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    country TEXT,
    device TEXT,
    referrer TEXT
);

-- Indexes for clicks
CREATE INDEX idx_clicks_link_id_ts ON clicks(link_id, ts);
