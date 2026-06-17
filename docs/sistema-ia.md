# Sistema de Inteligencia Artificial — gestionDelFin

El sistema de IA asiste dos decisiones críticas de negocio:
1. **Evaluación de admisión**: ¿debe esta persona ser admitida al campamento?
2. **Recomendación de profesión**: ¿cuál es el oficio más adecuado para esta persona?

---

## Arquitectura del proveedor de texto

```
                    ┌─────────────────────────┐
                    │  ResilientTextProvider   │
                    │  (punto de entrada único) │
                    └────────┬────────┬─────────┘
                             │        │ fallback automático
              ┌──────────────▼─┐   ┌──▼──────────────────────┐
              │ OllamaProvider │   │  RulesFallbackProvider   │
              │  (LLM local)   │   │  (motor de reglas       │
              └────────────────┘   │   determinístico)        │
                                   └─────────────────────────┘
```

El `ResilientTextProvider` es la única instancia exportada (`textAiProvider`). Intenta el proveedor primario (Ollama si `AI_PROVIDER=ollama`, de lo contrario el fallback directamente) y, ante cualquier error, usa automáticamente `RulesFallbackProvider`. La API nunca devuelve error por falla del LLM.

---

## OllamaTextProvider — Proveedor LLM

Envía prompts al servidor Ollama local (o remoto) configurado en `OLLAMA_BASE_URL` con el modelo `OLLAMA_MODEL`.

### Evaluación de admisión

**Input enviado al LLM:**
```typescript
{
  personId: number,
  description: string,        // prn_profile_description de la persona
  stats: PersonStatsSummary,  // health, strength, satiety, hydration, luck, level
  camp: {
    id: number,
    name: string,
    activePersons: number,
    maxCapacity: number
  },
  rules: Record<string, unknown>,  // cor_admission_rules del campamento
  modelName?: string
}
```

**Output esperado del LLM:**
```typescript
{
  decision: "accept" | "observe" | "reject",
  confidence: number,   // 0.0 a 1.0
  reasons: string[]
}
```

El proveedor persiste el resultado en `admission_evaluations` con `ade_provider="ollama"` y el snapshot completo del input.

### Recomendación de profesión

**Input:**
```typescript
{
  personId: number,
  description: string,
  stats: PersonStatsSummary,
  professions: Array<{ id, name, description }>  // profesiones disponibles en el campamento
}
```

**Output esperado:**
```typescript
{
  professionName: string,
  confidence: number,
  reasons: string[],
  alternatives: Array<{ professionName: string, reason: string }>
}
```

El `ResilientTextProvider` valida que `professionName` corresponda a una profesión existente en la lista enviada. Si el LLM recomienda un nombre desconocido, lanza error y activa el fallback.

---

## RulesFallbackProvider — Motor de reglas

Provee respuestas determinísticas cuando Ollama no está disponible. Las reglas se basan en los stats numéricos de la persona y la capacidad del campamento.

**Lógica de admisión (simplificada):**
- Si el campamento está al 90%+ de capacidad: `reject`
- Si health < 5: `observe`
- En base a combinación de stats genera score → decide `accept | observe | reject`
- `confidence` siempre moderado (0.6–0.75) para indicar que es fallback

**Lógica de profesión:**
- Selecciona la profesión cuya descripción mejor se alinea con los stats más altos de la persona
- Prioriza `pfs_can_expedition=true` para personas con alta strength

---

## Flujo completo de evaluación de admisión

```
1. Operador registra persona (prn_admission_status = "pending")
2. Operador solicita evaluación: POST /admission-evaluations
3. Backend recopila stats, reglas de campamento, capacidad
4. ResilientTextProvider.evaluateAdmission(input)
   4a. OllamaProvider → prompt al LLM → parsea respuesta JSON
   4b. (si falla) → RulesFallbackProvider → resultado determinístico
5. Se persiste en admission_evaluations con snapshot completo
6. Operador revisa resultado en UI (decisión IA + confianza + razones)
7. Operador registra decisión: PUT /admission-evaluations/:id/decide
   Body: { userDecision, userObservation }
8. Se actualiza prn_admission_status de la persona
9. Se registra evento de auditoría
```

---

## Datos persistidos por evaluación

Cada evaluación guarda:

| Campo | Propósito |
|-------|-----------|
| `ade_input_snapshot` | Reproducibilidad: permite re-auditar qué datos vio el modelo |
| `ade_raw_response` | Debug: respuesta cruda sin parsear |
| `ade_model_name` | Trazabilidad del modelo usado |
| `ade_confidence` | Nivel de certeza del modelo |
| `ade_is_final` | Indica si la decisión humana ya fue registrada |

---

## Configuración

```bash
AI_PROVIDER=ollama           # "ollama" activa Ollama; cualquier otro valor usa solo reglas
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

Si `AI_PROVIDER` no es `"ollama"`, el `ResilientTextProvider` usa directamente `RulesFallbackProvider` como primario (sin intentar Ollama).

---

## Consideraciones de diseño

**¿Por qué fallback de reglas en lugar de error?**
El sistema está diseñado para operar en entornos con conectividad limitada. Un campamento de supervivencia no puede quedar bloqueado porque el servidor de IA no responde. El fallback garantiza que la evaluación siempre devuelve un resultado, marcado con `ade_provider="rules-fallback"` para que el operador sepa que la confianza es menor.

**¿Por qué snapshot de input?**
Las decisiones de admisión son auditables. Si meses después se cuestiona por qué se rechazó a una persona, el sistema puede mostrar exactamente qué datos vio el modelo en ese momento (stats, capacidad del campamento, reglas vigentes).

**¿Por qué validar que la profesión recomendada exista?**
Los LLMs pueden alucinar nombres. La validación en `ResilientTextProvider.recommendProfession` actúa como guardia: si el modelo recomienda una profesión que no existe en el catálogo del campamento, se descarta silenciosamente y se usa el fallback.
