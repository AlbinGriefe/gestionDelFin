# gestionDelFin

Proyecto colaborativo con estructura tipo monorepo para frontend, backend, base de datos, documentacion e infraestructura.

## Estructura

```text
apps/
  frontend/   Aplicacion React + Vite
  backend/    API, Prisma y configuracion del servidor
database/     Diagramas y referencias de base de datos
docs/         Documentacion funcional y tecnica
infra/        Archivos de infraestructura
tests/        Pruebas y notas de testing
```

## Requisitos

- Node.js 20 o superior
- npm
- Docker Desktop (opcional, para MySQL local)

## Puesta en marcha

### 1. Base de datos

Desde la raiz del proyecto:

```powershell
copy .env.example .env
docker compose up -d
```

### 2. Backend

```powershell
cd apps/backend
copy .env.example .env
npm install
npm run prisma:sync
```

### 3. Frontend

```powershell
cd apps/frontend
npm install
npm run dev
```

## Prisma

Los comandos de Prisma del backend estan preparados con la configuracion actual del proyecto:

```powershell
cd apps/backend
npm run prisma:validate
npm run prisma:pull
npm run prisma:format
npm run prisma:generate
npm run prisma:sync
```

## Git y colaboracion

- Este repositorio no debe versionar `node_modules`, archivos `.env`, salidas de build ni artefactos generados.
- Tener varios `.gitignore` no es un problema en un monorepo; el archivo raiz define reglas generales y los archivos internos pueden agregar reglas especificas por carpeta.
- Antes de subir cambios, conviene revisar `git status` para confirmar que solo vayan archivos fuente, documentacion y configuracion relevante.

## Scripts utiles desde la raiz

```powershell
npm run db:up
npm run install:all
npm run backend:prisma:sync
npm run frontend:dev
```
