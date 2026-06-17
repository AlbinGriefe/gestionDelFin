# Referencia de API — gestionDelFin

Base URL: `{VITE_API_URL}` (ej. `https://tu-backend.onrender.com/api/v1`)

Todas las respuestas tienen el formato:

```json
{
  "success": true,
  "requestId": "uuid",
  "data": { ... }
}
```

En caso de error:

```json
{
  "success": false,
  "requestId": "uuid",
  "error": { "code": "VALIDATION_ERROR", "message": "..." }
}
```

Los endpoints protegidos requieren la cookie `httpOnly` de sesión establecida al hacer login.

---

## Health

### `GET /health`

Verifica conectividad con base de datos y retorna configuración de sesión.

**Respuesta:**
```json
{
  "status": "ok",
  "apiVersion": "v1",
  "database": "connected",
  "serverTime": "2026-06-16T14:00:00.000Z",
  "sessionTimeoutMinutes": 30
}
```

---

## Auth — `/auth`

### `POST /auth/login`

```json
Body: { "username": "string", "password": "string", "campId": number }
```

Establece cookie de sesión. Devuelve el usuario autenticado y su campamento.

### `POST /auth/logout`

Invalida la sesión actual. No requiere body.

### `GET /auth/me`

Devuelve el usuario autenticado y su campamento activo.

### `PUT /auth/change-camp`

```json
Body: { "campId": number }
```

Cambia el campamento activo del usuario. Invalida la sesión anterior y genera una nueva.

---

## Campamentos — `/camps`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/camps` | Lista todos los campamentos |
| `GET` | `/camps/:id` | Detalle de un campamento |
| `POST` | `/camps` | Crear campamento |
| `PUT` | `/camps/:id` | Actualizar campamento |
| `GET` | `/camps/:id/rules` | Reglas operacionales del campamento |
| `PUT` | `/camps/:id/rules` | Actualizar reglas operacionales |

**Body de creación:**
```json
{
  "name": "string",
  "location": "string",
  "latitude": 0.0,
  "longitude": 0.0,
  "maxCapacity": 100
}
```

---

## Personas — `/persons`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/persons` | Lista personas del campamento activo |
| `GET` | `/persons/:id` | Detalle con stats, salud, profesión |
| `POST` | `/persons` | Registrar nueva persona |
| `PUT` | `/persons/:id` | Actualizar datos |
| `PUT` | `/persons/:id/status` | Cambiar estado de admisión |
| `PUT` | `/persons/:id/profession` | Asignar profesión |
| `GET` | `/persons/:id/progressions` | Historial de subidas de nivel |

**Body de creación:**
```json
{
  "name": "string",
  "lastname": "string",
  "identifier": "string",
  "birthDate": "YYYY-MM-DD",
  "profileDescription": "texto libre para evaluación IA"
}
```

---

## Evaluaciones de admisión — `/admission-evaluations`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/admission-evaluations` | Solicitar evaluación IA para una persona |
| `GET` | `/admission-evaluations/person/:personId` | Historial de evaluaciones de una persona |
| `PUT` | `/admission-evaluations/:id/decide` | Registrar decisión humana final |

**Body de solicitud de evaluación:**
```json
{
  "personId": number,
  "modelName": "llama3.2"   // opcional
}
```

**Body de decisión humana:**
```json
{
  "userDecision": "accept | observe | reject",
  "userObservation": "Notas del revisor"
}
```

---

## Recomendaciones de profesión — `/profession-recommendations`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/profession-recommendations` | Solicitar recomendación IA de oficio |
| `GET` | `/profession-recommendations/person/:personId` | Historial de recomendaciones |
| `PUT` | `/profession-recommendations/:id/decide` | Seleccionar profesión final |

---

## Profesiones — `/professions`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/professions` | Lista profesiones disponibles en el campamento |
| `GET` | `/professions/:id` | Detalle |
| `POST` | `/professions` | Crear profesión personalizada |
| `PUT` | `/professions/:id` | Actualizar |

---

