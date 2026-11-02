export function clampWorkspaceDimension(
  value: number,
  min: number,
  max: number,
): number {
  if (![value, min, max].every(Number.isFinite) || min > max) return min;
  return Math.round(Math.max(min, Math.min(max, value)));
}
