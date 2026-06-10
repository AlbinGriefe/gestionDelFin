import { describe, expect, it } from "vitest";

import { DEFAULT_PROFILE_TEMPLATES } from "../src/modules/persons/profile-templates.js";
import { RulesFallbackProvider } from "../src/modules/text-ai/rules-fallback-provider.js";
import type {
  AdmissionAiInput,
  ProfessionAiInput,
  TextAiProvider,
} from "../src/modules/text-ai/text-ai.types.js";

const professions = [
  "Medico",
  "Guerrero",
  "Explorador",
  "Agricultor",
  "Cientifico",
  "Diplomatico",
  "Cazador",
].map((name, index) => ({
  id: index + 1,
  name,
  description: name,
}));

const stats = {
  health: 5,
  maxHealth: 5,
  strength: 5,
  satiety: 5,
  hydration: 5,
  luck: 5,
  level: 1,
};

describe("text AI providers", () => {
  it.each(DEFAULT_PROFILE_TEMPLATES)(
    "maps the profile to $expectedProfession using deterministic rules",
    async (template) => {
      const provider = new RulesFallbackProvider();
      const result = await provider.recommendProfession({
        personId: 1,
        description: template.description,
        stats,
        professions,
      });

      expect(result.professionName).toBe(template.expectedProfession);
      expect(result.reasons.length).toBeGreaterThan(0);
    },
  );

  it("rejects admission when the camp is full", async () => {
    const provider = new RulesFallbackProvider();
    const result = await provider.evaluateAdmission({
      personId: 1,
      description: DEFAULT_PROFILE_TEMPLATES[0].description,
      stats,
      camp: {
        id: 1,
        name: "Central",
        activePersons: 10,
        maxCapacity: 10,
      },
      rules: {},
    });

    expect(result.decision).toBe("reject");
    expect(result.provider).toBe("rules-fallback");
  });

  it("uses rules when the primary provider fails", async () => {
    process.env.JWT_SECRET = "test-secret-at-least-16-characters";
    const { ResilientTextProvider } =
      await import("../src/modules/text-ai/resilient-text-provider.js");
    const failingProvider: TextAiProvider = {
      evaluateAdmission: async (_input: AdmissionAiInput) => {
        throw new Error("offline");
      },
      recommendProfession: async (_input: ProfessionAiInput) => {
        throw new Error("offline");
      },
      getHealth: async () => ({
        provider: "offline",
        ready: false,
        model: null,
        reason: "offline",
      }),
    };
    const provider = new ResilientTextProvider(failingProvider);
    const result = await provider.recommendProfession({
      personId: 1,
      description: DEFAULT_PROFILE_TEMPLATES[3].description,
      stats,
      professions,
    });

    expect(result.provider).toBe("rules-fallback");
    expect(result.professionName).toBe("Agricultor");
  });
});
