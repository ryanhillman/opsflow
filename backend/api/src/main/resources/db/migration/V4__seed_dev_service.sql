-- V4__seed_dev_service.sql
INSERT INTO services (id, org_id, name, key)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'API',
  'api'
)
ON CONFLICT (org_id, key) DO NOTHING;