# Reporte de estado actual del proyecto

Fecha de cierre: 2026-06-08

## 1. Resumen ejecutivo

La asignacion definida en `AsignacionesTrasAnalisis.md` ya fue aplicada en la
capa backend y persistencia. El proyecto dejo de depender de imagenes para IA:
ahora registra personas pendientes con descripcion textual y estadisticas,
evalua admision, recomienda oficio y exige confirmacion humana.

El backend puede funcionar sin instalar Ollama. Para un despliegue cloud sin
modelo local se debe usar:

```env
AI_PROVIDER=rules
```

Si se mantiene `AI_PROVIDER=ollama`, el sistema intenta Qwen y usa reglas cuando
Ollama falla. En una URL que tarde en responder, la peticion puede esperar hasta
`AI_TIMEOUT_MS`, por lo que `rules` es la configuracion recomendada mientras no
se contrate un proveedor cloud.

La fase no incluye pantallas nuevas. El frontend conserva las pantallas
existentes, pero sus tipos y clientes fueron ajustados para compilar con los
contratos nuevos.

## 2. Matriz de cumplimiento

| Asignacion | Estado anterior | Resultado implementado | Pendiente |
| --- | --- | --- | --- |
| Retirar IA visual | Fotos, identificacion y provider de vision | Campos y rutas visuales retirados; legado `ai_evaluations` solo se conserva en base | Aplicar migracion en una copia respaldada |
| IA textual | No existia flujo textual utilizable | Contrato `TextAiProvider`, Ollama Qwen y fallback determinista | Elegir proveedor cloud solo si se necesita |
| Admision formal | Booleano modificable por CRUD | Estados `pending`, `under_review`, `observe`, `accepted`, `rejected` | Pantalla de revision |
| Permisos | Cualquier autenticado podia modificar personas | Alta, edicion, admision y oficio limitados a `Administrador sistema` | Mostrar permisos en UI |
| Perfil de persona | Sin descripcion operativa | Descripcion editable y seleccion aleatoria entre 10 plantillas | Formulario frontend |
| Estadisticas | No existian | Salud, Salud maxima, Fuerza, Saciedad, Hidratacion, Suerte y Nivel | Visualizacion frontend |
| Progresion | No existia | +1 por actividad compatible exitosa, tope 31/50 e idempotencia por referencia | Historial visual |
| Oficio pendiente | Obligatorio al registrar | Nullable hasta admision; recomendacion separada y corregible | Pantalla para confirmar |
| Reglas por campamento | Valores dispersos | Admision y probabilidades configurables por campamento | Editor frontend |
| Produccion diaria | Solo valores directos por oficio | Agricultor/Cazador +8 comida, Cientifico +8 agua y penalizacion -6 incompatible | Catalogos editables en UI |
| Asignaciones diarias | Automaticas implicitas | Asignaciones explicitas o automaticas, compatibilidad y resultado guardado | Pantalla de asignacion |
| Raciones | Podian dejar stock negativo | Consumo limitado al stock y evento de escasez por faltante | Regla de reparto por persona |
| Enfermedad | Sin evento automatico | Tirada cuando Salud/Salud maxima cae bajo el umbral | UI de alertas |
| Curacion | No existia | Medico consume 3 de comida, cura 5 y elimina Enfermo | Pantalla de accion medica |
| Expediciones | Resultado manual y sin zonas | Zonas, suerte, recursos valiosos, bonus de Explorador/Cazador y estado fallido | Mapa interactivo |
| Traslados | Sin probabilidad fallida | Suerte, bonus Diplomatico, capacidad destino y estado `failed` | Presentar calculo en UI |
| Eventos narrativos | Mezclados conceptualmente con auditoria | Tabla y API separadas para enfermedad, escasez, ataque, recursos y perdida | Pantalla de eventos |
| Seed | Incompleto para el nuevo dominio | 7 oficios, 10 perfiles, estados de salud y reglas iniciales | Ejecutarlo tras migrar |
| Pruebas | No habia suite real | Vitest/Supertest con 20 casos | Integracion E2E con MySQL |

## 3. Personas y admision

### 3.1 Registro

`POST /api/v1/persons` crea una persona:

