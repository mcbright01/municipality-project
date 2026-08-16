-- migration_multi_photo.sql
-- Run this ONLY if you already ran the old schema.sql (the one with a single
-- `photo_base64` column on `complaints`). New installs should just use the
-- current schema.sql instead — it already includes this.
--
--   psql -U postgres -d MuniReportDB -f migration_multi_photo.sql

CREATE TABLE IF NOT EXISTS complaint_photos (
  photo_id      SERIAL PRIMARY KEY,
  complaint_id  INTEGER NOT NULL REFERENCES complaints(complaint_id) ON DELETE CASCADE,
  photo_base64  TEXT NOT NULL,
  position      SMALLINT NOT NULL DEFAULT 0,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complaint_photos_complaint ON complaint_photos(complaint_id);

-- Carry forward any single photo that was already attached to a complaint
-- under the old column, so existing data isn't lost.
INSERT INTO complaint_photos (complaint_id, photo_base64, position)
SELECT complaint_id, photo_base64, 0
FROM complaints
WHERE photo_base64 IS NOT NULL;

ALTER TABLE complaints DROP COLUMN IF EXISTS photo_base64;
