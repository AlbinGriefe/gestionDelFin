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

### 0. Instalar dependencias del monorepo

Desde la raiz del proyecto:

```powershell
npm install
```

Ese comando resuelve los workspaces definidos en [`package.json`](C:/Users/jcaba/OneDrive/Desktop/Stuff/Cooking/Javascript/gestionDelFin/package.json). El codigo fuente real sigue viviendo en `apps/frontend` y `apps/backend`; lo que aparezca dentro de `node_modules/@gestiondelfin/*` son enlaces creados por npm para el monorepo, no carpetas duplicadas.

Convencion del equipo:

- Ejecutar `npm install` solo en la raiz del proyecto.
- Ejecutar scripts de cada app desde la raiz con los scripts `frontend:*` y `backend:*`.
- No versionar ni revisar cambios dentro de `node_modules`.

### 1. Base de datos

Desde la raiz del proyecto:

```powershell
copy .env.example .env
docker compose up -d
```

Esto levanta un contenedor MySQL 8 con estas credenciales por defecto:

- Host: `localhost`
- Port: `3306`
- Database: `apocalypse_db`
- User: `app_user`
- Password: `app_password`
- Root user: `root`
- Root password: `root`

La configuracion sale de [`.env.example`](C:/Users/jcaba/OneDrive/Desktop/Stuff/Cooking/Javascript/gestionDelFin/.env.example) y de [`docker-compose.yml`](C:/Users/jcaba/OneDrive/Desktop/Stuff/Cooking/Javascript/gestionDelFin/docker-compose.yml). Si quieren otras credenciales, cambien el archivo `.env` antes de correr `docker compose up -d`.

Importante: el `docker-compose` actual crea la base vacia, pero no importa automaticamente el modelo SQL del proyecto. Despues de levantar MySQL, hay que cargar [`Tercermodelo.sql`](C:/Users/jcaba/OneDrive/Desktop/Stuff/Cooking/MySQL/Tercermodelo.sql).

#### Conexion desde MySQL Workbench

1. Crear una conexion nueva.
2. Usar `localhost` como host.
3. Usar `3306` como puerto.
4. Usar `root` / `root` o `app_user` / `app_password`.
5. Probar la conexion y guardar.

#### Importar el modelo SQL

Opcion Workbench:

1. Abrir la conexion.
2. Ir a `Server > Data Import`.
3. Elegir `Import from Self-Contained File`.
4. Seleccionar [`Tercermodelo.sql`](C:/Users/jcaba/OneDrive/Desktop/Stuff/Cooking/MySQL/Tercermodelo.sql).
5. Ejecutar `Start Import`.

Opcion terminal:

```powershell
docker compose exec -T mysql mysql -uroot -proot apocalypse_db < "C:\Users\jcaba\OneDrive\Desktop\Stuff\Cooking\MySQL\Tercermodelo.sql"
```

Si la base ya existia y quieren reiniciarla desde cero para volver a importar el SQL:

```powershell
docker compose down -v
docker compose up -d
```

Ese paso borra el volumen de MySQL. Solo usenlo si no necesitan conservar datos.

### 2. Backend

```powershell
cd apps/backend
copy .env.example .env
npm run prisma:sync
```

Antes de iniciar la API, revisar que `apps/backend/.env` tenga al menos:

- `DATABASE_URL="mysql://app_user:app_password@localhost:3306/apocalypse_db"`
- `JWT_SECRET=una-clave-larga-y-segura`

Si la base de datos tiene usuarios con contraseñas en texto plano solo para pruebas locales, se puede usar temporalmente:

```env
ALLOW_INSECURE_PLAINTEXT_PASSWORDS=true
```

Con eso listo, pueden arrancar el backend:

```powershell
cd apps/backend
npm run dev
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
npm install
npm run db:up
npm run db:logs
npm run backend:dev
npm run backend:build
npm run backend:typecheck
npm run backend:prisma:sync
npm run frontend:dev
```

## Pruebas y verificaciones actuales

Hoy el proyecto todavia no tiene pruebas automatizadas reales con Jest, Vitest o Supertest. Lo que si se puede ejecutar para validar lo implementado es esto:

### Verificacion de Prisma

```powershell
cd apps/backend
npm run prisma:validate
npm run prisma:sync
```

### Verificacion de TypeScript y build

```powershell
cd apps/backend
npm run typecheck
npm run build
```

### Prueba manual de la API

Con el backend corriendo en `http://localhost:3001`:

```powershell
curl http://localhost:3001/api/v1/health
curl http://localhost:3001/api/v1/auth/session-config
```

Deberian responder `200 OK`.

### Prueba manual de login

El endpoint existe:

- `POST /api/v1/auth/login`

Pero el script SQL actual no inserta usuarios semilla. Antes de probar login, necesitan crear al menos:

- un registro en `roles`
- un registro en `persons`
- un registro en `users`

Body esperado:

```json
{
  "identity": "usuario_o_email",
  "password": "tu_password"
}
```
