# Decisiones de IA textual

## Alcance

La IA tiene dos operaciones separadas:

1. evaluar admision;
2. recomendar oficio.

Ambas usan descripcion textual y estadisticas. No usan fotografias,
identificacion visual ni deteccion zombie.

## Proveedores

- `OllamaTextProvider`: usa Qwen mediante `/api/generate` y exige JSON.
- `RulesFallbackProvider`: reglas deterministas por capacidad, salud y senales.
- `ResilientTextProvider`: intenta el proveedor principal y usa reglas si falla.

Configuracion:

```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b
AI_TIMEOUT_MS=180000
```

Para despliegue sin Ollama:

```env
AI_PROVIDER=rules
```

## Admision

Entrada:

- descripcion;
- estadisticas;
- capacidad actual y maxima;
- reglas del campamento.

Salida:

- `accept`;
- `observe`;
- `reject`;
- confianza;
- razones.

La persona permanece `under_review` hasta confirmacion humana. Solo
`Administrador sistema` puede confirmar. La aceptacion verifica nuevamente la
capacidad.

## Recomendacion de oficio

Solo se ejecuta para una persona aceptada y activa. El proveedor recibe los
oficios activos compatibles con el campamento y devuelve:

- oficio recomendado;
- confianza;
- razones;
- alternativas.

El administrador puede aceptar la recomendacion o seleccionar otro oficio. El
backend valida que el oficio exista y sea aplicable.

## Trazabilidad

Se guarda:

- proveedor y modelo;
- confianza y razones;
- entrada utilizada;
- respuesta original cuando existe;
- decision humana;
- usuario revisor;
- observacion;
- evento de auditoria.

Las evaluaciones visuales antiguas no se borran de la base, pero no tienen rutas
de ejecucion en la API actual.
