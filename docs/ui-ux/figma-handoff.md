# Handoff para Figma

## Estado

El frontend navegable ya implementa los flujos y sirve como fuente de verdad
visual. El archivo de Figma fue creado y la pantalla `Play` fue capturada desde
la aplicacion local.

- Archivo: `https://www.figma.com/design/STawByOaiGsp1VGCBhnEd8`
- Captura `Play`: `https://www.figma.com/design/STawByOaiGsp1VGCBhnEd8?node-id=1-2`

La generacion de fundamentos, componentes reutilizables y flujos adicionales
queda pausada porque el equipo alcanzo el limite de llamadas MCP del plan
Starter de Figma. No es un bloqueo del codigo ni de autenticacion.

## Referencia visual

- Concepto: `docs/ui-ux/references/dashboard-concept.png`
- Entrada: `apps/frontend/src/assets/generated/camp-entry.png`
- Aplicacion local: `http://localhost:5173`

## Paginas que debe contener el archivo

1. Fundamentos: color, tipografia, espaciado, iconografia y estados.
2. Componentes: navegacion, botones, campos, badges, tablas, paneles y modales.
3. Play y acceso.
4. Dashboard por rol.
5. Personas, admision, oficio y curacion.
6. Cobertura y reasignacion temporal.
7. Campamentos y cambio de campamento.
8. Inventario y proceso diario.
9. Zonas, expediciones y traslados.
10. Eventos, usuarios, sesiones y configuracion.
11. Variantes moviles de Play, login, dashboard, navegacion y panel de persona.

## Tokens implementados

| Uso             | Valor         |
| --------------- | ------------- |
| Verde principal | `#244b36`     |
| Fondo           | `#f4f6f4`     |
| Superficie      | `#ffffff`     |
| Borde           | `#dbe2dc`     |
| Texto           | `#17211b`     |
| Alerta          | `#9d3c36`     |
| Advertencia     | `#895a12`     |
| Radio           | `6px` a `7px` |

Al restablecerse la cuota MCP, las pantallas restantes deben generarse desde la
aplicacion real y no desde una reinterpretacion separada.
