# Mecánicas del Sistema de Simulación — gestionDelFin

El sistema simula la gestión de un campamento de supervivencia post-apocalíptica. Esta documentación explica las reglas que gobiernan las probabilidades, el progreso de personas y los eventos narrativos.

---

## Stats de personas

Cada persona tiene 6 estadísticas numéricas, todas en rango 0–31 (`PERSON_STAT_MAX = 31`):

| Stat        | Rol en el juego                                            |
| ----------- | ---------------------------------------------------------- |
| `health`    | Puntos de vida actuales. A 0, la persona no puede trabajar |
| `maxHealth` | Vida máxima (techo de recuperación)                        |
| `strength`  | Afecta producción física y resultado de expediciones       |
| `satiety`   | Saciedad; baja si no recibe raciones                       |
| `hydration` | Hidratación; baja sin agua                                 |
| `luck`      | Bonus en probabilidades de misiones                        |
| `level`     | Nivel 1–50 (`PERSON_LEVEL_MAX = 50`)                       |

**Generación inicial**: al registrar una persona nueva, cada stat se genera aleatoriamente en 0–10 (`randomInitialStat`). Salud máxima se fija igual a salud inicial (mínimo 1).

**Subida de nivel**: cada fuente de progreso (`daily_assignment`, `expedition`, `transfer`, `care`) puede desencadenar `advanceStats`, que incrementa todos los stats en 1 punto (sin superar el máximo). El historial queda en `person_progressions`.

---

## Probabilidades de operaciones

Las expediciones y transferencias tienen una probabilidad base configurable por campamento (`camp_operational_rules`). La fórmula final es:

```
probabilidad_final = clamp(base + bonus_suerte + bonus_profesion, 5%, 95%)
```

### Bonus de suerte

```
luck_bonus = clamp(average_luck / MAX_LUCK * 10, 0, 10)
```

`MAX_LUCK = 31`. Un grupo con suerte promedio de 31 aporta el máximo de 10 puntos porcentuales.

### Bonus de profesión

Cada profesión puede tener `pfs_transfer_bonus_pp` o `pfs_valuable_bonus_pp` (puntos porcentuales adicionales).

### Resultado (roll)

```
roll = Math.random() * 100  // número de 0 a 100
éxito = roll <= probabilidad_final
```

El sistema almacena `nre_probability` y `nre_roll` en `narrative_events` para auditabilidad.

### Rango permitido

El `clampProbability` fuerza un mínimo de 5% y máximo de 95%. Ninguna operación es imposible ni garantizada —siempre hay riesgo y siempre hay esperanza.

---

## Proceso diario

El ciclo del día (disparado manualmente por un operador) ejecuta en orden:

### 1. Asignación de tareas

Cada persona activa recibe una tarea según su profesión:

- Profesiones con `pfs_food_generated_per_day > 0` → `food_production`
- Profesiones con `pfs_water_generated_per_day > 0` → `water_production`
- Resto → `camp_support`

Si una persona no puede trabajar (salud = 0 o estado de salud con `phs_can_work = false`), la asignación se marca `das_is_compatible = false` y no produce.

### 2. Producción de recursos

El sistema suma la producción de todas las personas asignadas y la registra en `storage` como movimiento de tipo `daily_production`.

### 3. Consumo de raciones

Las personas activas consumen alimentos y agua según configuración. Los movimientos quedan registrados como tipo `ration`.

### 4. Eventos narrativos

El sistema evalúa probabilidades de eventos aleatorios configuradas en `camp_operational_rules`:

| Evento               | Trigger                    | Efecto                                                      |
| -------------------- | -------------------------- | ----------------------------------------------------------- |
| `disease`            | `cor_disease_probability`  | Persona al azar pierde salud; puede adquirir estado enfermo |
| `scarcity`           | Threshold de stock bajo    | Alerta de recursos críticos                                 |
| `zombie_attack`      | Variable                   | Pérdida de salud colectiva                                  |
| `valuable_resources` | `cor_valuable_probability` | Ganancia inesperada de recursos                             |
| `traveler_loss`      | En expediciones            | Persona no regresa del campo                                |

---

## Atención médica

Un personaje con profesión médica puede aplicar `care_action` sobre un paciente:

- Costo en comida: `pfs_healing_food_cost` (descontado del inventario del campamento)
- Salud restaurada: `pfs_healing_amount` (sin superar `pst_max_health`)
- Eliminar estado de enfermedad: si `cra_removed_sick = true`

La atención médica puede otorgar progresión de nivel al paciente (`ppg_source_type = "care"`).

---

## Expediciones

Una expedición agrupa personas que salen del campamento a una zona de exploración:

1. Se planifica con fecha de salida y días estimados.
2. Al iniciarla (`in_progress`), se descuentan raciones de preparación.
3. Al retornar (`returned`), el sistema:
   - Aplica la fórmula de probabilidad de éxito.
   - Si éxito: genera movimiento `expedition_return` con recursos hallados.
   - Si falla: evento narrativo `traveler_loss`.
   - Otorga progresión de nivel a los participantes.

El nivel de riesgo de la zona (`low | medium | high | critical`) puede penalizar la probabilidad base.

---

## Transferencias

Una transferencia mueve personas y/o recursos entre dos campamentos. Requiere aprobación de ambos lados:

```
Campamento A solicita → Campamento B acepta →
  Campamento A aprueba salida → en_transit →
  Campamento B confirma llegada → completed
```

Las personas transferidas cambian su `id_camp`. Los recursos se mueven en `storage` de origen a destino mediante movimientos `transfer_out` / `transfer_in`.

---

## Evaluaciones de admisión

El flujo de admisión de nuevos integrantes:

```
Registro (pending)
  → Evaluación IA (under_review)
  → Revisión humana → accept / observe / reject
  → Si accepted: persona disponible para asignación de profesión
  → Si observe: en espera de más información
  → Si rejected: excluida del campamento
```

La IA considera: descripción libre, stats generados, capacidad disponible del campamento y reglas de admisión configuradas.

---

## Logros

Los `achievements` se otorgan a usuarios (no a personas) al cumplir criterios definidos en `avs_criteria` (JSON). El módulo de logros evalúa condiciones al completar operaciones relevantes. El otorgamiento queda en `achievement_users` con timestamp y notas.
