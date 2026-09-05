declare const branchTimeZoneBrand: unique symbol;

/** A validated IANA time-zone identifier owned by an operational Branch. */
export type BranchTimeZone = string & {
  readonly [branchTimeZoneBrand]: 'BranchTimeZone';
};

const fixedOffset = /^(?:[+-]\d{2}:?\d{2}|Etc\/GMT[+-]\d{1,2})$/u;

export function parseBranchTimeZone(value: unknown): BranchTimeZone {
  if (typeof value !== 'string' || value.trim() === '' || fixedOffset.test(value)) {
    throw new TypeError('Branch time zone must be an IANA time-zone identifier.');
  }

  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: value })
      .resolvedOptions().timeZone as BranchTimeZone;
  } catch {
    throw new TypeError('Branch time zone must be an IANA time-zone identifier.');
  }
}

export interface OperationalDateTime {
  readonly date: string;
  readonly time: string;
  readonly timeZone: BranchTimeZone;
}

/**
 * Renders an already-authoritative instant for a Branch. It never derives or
 * mutates the stored instant, so a later branch time-zone change has no
 * historical rewrite effect.
 */
export function presentOperationalDateTime(
  instant: Date,
  timeZone: BranchTimeZone,
): OperationalDateTime {
  if (!(instant instanceof Date) || !Number.isFinite(instant.getTime())) {
    throw new TypeError('Operational instant must be valid.');
  }
  const parts = new Intl.DateTimeFormat('en-CA', {
    calendar: 'iso8601',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
    timeZone,
    year: 'numeric',
  }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((candidate) => candidate.type === type)?.value ?? '';
  return Object.freeze({
    date: `${part('year')}-${part('month')}-${part('day')}`,
    time: `${part('hour')}:${part('minute')}`,
    timeZone,
  });
}