## Expediciones — `/expeditions`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/expeditions` | Lista expediciones del campamento |
| `GET` | `/expeditions/:id` | Detalle con participantes |
| `POST` | `/expeditions` | Planificar expedición |
| `PUT` | `/expeditions/:id/start` | Iniciar expedición |
| `PUT` | `/expeditions/:id/return` | Registrar regreso |
| `PUT` | `/expeditions/:id/cancel` | Cancelar |

**Body de creación:**
```json
{
  "name": "string",
  "leavingDate": "ISO8601",
  "estimatedDays": 3,
  "explorationZoneId": number,
  "participants": [{ "personId": number, "role": "string" }]
}
```

---

## Zonas de exploración — `/exploration-zones`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/exploration-zones` | Lista zonas del campamento |
| `POST` | `/exploration-zones` | Crear zona |
| `PUT` | `/exploration-zones/:id` | Actualizar |

Riesgo posible: `low | medium | high | critical`.

---

## Transferencias — `/transfers`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/transfers` | Lista transferencias |
| `GET` | `/transfers/:id` | Detalle |
| `POST` | `/transfers` | Solicitar transferencia |
| `PUT` | `/transfers/:id/accept` | Aceptar solicitud |
| `PUT` | `/transfers/:id/decline` | Rechazar |
| `PUT` | `/transfers/:id/schedule` | Programar envío |
| `PUT` | `/transfers/:id/dispatch` | Marcar en tránsito |
| `PUT` | `/transfers/:id/deliver` | Confirmar llegada |
| `PUT` | `/transfers/:id/complete` | Cerrar transferencia |

---

## Inventario — `/inventory`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/inventory` | Stock completo del campamento |
| `GET` | `/inventory/alerts` | Recursos bajo el mínimo |
| `POST` | `/inventory/movement` | Registrar movimiento manual |

---

## Procesos diarios — `/daily-processes`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/daily-processes/run` | Ejecutar ciclo del día |
| `GET` | `/daily-processes/history` | Historial de días procesados |

El ciclo del día asigna tareas, produce recursos, aplica consumo de raciones y genera eventos narrativos aleatorios.

---

## Acciones de cuidado médico — `/care-actions`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/care-actions` | Aplicar atención médica |
| `GET` | `/care-actions` | Historial de atenciones |

**Body:**
```json
{
  "doctorId": number,
  "patientId": number
}
```

El costo en comida y la cantidad de salud restaurada se determinan por la profesión del doctor.

---

## Eventos narrativos — `/narrative-events`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/narrative-events` | Lista eventos del campamento |
| `PUT` | `/narrative-events/:id/resolve` | Marcar como resuelto |

---

## Dashboard — `/dashboard`

### `GET /dashboard`

Devuelve métricas consolidadas del campamento activo:
- Total de personas activas y pendientes
- Stock de recursos críticos
- Expediciones en curso
- Últimos eventos narrativos

---

## Usuarios — `/users`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/users` | Lista usuarios del campamento |
| `POST` | `/users` | Crear usuario |
| `PUT` | `/users/:id` | Actualizar |
| `PUT` | `/users/:id/password` | Cambiar contraseña |

---

## Sesiones — `/sessions`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/sessions` | Sesiones activas del usuario |
| `DELETE` | `/sessions/:id` | Cerrar sesión específica |

---

## Logros — `/achievements`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/achievements` | Lista de logros disponibles |
| `GET` | `/achievements/user/:userId` | Logros desbloqueados por usuario |

---

## Configuración del sistema — `/settings`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/settings` | Parámetros del sistema (públicos) |
| `PUT` | `/settings/:key` | Actualizar parámetro (solo admin) |

---

## Eventos de auditoría — `/events`

### `GET /events`

Lista el log de auditoría del campamento. Parámetros de query:
- `entity` — filtrar por entidad (ej. `persons`)
- `entityId` — filtrar por id de entidad
- `from` / `to` — rango de fechas

Estos registros son inmutables (no existe PUT ni DELETE).
