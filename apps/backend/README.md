# Backend

API versionada para `gestionDelFin`, construida con Express, Prisma y MySQL/MariaDB.

## Scripts

```powershell
npm run dev
npm run build
npm run start
npm run typecheck
npm run prisma:sync
```

## Endpoints base

- `GET /api/v1/health`
- `GET /api/v1/auth/session-config`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`

## Notas de la fase actual

- La API ya incluye autenticacion con JWT y control de sesion por inactividad.
- La expiracion por inactividad usa el tiempo del servidor y puede parametrizarse.
- El resto de modulos del dominio siguen pendientes de implementacion.
