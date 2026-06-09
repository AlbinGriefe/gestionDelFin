# Frontend

Aplicacion React + Vite del proyecto `gestionDelFin`.

## Estado actual

El frontend ya compila y tiene una base de integracion real con el backend:

- autenticacion y manejo de token
- rutas protegidas y publicas
- pagina de login
- pagina inicial autenticada
- pagina de usuarios
- capas `api`, `context` y `types` para varios modulos del dominio

Todavia no se han construido pantallas para la mayoria de esos modulos. Hoy la navegacion visible esta concentrada en:

- `/login`
- `/home`
- `/users`

## Variables de entorno

Crear `apps/frontend/.env` a partir de `apps/frontend/.env.example`.

Variable requerida:

```env
VITE_API_URL=http://localhost:3001/api/v1
```

## Scripts

Desde la raiz del monorepo:

```powershell
npm run frontend:dev
npm run frontend:build
```

Directo sobre el workspace:

```powershell
npm run dev -w @gestiondelfin/frontend
npm run build -w @gestiondelfin/frontend
```

## Verificaciones realizadas

- `npm run frontend:build`: correcto
- `npm run dev -w @gestiondelfin/frontend -- --host 127.0.0.1 --port 4173`: correcto en esta revision

Nota:

- en la revision funcional del 2026-05-27, el puerto `5173` no estuvo disponible en el entorno de prueba; Vite si pudo levantar correctamente en `4173`

## Estructura funcional actual

- `src/modules/auth`: login, sesion y proveedor global
- `src/modules/users`: listado, alta, edicion y detalle
- `src/modules/*/api|context|types`: integracion preparada para modulos aun sin pantalla
- `src/routes`: `ProtectedRoute`, `PublicRoute` y `RootRedirect`

## Limitaciones actuales

- no hay dashboard funcional todavia
- no hay pantallas para `camps`, `persons`, `inventory`, `transfers`, `expeditions`, `events`, `professions`, `sessions`, `settings` ni `daily-processes`
- el frontend depende de que el backend y la base de datos esten operativos para validar login y CRUD reales
