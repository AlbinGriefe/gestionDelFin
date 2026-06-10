# gestionDelFin

Sistema de gestion de campamentos con ambientacion de supervivencia. El
repositorio es un monorepo con frontend React, backend Express, Prisma, MySQL y
documentacion tecnica.

## Estructura

```text
apps/
  frontend/   Aplicacion React + Vite
  backend/    API, Prisma, migraciones y seed
database/     Diagramas y referencias
docs/         Documentacion funcional y tecnica
infra/        Infraestructura
tests/        Notas y pruebas generales
```

## Requisitos

- Node.js 20 o superior.
- npm.
- Docker Desktop para el MySQL local, o una instancia MySQL compatible.

## Puesta en marcha

### 1. Dependencias

Desde la raiz:

```powershell
npm ci
```

Usar `npm install` solo cuando se cambien dependencias y sea necesario
regenerar `package-lock.json`.

### 2. Variables de entorno

```powershell
copy .env.example .env
copy apps\backend\.env.example apps\backend\.env
copy apps\frontend\.env.example apps\frontend\.env
```

Las contrasenas de los usuarios de prueba se configuran mediante las variables
`SEED_*` de `apps/backend/.env`.

Para ejecutar sin instalar Ollama:

```env
AI_PROVIDER=rules
```

Para intentar Qwen mediante Ollama y conservar reglas como fallback:

```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b
```

### 3. Base de datos

```powershell
npm run db:up
```

Credenciales locales predeterminadas:

| Campo    | Valor           |
| -------- | --------------- |
| Host     | `localhost`     |
| Puerto   | `3306`          |
| Base     | `apocalypse_db` |
| Usuario  | `app_user`      |
| Password | `app_password`  |

La base existente debe respaldarse antes de aplicar la migracion ubicada en:

```text
apps/backend/prisma/prisma/migrations/
  20260608120000_text_ai_assignments/migration.sql
```

La migracion elimina las columnas visuales antiguas de personas. Primero debe
probarse sobre una copia de la base.

### 4. Prisma y seed

```powershell
npm run backend:prisma:validate
npm run backend:prisma:generate
npm run backend:seed
```

El seed crea:

- dos campamentos;
- cuatro roles y cuatro cuentas de prueba;
- siete oficios operativos;
- diez perfiles textuales;
- estados de salud y estadisticas;
- recursos e inventario inicial;
- reglas operativas por campamento.

Usuarios:

| Usuario      | Variable de password       | Rol                                |
| ------------ | -------------------------- | ---------------------------------- |
| `admin`      | `SEED_ADMIN_PASSWORD`      | administrador sistema              |
| `gestion`    | `SEED_GESTION_PASSWORD`    | gestion recursos                   |
| `viajes`     | `SEED_VIAJES_PASSWORD`     | encargado de viajes y comunicacion |
| `trabajador` | `SEED_TRABAJADOR_PASSWORD` | trabajador                         |

### 5. Desarrollo

```powershell
npm run backend:dev
npm run frontend:dev
```

- Backend: `http://localhost:3001`
- Frontend: `http://localhost:5173`
- API: `http://localhost:3001/api/v1`

## Scripts utiles

```powershell
npm run db:up
npm run db:down
npm run db:logs

npm run backend:dev
npm run backend:typecheck
npm run backend:build
npm run backend:test
npm run backend:prisma:validate
npm run backend:prisma:generate
npm run backend:seed

npm run frontend:dev
npm run frontend:build
npm run verify:build
npm run audit:prod
```

## Verificacion

```powershell
npm run backend:prisma:validate
npm run backend:typecheck
npm run backend:build
npm run backend:test
npm run frontend:build
npm run lint -w @gestiondelfin/frontend
```

Con el backend iniciado:

```powershell
curl http://localhost:3001/api/v1/health
curl http://localhost:3001/api/v1/auth/session-config
curl http://localhost:3001/api/v1/admission-evaluations/health
```

## IA textual

La IA no analiza imagenes. Tiene dos flujos independientes:

1. evaluacion de admision;
2. recomendacion de oficio posterior a la admision.

Las respuestas incluyen confianza y razones, y requieren confirmacion humana.
Si Ollama no esta disponible, el backend utiliza reglas deterministas.

## Colaboracion

- No versionar `node_modules`, `.env` ni salidas de build.
- Ejecutar dependencias desde la raiz del monorepo.
- Revisar cambios de `package-lock.json`.
- Antes de subir, ejecutar `git status`, builds y pruebas.

Documentacion:

- `ReporteEstadoActualProyecto.md`
- `docs/api/endpoints.md`
- `docs/architecture/backend.md`
- `docs/business-rules/ai-decisions.md`
- `docs/operations/functional-review.md`
