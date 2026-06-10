# Guia de uso

## Inicio local

1. Inicia MySQL con `npm run db:up`.
2. Aplica la migracion con `npm run backend:prisma:migrate:deploy`.
3. Carga datos de demostracion con `npm run backend:seed`.
4. Inicia la API con `npm run backend:dev`.
5. Inicia el frontend con `npm run frontend:dev`.
6. Abre `http://localhost:5173`.

La API expone su healthcheck en `http://localhost:3001/api/v1/health`.

## Variables privadas de la seed

Las contrasenas nunca se guardan en Git. Deben existir en `apps/backend/.env`:

- `SEED_ADMIN_PASSWORD`
- `SEED_GESTION_ALPHA_PASSWORD`
- `SEED_VIAJES_ALPHA_PASSWORD`
- `SEED_TRABAJADOR_ALPHA_PASSWORD`
- `SEED_GESTION_BETA_PASSWORD`
- `SEED_VIAJES_BETA_PASSWORD`

Usuarios creados:

| Usuario            | Rol                                | Campamento inicial |
| ------------------ | ---------------------------------- | ------------------ |
| `admin`            | Administrador sistema              | Base Alpha         |
| `gestion_alpha`    | Gestion recursos                   | Base Alpha         |
| `viajes_alpha`     | Encargado de viajes y comunicacion | Base Alpha         |
| `trabajador_alpha` | Trabajador                         | Base Alpha         |
| `gestion_beta`     | Gestion recursos                   | Refugio Beta       |
| `viajes_beta`      | Encargado de viajes y comunicacion | Refugio Beta       |

## Recorridos principales

### Administrador

- Registra personas.
- Ejecuta y confirma la evaluacion textual de admision.
- Solicita, acepta o corrige la recomendacion de oficio.
- Revisa cobertura y realiza reasignaciones temporales.
- Gestiona campamentos, usuarios, sesiones y reglas operativas.
- Cambia de campamento activo desde la barra superior.

### Gestion de recursos

- Consulta y ajusta inventario.
- Configura minimos y maximos.
- Asigna tareas y ejecuta el proceso diario.
- Aplica curacion medica desde el flujo de una persona.
- Gestiona traslados de recursos autorizados.

### Viajes y comunicacion

- Registra zonas de exploracion.
- Crea expediciones vinculadas a una zona y asigna raciones.
- Resuelve salidas, retornos y fallos.
- Gestiona estados y aprobaciones de traslados.

### Trabajador

- Consulta el dashboard, inventario y eventos narrativos de su campamento.
- No puede modificar configuracion, personas, recursos ni viajes.

## IA

Produccion utiliza `AI_PROVIDER=rules`. Esta opcion:

- No descarga modelos.
- No requiere Ollama.
- Devuelve decisiones, confianza y razones estructuradas.
- Conserva confirmacion humana obligatoria.

Ollama permanece opcional para desarrollo. El reemplazo del analisis visual por
IA textual debe recibir aprobacion academica.

## Pruebas

- Backend: `npm run backend:test`
- Integracion MySQL: `$env:RUN_DB_INTEGRATION='true'; npm run backend:test`
- End to end: configura las variables `E2E_*_PASSWORD` y ejecuta `npm run test:e2e`
- Validacion completa: `npm run verify`
