-- migration_add_address.sql
-- Run this ONLY if your database already exists from before this change.
-- New installs should just use the current schema.sql — it already includes this.
--
--   psql -U postgres -d MuniReportDB -f migration_add_address.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS province VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS postal_address VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS municipality VARCHAR(150);
