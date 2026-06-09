# Backend

## Decisiones base

- API REST versionada bajo `/api/v1`.
- Express como servidor HTTP.
- Prisma y MySQL como persistencia.
- JWT y sesiones persistidas para autenticacion.
- Hora del servidor para procesos diarios y vencimiento de sesiones.
- Auditoria tecnica en `events`.
- Eventos del dominio en `narrative_events`.

## Modulos principales

- `persons`: registro pendiente, perfil textual, estadisticas e historial.
- `admission-evaluations`: recomendacion de ingreso y confirmacion humana.
- `profession-recommendations`: recomendacion de oficio posterior a la admision.
- `text-ai`: contrato desacoplado, Ollama Qwen opcional y fallback por reglas.
- `camps`: capacidad, metricas y reglas operativas configurables.
- `daily-processes`: asignaciones, produccion, penalizaciones, raciones y enfermedad.
- `care-actions`: curacion medica con consumo de comida.
- `expeditions`: zonas, probabilidad de exito, recursos y progresion.
- `transfers`: envios, probabilidad de exito, capacidad y progresion.
- `narrative-events`: consulta de consecuencias operativas.
- `events`: auditoria transversal.

## IA y degradacion

El backend no necesita Ollama para arrancar ni para completar los flujos. Si
`AI_PROVIDER=ollama` y Ollama no responde, `ResilientTextProvider` utiliza
`RulesFallbackProvider`. Tambien puede configurarse `AI_PROVIDER=rules` para no
intentar ninguna conexion externa.

La IA no escribe una decision final:

1. genera una evaluacion o recomendacion;
2. guarda proveedor, confianza, razones y entrada;
3. un administrador confirma o corrige;
4. la decision humana modifica admision u oficio.

Las filas antiguas de `ai_evaluations` se conservan como legado de auditoria,
pero el backend ya no ejecuta evaluaciones visuales.

## Persistencia

El esquema incorpora estadisticas, progresion idempotente, plantillas de perfil,
evaluaciones, recomendaciones, reglas de campamento, asignaciones, curaciones,
eventos narrativos y zonas.

La migracion SQL esta en:

`apps/backend/prisma/prisma/migrations/20260608120000_text_ai_assignments/migration.sql`

Debe respaldarse y baselinearse la base existente antes de ejecutar
`prisma migrate deploy`, porque la migracion elimina las columnas visuales de
`persons`.

## Pendientes

- aplicar y probar la migracion sobre una copia de MySQL;
- pruebas integradas con base real;
- proveedor cloud opcional;
- scheduler externo para ejecutar el proceso diario;
- pantallas frontend de los nuevos modulos.
