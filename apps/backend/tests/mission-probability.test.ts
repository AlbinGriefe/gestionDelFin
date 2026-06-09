import { describe, expect, it } from "vitest";

import {
  calculateLuckBonus,
  calculateMissionProbability,
  clampProbability,
  randomInteger,
  rollSucceeds,
} from "../src/modules/operations/mission-probability.js";

describe("mission probability", () => {
  it("adds up to ten luck points and profession bonuses", () => {
    expect(calculateLuckBonus([31, 31])).toBe(10);
    expect(
      calculateMissionProbability({
        baseProbability: 75,
        luckValues: [31],
        professionBonusPoints: 1.5,
      }),
    ).toEqual({
      baseProbability: 75,
      luckBonusPoints: 10,
      professionBonusPoints: 1.5,
      probability: 86.5,
    });
  });

  it("clamps final probabilities to the 5-95 range", () => {
    expect(clampProbability(-20)).toBe(5);
    expect(clampProbability(150)).toBe(95);
    expect(rollSucceeds(95, 95)).toBe(true);
    expect(rollSucceeds(95, 95.01)).toBe(false);
  });

  it("generates inclusive hunter rewards", () => {
    expect(randomInteger(8, 10, () => 0)).toBe(8);
    expect(randomInteger(8, 10, () => 0.999999)).toBe(10);
  });
});
