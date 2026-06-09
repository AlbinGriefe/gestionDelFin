# Backend

API versionada para `gestionDelFin`, construida con Express, Prisma y MySQL/MariaDB.

## Scripts

```powershell
npm run dev
npm run build
npm run start
npm run typecheck
npm run test
npm run prisma:sync
```

## Endpoints base

- `GET /`
- `GET /api/v1/health`
- `GET /api/v1/auth/session-config`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`
- `GET /api/v1/admission-evaluations/health`
- `POST /api/v1/admission-evaluations`
- `PATCH /api/v1/admission-evaluations/:evaluationId/confirm`
- `POST /api/v1/profession-recommendations`
- `PATCH /api/v1/profession-recommendations/:recommendationId/confirm`
- `GET /api/v1/camps`
- `GET /api/v1/camps/:campId`
- `POST /api/v1/camps`
- `PATCH /api/v1/camps/:campId`
- `GET /api/v1/expeditions/catalogs`
- `GET /api/v1/expeditions`
- `GET /api/v1/expeditions/:expeditionId`
- `POST /api/v1/expeditions`
- `PATCH /api/v1/expeditions/:expeditionId/state`
- `GET /api/v1/inventory/catalogs`
- `GET /api/v1/inventory`
- `GET /api/v1/inventory/:storageId`
- `POST /api/v1/inventory/adjustments`
- `PATCH /api/v1/inventory/:storageId/thresholds`
- `GET /api/v1/sessions`
- `GET /api/v1/sessions/current`
- `GET /api/v1/sessions/:sessionId`
- `PATCH /api/v1/sessions/:sessionId/revoke`
- `GET /api/v1/settings/public`
- `GET /api/v1/settings`
- `GET /api/v1/settings/:key`
- `PUT /api/v1/settings/:key`
- `GET /api/v1/transfers/catalogs`
- `GET /api/v1/transfers`
- `GET /api/v1/transfers/:transferId`
- `POST /api/v1/transfers`
- `PATCH /api/v1/transfers/:transferId/state`
- `GET /api/v1/persons/catalogs`
- `GET /api/v1/persons`
- `GET /api/v1/persons/:personId`
- `POST /api/v1/persons`
- `PATCH /api/v1/persons/:personId`
- `GET /api/v1/users/catalogs`
- `GET /api/v1/users`
- `GET /api/v1/users/:userId`
- `POST /api/v1/users`
- `PATCH /api/v1/users/:userId`
- `GET /api/v1/events`
- `GET /api/v1/events/:eventId`
- `GET /api/v1/professions/coverage`
- `GET /api/v1/professions`
- `GET /api/v1/professions/:professionId`
- `POST /api/v1/professions`
- `POST /api/v1/professions/temporary-reassignment`
- `POST /api/v1/professions/revert-reassignment`
- `PATCH /api/v1/professions/:professionId`
- `POST /api/v1/daily-processes/run`
- `GET /api/v1/daily-processes/status/:campId`

## Variables minimas

En `apps/backend/.env` deben existir como minimo:

```env
DATABASE_URL="mysql://app_user:app_password@localhost:3306/apocalypse_db"
JWT_SECRET=una-clave-larga-y-segura
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b
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

Revision funcional documentada:

- [`docs/operations/functional-review.md`](C:/Users/jcaba/OneDrive/Desktop/Stuff/Cooking/Javascript/gestionDelFin/docs/operations/functional-review.md)

Con el servidor levantado:

- `GET http://localhost:3001/api/v1/health`
- `GET http://localhost:3001/api/v1/auth/session-config`

## Limite actual para login

El backend ya resuelve autenticacion, pero la base de datos del proyecto todavia no trae usuarios semilla. Para usar `POST /api/v1/auth/login`, primero debe existir al menos un usuario cargado en las tablas `roles`, `persons` y `users`.

## Notas de la fase actual

- La API ya incluye autenticacion con JWT y control de sesion por inactividad.
- `admission-evaluations` y `profession-recommendations` usan texto, estadisticas y confirmacion humana.
- `text-ai` intenta Ollama Qwen y usa reglas deterministas si el proveedor no esta disponible.
- La expiracion por inactividad usa el tiempo del servidor y puede parametrizarse.
- `camps` ya permite administrar campamentos y consultar metricas operativas base.
- `inventory` ya permite consultar stock, ajustar cantidades y gestionar umbrales minimos/maximos.
- `sessions` ya permite consultar sesiones autenticadas y revocarlas manualmente.
- `settings` ya permite exponer configuraciones publicas y administrar parametros como el timeout de sesion.
- `transfers` ya permite solicitar traslados y avanzar estados con efectos sobre inventario y campamento de personas.
- `expeditions` resuelve exito, zonas, recursos valiosos, eventos y progresion.
- `persons` registra perfiles, estadisticas, admision formal y trazabilidad.
- `users` ya permite administrar cuentas, roles, vinculacion con personas y revocacion de sesiones sensibles.
- El resto de modulos del dominio siguen pendientes de implementacion o cierre de UI.
