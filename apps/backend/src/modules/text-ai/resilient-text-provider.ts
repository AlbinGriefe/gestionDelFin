import { env } from "../../lib/env.js";
import { OllamaTextProvider } from "./ollama-text-provider.js";
import { RulesFallbackProvider } from "./rules-fallback-provider.js";
import type {
  AdmissionAiInput,
  ProfessionAiInput,
  TextAiProvider,
} from "./text-ai.types.js";

export class ResilientTextProvider implements TextAiProvider {
  private readonly fallback: TextAiProvider;
  private readonly primary: TextAiProvider;

  constructor(
    primary?: TextAiProvider,
    fallback: TextAiProvider = new RulesFallbackProvider(),
  ) {
    this.fallback = fallback;
    this.primary =
      primary ??
      (env.AI_PROVIDER === "ollama" ? new OllamaTextProvider() : fallback);
  }

  async evaluateAdmission(input: AdmissionAiInput) {
    try {
      return await this.primary.evaluateAdmission(input);
    } catch {
      return this.fallback.evaluateAdmission(input);
    }
  }

  async recommendProfession(input: ProfessionAiInput) {
    try {
      const result = await this.primary.recommendProfession(input);
      const valid = input.professions.some(
        (profession) =>
          profession.name.toLowerCase() === result.professionName.toLowerCase(),
      );
      if (!valid) throw new Error("Provider recommended an unknown profession.");
      return result;
    } catch {
      return this.fallback.recommendProfession(input);
    }
  }

  async getHealth() {
    if (this.primary === this.fallback) return this.fallback.getHealth();
    const primaryHealth = await this.primary.getHealth();
    if (primaryHealth.ready) return primaryHealth;
    return {
      provider: "rules-fallback",
      ready: true,
      model: null,
      reason: `Primary provider unavailable: ${primaryHealth.reason ?? "unknown"}`,
    };
  }
}

export const textAiProvider = new ResilientTextProvider();
