# Seguridad de dependencias

Fecha de revision: 2026-05-27

## Politica del equipo

- Usar `npm ci` como flujo por defecto para clonar, validar y correr builds del monorepo
- Usar `npm install` solo cuando se quiera modificar dependencias o regenerar intencionalmente `package-lock.json`
- Instalar siempre desde la raiz del monorepo
- Revisar cualquier cambio en `package-lock.json` como parte explicita del PR
- No ejecutar `npm audit fix` automaticamente ni a ciegas

## Comandos recomendados

Desde la raiz:

```powershell
npm ci
npm run audit:prod
npm run backend:typecheck
npm run verify:build
```

Comandos adicionales utiles:

```powershell
npm run audit:all
npm run backend:prisma:validate
npm run backend:prisma:sync
```

## Estado actual del arbol npm

Resultado base de `npm audit --workspaces --omit=dev`:

- 14 vulnerabilidades reportadas
- 5 `moderate`
- 9 `high`

## Clasificacion actual

### Riesgo de runtime

Estas dependencias se resuelven en el backend que corre Express y deben priorizarse primero:

| Paquete | Severidad | Via actual | Riesgo |
| --- | --- | --- | --- |
| `path-to-regexp@8.3.0` | High | `express -> router -> path-to-regexp` | Afecta parsing de rutas en runtime |
| `qs@6.15.0` | Moderate | `express -> body-parser/qs` | Afecta parsing de query/body en runtime |

Decision:

- revisar primero si existe una actualizacion segura de `express` o `router` que absorba ambos fixes
- si no existe update directa viable, documentar la exposicion y revisar mitigaciones aguas arriba

### Riesgo de tooling

Estas dependencias vienen de la cadena de Prisma CLI y herramientas de desarrollo:

| Paquete | Severidad | Via actual | Tipo |
| --- | --- | --- | --- |
| `@hono/node-server@1.19.9` | High | `prisma -> @prisma/dev -> @hono/node-server` | Tooling |
| `hono@4.11.4` | High | `prisma -> @prisma/dev -> hono` | Tooling |
| `effect@3.18.4` | High | `prisma -> @prisma/config -> effect` | Tooling |
| `lodash@4.17.21` | High | `prisma -> @prisma/dev -> @mrleebo/prisma-ast -> chevrotain -> lodash` | Tooling |

Decision:

- no tocar Prisma de forma reactiva con `audit fix`
- evaluar una actualizacion controlada de Prisma cuando el equipo pueda validar:
  - `prisma validate`
  - `prisma generate`
  - `backend:typecheck`
  - `backend:build`

## Flujo seguro de colaboracion

### Al clonar

1. `git clone`
2. `npm ci`
3. `npm run audit:prod`
4. `npm run verify:build`

### Antes de aceptar cambios de dependencias

Revisar:

- que el PR explique por que cambia `package.json` o `package-lock.json`
- si cambia tooling, que no rompa Prisma ni builds
- si cambia runtime, que el changelog o advisory justifique el update
- que no entren paquetes nuevos sin razon funcional clara

### Antes de mergear

Validar:

- `npm run backend:typecheck`
- `npm run verify:build`
- `npm run audit:prod`

## Vigilancia automatica

Se agrega `/.github/dependabot.yml` para:

- revisar dependencias npm del monorepo semanalmente
- separar updates de produccion y desarrollo
- revisar la imagen Docker del repo

Ademas, en GitHub deben quedar activos:

- Dependabot alerts
- Dependabot security updates
- npm malware alerts

## Decision actual

No se recomienda actualizar Prisma/tooling inmediatamente dentro de esta fase.

Motivo:

- el riesgo mas urgente visible hoy esta en dependencias de runtime (`path-to-regexp`, `qs`)
- Prisma afecta tooling critico del proyecto y requiere una ventana controlada de validacion

Siguiente prioridad:

1. revisar actualizacion segura del stack Express
2. confirmar impacto real en backend expuesto
3. programar actualizacion de Prisma como tarea separada
