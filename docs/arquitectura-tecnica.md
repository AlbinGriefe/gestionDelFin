# Arquitectura Técnica — gestionDelFin

## Descripción general

**gestionDelFin** es un sistema web de gestión de campamentos de supervivencia post-apocalíptica. Permite a equipos humanos registrar personas, administrar recursos, ejecutar expediciones y tomar decisiones apoyadas por inteligencia artificial —todo en un entorno narrativo donde el puntaje de las operaciones depende del azar, las habilidades y las reglas del campamento.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Backend | Node.js 20 + Express 5 + TypeScript |
| ORM | Prisma (MySQL) |
| IA (primario) | Ollama (LLM local) |
| IA (fallback) | Motor de reglas determinístico |
| CI | GitHub Actions |
| Deploy backend | Render |
| Deploy frontend | Vercel |

---

## Estructura del monorepo

```
gestionDelFin/
├── apps/
│   ├── backend/          # API REST + lógica de negocio
│   │   ├── prisma/       # Schema y migraciones
│   │   ├── src/
│   │   │   ├── api/v1/   # Rutas, middlewares
│   │   │   ├── modules/  # Dominio de negocio (un directorio por módulo)
│   │   │   ├── lib/      # Prisma, env, logger
│   │   │   └── shared/   # Errores, helpers, tipos Express
│   │   └── tests/
│   └── frontend/         # SPA React
│       └── src/
│           ├── modules/  # Espejo de módulos del backend
│           ├── components/
│           └── layouts/
└── docs/                 # Esta documentación
```

---

## Diagrama de arquitectura

```
┌────────────────────────────────────────────────────┐
│                   FRONTEND (Vercel)                │
│           React + Vite + TypeScript                │
│                                                    │
│  Auth Context ──► API Client ──► Módulos UI        │
└──────────────────────────┬─────────────────────────┘
                           │ HTTPS / REST JSON
┌──────────────────────────▼─────────────────────────┐
│                  BACKEND (Render)                  │
│          Express v5 + TypeScript                   │
│                                                    │
│  Middleware: Auth JWT ─► Validate Body ─► Route    │
│                                                    │
│  ┌─────────┐ ┌──────────┐ ┌────────────────────┐  │
│  │ Modules │ │  Events  │ │   Text AI Layer     │  │
│  │(persona,│ │ (audit   │ │ ResilientProvider   │  │
│  │ camps,  │ │  log)    │ │  ┌──────┐ ┌──────┐  │  │
│  │ invento,│ └──────────┘ │  │Ollama│ │Rules │  │  │
│  │  etc.)  │              │  └──────┘ └──────┘  │  │
│  └─────────┘              └────────────────────┘  │
└──────────────────────────┬─────────────────────────┘
                           │ Prisma ORM
┌──────────────────────────▼─────────────────────────┐
│               BASE DE DATOS (MySQL)                │
│  25+ tablas: persons, camps, resources,            │
│  expeditions, transfers, ai_evaluations, …         │
└────────────────────────────────────────────────────┘
```

---

## Patrón de módulos

Cada módulo del backend sigue la misma estructura en capas:

```
modules/<nombre>/
  ├── <nombre>.routes.ts      # Define endpoints HTTP, aplica middlewares
  ├── <nombre>.controller.ts  # Extrae parámetros de Request, llama al service
  ├── <nombre>.service.ts     # Lógica de negocio, orquesta el repository
  ├── <nombre>.repository.ts  # Consultas Prisma
  ├── <nombre>.schemas.ts     # Validación Zod de request bodies
  └── <nombre>.types.ts       # Tipos TypeScript compartidos
```

El flujo es siempre: `Route → Controller → Service → Repository → Prisma → MySQL`.

---

## Autenticación y sesiones

- **JWT** almacenado en cookie `httpOnly`.
- Cada token se registra en la tabla `user_sessions` con IP, tiempo de expiración y razón de cierre de sesión (`manual | timeout | forced | camp_change | security`).
- El middleware `auth.ts` verifica el JWT y adjunta `req.user` con el id de usuario y campamento activo.
- El frontend detecta inactividad con un timer configurable y cierra sesión automáticamente (módulo `IdleManager`).

---

## Sistema de campamentos

Un **camp** (campamento) es la unidad central del sistema. Todo recurso, persona, expedición y usuario pertenece a un campamento. Esto permite que múltiples grupos gestionen sus propios campamentos de forma aislada dentro de la misma base de datos.

Las reglas operacionales de cada campamento (`camp_operational_rules`) controlan:
- Probabilidades base de éxito en expediciones y transferencias.
- Probabilidad de enfermedades y recursos valiosos.
- Criterios de admisión de personas (JSON configurable por campamento).

---

## Proceso diario

El endpoint `/daily-processes` ejecuta el ciclo de simulación del día:

1. Asigna tareas a personas según su profesión (`food_production | water_production | camp_support`).
2. Calcula producción de alimentos y agua.
3. Aplica consumo de raciones.
4. Evalúa eventos narrativos (enfermedades, escasez, ataques zombis, recursos valiosos, pérdida de viajeros).
5. Registra resultados y genera el log de eventos.

---

## Módulos del sistema

| Módulo | Descripción |
|--------|-------------|
| `auth` | Login, logout, sesiones, cambio de campamento |
| `camps` | CRUD de campamentos, mapa interactivo |
| `persons` | Personas bajo evaluación o admitidas; stats RPG |
| `professions` | Oficios que determinan producción y bonificaciones |
| `admission-evaluations` | Evaluaciones IA de admisión de personas |
| `profession-recommendations` | Recomendaciones IA de oficio |
| `expeditions` | Misiones fuera del campamento |
| `exploration-zones` | Zonas geográficas con nivel de riesgo |
| `transfers` | Movimiento de personas y recursos entre campamentos |
| `inventory` | Stock de recursos por campamento |
| `daily-processes` | Ciclo de simulación diaria |
| `care-actions` | Atención médica entre personas |
| `narrative-events` | Eventos aleatorios generados por el sistema |
| `achievements` | Logros desbloqueados por usuarios |
| `dashboard` | Métricas consolidadas del campamento |
| `settings` | Parámetros del sistema |
| `events` | Log de auditoría inmutable |
| `sessions` | Gestión de sesiones activas |
| `users` | CRUD de usuarios del sistema |

---

## Variables de entorno

```bash
# apps/backend/.env
DATABASE_URL=mysql://user:password@host:3306/db
JWT_SECRET=secret_largo_y_aleatorio
PORT=3000
AI_PROVIDER=ollama           # "ollama" | cualquier otro valor desactiva Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# apps/frontend/.env
VITE_API_URL=https://tu-backend.onrender.com/api/v1
```

---

## CI / CD

El pipeline `.github/workflows/ci.yml` ejecuta en cada push a `main`:
1. Instalación de dependencias (pnpm workspaces).
2. Type-check (`tsc --noEmit`).
3. Linting (`eslint`).
4. Tests (`vitest`).

El deploy en Render (backend) y Vercel (frontend) se activa automáticamente al pasar CI en `main`.
