INSERT INTO roles (rls_name, rls_description, rls_is_system_role)
VALUES (
  'SuperAdmin',
  'Administracion global del sistema y de usuarios.',
  TRUE
)
ON DUPLICATE KEY UPDATE
  rls_description = VALUES(rls_description),
  rls_is_system_role = TRUE;

INSERT INTO user_camp_memberships (
  id_user,
  id_camp,
  ucm_is_active,
  ucm_created_at
)
SELECT
  id_user,
  id_camp,
  TRUE,
  NOW()
FROM users
WHERE id_camp IS NOT NULL
ON DUPLICATE KEY UPDATE
  ucm_is_active = TRUE;

UPDATE users AS target_user
JOIN roles AS super_role
  ON super_role.rls_name = 'SuperAdmin'
JOIN roles AS old_role
  ON old_role.id_role = target_user.id_role
SET target_user.id_role = super_role.id_role
WHERE target_user.usr_username = 'admin'
  AND old_role.rls_name = 'administrador sistema';
