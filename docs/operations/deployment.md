# Despliegue en Render, Aiven y Vercel

## Render: API

El repositorio incluye `render.yaml` para crear el backend como Blueprint.
Render debe leerlo desde la raiz del repo.

Variables solicitadas por el Blueprint:

```text
DATABASE_URL=<Aiven MySQL URL>
JWT_SECRET=<secreto largo>
CRON_SECRET=<secreto largo>
CORS_ORIGIN=*
```

Para Aiven, usa la URL de MySQL con TLS. Si Aiven entrega un certificado que no
puede validarse desde Render, `?sslaccept=accept_invalid_certs` funciona para
Prisma y el backend lo traduce al modo TLS compatible con `mariadb`.

El Blueprint configura:

- Build: `npm ci && npm run backend:prisma:generate && npm run backend:build`
- Pre-deploy: `npm run backend:prisma:migrate:deploy`
- Start: `npm run backend:start`
- Healthcheck: `/api/v1/health`

No ejecutes la seed automaticamente en cada arranque. La seed de demostracion se
ejecuta manualmente una sola vez con las seis variables `SEED_*_PASSWORD`.

## Vercel: frontend

- Framework: Vite
- Root Directory: `apps/frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Variable: `VITE_API_URL=https://<api-render>.onrender.com/api/v1`

Agrega una regla de fallback para que las rutas de React entreguen `index.html`;
el repo ya la incluye en `apps/frontend/vercel.json`.

## Cierre de CORS

Tras desplegar Vercel:

1. Copia la URL final del frontend.
2. En Render, cambia `CORS_ORIGIN` de `*` a esa URL exacta.
3. Redepliega la API.

## Proceso diario

Configura una llamada diaria desde Render Cron, cron-job.org o un servicio
equivalente:

```text
POST https://<api-render>.onrender.com/api/v1/daily-processes/cron/run
X-Cron-Secret: <CRON_SECRET>
```

El proceso es idempotente por campamento y fecha. La ejecucion manual permanece
disponible para Gestion de recursos.

## Verificacion publica

1. Abre `/api/v1/health`.
2. Inicia sesion con cada rol.
3. Cambia de campamento con `admin`.
4. Ejecuta `E2E_BASE_URL=https://<frontend>.vercel.app npm run test:e2e`.
5. Confirma que CORS solo permita la URL final de Vercel.

## Railway: alternativa anterior

### Railway: MySQL

1. Crea un servicio MySQL.
2. Copia su URL privada en `DATABASE_URL` del servicio backend.
3. No ejecutes la seed automaticamente en cada arranque.

### Railway: API

Directorio raiz del repositorio:

- Build: `npm ci && npm run backend:prisma:generate && npm run backend:build`
- Pre-deploy: `npm run backend:prisma:migrate:deploy`
- Start: `npm run backend:start`
- Healthcheck: `/api/v1/health`

Variables minimas:

```text
NODE_ENV=production
PORT=<provisto por Railway>
API_PREFIX=/api/v1
DATABASE_URL=<Railway MySQL>
JWT_SECRET=<secreto largo>
CRON_SECRET=<secreto largo>
CORS_ORIGIN=https://<frontend>.vercel.app
AI_PROVIDER=rules
```

La seed de demostracion se ejecuta manualmente una sola vez con las seis
variables `SEED_*_PASSWORD`.

### Railway Cron

Configura una llamada diaria:

```text
POST https://<api>.railway.app/api/v1/daily-processes/cron/run
X-Cron-Secret: <CRON_SECRET>
```

El proceso es idempotente por campamento y fecha. La ejecucion manual permanece
disponible para Gestion de recursos.
