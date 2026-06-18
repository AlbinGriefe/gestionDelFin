# Documento de Cierre — gestionDelFin

## Resumen del proyecto

**gestionDelFin** es un sistema web completo para la gestión de campamentos de supervivencia en un contexto narrativo post-apocalíptico. Permite a equipos de operadores registrar personas, administrar recursos, ejecutar expediciones inter-zona y tomar decisiones apoyadas por inteligencia artificial —con todas las operaciones auditadas y una capa de simulación que aporta incertidumbre narrativa a través de eventos aleatorios.

**Período de desarrollo**: 2025–2026  
**Repositorio**: [github.com/AlbinGriefe/gestionDelFin](https://github.com/AlbinGriefe/gestionDelFin)  
**Equipo**: AlbinGriefe, Frauli117, WagRuiz y colaboradores

---

## Qué se construyó

### Backend (Node.js + Express + Prisma)

- API REST versionada (`/api/v1`) con 20 módulos de dominio.
- Base de datos relacional MySQL con 25+ tablas, migraciones versionadas.
- Sistema de autenticación JWT con sesiones auditadas y cierre automático por inactividad.
- Motor de simulación: proceso diario que asigna tareas, calcula producción, aplica consumo y genera eventos narrativos.
- Sistema de progresión de personas: stats RPG (health, strength, luck, etc.), subidas de nivel desde múltiples fuentes.
- Probabilidades configurables por campamento para expediciones, transferencias y eventos narrativos.
- Log de auditoría inmutable (`events`) que registra cada cambio de estado relevante.

### Inteligencia Artificial

- Integración con **Ollama** (LLM local) para evaluaciones de admisión y recomendaciones de profesión.
- **ResilientTextProvider**: arquitectura con fallback automático a motor de reglas determinístico —el sistema nunca falla por indisponibilidad del LLM.
- Persistencia completa de evaluaciones: snapshot de input, respuesta cruda, decisión del modelo y decisión humana final.
- Validación de salida del LLM: si el modelo recomienda una entidad inexistente, se descarta y activa el fallback.

### Frontend (React + Vite + TypeScript)

- SPA con routing por módulos, autenticación en contexto y detección de inactividad.
- Mapa interactivo de campamentos con coordenadas GPS.
- Flujos guiados de admisión: registro → evaluación IA → revisión humana → asignación de oficio.
- Componentes reutilizables: `DetailCard`, `DetailField`, `CatalogSelect`, `ResourceAlertsBanner`.
- Banner de alertas de stock en tiempo de carga.

### Infraestructura

- Monorepo con pnpm workspaces.
- CI en GitHub Actions: typecheck + lint + tests en cada push.
- Deploy automático: Render (backend) + Vercel (frontend).

---

## Decisiones técnicas relevantes

### Módulos en capas (routes → controller → service → repository)

Separar la lógica en cuatro capas permite testear el service en aislamiento sin levantar Express, y testear el repository contra una base de datos real sin tocar la lógica de negocio. Esto probó su valor en los tests de contrato HTTP (`person-contract.http.test.ts`) y en los tests de lógica pura (`mission-probability.test.ts`).

### Fallback determinístico en IA

La decisión de no propagar errores del LLM fue clave para la robustez. En lugar de devolver 500 cuando Ollama no está disponible, el sistema responde siempre con un resultado marcado como `provider="rules-fallback"`. Esto permite operar en producción sin Ollama activo, con la pérdida de precisión claramente señalizada al operador.

### Snapshot de input en evaluaciones

Guardar `ade_input_snapshot` en cada evaluación sacrifica un poco de espacio en base de datos pero habilita auditabilidad completa. Un operador puede revisar meses después qué datos vio el modelo y por qué recomendó lo que recomendó.

### Probabilidades con piso y techo (5%–95%)

El `clampProbability` fue una decisión de diseño narrativo: ninguna operación es absolutamente segura ni absolutamente imposible. Esto mantiene la tensión en el juego y evita que campamentos muy bien equipados rompan el sistema con 100% de éxito garantizado.

---

## Qué funciona bien

- La arquitectura de módulos es coherente y fácil de extender. Agregar un nuevo módulo sigue el mismo patrón en todos los casos.
- El sistema de fallback de IA es transparente y confiable. Los tests de `text-ai.test.ts` verifican el comportamiento bajo fallo del LLM.
- El log de auditoría (`events`) es completo y consistente.
- El proceso diario es el corazón narrativo del sistema y encapsula bien la simulación.

---

## Limitaciones y deuda técnica

### Sin UI para proceso diario

El proceso diario existe como endpoint (`POST /daily-processes/run`) pero la interfaz de usuario para dispararlo y visualizar el resumen de resultados está incompleta o ausente. Los operadores deben llamar al API directamente.

### Tests de integración limitados

Existen tests de lógica pura y un test de contrato HTTP básico, pero no hay tests de integración end-to-end que cubran flujos completos (ej. admisión completa + asignación + proceso diario). Agregar estos tests reduciría riesgo en deploys.

### Ollama en producción

El backend en Render no tiene acceso a un servidor Ollama local. En el entorno de producción actual, el sistema opera siempre en modo `rules-fallback`. Para activar Ollama en producción se necesitaría un servidor Ollama desplegado con acceso HTTP desde Render, o migrar a un proveedor de LLM en la nube (ej. Anthropic API, OpenAI).

### Roles de usuario no granulares

El modelo de roles existe (`roles` table) pero la implementación actual no impone permisos granulares por endpoint. Todos los usuarios autenticados de un campamento acceden a todos los módulos del campamento.

### Sin paginación en varios endpoints

Algunos endpoints de lista (personas, expediciones, eventos) no implementan paginación. Con volúmenes grandes de datos esto puede impactar el tiempo de respuesta.

---

## Recomendaciones para el equipo que continúe

1. **Activar Ollama en producción**: desplegar un servidor Ollama con modelo `llama3.2` accesible desde Render, o migrar a Anthropic API (claude-haiku-4-5 es una opción eficiente en costo). Actualizar `AI_PROVIDER` y `OLLAMA_BASE_URL` en las variables de entorno.

2. **Implementar paginación**: los endpoints de lista deben aceptar `page` y `pageSize`. Prisma lo soporta nativamente con `skip` y `take`.

3. **Completar la UI del proceso diario**: construir la pantalla que muestra el resumen del día: producción generada, consumo de raciones, eventos narrativos ocurridos, personas que subieron de nivel.

4. **Agregar tests de integración end-to-end**: un test que crea un campamento, registra personas, ejecuta el proceso diario y verifica el estado del inventario validaría el flujo crítico completo.

5. **Granularidad de roles**: implementar middleware que verifique permisos por endpoint según el rol del usuario. El modelo de datos ya tiene la tabla `roles`; falta la lógica de enforcement.

6. **Monitoreo en producción**: agregar un servicio de monitoreo (ej. Sentry para errores, Render metrics para latencia). El endpoint `/health` es un buen starting point para health checks externos.

7. **Documentación de decisiones de admisión**: considerar exportación de historial de evaluaciones en CSV/PDF para que los operadores puedan reportar su actividad fuera del sistema.

---

## Métricas del proyecto

| Métrica                 | Valor              |
| ----------------------- | ------------------ |
| Tablas en base de datos | 25+                |
| Módulos backend         | 20                 |
| Endpoints REST          | ~80                |
| Tests                   | 7 archivos de test |
| PRs mergeados           | 23+                |
| Contribuidores          | 3+                 |

---

## Agradecimientos

El equipo de desarrollo construyó este sistema como proyecto académico/personal, explorando la intersección entre gestión de simulación narrativa e inteligencia artificial aplicada a decisiones humanas. La arquitectura resultante es sólida y extensible para futuras iteraciones del juego o aplicaciones similares de gestión con IA.
