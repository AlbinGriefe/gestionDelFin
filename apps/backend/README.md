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

## Variables minimas

En `apps/backend/.env` deben existir como minimo:

```env
DATABASE_URL="mysql://app_user:app_password@localhost:3306/apocalypse_db"
JWT_SECRET=una-clave-larga-y-segura
```

Opcionalmente, para una demo local con contrasenas sin hash:

```env
ALLOW_INSECURE_PLAINTEXT_PASSWORDS=true
```

## Verificaciones disponibles

```powershell
npm run prisma:validate
npm run prisma:sync
npm run typecheck
npm run build
npm run dev
```

Desde la raiz del monorepo tambien pueden correrse asi:

```powershell
npm run backend:prisma:validate
npm run backend:prisma:sync
npm run backend:typecheck
npm run backend:build
npm run backend:dev
```

Con el servidor levantado:

- `GET http://localhost:3001/api/v1/health`
- `GET http://localhost:3001/api/v1/auth/session-config`

## Limite actual para login

El backend ya resuelve autenticacion, pero la base de datos del proyecto todavia no trae usuarios semilla. Para usar `POST /api/v1/auth/login`, primero debe existir al menos un usuario cargado en las tablas `roles`, `persons` y `users`.

## Notas de la fase actual

- La API ya incluye autenticacion con JWT y control de sesion por inactividad.
- La expiracion por inactividad usa el tiempo del servidor y puede parametrizarse.
- El resto de modulos del dominio siguen pendientes de implementacion.
