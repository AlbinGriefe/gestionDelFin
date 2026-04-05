# Flujo de autenticacion

## Endpoints base

- `GET /api/v1/auth/session-config`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`

## Flujo

1. El cliente consulta `session-config` para obtener el tiempo de inactividad configurado y la hora del servidor.
2. El usuario envía `identity` y `password` a `login`.
3. La API valida credenciales, verifica el rol asociado y crea un registro en `user_sessions`.
4. La respuesta entrega un JWT `Bearer`, los datos básicos del usuario y el tiempo de inactividad configurado.
5. En cada request autenticado, la API valida el JWT, consulta la sesión y actualiza la expiración por inactividad.
6. Si la sesión expira por inactividad, el acceso vuelve a requerir autenticación.
