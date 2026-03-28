# Endpoints actuales

## Salud del sistema

- `GET /api/v1/health`

## Autenticacion

- `GET /api/v1/auth/session-config`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`

## Personas

- `GET /api/v1/persons/catalogs`
- `GET /api/v1/persons`
- `GET /api/v1/persons/:personId`
- `POST /api/v1/persons`
- `PATCH /api/v1/persons/:personId`

## Campamentos

- `GET /api/v1/camps`
- `GET /api/v1/camps/:campId`
- `POST /api/v1/camps`
- `PATCH /api/v1/camps/:campId`

## Expediciones

- `GET /api/v1/expeditions/catalogs`
- `GET /api/v1/expeditions`
- `GET /api/v1/expeditions/:expeditionId`
- `POST /api/v1/expeditions`
- `PATCH /api/v1/expeditions/:expeditionId/state`

## Inventario

- `GET /api/v1/inventory/catalogs`
- `GET /api/v1/inventory`
- `GET /api/v1/inventory/:storageId`
- `POST /api/v1/inventory/adjustments`
- `PATCH /api/v1/inventory/:storageId/thresholds`

## Sesiones

- `GET /api/v1/sessions`
- `GET /api/v1/sessions/current`
- `GET /api/v1/sessions/:sessionId`
- `PATCH /api/v1/sessions/:sessionId/revoke`

## Configuracion

- `GET /api/v1/settings/public`
- `GET /api/v1/settings`
- `GET /api/v1/settings/:key`
- `PUT /api/v1/settings/:key`

## Traslados

- `GET /api/v1/transfers/catalogs`
- `GET /api/v1/transfers`
- `GET /api/v1/transfers/:transferId`
- `POST /api/v1/transfers`
- `PATCH /api/v1/transfers/:transferId/state`

## Usuarios

- `GET /api/v1/users/catalogs`
- `GET /api/v1/users`
- `GET /api/v1/users/:userId`
- `POST /api/v1/users`
- `PATCH /api/v1/users/:userId`

## Pendientes de la siguiente etapa

- Dashboard
- Reportes
- Reglas de negocio complementarias
