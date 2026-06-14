import type {
  AdmissionAiInput,
  AdmissionAiResult,
  ProfessionAiInput,
  ProfessionAiResult,
  TextAiProvider,
} from "./text-ai.types.js";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const PROFESSION_SIGNALS: Record<string, string[]> = {
  medico: [
    "herida",
    "fiebre",
    "respiratoria",
    "paciente",
    "enfermeria",
    "higiene",
    "vendaje",
    "infeccion",
    "salud",
  ],
  guerrero: [
    "defensa",
    "vigilancia",
    "acceso",
    "escolta",
    "resistente",
    "disciplina",
    "combate",
  ],
  explorador: [
    "mapa",
    "ruta",
    "rastro",
    "terreno",
    "huella",
    "observa",
    "reporte",
    "orientacion",
  ],
  agricultor: [
    "cultivo",
    "hortaliza",
    "semilla",
    "suelo",
    "siembra",
    "cosecha",
  ],
  cientifico: [
    "filtracion",
    "purificacion",
    "agua",
    "contaminacion",
    "bomba",
    "filtro",
    "tecnica",
  ],
  diplomatico: [
    "negociar",
    "conflicto",
    "acuerdo",
    "discusion",
    "comunica",
    "mediacion",
  ],
  cazador: [
    "animal",
    "trampa",
    "carne",
    "sigilo",
    "alimento",
    "caza",
    "huella",
  ],
};

function clampConfidence(value: number) {
  return Math.max(0, Math.min(1, value));
}

export class RulesFallbackProvider implements TextAiProvider {
  async evaluateAdmission(input: AdmissionAiInput): Promise<AdmissionAiResult> {
    const reasons: string[] = [];
    let decision: AdmissionAiResult["decision"] = "accept";
    let confidence = 0.75;
    const minimumHealth =
      typeof input.rules.minimumHealth === "number"
        ? input.rules.minimumHealth
        : 1;

    if (
      input.camp.maxCapacity > 0 &&
      input.camp.activePersons >= input.camp.maxCapacity
    ) {
      decision = "reject";
      confidence = 0.98;
      reasons.push("El campamento no tiene capacidad disponible.");
    } else if (input.stats.health < minimumHealth) {
      decision = "observe";
      confidence = 0.82;
      reasons.push("La salud inicial requiere revision antes del ingreso.");
    } else if (input.description.trim().length < 20) {
      decision = "observe";
      confidence = 0.7;
      reasons.push("La descripcion no contiene informacion suficiente.");
    } else {
      reasons.push("Existe capacidad disponible en el campamento.");
      reasons.push(
        "El perfil contiene informacion suficiente para revision humana.",
      );
      reasons.push(
        "Las estadisticas iniciales no incumplen las reglas configuradas.",
      );
    }

    return {
      provider: "rules-fallback",
      model: null,
      decision,
      confidence,
      reasons,
      rawResponse: { rules: input.rules },
    };
  }

  async recommendProfession(
    input: ProfessionAiInput,
  ): Promise<ProfessionAiResult> {
    const normalizedDescription = normalize(input.description);
    const ranked = input.professions
      .map((profession) => {
        const key = normalize(profession.name);
        const signals = PROFESSION_SIGNALS[key] ?? [];
        let score = signals.filter((signal) =>
          normalizedDescription.includes(signal),
        ).length;

        if (key === "guerrero") {
          score += (input.stats.strength + input.stats.health) / 20;
        }
        if (key === "explorador" || key === "cazador") {
          score += input.stats.luck / 20;
        }

        return { profession, score, signals };
      })
      .sort((a, b) => b.score - a.score || a.profession.id - b.profession.id);

    const winner = ranked[0];
    if (!winner) {
      throw new Error("No active professions are available.");
    }

    const matchedSignals = winner.signals.filter((signal) =>
      normalizedDescription.includes(signal),
    );
    const confidence = clampConfidence(0.55 + winner.score * 0.08);

    return {
      provider: "rules-fallback",
      model: null,
      professionName: winner.profession.name,
      confidence,
      reasons:
        matchedSignals.length > 0
          ? [
              `El perfil coincide con: ${matchedSignals.join(", ")}.`,
              "La recomendacion considera las estadisticas iniciales.",
            ]
          : [
              "No hubo coincidencias textuales fuertes; se uso la mejor alternativa disponible.",
            ],
      alternatives: ranked.slice(1, 3).map((entry) => ({
        professionName: entry.profession.name,
        reason: "Alternativa con señales secundarias compatibles.",
      })),
      rawResponse: {
        scores: ranked.map((entry) => ({
          profession: entry.profession.name,
          score: entry.score,
        })),
      },
    };
  }

  async getHealth() {
    return {
      provider: "rules-fallback",
      ready: true,
      model: null,
      reason: null,
    };
  }
}
