# Despliegue en Vercel y Railway

## Railway: MySQL

1. Crea un servicio MySQL.
2. Copia su URL privada en `DATABASE_URL` del servicio backend.
3. No ejecutes la seed automaticamente en cada arranque.

## Railway: API

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

## Railway Cron

Configura una llamada diaria:

```text
POST https://<api>.railway.app/api/v1/daily-processes/cron/run
X-Cron-Secret: <CRON_SECRET>
```

El proceso es idempotente por campamento y fecha. La ejecucion manual permanece
disponible para Gestion de recursos.

## Vercel: frontend

- Framework: Vite
- Root Directory: `apps/frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Variable: `VITE_API_URL=https://<api>.railway.app/api/v1`

Agrega una regla de fallback para que las rutas de React entreguen `index.html`.

## Verificacion publica

1. Abre `/api/v1/health`.
2. Inicia sesion con cada rol.
3. Cambia de campamento con `admin`.
4. Ejecuta `E2E_BASE_URL=https://<frontend>.vercel.app npm run test:e2e`.
5. Confirma que CORS solo permita la URL final de Vercel.
