# Repositorio y Desarrollo — gestionDelFin

## Repositorio

- **Organización GitHub**: [AlbinGriefe/gestionDelFin](https://github.com/AlbinGriefe/gestionDelFin)
- **Rama principal**: `main`
- **Tipo**: monorepo con pnpm workspaces

---

## Setup local

### Requisitos previos

- Node.js >= 20
- pnpm >= 9
- MySQL 8 accesible
- Ollama (opcional, para IA con LLM)

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/AlbinGriefe/gestionDelFin.git
cd gestionDelFin

# Instalar dependencias de todos los workspaces
pnpm install
```

### Configuración del backend

```bash
cd apps/backend
cp .env.example .env
# Editar .env con DATABASE_URL, JWT_SECRET, AI_PROVIDER, etc.

# Ejecutar migraciones
pnpm prisma migrate deploy

# (Opcional) Cargar datos de prueba
pnpm prisma db seed
```

### Configuración del frontend

```bash
cd apps/frontend
cp .env.example .env
# Editar VITE_API_URL con la URL del backend
```

### Iniciar en desarrollo

```bash
# Desde la raíz del monorepo
pnpm --filter backend dev    # Puerto 3000
pnpm --filter frontend dev   # Puerto 5173
```

---

## Estructura de branches

| Branch | Propósito |
|--------|-----------|
| `main` | Producción; protegida, solo merge por PR |
| `feature/*` | Nuevas funcionalidades |
| `fix/*` | Corrección de bugs |

Convención de commits: `tipo: descripción en minúsculas`

Ejemplos: `feat: agregar evaluación de admisión`, `fix: corregir cálculo de probabilidad`, `chore: actualizar dependencias`

---

## Tests

```bash
# Ejecutar todos los tests del backend
pnpm --filter backend test

# Tests individuales (vitest)
pnpm --filter backend test person-stats
pnpm --filter backend test mission-probability
```

### Cobertura de tests existentes

| Test | Qué verifica |
|------|-------------|
| `person-stats.test.ts` | `generateInitialStats`, `advanceStats`, `healthPercentage` |
| `person-progression.test.ts` | Subidas de nivel y condiciones de borde |
| `mission-probability.test.ts` | `calculateMissionProbability`, `calculateLuckBonus`, `rollSucceeds` |
| `text-ai.test.ts` | `ResilientTextProvider` con mocks de Ollama |
| `settings.test.ts` | CRUD de configuración del sistema |
| `database.integration.test.ts` | Conectividad a base de datos |
| `person-contract.http.test.ts` | Endpoints HTTP de personas |

---

## CI Pipeline

Archivo: `.github/workflows/ci.yml`

Ejecuta en cada push:

```
1. Checkout
2. Setup Node.js + pnpm
3. pnpm install
4. pnpm typecheck (tsc --noEmit)
5. pnpm lint (eslint)
6. pnpm test (vitest)
```

---

## Dependabot

Configurado en `.github/dependabot.yml` para actualizaciones semanales de dependencias npm.

---

## Deploy

### Backend (Render)

- **Tipo**: Web Service
- **Build command**: `pnpm install && pnpm --filter backend build`
- **Start command**: `pnpm --filter backend start`
- **Variables de entorno**: configuradas en el panel de Render

### Frontend (Vercel)

- **Framework**: Vite
- **Build command**: `pnpm --filter frontend build`
- **Output**: `apps/frontend/dist`
- **Variable de entorno**: `VITE_API_URL`

---

## Prisma

El schema vive en `apps/backend/prisma/prisma/schema.prisma`. El cliente generado va a `apps/backend/src/generated/prisma`.

```bash
# Generar cliente después de cambios al schema
pnpm --filter backend prisma generate

# Crear nueva migración
pnpm --filter backend prisma migrate dev --name nombre_migracion

# Aplicar migraciones en producción
pnpm --filter backend prisma migrate deploy

# Abrir Prisma Studio (interfaz visual)
pnpm --filter backend prisma studio
```

---

## Convenciones de código

- **TypeScript strict** en ambos workspaces.
- **ESLint** con configuración flat (`eslint.config.js`).
- **Prettier** con configuración en `.prettierrc` raíz.
- **Módulos ES** (`.js` imports en TypeScript, compilación ESM).
- Todos los handlers de Express son `async` y delegan a `next(error)` en el catch.
- Los errores de dominio extienden `AppError` (`src/shared/errors/app-error.ts`).
- Las respuestas siguen siempre `createSuccessResponse` / `createErrorResponse`.
