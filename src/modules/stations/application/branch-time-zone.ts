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
const localDateTime = /^(?<date>\d{4}-\d{2}-\d{2})T(?<hour>[01]\d|2[0-3]):(?<minute>[0-5]\d)$/u;
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
 * Interprets an operator-entered Branch-local wall clock as an absolute UTC
 * instant. Browser/process time zones are deliberately ignored. Missing and
 * repeated civil times fail closed instead of silently choosing an offset.
 */
export function branchLocalDateTimeToUtc(
  value: string,
  timeZone: BranchTimeZone,
): Date {
  const match = localDateTime.exec(value);
  if (!match?.groups) {
    throw new TypeError('Operational local date and time must use YYYY-MM-DDTHH:mm.');
  }
  const date = match.groups.date;
  const hour = match.groups.hour;
  const minute = match.groups.minute;
  if (!date || !hour || !minute) throw new TypeError('Operational local date and time is invalid.');
  assertCalendarDate(date);
  const nominalUtc = Date.parse(`${date}T${hour}:${minute}:00.000Z`);
  const samples = [nominalUtc - 86_400_000, nominalUtc, nominalUtc + 86_400_000];
  const candidates = new Map<number, Date>();

  for (const sample of samples) {
    const presented = presentOperationalDateTime(new Date(sample), timeZone);
    const presentedAsUtc = Date.parse(`${presented.date}T${presented.time}:00.000Z`);
    const candidate = new Date(nominalUtc - (presentedAsUtc - sample));
    const roundTrip = presentOperationalDateTime(candidate, timeZone);
    if (roundTrip.date === date && roundTrip.time === `${hour}:${minute}`) {
      candidates.set(candidate.getTime(), candidate);
    }
  }

  if (candidates.size !== 1) {
    throw new RangeError('Operational local date and time is missing or ambiguous in the Branch time zone.');
  }
  const result = [...candidates.values()][0];
  if (!result) throw new RangeError('Operational local date and time could not be resolved.');
  return result;
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
