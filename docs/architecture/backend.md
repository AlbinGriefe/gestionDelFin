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
- Modulo `persons` con listado, detalle, alta, actualizacion, catalogos y trazabilidad en `person_records`
- Modulo `users` con catalogos, listado, detalle, alta, actualizacion, hashing de contrasena y revocacion de sesiones sensibles
- Modulo `camps` con listado, detalle operativo, alta, actualizacion y reglas de consistencia para capacidad y estado
- Modulo `inventory` con consulta de stock, alertas de minimo, ajustes y trazabilidad en `storage_records` y `resources_movements`
- Modulo `transfers` con solicitud, detalle y flujo de estados con impacto en inventario y traslado de personas entre campamentos
- Modulo `expeditions` con catalogos, planificacion, flujo de estados y retorno de recursos al inventario mediante `storage_records` y `resources_movements`
- Modulo `sessions` con consulta de sesiones activas/historicas, lectura de sesion actual y revocacion manual
- Modulo `settings` con parametros visibles para la interfaz y administracion del timeout de sesion

## Siguiente etapa

- Dashboard, reportes, admision con IA y reglas finas de consumo/raciones
