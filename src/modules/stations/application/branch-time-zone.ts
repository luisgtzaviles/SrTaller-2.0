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

const calendarDate = /^\d{4}-\d{2}-\d{2}$/u;
const boundarySearchWindowMs = 36 * 60 * 60 * 1_000;

function assertCalendarDate(value: string): void {
  if (!calendarDate.test(value)) {
    throw new TypeError('Operational calendar date must be an ISO calendar date.');
  }
  const candidate = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(candidate.getTime()) || candidate.toISOString().slice(0, 10) !== value) {
    throw new TypeError('Operational calendar date must be valid.');
  }
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

/** Derives a Branch-local calendar date from an authoritative UTC instant. */
export function branchLocalCalendarDate(
  instant: Date,
  timeZone: BranchTimeZone,
): string {
  return presentOperationalDateTime(instant, timeZone).date;
}

/**
 * Converts a Branch-local calendar start to UTC using IANA rules. This does
 * not mutate persisted instants or depend on a process-global timezone.
 */
export function branchLocalCalendarBoundaryToUtc(
  localDate: string,
  timeZone: BranchTimeZone,
): Date {
  assertCalendarDate(localDate);
  const nominalUtc = new Date(`${localDate}T00:00:00.000Z`).getTime();
  let lower = nominalUtc - boundarySearchWindowMs;
  let upper = nominalUtc + boundarySearchWindowMs;

  if (
    branchLocalCalendarDate(new Date(lower), timeZone) >= localDate ||
    branchLocalCalendarDate(new Date(upper), timeZone) < localDate
  ) {
    throw new RangeError('Operational calendar boundary is outside the supported IANA window.');
  }

  while (upper - lower > 1) {
    const midpoint = lower + Math.floor((upper - lower) / 2);
    if (branchLocalCalendarDate(new Date(midpoint), timeZone) < localDate) {
      lower = midpoint;
    } else {
      upper = midpoint;
    }
  }

  return new Date(upper);
}
