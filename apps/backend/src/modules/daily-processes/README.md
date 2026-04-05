# Daily Processes

Módulo encargado de ejecutar los procesos automáticos diarios de cada campamento: producción de recursos y distribución de raciones.

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/v1/daily-processes/run` | Ejecuta el proceso diario del campamento |
| `POST` | `/api/v1/daily-processes/production-corrections` | Registra una corrección de producción para una persona |

---

## Cómo funciona el proceso diario

### `POST /run`

1. **Verifica idempotencia** — Busca si ya existe un movimiento de tipo `daily_production` para el campamento en el día actual. Si ya corrió, retorna error `409`.

2. **Lee configuración del sistema** — Obtiene 4 settings obligatorios de `system_settings`. Si alguno falta, retorna error `500` indicando cuál.

   | Setting | Tipo | Descripción |
   |---------|------|-------------|
   | `daily_food_resource_id` | integer | ID del recurso que representa la comida |
   | `daily_water_resource_id` | integer | ID del recurso que representa el agua |
   | `daily_food_ration_per_person` | decimal | Unidades de comida consumidas por persona por día |
   | `daily_water_ration_per_person` | decimal | Unidades de agua consumidas por persona por día |

3. **Calcula producción** — Suma `pfs_food_generated_per_day` y `pfs_water_generated_per_day` de las profesiones de todas las personas que **pueden trabajar**:
   - `prn_is_active = true`
   - `prn_is_accepted = true`
   - Sin condición de salud (`id_person_health = null`) **O** condición con `phs_can_work = true`

4. **Calcula raciones** — Multiplica el conteo de **todas** las personas activas y aceptadas por la ración configurada por persona.

5. **Ejecuta en una sola transacción:**
   - Agrega producción de comida a `storage` (crea el registro si no existe)
   - Agrega producción de agua a `storage`
   - Descuenta raciones de comida de `storage`
   - Descuenta raciones de agua de `storage`
   - Crea registros en `storage_records` por cada cambio
   - Crea movimientos en `resources_movements` con tipos `daily_production` y `ration`
   - Crea un evento en `events` con el resumen del proceso

6. **Retorna resumen** con:
   - Cantidad de personas que trabajaron vs total de personas
   - Producción de comida y agua (cantidad producida + nuevo stock)
   - Raciones de comida y agua (cantidad consumida + nuevo stock + alerta si quedó bajo el mínimo)

---

### `POST /production-corrections`

Permite registrar una corrección de producción cuando una persona no puede cumplir con su cuota diaria (por ejemplo, estuvo fuera, enfermó a mitad del día, etc.).

**Body:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `campId` | number (opcional) | Campamento (por defecto el del usuario autenticado) |
| `personId` | number | ID de la persona |
| `resourceId` | number | ID del recurso a corregir (comida o agua) |
| `quantityDelta` | number | Delta a aplicar (positivo = más producción, negativo = menos) |
| `reason` | string | Motivo de la corrección |

La corrección crea un movimiento en `resources_movements` con:
- `rsm_type = "adjustment"`
- `rsm_reference_type = "person"`
- `id_person` asociado

Y registra el cambio en `storage_records` y `events`.

---

## Prerequisitos

Antes de poder ejecutar el proceso diario, un **Administrador sistema** debe configurar los 4 settings requeridos via `PATCH /api/v1/settings/:key`.

---

## Roles

| Acción | Roles permitidos |
|--------|-----------------|
| Ejecutar proceso diario | Administrador sistema, Gestión recursos |
| Aplicar corrección de producción | Administrador sistema, Gestión recursos |

---

## Pendiente

- Endpoint `GET /api/v1/daily-processes/status/:campId` para consultar si el proceso ya corrió hoy.
- Automatización vía cron del servidor (actualmente se dispara manualmente).
