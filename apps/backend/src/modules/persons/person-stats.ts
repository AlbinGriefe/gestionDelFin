import type { PersonStatsSummary } from "./persons.types.js";

export const PERSON_STAT_MAX = 31;
export const PERSON_LEVEL_MAX = 50;

export function randomInitialStat(random: () => number = Math.random) {
  return Math.floor(random() * 11);
}

export function generateInitialStats(
  random: () => number = Math.random,
): PersonStatsSummary {
  const health = randomInitialStat(random);

  return {
    health,
    maxHealth: Math.max(1, health),
    strength: randomInitialStat(random),
    satiety: randomInitialStat(random),
    hydration: randomInitialStat(random),
    luck: randomInitialStat(random),
    level: 1,
  };
}

export function advanceStats(stats: PersonStatsSummary): PersonStatsSummary {
  if (stats.level >= PERSON_LEVEL_MAX) {
    return stats;
  }

  return {
    health: Math.min(PERSON_STAT_MAX, stats.health + 1),
    maxHealth: Math.min(PERSON_STAT_MAX, stats.maxHealth + 1),
    strength: Math.min(PERSON_STAT_MAX, stats.strength + 1),
    satiety: Math.min(PERSON_STAT_MAX, stats.satiety + 1),
    hydration: Math.min(PERSON_STAT_MAX, stats.hydration + 1),
    luck: Math.min(PERSON_STAT_MAX, stats.luck + 1),
    level: Math.min(PERSON_LEVEL_MAX, stats.level + 1),
  };
}

export function healthPercentage(
  stats: Pick<PersonStatsSummary, "health" | "maxHealth">,
) {
  if (stats.maxHealth <= 0) return 0;
  return (stats.health / stats.maxHealth) * 100;
}
