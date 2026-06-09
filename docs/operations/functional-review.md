# Revision funcional

Fecha de revision: 2026-06-08

## Resultado

La fase backend de personas, IA textual y operaciones del campamento compila y
cuenta con pruebas unitarias/HTTP.

```text
npm.cmd run backend:prisma:validate  -> correcto
npm.cmd run backend:prisma:generate  -> correcto
npm.cmd run backend:typecheck        -> correcto
npm.cmd run backend:build            -> correcto
npm.cmd run frontend:build           -> correcto
npm.cmd test -w @gestiondelfin/backend -> 20 pruebas correctas
npm.cmd run audit:prod               -> 15 vulnerabilidades (11 altas, 4 moderadas)
```

## Cobertura implementada

- personas pendientes con perfil aleatorio y estadisticas;
- admision textual revisable;
- oficio nullable y recomendacion revisable;
- fallback por reglas sin instalacion de Ollama;
- progresion con limites e idempotencia;
- reglas operativas por campamento;
- asignaciones diarias, produccion y penalizacion;
- raciones sin inventario negativo y evento de escasez;
- enfermedad y curacion;
- probabilidades de expediciones y traslados;
- eventos narrativos;
- zonas de exploracion.

## Limitaciones de verificacion

- La migracion esta creada pero no fue aplicada sobre la base local.
- `prisma migrate status` detecta una migracion pendiente.
- Docker no pudo consultarse por permisos sobre el motor local.
- No se ejecutaron pruebas E2E transaccionales contra una base migrada.
- El frontend compila con los contratos nuevos, pero no tiene pantallas nuevas.

## Siguiente verificacion

1. respaldar o clonar `apocalypse_db`;
2. aplicar la migracion en la copia;
3. ejecutar el seed;
4. probar admision, oficio, proceso diario, curacion y misiones con Supertest y
   transacciones reales;
5. integrar las pantallas frontend.
