# Modelo de Datos — gestionDelFin

Base de datos MySQL gestionada con Prisma ORM. El esquema completo vive en `apps/backend/prisma/prisma/schema.prisma`.

---

## Diagrama de entidades principales

```
┌──────────┐         ┌──────────────┐         ┌──────────────┐
│  camps   │────────►│   persons    │◄────────│  professions │
│          │  1:N    │              │  N:1    │              │
└────┬─────┘         └──────┬───────┘         └──────────────┘
     │                      │
     │ 1:N                  │ 1:1
     │               ┌──────▼──────┐
     │               │ person_stats│
     │               └─────────────┘
     │
     │ 1:N                         1:N
┌────▼─────────────┐         ┌──────────────────┐
│    expeditions   │────────►│ expedition_records│
│                  │  1:N    │                  │
└────┬─────────────┘         └──────────────────┘
     │ N:1
┌────▼──────────────┐
│ exploration_zones │
└───────────────────┘

┌──────────┐  1:N  ┌──────────┐  1:N  ┌───────────────────────────┐
│  camps   │──────►│ storage  │       │ application_admission_     │
│          │       │          │       │ resources / person         │
└──────────┘       └────┬─────┘       └───────────────────────────┘
                        │ N:1                      ▲
                   ┌────▼─────┐              ┌─────┴────┐
                   │resources │              │transfers │
                   └──────────┘              └──────────┘
```

---

## Tablas y campos relevantes

### `camps` — Campamentos

| Campo                      | Tipo          | Descripción                      |
| -------------------------- | ------------- | -------------------------------- | --------- | --------- | --------- |
| `id_camp`                  | INT PK        | Identificador                    |
| `cmp_name`                 | VARCHAR(150)  | Nombre único                     |
| `cmp_location`             | VARCHAR(255)  | Descripción textual de ubicación |
| `cmp_latitude / longitude` | DECIMAL(10,7) | Coordenadas GPS (opcionales)     |
| `cmp_max_capacity`         | INT           | Máximo de personas admitidas     |
| `cmp_status`               | ENUM          | `active                          | destroyed | abandoned | inactive` |

### `persons` — Personas

| Campo                     | Tipo               | Descripción                            |
| ------------------------- | ------------------ | -------------------------------------- | ------------ | ------- | -------- | --------- |
| `id_person`               | INT PK             | Identificador                          |
| `id_camp`                 | INT FK             | Campamento de residencia               |
| `id_profession`           | INT FK             | Profesión asignada (null = sin oficio) |
| `id_person_health`        | INT FK             | Estado de salud actual                 |
| `prn_name / prn_lastname` | VARCHAR            | Nombre completo                        |
| `prn_identifier`          | VARCHAR(40) UNIQUE | Código único externo                   |
| `prn_profile_description` | TEXT               | Texto libre para evaluación IA         |
| `prn_admission_status`    | ENUM               | `pending                               | under_review | observe | accepted | rejected` |

### `person_stats` — Estadísticas RPG

Tabla 1:1 con `persons`. Todos los valores máximos son 31 (constante `PERSON_STAT_MAX`).

| Campo            | Descripción                |
| ---------------- | -------------------------- |
| `pst_health`     | Puntos de vida actuales    |
| `pst_max_health` | Vida máxima                |
| `pst_strength`   | Fuerza (afecta producción) |
| `pst_satiety`    | Saciedad                   |
| `pst_hydration`  | Hidratación                |
| `pst_luck`       | Suerte (bonus en misiones) |
| `pst_level`      | Nivel 1–50                 |

### `professions` — Profesiones

| Campo                         | Descripción                                |
| ----------------------------- | ------------------------------------------ |
| `pfs_food_generated_per_day`  | Comida producida diariamente               |
| `pfs_water_generated_per_day` | Agua producida diariamente                 |
| `pfs_can_expedition`          | ¿Puede participar en expediciones?         |
| `pfs_can_transfer`            | ¿Puede ser transferido?                    |
| `pfs_valuable_bonus_pp`       | Bonus en probabilidad de recursos valiosos |
| `pfs_transfer_bonus_pp`       | Bonus en probabilidad de transferencia     |
| `pfs_healing_food_cost`       | Costo en comida de atención médica         |
| `pfs_healing_amount`          | Puntos de salud restaurados                |

### `expeditions` — Expediciones

