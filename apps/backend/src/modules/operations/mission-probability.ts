export const MIN_OPERATION_PROBABILITY = 5;
export const MAX_OPERATION_PROBABILITY = 95;
export const MAX_LUCK = 31;
export const MAX_LUCK_BONUS_POINTS = 10;

export function clampProbability(value: number) {
  return Math.min(
    MAX_OPERATION_PROBABILITY,
    Math.max(MIN_OPERATION_PROBABILITY, value),
  );
}

export function calculateLuckBonus(
  luckValues: number[],
  maxLuck = MAX_LUCK,
) {
  if (luckValues.length === 0 || maxLuck <= 0) return 0;

  const averageLuck =
    luckValues.reduce((total, luck) => total + luck, 0) / luckValues.length;

  return Math.min(
    MAX_LUCK_BONUS_POINTS,
    Math.max(0, (averageLuck / maxLuck) * MAX_LUCK_BONUS_POINTS),
  );
}

export function calculateMissionProbability(input: {
  baseProbability: number;
  luckValues: number[];
  professionBonusPoints?: number;
}) {
  const luckBonusPoints = calculateLuckBonus(input.luckValues);
  const professionBonusPoints = input.professionBonusPoints ?? 0;
  const probability = clampProbability(
    input.baseProbability + luckBonusPoints + professionBonusPoints,
  );

  return {
    baseProbability: input.baseProbability,
    luckBonusPoints,
    professionBonusPoints,
    probability,
  };
}

export function rollPercentage(random: () => number = Math.random) {
  return Number((random() * 100).toFixed(2));
}

export function rollSucceeds(probability: number, roll: number) {
  return roll <= clampProbability(probability);
}

export function randomInteger(
  minimum: number,
  maximum: number,
  random: () => number = Math.random,
) {
  if (maximum <= minimum) return minimum;
  return Math.floor(random() * (maximum - minimum + 1)) + minimum;
}
