# Reasignación Temporal de Profesiones

## Contexto

El enunciado establece que si una profesión se queda sin trabajadores activos (por enfermedad, herida, ausencia del campamento u otro motivo), el sistema debe permitir mover personas de otra profesión de forma temporal a la que quedó sin cobertura.

---

## Endpoints implementados

### `GET /professions/coverage?campId={id}`

Devuelve el estado de cobertura de todas las profesiones activas del campamento.

**Respuesta por profesión:**
```json
{
  "profession": { "id": 3, "name": "Médico", ... },
  "totalPersons": 2,
  "activeWorkers": 0,
  "outOfCamp": 1,
  "temporarilyAssigned": 0,
  "needsCoverage": true
}
```

- `activeWorkers`: personas que pueden trabajar ahora mismo en el campamento.
- `outOfCamp`: personas en expedición activa o traslado en tránsito.
- `temporarilyAssigned`: personas que llegaron de otra profesión de forma temporal.
- `needsCoverage`: `true` cuando `activeWorkers === 0`.

> Las profesiones sin ninguna persona asignada también aparecen en el listado con todos sus contadores en 0.

---

### `POST /professions/temporary-reassignment`

Mueve un grupo de personas temporalmente a una profesión que necesita cobertura.

**Body:**
```json
{
  "targetProfessionId": 3,
  "personIds": [12, 15, 18],
  "notes": "Cobertura urgente por bajas en el área médica"
}
```

**Respuesta:**
```json
{
  "reassigned": [...],
  "skipped": [...],
  "warnings": ["Target profession already has 2 active worker(s). Reassignment may not be necessary."]
}
```

**Validaciones aplicadas por persona:**
| Condición | Resultado |
|-----------|-----------|
| No pertenece al campamento del actor | `skipped` |
| `prn_is_accepted = false` o `prn_is_active = false` | `skipped` |
| Estado de salud con `phs_can_work = false` (herida/enferma) | `skipped` |
| Actualmente fuera del campamento (expedición o traslado) | `skipped` |
| Ya pertenece a la profesión destino | `skipped` |
| Pasa todas las validaciones | `reassigned` |

**Advertencia informativa:** si la profesión destino ya tiene trabajadores activos, la operación continúa pero se incluye un mensaje en `warnings`. La reasignación no se bloquea.

---

### `POST /professions/revert-reassignment`

Devuelve a las personas a su profesión original después de la emergencia.

**Body:**
```json
{
  "personIds": [12, 15, 18],
  "notes": "El médico titular se recuperó"
}
```

**Cómo funciona el revert:**
1. Busca el registro más reciente en `person_records` con tipo `profession_changed` donde `prr_new_value.is_temporary === true`.
2. Toma `prr_old_value.id_profession` como la profesión original.
3. Verifica que `person.id_profession` coincida con `prr_new_value.id_profession` — si no coincide, significa que fue movida manualmente después y va a `skipped`.
4. Verifica que la profesión original siga existiendo y esté activa.

**Validaciones adicionales en revert:**
| Condición | Resultado |
|-----------|-----------|
| Sin registro temporal previo | `skipped` |
| La profesión actual no coincide con el registro temporal | `skipped` |
| La profesión original ya no existe | `skipped` |
| La profesión original está inactiva | `skipped` |
| Todo válido | `reassigned` |

---

## Auditoría

Cada cambio genera dos registros:

- **`person_records`** (`prr_event_type = "profession_changed"`):
  - Reasignación temporal: `prr_new_value = { id_profession, is_temporary: true }`
  - Revert: `prr_new_value = { id_profession, is_temporary: false }`
  - `prr_old_value` siempre contiene la profesión anterior.

- **`events`**: registro en la tabla de auditoría general del campamento.

---

## Definición de "trabajador activo"

Una persona cuenta como trabajador activo si cumple **todas** estas condiciones:

1. `prn_is_accepted = true`
2. `prn_is_active = true`
3. Sin estado de salud asignado **o** `phs_can_work = true`
4. No está fuera del campamento (sin expedición `in_progress` con salida confirmada sin retorno, ni traslado `in_transit/scheduled` con salida confirmada)

---

## Control de acceso

Solo el rol **Administrador sistema** puede ejecutar los tres endpoints.  
Cualquier rol autenticado puede consultar `/coverage`, siempre que sea de su propio campamento (el Administrador puede consultar cualquiera).

---

## Limitación conocida

Si una persona es reasignada temporalmente dos veces consecutivas, el revert deshace únicamente el último cambio temporal. Para volver a la profesión original habría que hacer revert dos veces.
