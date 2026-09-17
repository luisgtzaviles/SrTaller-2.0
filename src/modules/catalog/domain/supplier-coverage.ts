/**
 * A complete supplier list remains valid data even when it is unexpectedly
 * small. This policy only asks the applying actor to acknowledge the risk that
 * it would replace the automatic coverage baseline; it never blocks or mutates
 * Catalog items by absence.
 */
export const COMPLETE_BASELINE_PLAUSIBILITY_MINIMUM_BASELINE_COUNT = 20;
export const COMPLETE_BASELINE_PLAUSIBILITY_MAX_CURRENT_RATIO = 0.25;

export type SupplierCoveragePlausibility = Readonly<{
  status: 'NORMAL' | 'REVIEW_REQUIRED';
  reason: 'LARGE_COVERAGE_DROP' | null;
  baselineCount: number | null;
  currentCount: number;
  continuedCount: number | null;
  notObservedCount: number | null;
  additionalCount: number | null;
  absoluteDrop: number | null;
  reductionPercent: number | null;
}>;

export function assessCompleteBaselinePlausibility(input: Readonly<{
  baselineCount: number | null;
  currentCount: number;
  continuedCount: number | null;
  notObservedCount: number | null;
  additionalCount: number | null;
}>): SupplierCoveragePlausibility {
  const { baselineCount, currentCount, continuedCount, notObservedCount, additionalCount } = input;
  if (baselineCount === null) return Object.freeze({ status: 'NORMAL', reason: null, baselineCount, currentCount, continuedCount, notObservedCount, additionalCount, absoluteDrop: null, reductionPercent: null });
  const absoluteDrop = Math.max(0, baselineCount - currentCount);
  const reductionPercent = baselineCount === 0 ? 0 : Math.round((absoluteDrop / baselineCount) * 100);
  const reviewRequired = baselineCount >= COMPLETE_BASELINE_PLAUSIBILITY_MINIMUM_BASELINE_COUNT
    && currentCount / baselineCount <= COMPLETE_BASELINE_PLAUSIBILITY_MAX_CURRENT_RATIO;
  return Object.freeze({ status: reviewRequired ? 'REVIEW_REQUIRED' : 'NORMAL', reason: reviewRequired ? 'LARGE_COVERAGE_DROP' : null, baselineCount, currentCount, continuedCount, notObservedCount, additionalCount, absoluteDrop, reductionPercent });
}