- activa;
- sin oficio;
- con estado `pending`;
- con descripcion recibida o una plantilla aleatoria;
- con estadisticas aleatorias entre 0 y 10;
- con nivel 1.

Las fotografias y documentos visuales ya no forman parte del contrato.
`isAccepted` se conserva en las respuestas como valor calculado para no romper
consumidores existentes.

### 3.2 Evaluacion de admision

Flujo implementado:

1. El administrador registra la persona.
2. `POST /api/v1/admission-evaluations` envia descripcion, estadisticas,
   capacidad y reglas al provider.
3. El provider devuelve `accept`, `observe` o `reject`, confianza y razones.
4. La persona queda `under_review`.
5. `PATCH /api/v1/admission-evaluations/:id/confirm` confirma o corrige.
6. La capacidad vuelve a validarse antes de aceptar.

La evaluacion no detecta zombies. El concepto zombie queda limitado a la
ambientacion y a eventos narrativos como ataques durante misiones.

### 3.3 Recomendacion de oficio

Solo una persona aceptada puede evaluarse mediante:

```text
POST /api/v1/profession-recommendations
PATCH /api/v1/profession-recommendations/:id/confirm
```

La respuesta guarda oficio recomendado, confianza, razones, alternativas,
provider, modelo y entrada utilizada. El administrador puede aceptar o elegir
otro oficio valido.

## 4. Estadisticas y progresion

| Dato | Inicial | Maximo |
| --- | ---: | ---: |
| Salud | 0-10 | 31 |
| Salud maxima | 1-10 | 31 |
| Fuerza | 0-10 | 31 |
| Saciedad | 0-10 | 31 |
| Hidratacion | 0-10 | 31 |
| Suerte | 0-10 | 31 |
| Nivel | 1 | 50 |

Una actividad compatible exitosa aumenta el nivel y todas las estadisticas en
uno. `person_progressions` usa una clave unica por persona y actividad para
evitar doble progreso por reintentos o ejecuciones forzadas.

Fuentes actuales de progreso:

- asignacion diaria compatible;
- expedicion exitosa para oficios compatibles;
- traslado exitoso para oficios compatibles;
- curacion realizada por un Medico.

## 5. Campamentos, recursos y cuidado

Cada campamento dispone de reglas para:

- admision;
- exito de expedicion, inicialmente 70%;
- exito de traslado, inicialmente 75%;
- enfermedad, inicialmente 25%;
- recursos valiosos, inicialmente 20%;
- umbral de salud para enfermedad, inicialmente 25%.

La suerte aporta hasta 10 puntos porcentuales. Toda probabilidad final se limita
al intervalo 5%-95%.

El proceso diario:

- usa asignaciones explicitas o genera asignaciones por oficio;
- produce +8 comida para Agricultor/Cazador;
- produce +8 agua para Cientifico;
- aplica hasta -6 al recurso de una tarea productiva incompatible;
- no permite inventario negativo;
- registra faltantes como escasez;
- evalua enfermedad para salud bajo el umbral.

La racion por integrante sigue en `daily_ration_per_person`. Es modificable,
pero continua siendo global y se aplica a cada recurso racionable. Configurar
una racion distinta por campamento o por recurso queda fuera de esta fase.

## 6. Expediciones, traslados y eventos

### 6.1 Expediciones

Una expedicion puede vincularse a una zona con coordenadas y riesgo. Sus
integrantes deben estar activos, aceptados y tener un oficio compatible.

Al solicitar `returned`, el backend calcula:

- probabilidad base;
- bonus promedio de suerte;
- tirada;
- probabilidad de recursos valiosos;
- +1.5 puntos por cada Explorador;
- tirada de 3.5% por Cazador para obtener 8-10 de comida.

Si la tirada principal falla, la expedicion queda `failed` y se registra ataque
zombie o perdida de viajeros.

### 6.2 Traslados

Al solicitar `delivered`, el backend calcula el exito con:

- 75% base configurable;
- hasta 10 puntos por suerte;
- +1.5 puntos por cada Diplomatico;
- limite final 5%-95%.

Un fallo cambia el traslado a `failed` y genera un evento narrativo. Un exito
vuelve a validar la capacidad destino antes de mover personas y recursos.

### 6.3 Separacion de eventos

