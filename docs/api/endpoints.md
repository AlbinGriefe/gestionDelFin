# Endpoints actuales

Todos los endpoints de dominio usan el prefijo `/api/v1` y requieren
autenticacion salvo `GET /` y las operaciones publicas de autenticacion.

## Autenticacion y salud

- `GET /`
- `GET /api/v1/health`
- `GET /api/v1/auth/session-config`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`

## Personas, admision y oficio

- `GET /api/v1/persons/catalogs`
- `GET /api/v1/persons`
- `GET /api/v1/persons/:personId`
- `POST /api/v1/persons`
- `PATCH /api/v1/persons/:personId`
- `GET /api/v1/admission-evaluations/health`
- `POST /api/v1/admission-evaluations`
- `PATCH /api/v1/admission-evaluations/:evaluationId/confirm`
- `POST /api/v1/profession-recommendations`
- `PATCH /api/v1/profession-recommendations/:recommendationId/confirm`

Las escrituras de personas, admision y confirmacion de oficio requieren el rol
`Administrador sistema`.

## Campamentos y zonas

- `GET /api/v1/camps`
- `GET /api/v1/camps/:campId`
- `POST /api/v1/camps`
- `PATCH /api/v1/camps/:campId`
- `PUT /api/v1/camps/:campId/operational-rules`
- `GET /api/v1/exploration-zones`
- `GET /api/v1/exploration-zones/:zoneId`
- `POST /api/v1/exploration-zones`
- `PATCH /api/v1/exploration-zones/:zoneId`

## Operacion diaria y cuidado

- `POST /api/v1/daily-processes/run`
- `GET /api/v1/daily-processes/status/:campId`
- `GET /api/v1/daily-processes/assignments`
- `PUT /api/v1/daily-processes/assignments`
- `POST /api/v1/care-actions/heal`

## Expediciones y traslados

- `GET /api/v1/expeditions/catalogs`
- `GET /api/v1/expeditions`
- `GET /api/v1/expeditions/:expeditionId`
- `POST /api/v1/expeditions`
- `PATCH /api/v1/expeditions/:expeditionId/state`
- `GET /api/v1/transfers/catalogs`
- `GET /api/v1/transfers`
- `GET /api/v1/transfers/:transferId`
- `POST /api/v1/transfers`
- `PATCH /api/v1/transfers/:transferId/state`

Al solicitar el retorno de una expedicion o la entrega de un traslado, el
backend calcula el resultado. Puede resolver el estado como `failed`.

## Inventario, profesiones y configuracion

- `GET /api/v1/inventory/catalogs`
- `GET /api/v1/inventory`
- `GET /api/v1/inventory/:storageId`
- `POST /api/v1/inventory/adjustments`
- `PATCH /api/v1/inventory/:storageId/thresholds`
- `GET /api/v1/professions/coverage`
- `GET /api/v1/professions`
- `GET /api/v1/professions/:professionId`
- `POST /api/v1/professions`
- `PATCH /api/v1/professions/:professionId`
- `POST /api/v1/professions/temporary-reassignment`
- `POST /api/v1/professions/revert-reassignment`
- `GET /api/v1/settings/public`
- `GET /api/v1/settings`
- `GET /api/v1/settings/:key`
- `PUT /api/v1/settings/:key`

## Auditoria y eventos narrativos

- `GET /api/v1/events`
- `GET /api/v1/events/:eventId`
- `GET /api/v1/narrative-events`
- `GET /api/v1/narrative-events/:eventId`

`events` conserva auditoria tecnica. `narrative-events` expone enfermedad,
escasez, ataques, recursos valiosos y perdida de viajeros.

## Usuarios y sesiones

- `GET /api/v1/users/catalogs`
- `GET /api/v1/users`
- `GET /api/v1/users/:userId`
- `POST /api/v1/users`
- `PATCH /api/v1/users/:userId`
- `GET /api/v1/sessions`
- `GET /api/v1/sessions/current`
- `GET /api/v1/sessions/:sessionId`
- `PATCH /api/v1/sessions/:sessionId/revoke`

## Pendientes de frontend

- pantallas para los nuevos flujos de personas e IA;
- configuracion visual de reglas operativas;
- asignaciones diarias;
- curacion;
- eventos narrativos;
- zonas y mapa;
- pantalla inicial narrativa `Play`.
