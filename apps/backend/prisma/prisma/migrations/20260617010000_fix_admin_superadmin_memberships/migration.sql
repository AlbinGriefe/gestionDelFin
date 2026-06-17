INSERT INTO roles (rls_name, rls_description, rls_is_system_role)
VALUES (
  'SuperAdmin',
  'Administracion global del sistema y de usuarios.',
  TRUE
)
ON DUPLICATE KEY UPDATE
  rls_description = VALUES(rls_description),
  rls_is_system_role = TRUE;

UPDATE users AS target_user
JOIN roles AS super_role
  ON super_role.rls_name = 'SuperAdmin'
SET target_user.id_role = super_role.id_role
WHERE target_user.usr_username = 'admin';

INSERT INTO user_camp_memberships (
  id_user,
  id_camp,
  ucm_is_active,
  ucm_created_at
)
SELECT
  admin_user.id_user,
  camp.id_camp,
  TRUE,
  NOW()
FROM users AS admin_user
JOIN roles AS super_role
  ON super_role.id_role = admin_user.id_role
  AND super_role.rls_name = 'SuperAdmin'
CROSS JOIN camps AS camp
WHERE admin_user.usr_username = 'admin'
ON DUPLICATE KEY UPDATE
  ucm_is_active = TRUE;

UPDATE user_sessions AS user_session
JOIN users AS admin_user
  ON admin_user.id_user = user_session.id_user
SET
  user_session.uss_is_expired = TRUE,
  user_session.uss_last_update = NOW(),
  user_session.uss_expired_session = NOW(),
  user_session.uss_sign_out_reason = 'forced'
WHERE admin_user.usr_username = 'admin'
  AND user_session.uss_is_expired = FALSE;
