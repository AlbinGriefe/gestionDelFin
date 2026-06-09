import { describe, expect, it } from "vitest";

import {
  advanceStats,
  generateInitialStats,
  PERSON_LEVEL_MAX,
  PERSON_STAT_MAX,
  randomInitialStat,
} from "../src/modules/persons/person-stats.js";

describe("person stats", () => {
  it("generates initial values between 0 and 10 with level 1", () => {
    expect(randomInitialStat(() => 0)).toBe(0);
    expect(randomInitialStat(() => 0.999999)).toBe(10);

    const stats = generateInitialStats(() => 0.5);
    expect(stats).toEqual({
      health: 5,
      maxHealth: 5,
      strength: 5,
      satiety: 5,
      hydration: 5,
      luck: 5,
      level: 1,
    });
  });

  it("caps statistics at 31 and level at 50", () => {
    const advanced = advanceStats({
      health: PERSON_STAT_MAX,
      maxHealth: PERSON_STAT_MAX,
      strength: 30,
      satiety: 30,
      hydration: 30,
      luck: 30,
      level: PERSON_LEVEL_MAX - 1,
    });

    expect(advanced).toEqual({
      health: 31,
      maxHealth: 31,
      strength: 31,
      satiety: 31,
      hydration: 31,
      luck: 31,
      level: 50,
    });
    expect(advanceStats(advanced)).toEqual(advanced);
  });
});
