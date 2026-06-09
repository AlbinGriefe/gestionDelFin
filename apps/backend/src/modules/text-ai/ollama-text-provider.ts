import { env } from "../../lib/env.js";
import type {
  AdmissionAiInput,
  AdmissionAiResult,
  ProfessionAiInput,
  ProfessionAiResult,
  TextAiProvider,
} from "./text-ai.types.js";

function extractJson(text: string) {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>;
    }
    throw new Error("Ollama did not return valid JSON.");
  }
}

function asConfidence(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : 0.5;
}

function asReasons(value: unknown) {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

export class OllamaTextProvider implements TextAiProvider {
  private async generate(prompt: string, modelName?: string) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.AI_TIMEOUT_MS);
    try {
      const response = await fetch(`${env.OLLAMA_BASE_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: modelName ?? env.OLLAMA_MODEL,
          prompt,
          stream: false,
          format: "json",
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Ollama returned ${response.status}.`);
      }
      const payload = (await response.json()) as { response?: string };
      if (!payload.response) throw new Error("Ollama returned an empty response.");
      return {
        parsed: extractJson(payload.response),
        raw: payload,
        model: modelName ?? env.OLLAMA_MODEL,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async evaluateAdmission(input: AdmissionAiInput): Promise<AdmissionAiResult> {
    const response = await this.generate(
      [
        "Evalua una solicitud de ingreso a un campamento.",
        "Responde solo JSON con decision accept|observe|reject, confidence 0..1 y reasons string[].",
        "La decision es una recomendacion y debe ser explicable.",
        JSON.stringify(input),
      ].join("\n"),
      input.modelName,
    );
    const decision = response.parsed.decision;
    if (!["accept", "observe", "reject"].includes(String(decision))) {
      throw new Error("Ollama returned an invalid admission decision.");
    }
    return {
      provider: "ollama",
      model: response.model,
      decision: decision as AdmissionAiResult["decision"],
      confidence: asConfidence(response.parsed.confidence),
      reasons: asReasons(response.parsed.reasons),
      rawResponse: response.raw,
    };
  }

  async recommendProfession(
    input: ProfessionAiInput,
  ): Promise<ProfessionAiResult> {
    const response = await this.generate(
      [
        "Recomienda un oficio usando solo la lista disponible.",
        "Responde solo JSON con professionName, confidence 0..1, reasons string[] y alternatives [{professionName,reason}].",
        JSON.stringify(input),
      ].join("\n"),
      input.modelName,
    );
    const professionName = String(response.parsed.professionName ?? "").trim();
    if (!professionName) throw new Error("Ollama did not recommend a profession.");
    const alternatives = Array.isArray(response.parsed.alternatives)
      ? response.parsed.alternatives
          .map((entry) => entry as Record<string, unknown>)
          .filter(
            (entry) =>
              typeof entry.professionName === "string" &&
              typeof entry.reason === "string",
          )
          .map((entry) => ({
            professionName: String(entry.professionName),
            reason: String(entry.reason),
          }))
      : [];
    return {
      provider: "ollama",
      model: response.model,
      professionName,
      confidence: asConfidence(response.parsed.confidence),
      reasons: asReasons(response.parsed.reasons),
      alternatives,
      rawResponse: response.raw,
    };
  }

  async getHealth() {
    try {
      const response = await fetch(`${env.OLLAMA_BASE_URL}/api/tags`);
      return {
        provider: "ollama",
        ready: response.ok,
        model: env.OLLAMA_MODEL,
        reason: response.ok ? null : `Ollama returned ${response.status}.`,
      };
    } catch (error) {
      return {
        provider: "ollama",
        ready: false,
        model: env.OLLAMA_MODEL,
        reason: error instanceof Error ? error.message : "Ollama unavailable.",
      };
    }
  }
}
