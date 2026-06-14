# Handoff para Figma

## Estado

El frontend navegable ya implementa los flujos y sirve como fuente de verdad
visual. El archivo de Figma contiene 22 pantallas de escritorio capturadas
desde la aplicacion local y organizadas por rol.

- Archivo: `https://www.figma.com/design/STawByOaiGsp1VGCBhnEd8`
- Captura `Play`: `https://www.figma.com/design/STawByOaiGsp1VGCBhnEd8?node-id=1-2`

El equipo fue actualizado a Figma Pro con asiento Full. La cuota ya no bloquea
la generacion y los flujos principales quedaron representados mediante capas
que pueden modificarse.

## Cobertura actual

- Play y acceso.
- Dashboard de administrador, recursos, viajes y trabajador.
- Personas, admision, recomendacion de oficio y curacion.
- Oficios, cobertura y reasignacion temporal.
- Campamentos, usuarios, sesiones y configuracion.
- Inventario, proceso diario y traslados de recursos.
- Zonas, expediciones y traslados de viajes.
- Eventos narrativos y acceso denegado.

## Referencia visual

- Concepto: `docs/ui-ux/references/dashboard-concept.png`
- Entrada: `apps/frontend/src/assets/generated/camp-entry.png`
- Aplicacion local: `http://localhost:5173`

## Estructura objetivo

1. Fundamentos: color, tipografia, espaciado, iconografia y estados.
2. Componentes: navegacion, botones, campos, badges, tablas, paneles y modales.
3. Flujos frontend por rol: completado con 22 pantallas.
4. Variantes moviles de Play, login, dashboard, navegacion y panel de persona.

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

Las variantes pendientes deben generarse desde la aplicacion real y conservar
el frontend implementado como fuente de verdad.
