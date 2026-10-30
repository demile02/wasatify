export function normalizeQuizPoints(weights: number[], maximum = 100): number[] {
  if (!weights.length) return [];
  if (!Number.isInteger(maximum) || maximum < weights.length) {
    throw new Error(`Kuis maksimal ${maximum} pertanyaan agar nilai tetap ${maximum} poin.`);
  }

  const safeWeights = weights.map((weight) => Number.isFinite(weight) && weight > 0 ? weight : 1);
  const totalWeight = safeWeights.reduce((total, weight) => total + weight, 0);
  if (totalWeight === maximum && safeWeights.every(Number.isInteger)) return safeWeights;
  const remainingPoints = maximum - safeWeights.length;
  const exactShares = safeWeights.map((weight) => (remainingPoints * weight) / totalWeight);
  const points = exactShares.map((share) => 1 + Math.floor(share));
  const remainder = maximum - points.reduce((total, point) => total + point, 0);
  const byLargestRemainder = exactShares
    .map((share, index) => ({ index, remainder: share - Math.floor(share) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);

  for (let index = 0; index < remainder; index += 1) {
    points[byLargestRemainder[index].index] += 1;
  }

  return points;
}