| Campo                           | Tipo     | Descripción                     |
| ------------------------------- | -------- | ------------------------------- | ----------- | -------- | ------ | ---------- |
| `exs_leaving_date`              | DATETIME | Fecha de salida                 |
| `exs_estimated_days`            | INT      | Días previstos                  |
| `exe_state`                     | ENUM     | `planned                        | in_progress | returned | failed | cancelled` |
| `exe_resources_used / returned` | DECIMAL  | Recursos consumidos y devueltos |

### `transfers` — Transferencias entre campamentos

Un transfer puede ser de tipo `resources | people | mixed`. El flujo de estados es:

```
pending → accepted → scheduled → in_transit → delivered → completed
                └→ declined
                                               └→ returned
                                               └→ failed
```

Cuatro usuarios pueden firmar: solicitante, aceptante, aprobador origen, aprobador destino.

### `storage` — Inventario por campamento

| Campo              | Descripción                   |
| ------------------ | ----------------------------- |
| `stg_quantity`     | Stock actual                  |
| `stg_min_quantity` | Umbral de alerta (stock bajo) |
| `stg_max_quantity` | Capacidad máxima (opcional)   |

### `ai_evaluations` — Evaluaciones IA (modelo anterior)

Almacena el resultado histórico del modelo anterior de evaluación IA. Desplazado por `admission_evaluations` en el modelo actual.

### `admission_evaluations` — Evaluaciones de admisión IA

| Campo                | Descripción                          |
| -------------------- | ------------------------------------ | ------- | ------- |
| `ade_provider`       | `ollama` o `rules-fallback`          |
| `ade_model_name`     | Nombre del modelo LLM utilizado      |
| `ade_confidence`     | Confianza 0.0–1.0                    |
| `ade_decision`       | `accept                              | observe | reject` |
| `ade_reasons`        | JSON con array de razones            |
| `ade_input_snapshot` | Snapshot del input enviado al modelo |
| `ade_raw_response`   | Respuesta cruda del LLM              |
| `ade_user_decision`  | Decisión final del operador humano   |
| `ade_is_final`       | true = decisión cerrada              |

### `profession_recommendations` — Recomendaciones de oficio IA

Similar a `admission_evaluations`. Incluye campo `pfr_alternatives` (JSON array) con profesiones alternativas y sus justificaciones.

### `narrative_events` — Eventos narrativos

| Campo              | Tipo    | Descripción                      |
| ------------------ | ------- | -------------------------------- | -------- | ------------- | ------------------ | -------------- |
| `nre_type`         | ENUM    | `disease                         | scarcity | zombie_attack | valuable_resources | traveler_loss` |
| `nre_status`       | ENUM    | `generated                       | applied  | resolved`     |
| `nre_probability`  | DECIMAL | Probabilidad de ocurrencia usada |
| `nre_roll`         | DECIMAL | Número aleatorio generado        |
| `nre_participants` | JSON    | Personas afectadas               |
| `nre_effects`      | JSON    | Efectos aplicados                |

### `daily_assignments` — Asignaciones diarias

Única por `(id_person, das_date)`. El campo `das_task` determina qué produce la persona ese día: `food_production | water_production | camp_support`.

### `person_progressions` — Historial de subidas de nivel

Registra cada avance de nivel con snapshot antes/después de stats. Único por `(id_person, ppg_reference_key)` para evitar duplicados.

---

## Enums clave

| Enum                                  | Valores                                                                                                     |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `persons_prn_admission_status`        | `pending, under_review, observe, accepted, rejected`                                                        |
| `expeditions_exe_state`               | `planned, in_progress, returned, failed, cancelled`                                                         |
| `transfers_tfs_state`                 | `pending, accepted, declined, scheduled, in_transit, delivered, returned, completed, cancelled, failed`     |
| `resources_movements_rsm_type`        | `entry, adjustment, daily_production, expedition_out, expedition_return, transfer_out, transfer_in, ration` |
| `narrative_events_nre_type`           | `disease, scarcity, zombie_attack, valuable_resources, traveler_loss`                                       |
| `daily_assignments_das_task`          | `food_production, water_production, camp_support`                                                           |
| `person_progressions_ppg_source_type` | `daily_assignment, expedition, transfer, care`                                                              |

---

## Reglas de integridad

- **Cascade delete**: cuando se elimina una `person`, se eliminan en cascada sus `ai_evaluations`, `person_health_records`, `person_records`, `person_progressions`, `person_stats`, `expedition_records`.
- **Cascade delete camp**: cuando se elimina un `camp`, se eliminan `storage`, `narrative_events`, `exploration_zones`, `daily_assignments`, `care_actions`.
- Los usuarios no se eliminan en cascada desde `persons`; si la persona se elimina, el campo `id_person` del usuario queda en null.
