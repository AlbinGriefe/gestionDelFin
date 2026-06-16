# Despliegue en Render, Aiven y Vercel

Stack en capas gratuitas:

- Base de datos MySQL en Aiven.
- API (Express) en Render.
- Frontend (Vite) en Vercel.

El orden importa por la dependencia cruzada: la API necesita la URL del
frontend para CORS y el frontend necesita la URL de la API.

## 1. Aiven: MySQL

1. Crea un servicio MySQL en el plan gratuito.
2. Toma los datos de conexion: host, puerto, usuario, password y base.
3. Aiven exige TLS. Arma el `DATABASE_URL` con SSL:

```text
mysql://USUARIO:PASSWORD@HOST:PUERTO/BASE?ssl-mode=REQUIRED
```

Si el adapter pide el certificado de la autoridad, descarga el CA de Aiven y
referencia su ruta con `sslcert`/`sslca` segun lo solicite el driver.

## 2. Render: API

El repositorio incluye `render.yaml` (Blueprint) con build, migracion y arranque.

- Build: `npm ci && npm run backend:prisma:generate && npm run backend:build`
- Start: `npm run backend:prisma:migrate:deploy && npm run backend:start`
- Healthcheck: `/api/v1/health`

La migracion corre en el arranque porque es idempotente; no se depende de un
comando pre-deploy.

Pasos:

1. New > Web Service > conecta el repositorio (rama `main`).
2. Render detecta `render.yaml`. Plan: Free.
3. Configura las variables marcadas como `sync: false`:

```text
DATABASE_URL=<Aiven MySQL con SSL>
JWT_SECRET=<secreto largo>
CRON_SECRET=<secreto largo>
CORS_ORIGIN=*           # temporal, se cierra en el paso 5
```

`NODE_ENV`, `API_PREFIX`, `AI_PROVIDER` y `DATABASE_SSL` ya vienen en
`render.yaml`. `PORT` lo provee Render automaticamente.

4. Despliega y verifica `https://<api>.onrender.com/api/v1/health`.

Nota: el plan Free de Render suspende el servicio tras inactividad; el primer
request luego de dormir tarda unos segundos.

## 3. Seed de demostracion (una sola vez)

Desde la consola/Shell del servicio en Render, con las seis variables
`SEED_*_PASSWORD` definidas:

```text
npm run backend:seed
```

No ejecutar la seed en cada arranque.

## 4. Vercel: frontend

- Framework: Vite
- Root Directory: `apps/frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Variable: `VITE_API_URL=https://<api>.onrender.com/api/v1`

Agrega una regla de fallback para que las rutas de React entreguen `index.html`.

## 5. Cerrar CORS

En Render, ajusta `CORS_ORIGIN=https://<frontend>.vercel.app` y vuelve a
desplegar.

## 6. Proceso diario (cron)

Render Cron como servicio aparte puede no estar en el plan free. Alternativa
gratuita: un cron externo (por ejemplo cron-job.org) que llame a diario:

```text
POST https://<api>.onrender.com/api/v1/daily-processes/cron/run
X-Cron-Secret: <CRON_SECRET>
```

El proceso es idempotente por campamento y fecha. La ejecucion manual permanece
disponible para Gestion de recursos.

## 7. Verificacion publica

1. Abre `/api/v1/health`.
2. Inicia sesion con cada rol.
3. Cambia de campamento con `admin`.
4. Ejecuta `E2E_BASE_URL=https://<frontend>.vercel.app npm run test:e2e`.
5. Confirma que CORS solo permita la URL final de Vercel.
