# Flujos de UI y Componentes — gestionDelFin

---

## Módulos del frontend

El frontend espeja la estructura de módulos del backend:

```
src/
├── modules/
│   ├── auth/          — Login, sesión, idle manager
│   ├── camps/         — Lista, mapa y formulario de campamentos
│   ├── persons/       — Registro, detalle y gestión de personas
│   ├── professions/   — Catálogo de profesiones
│   ├── expeditions/   — Planificación y seguimiento
│   ├── transfers/     — Solicitudes inter-campamento
│   ├── inventory/     — Stock y movimientos
│   ├── dashboard/     — Vista general del campamento
│   └── achievements/  — Logros de usuarios
├── components/        — Componentes reutilizables
├── layouts/           — AppShell (barra lateral + header)
└── App.tsx            — Router principal
```

---

## Flujo de autenticación

```
┌─────────────────┐
│   Login Form    │
│  (username +    │
│   password +    │
│   camp select)  │
└────────┬────────┘
         │ POST /auth/login
         ▼
┌─────────────────┐     ┌──────────────┐
│  AuthProvider   │────►│  AppShell    │
│  (Context)      │     │  (nav + main)│
└─────────────────┘     └──────────────┘
         │
         │ idle timeout
         ▼
┌─────────────────┐
│  IdleManager    │ → POST /auth/logout → Login Form
└─────────────────┘
```

El `AuthProvider` almacena el usuario en contexto React. `useAuth()` expone el usuario, la función de logout y el campamento activo. `IdleManager` detecta inactividad y cierra sesión automáticamente.

---

## Flujo de admisión de personas

```
Personas pendientes
        │
        ▼
[Ver perfil + stats generados]
        │
        ▼
[Solicitar evaluación IA] ──► POST /admission-evaluations
        │
        ▼
[Resultado: decisión + confianza + razones]
        │
   ┌────┴────┐
   ▼         ▼
[Aceptar] [Observar/Rechazar]
   │
   ▼
[Asignar profesión] ──► POST /profession-recommendations
        │
        ▼
[Resultado IA + alternativas]
        │
        ▼
[Confirmar oficio final]
```

---

## Componentes reutilizables

### `DetailCard`

Card de detalle con título, acciones y cuerpo genérico. Usado en vistas de persona, campamento, expedición.

### `DetailField`

Muestra un campo etiqueta-valor en línea. Maneja tipos: texto, fecha, número, enum con color.

### `CatalogSelect`

Dropdown con búsqueda para seleccionar entidades del catálogo (profesiones, recursos, zonas). Carga datos del API al montar.

### `SearchById`

Input de búsqueda por identificador único de persona. Util en flujos de transferencia y cuidado médico.

### `ResourceAlertsBanner`

Banner que aparece en la parte superior cuando algún recurso está por debajo del stock mínimo. Enlaza directamente al inventario.

---

## Mapa de campamentos (`CampMap`)

El componente `CampMap` renderiza un mapa SVG/imagen (`public/camp-map.png`) con los campamentos posicionados mediante coordenadas GPS normalizadas al viewport. Al hacer clic en un campamento se navega a su detalle. Los campamentos activos aparecen con indicador verde; los inactivos/destruidos en gris.

Los sites estáticos configurados están en `campSites.ts` como constante local.

---

## AppShell — Layout principal

```
┌────────────────────────────────────────┐
│  Header: campamento activo + logout    │
├──────────┬─────────────────────────────┤
│          │                             │
│  Sidebar │    <Outlet />               │
│  (nav)   │  (contenido de la ruta)     │
│          │                             │
└──────────┴─────────────────────────────┘
```

La sidebar muestra los módulos disponibles según el rol del usuario.

---

## Gestión de estado

No hay una librería de estado global (Redux, Zustand). El estado se maneja con:

- **Context API**: autenticación (`AuthContext`), sesión idle (`IdleSessionContext`).
- **useState / useEffect local**: datos de cada vista.
- **API calls directos**: cada componente llama al API client de su módulo al montar.

El cliente API (`auth.api.ts`, `camp.api.ts`, etc.) son funciones fetch tipadas que apuntan a `VITE_API_URL`.

---

## Manejo de errores en UI

Los errores HTTP del API se capturan en cada módulo. Si el servidor devuelve 401, el `AuthProvider` redirige automáticamente al login. Para otros errores, el componente muestra un mensaje inline sin romper la navegación.