`events` conserva acciones tecnicas y cambios de entidades.

`narrative_events` conserva:

- tipo y estado;
- probabilidad y tirada;
- fuente y referencia;
- participantes;
- recursos y efectos;
- descripcion;
- campamento y usuario.

## 7. Persistencia y migracion

Modelos nuevos:

- `profile_templates`;
- `person_stats`;
- `person_progressions`;
- `admission_evaluations`;
- `profession_recommendations`;
- `camp_operational_rules`;
- `daily_assignments`;
- `care_actions`;
- `narrative_events`;
- `exploration_zones`.

Migracion:

```text
apps/backend/prisma/prisma/migrations/
  20260608120000_text_ai_assignments/migration.sql
```

Estado real:

- Prisma encuentra una migracion pendiente.
- La base local ya existia antes de Prisma Migrate.
- La migracion elimina `prn_photo_url`,
  `prn_identification_card_url` y `prn_is_accepted`.
- No se ejecuto sobre la base local para evitar perdida de datos sin respaldo.

Procedimiento requerido:

1. respaldar o clonar la base;
2. comprobar la migracion sobre la copia;
3. aplicar `prisma migrate deploy`;
4. ejecutar `npm.cmd run backend:seed`;
5. probar los flujos con datos reales.

## 8. API nueva o modificada

```text
POST  /persons
POST  /admission-evaluations
PATCH /admission-evaluations/:id/confirm
POST  /profession-recommendations
PATCH /profession-recommendations/:id/confirm
PUT   /camps/:campId/operational-rules
GET   /daily-processes/assignments
PUT   /daily-processes/assignments
POST  /care-actions/heal
GET   /narrative-events
GET   /narrative-events/:id
GET   /exploration-zones
GET   /exploration-zones/:id
POST  /exploration-zones
PATCH /exploration-zones/:id
```

Las rutas usan el prefijo `/api/v1`.

## 9. Pruebas y verificaciones

Comandos ejecutados:

```text
npm.cmd run backend:prisma:validate     -> correcto
npm.cmd run backend:prisma:generate     -> correcto
npm.cmd run backend:typecheck           -> correcto
npm.cmd run backend:build               -> correcto
npm.cmd run frontend:build              -> correcto
npm.cmd test -w @gestiondelfin/backend  -> 5 archivos, 20 pruebas correctas
npm.cmd run audit:prod                  -> 15 vulnerabilidades detectadas
```

Las pruebas cubren:

- generacion aleatoria 0-10;
- limites 31/50;
- idempotencia de progresion;
- formulas y limites de probabilidad;
- recompensas 8-10;
- las 10 descripciones y su oficio esperado;
- rechazo por capacidad;
- fallback cuando el provider principal falla;
- contrato HTTP de persona sin campos visuales.

No se ejecutaron pruebas transaccionales contra MySQL migrado. Docker no pudo
consultarse desde esta sesion por permisos del motor local.

## 10. Pendientes reales

### Backend y operacion

- aplicar y validar la migracion en una copia de MySQL;
- ejecutar seed;
- agregar pruebas integradas con base real;
- definir scheduler para el proceso diario;
- decidir si las raciones de expedicion deben descontarse al salir;
- evaluar raciones por campamento/recurso;
- revisar las 15 vulnerabilidades reportadas por `npm audit` (11 altas y 4
  moderadas) antes de
  produccion;
- seleccionar un proveedor cloud solo si el fallback local no es suficiente.

### Frontend

- formulario y listado de personas;
- revision de admision;
- recomendacion y correccion de oficio;
- estadisticas y progresion;
- reglas operativas;
- asignaciones diarias;
- curacion;
- eventos narrativos;
- zonas y mapa;
- contador visible de inactividad;
- pantalla narrativa `Play`.

## 11. Conclusion

La propuesta de `AsignacionesTrasAnalisis.md` es viable y ya tiene una base
backend funcional. La aplicacion puede desplegarse sin instalar modelos si se
configura `AI_PROVIDER=rules`; Ollama Qwen queda como mejora opcional, no como
dependencia de disponibilidad.

El siguiente riesgo no es la arquitectura de IA, sino aplicar la migracion sobre
datos reales y construir las pantallas que permitan operar los flujos nuevos.
