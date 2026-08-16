-- Demo accounts, one per role. Run after schema.sql:
--   psql -U postgres -d MuniReportDB -f seed.sql
--
-- Login credentials (documented in README.md):
--   admin@munireport.gov.za       / Admin123!
--   citizen@munireport.gov.za     / Citizen123!
--   officer@munireport.gov.za     / Officer123!
--   inspector@munireport.gov.za   / Inspector123!
--   supervisor@munireport.gov.za  / Supervisor123!
--   analyst@munireport.gov.za     / Analyst123!

INSERT INTO users (full_name, email, password_hash, role) VALUES
  ('System Admin', 'admin@munireport.gov.za', 'scrypt$c81ce1fd7a8db114e7d27aad964357f7$2851afeb78d73929dc5786ceffbf534f7529cbfa531a6219a418987e914cede7edd57f53a1cccf2f71b296727a45e6aa3a0a5d9844f1793b9c82db9de10a24cc', 'Admin'),
  ('Sipho Nkosi', 'officer@munireport.gov.za', 'scrypt$6f2297f80b8fdd63c9f5f967ac86c570$84fc8afe49cb5c79d45e537a6e363d2ab4da8ba23fde755856cf74a7efacf7b0026aba8378d7a4180ce272f06d19f0a40f0911a27282fd80bba000530212c6e5', 'Municipal Officer'),
  ('Thandiwe Dlamini', 'inspector@munireport.gov.za', 'scrypt$30a1685dbb6d872a43d9a6a672d20ccf$7a5bdee7184bb3fcdd78c59b4ccf4958b7aa9a34b16ed3df3b8b0db2b98ff9e885c9be4a96f03debf7213b0bb1c49cba16810b0e7b18610c0e9d08d272b332ad', 'Field Inspector'),
  ('Johan van der Merwe', 'supervisor@munireport.gov.za', 'scrypt$dcbe48f83aa68bbd6cfa36af13b98c16$997f602409e4e7d3538b4aa61878277ae79c98890af56a30a9929019dc6038a9e04952afcfc0e7fc2c0c4c14b615e2a6cc58d08ddd3174ce7e1ef1af4c907fe1', 'Supervisor'),
  ('Naledi Khumalo', 'analyst@munireport.gov.za', 'scrypt$dd6e2c778f447e355e7e35de5f65f5d4$81b8f9ec742504ad38964e6f12dc3d65a2d09edf44f8999574984ea72b5ba2556a623fa372973eda0265f293d7278967509327db66fad9521ac1c8cabb804faf', 'Data Analyst')
ON CONFLICT (email) DO NOTHING;

-- Citizen account includes sample address details, since those are
-- required for real Citizen sign-ups.
INSERT INTO users (full_name, email, password_hash, role, city, province, postal_address, municipality) VALUES
  ('Lerato Mokoena', 'citizen@munireport.gov.za', 'scrypt$f7516910b87debee9090d058ea859619$fd20f9f09776d3944bccecb37ef148d0c9dfd8e7485efeb7cc4a4195dad97db5780f47ce8f360f13207509613f164c030c5c3a347435bcbc5d1cdfe0d2a57784', 'Citizen', 'Sasolburg', 'Free State', 'P.O. Box 245, Sasolburg, 1947', 'Metsimaholo Local Municipality')
ON CONFLICT (email) DO NOTHING;
