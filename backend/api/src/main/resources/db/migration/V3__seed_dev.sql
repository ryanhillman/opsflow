-- V3__seed_dev.sql (dev seed)
-- email: you@example.com
-- password: devpass123

INSERT INTO orgs (id, slug, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'dev', 'Dev Org')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO users (id, email, name, password_hash)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'you@example.com',
  'Dev User',
  '$2a$10$bhnFMI5FKDRoWwu9jlmvtOz0LXV/W/a1vNOIEdpcLHBJ1Ti8PVHOu'
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO org_memberships (org_id, user_id, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  'OWNER'
)
ON CONFLICT (org_id, user_id) DO NOTHING;