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
- Docker Desktop (para MySQL local)

## Puesta en marcha

### 0. Instalar dependencias

Desde la raiz del proyecto:

```powershell
npm install
```

### 1. Variables de entorno

```powershell
# Raiz del proyecto
copy .env.example .env

# Backend
copy apps\backend\.env.example apps\backend\.env
```

Los valores por defecto del `.env.example` funcionan para desarrollo local sin modificaciones.

### 2. Base de datos

```powershell
npm run db:up
```

Esto levanta un contenedor MySQL 8 con estas credenciales:

| Campo    | Valor           |
|----------|-----------------|
| Host     | `localhost`     |
| Puerto   | `3306`          |
| Base     | `apocalypse_db` |
| Usuario  | `app_user`      |
| Password | `app_password`  |

### 3. Backend — migrar y cargar seed

```powershell
npm run backend:prisma:generate
npm run backend:seed
npm run backend:dev
```

El seed crea dos campamentos, cuatro roles y los siguientes usuarios de prueba:

| Usuario      | Contraseña       | Rol                            | Campamento   |
|--------------|------------------|--------------------------------|--------------|
| `admin`      | `Admin1234`      | Administrador sistema          | Base Alpha   |
| `gestion`    | `Gestion1234`    | Gestion recursos               | Base Alpha   |
| `viajes`     | `Viajes1234`     | Encargado de viajes            | Base Alpha   |
| `trabajador` | `Trabajador1234` | Trabajador                     | Base Alpha   |

> Las contrasenas del seed estan en `apps/backend/.env` como variables `SEED_*` para que cada uno pueda cambiarlas sin tocar el codigo.

### 4. Frontend

```powershell
npm run frontend:dev
```

La app queda disponible en `http://localhost:5173`.

---

## Criterio de organizacion del monorepo

- `apps/frontend` y `apps/backend` son las unicas aplicaciones.
- `database`, `docs`, `infra` y `tests` son carpetas de apoyo, no apps separadas.
- Las dependencias se instalan **solo desde la raiz** del proyecto con `npm install`.
- No versionar `node_modules`, archivos `.env`, ni artefactos de build.

---

## Scripts utiles desde la raiz

```powershell
npm run db:up                    # Levantar MySQL en Docker
npm run db:down                  # Apagar el contenedor
npm run db:logs                  # Ver logs de MySQL

npm run backend:dev              # Backend en modo desarrollo (puerto 3001)
npm run backend:build            # Compilar backend
npm run backend:typecheck        # Verificar tipos TypeScript
npm run backend:prisma:generate  # Generar cliente Prisma
npm run backend:prisma:sync      # Sincronizar schema desde la BD
npm run backend:seed             # Cargar datos iniciales

npm run frontend:dev             # Frontend en modo desarrollo (puerto 5173)
npm run frontend:build           # Compilar frontend
```

---

## Prisma

```powershell
cd apps/backend
npm run prisma:validate   # Validar schema
npm run prisma:pull       # Traer cambios desde la BD
npm run prisma:format     # Formatear schema
npm run prisma:generate   # Generar cliente
npm run prisma:sync       # pull + format + generate en un solo paso
```

---

## Verificacion rapida

Con el backend corriendo en `http://localhost:3001`:

```powershell
curl http://localhost:3001/api/v1/health
```

Debe responder `200 OK`.

Login de prueba:

```json
POST /api/v1/auth/login
{
  "identity": "admin",
  "password": "Admin1234"
}
```

