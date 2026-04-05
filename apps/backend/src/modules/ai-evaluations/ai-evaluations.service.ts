import { AppError } from "../../shared/errors/app-error.js";
import type {
  RunAiEvaluationInput,
  ConfirmEvaluationInput,
  GeminiZombieAnalysis,
  AieDecision,
  RunEvaluationResult,
  AiEvaluationResult,
} from "./ai-evaluations.types.js";
import {
  findPersonById,
  findEvaluationById,
  saveEvaluation,
  confirmEvaluation,
  findEvaluationsByPerson,
} from "./ai-evaluations.repository.js";

// ─── Constantes ───────────────────────────────────────────────────────────────

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const ZOMBIE_DETECTION_PROMPT = `
Eres un sistema de análisis biométrico post-apocalíptico. Analiza la imagen de una persona 
y determina si presenta indicadores de infección zombie.

Evalúa estos aspectos:
1. Condición de la piel: ¿normal, pálida/grisácea o con descomposición?
2. Estado de los ojos: ¿normales, vidriosos/sin vida o ausentes?
3. Heridas visibles: ¿mordeduras, laceraciones o heridas abiertas?
4. Expresión facial: ¿coherente con un humano vivo o inexpresiva?
5. Aspecto general: ¿signos de deterioro físico severo?

Responde ÚNICAMENTE con JSON válido, sin texto adicional ni bloques de código:

{
  "isZombie": boolean,
  "confidence": número entre 0.0 y 1.0,
  "reasons": ["razón 1", "razón 2"],
  "skinCondition": "normal" | "pale" | "decayed" | "unknown",
  "eyeCondition": "normal" | "glassy" | "absent" | "unknown",
  "visibleWounds": boolean,
  "overallAssessment": "descripción breve en español"
}

Si la imagen no contiene una cara humana, devuelve confidence: 0, isZombie: false 
y explica el motivo en overallAssessment.
`.trim();

// ─── Servicio ─────────────────────────────────────────────────────────────────

export class AiEvaluationsService {

  // ── Llamada a Gemini Vision ────────────────────────────────────────────────

  private async analyzeWithGemini(
    photoBase64: string,
    mimeType: string
  ): Promise<GeminiZombieAnalysis> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new AppError(
        "GEMINI_API_KEY no está configurada en las variables de entorno",
        500
      );
    }

    // Eliminar prefijo data:image/...;base64, si viene incluido
    const cleanBase64 = photoBase64.replace(
      /^data:image\/[a-z]+;base64,/,
      ""
    );

    const requestBody = {
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
            { text: ZOMBIE_DETECTION_PROMPT },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 512,
        responseMimeType: "application/json",
      },
    };

    let response: Response;
    try {
      response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
    } catch {
      throw new AppError(
        "No se pudo conectar con la API de Gemini. Verifique la conexión.",
        503
      );
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "sin detalle");
      throw new AppError(
        `Error en la API de Gemini (${response.status}): ${errorBody}`,
        502
      );
    }

    const data = await response.json();
    const rawText: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!rawText) {
      throw new AppError(
        "Gemini no devolvió una respuesta válida para la imagen proporcionada",
        502
      );
    }

    let analysis: GeminiZombieAnalysis;
    try {
      const cleanJson = rawText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      analysis = JSON.parse(cleanJson);
    } catch {
      throw new AppError(
        "Gemini devolvió un formato inesperado. Intente con una imagen más clara.",
        502
      );
    }

    if (
      typeof analysis.isZombie !== "boolean" ||
      typeof analysis.confidence !== "number"
    ) {
      throw new AppError(
        "La respuesta de Gemini no contiene los campos requeridos",
        502
      );
    }

    return analysis;
  }

  // ── Mapear análisis a decisión del schema ─────────────────────────────────

  private getDecision(
    isZombie: boolean,
    confidence: number
  ): AieDecision {
    if (confidence < 0.5) return "observe";
    return isZombie ? "decline" : "accept";
  }

  private getVerdict(
    decision: AieDecision
  ): "HUMAN" | "ZOMBIE" | "INCONCLUSIVE" {
    if (decision === "accept") return "HUMAN";
    if (decision === "decline") return "ZOMBIE";
    return "INCONCLUSIVE";
  }

  private getVerdictMessage(
    verdict: "HUMAN" | "ZOMBIE" | "INCONCLUSIVE",
    personName: string
  ): string {
    switch (verdict) {
      case "HUMAN":
        return `${personName} ha sido identificado/a como humano/a. Puede ingresar al campamento.`;
      case "ZOMBIE":
        return `¡ALERTA! ${personName} presenta indicadores de infección zombie. Acceso denegado.`;
      case "INCONCLUSIVE":
        return `No se pudo determinar el estado de ${personName}. Se requiere revisión manual.`;
    }
  }

  // ── Evaluar persona con Gemini ─────────────────────────────────────────────

  async evaluatePerson(input: RunAiEvaluationInput): Promise<RunEvaluationResult> {
    // 1. Verificar que la persona existe
    const person = await findPersonById(input.personId);
    if (!person) {
      throw new AppError(`Persona con ID ${input.personId} no encontrada`, 404);
    }
    if (!person.prn_is_active) {
      throw new AppError(`La persona con ID ${input.personId} no está activa`, 400);
    }

    // 2. Analizar imagen con Gemini
    const geminiAnalysis = await this.analyzeWithGemini(
      input.photoBase64,
      input.mimeType ?? "image/jpeg"
    );

    // 3. Determinar decisión y veredicto
    const decision = this.getDecision(
      geminiAnalysis.isZombie,
      geminiAnalysis.confidence
    );
    const verdict = this.getVerdict(decision);
    const personFullName = `${person.prn_name} ${person.prn_lastname}`;
    const message = this.getVerdictMessage(verdict, personFullName);

    // 4. Guardar en BD
    const saved = await saveEvaluation({
      personId: input.personId,
      reviewerUserId: input.reviewerUserId,
      geminiAnalysis,
      decision,
      score: Math.round(geminiAnalysis.confidence * 100),
      modelName: input.modelName ?? "gemini-2.0-flash",
    });

    return { evaluation: saved, verdict, message };
  }

  // ── Confirmar/rechazar decisión de la IA ──────────────────────────────────

  async confirmEvaluation(
    input: ConfirmEvaluationInput
  ): Promise<AiEvaluationResult> {
    const existing = await findEvaluationById(input.evaluationId);
    if (!existing) {
      throw new AppError(
        `Evaluación con ID ${input.evaluationId} no encontrada`,
        404
      );
    }
    if (existing.aie_is_final) {
      throw new AppError(
        `La evaluación ${input.evaluationId} ya fue finalizada y no puede modificarse`,
        409
      );
    }

    return confirmEvaluation({
      evaluationId: input.evaluationId,
      reviewerUserId: input.reviewerUserId,
      userDecision: input.userDecision,
      userObservation: input.userObservation,
    });
  }

  // ── Consultar evaluaciones de una persona ─────────────────────────────────

  async getPersonEvaluations(personId: number): Promise<AiEvaluationResult[]> {
    const person = await findPersonById(personId);
    if (!person) {
      throw new AppError(`Persona con ID ${personId} no encontrada`, 404);
    }

    return findEvaluationsByPerson(personId);
  }
}
