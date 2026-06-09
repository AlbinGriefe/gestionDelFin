import { describe, expect, it } from "vitest";

import { applyPersonProgression } from "../src/modules/persons/person-progression.service.js";

describe("person progression", () => {
  it("does not apply the same activity reference twice", async () => {
    const progressionKeys = new Set<string>();
    const stats = {
      id_person_stat: 1,
      id_person: 7,
      pst_health: 5,
      pst_max_health: 5,
      pst_strength: 5,
      pst_satiety: 5,
      pst_hydration: 5,
      pst_luck: 5,
      pst_level: 1,
      pst_updated_at: new Date(),
    };
    const tx = {
      person_progressions: {
        findFirst: async ({ where }: { where: { ppg_reference_key: string } }) =>
          progressionKeys.has(where.ppg_reference_key) ? { id: 1 } : null,
        create: async ({ data }: { data: { ppg_reference_key: string } }) => {
          progressionKeys.add(data.ppg_reference_key);
          return data;
        },
      },
      person_stats: {
        findUnique: async () => stats,
        update: async ({ data }: { data: Partial<typeof stats> }) => {
          Object.assign(stats, data);
          return stats;
        },
      },
      person_records: {
        create: async ({ data }: { data: unknown }) => data,
      },
    };

    const first = await applyPersonProgression(tx as never, {
      personId: 7,
      sourceType: "expedition",
      referenceKey: "expedition:12",
    });
    const second = await applyPersonProgression(tx as never, {
      personId: 7,
      sourceType: "expedition",
      referenceKey: "expedition:12",
    });

    expect(first.applied).toBe(true);
    expect(second).toEqual({ applied: false, reason: "already_applied" });
    expect(stats.pst_level).toBe(2);
  });
});
