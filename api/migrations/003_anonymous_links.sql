-- Allow anonymous link creation (user_id can be NULL)

ALTER TABLE links ALTER COLUMN user_id DROP NOT NULL;
