UPDATE auth.users 
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb), 
  '{is_admin}', 
  'true'
) 
WHERE email = 'admin@example.com';