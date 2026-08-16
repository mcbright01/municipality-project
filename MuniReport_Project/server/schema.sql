-- MuniReportDB schema
-- Run this once against a fresh database:
--   psql -U postgres -d MuniReportDB -f schema.sql

DROP TABLE IF EXISTS files CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS inspection_reports CASCADE;
DROP TABLE IF EXISTS complaint_photos CASCADE;
DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE IF NOT EXISTS users (
  user_id        SERIAL PRIMARY KEY,
  full_name      VARCHAR(150) NOT NULL,
  email          VARCHAR(150) UNIQUE NOT NULL,
  password_hash  TEXT NOT NULL,
  role           VARCHAR(30) NOT NULL CHECK (
                   role IN ('Admin', 'Citizen', 'Municipal Officer', 'Field Inspector', 'Supervisor', 'Data Analyst')
                 ),
  -- Address fields are required for Citizen sign-up (enforced in the API layer)
  -- and left NULL for staff accounts, which don't need them.
  city             VARCHAR(100),
  province         VARCHAR(50),
  postal_address   VARCHAR(255),
  municipality     VARCHAR(150),
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  category_id    SERIAL PRIMARY KEY,
  name           VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS complaints (
  complaint_id          SERIAL PRIMARY KEY,
  reference_number      VARCHAR(20) UNIQUE NOT NULL,
  description           TEXT NOT NULL,
  location_address       VARCHAR(255) NOT NULL,
  citizen_id            INTEGER NOT NULL REFERENCES users(user_id),
  category_id           INTEGER NOT NULL REFERENCES categories(category_id),
  status                VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (
                           status IN ('Pending', 'Assigned', 'In Progress', 'Resolved', 'Rejected')
                         ),
  assigned_inspector_id INTEGER REFERENCES users(user_id),
  is_duplicate          BOOLEAN NOT NULL DEFAULT FALSE,
  is_duplicate          BOOLEAN NOT NULL DEFAULT FALSE,
  latitude              DOUBLE PRECISION,
  longitude             DOUBLE PRECISION,
  created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Simple composite index to support location-based lookups (non-PostGIS)
CREATE INDEX IF NOT EXISTS idx_complaints_location ON complaints(latitude, longitude);

-- A complaint requires at least 3 supporting photos (enforced in the API layer,
-- since a CHECK constraint can't easily count sibling rows in Postgres).
CREATE TABLE IF NOT EXISTS complaint_photos (
  photo_id      SERIAL PRIMARY KEY,
  complaint_id  INTEGER NOT NULL REFERENCES complaints(complaint_id) ON DELETE CASCADE,
  photo_base64  TEXT NOT NULL,
  position      SMALLINT NOT NULL DEFAULT 0,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inspection_reports (
  report_id         SERIAL PRIMARY KEY,
  complaint_id       INTEGER NOT NULL REFERENCES complaints(complaint_id),
  inspector_id      INTEGER NOT NULL REFERENCES users(user_id),
  findings          TEXT NOT NULL,
  is_false_report   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tasks allow supervisors/officers to create follow-up work items tied to complaints.
CREATE TABLE IF NOT EXISTS tasks (
  task_id        SERIAL PRIMARY KEY,
  complaint_id   INTEGER REFERENCES complaints(complaint_id) ON DELETE SET NULL,
  assigned_to    INTEGER REFERENCES users(user_id),
  assigned_by    INTEGER REFERENCES users(user_id),
  status         VARCHAR(20) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','In Progress','Blocked','Done','Cancelled')),
  notes          TEXT,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  log_id        SERIAL PRIMARY KEY,
  user_id       INTEGER REFERENCES users(user_id),
  action        VARCHAR(100) NOT NULL,
  target_table  VARCHAR(50),
  target_id     INTEGER,
  details       TEXT,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Files uploaded to the system (complaint attachments, inspection evidence, other documents).
CREATE TABLE IF NOT EXISTS files (
  file_id       SERIAL PRIMARY KEY,
  original_name VARCHAR(255) NOT NULL,
  storage_name  VARCHAR(255) NOT NULL UNIQUE,
  path          VARCHAR(1024) NOT NULL,
  mime_type     VARCHAR(100),
  size_bytes    INTEGER,
  uploader_id   INTEGER REFERENCES users(user_id),
  complaint_id  INTEGER REFERENCES complaints(complaint_id) ON DELETE SET NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_files_complaint ON files(complaint_id);

CREATE INDEX IF NOT EXISTS idx_complaints_citizen ON complaints(citizen_id);
CREATE INDEX IF NOT EXISTS idx_complaints_inspector ON complaints(assigned_inspector_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaint_photos_complaint ON complaint_photos(complaint_id);

INSERT INTO categories (name) VALUES
  ('Waste Management'),
  ('Roads (Potholes)'),
  ('Water & Sanitation'),
  ('Electricity')
ON CONFLICT (name) DO NOTHING;
