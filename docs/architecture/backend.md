# Backend

## Decisiones base

- API REST versionada bajo `/api/v1`
- Express como servidor HTTP
- Prisma como capa de acceso a datos
- JWT para autenticacion
- Sesiones persistidas en la tabla `user_sessions`
- Hora central basada en el servidor para procesos sensibles

## Estado actual

- Healthcheck funcional
- Login, lectura de sesion y cierre de sesion
- Middleware de autenticacion para rutas protegidas
- Manejo centralizado de errores y validaciones

## Siguiente etapa

- CRUD de personas
- CRUD de campamentos
- Gestion de inventario y alertas
- Traslados entre campamentos
- Expediciones y consumo de raciones
