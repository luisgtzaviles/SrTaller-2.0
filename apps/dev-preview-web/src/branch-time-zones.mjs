export const BRANCH_TIME_ZONE_OPTIONS = Object.freeze([
  Object.freeze({ timeZone: 'America/Tijuana', city: 'Tijuana' }),
  Object.freeze({ timeZone: 'America/Hermosillo', city: 'Hermosillo' }),
  Object.freeze({ timeZone: 'America/Mazatlan', city: 'Mazatlán' }),
  Object.freeze({ timeZone: 'America/Mexico_City', city: 'Ciudad de México' }),
  Object.freeze({ timeZone: 'America/Monterrey', city: 'Monterrey' }),
  Object.freeze({ timeZone: 'America/Cancun', city: 'Cancún' }),
]);

function utcOffset(timeZone, now) {
  const offset = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'longOffset',
  }).formatToParts(now).find((part) => part.type === 'timeZoneName')?.value;
  const match = /^GMT(?:(?<sign>[+-])(?<hours>\d{2}):(?<minutes>\d{2}))?$/u.exec(offset ?? '');
  if (!match) throw new TypeError('A valid IANA time zone is required.');
  return match.groups?.sign
    ? `UTC${match.groups.sign}${match.groups.hours}:${match.groups.minutes}`
    : 'UTC+00:00';
}

function cityFor(timeZone) {
  return BRANCH_TIME_ZONE_OPTIONS.find((option) => option.timeZone === timeZone)?.city
    ?? timeZone.split('/').at(-1)?.replaceAll('_', ' ')
    ?? timeZone;
}

/** Offset is presentation-only and is recalculated from the IANA authority. */
export function humanBranchTimeZoneLabel(timeZone, now = new Date()) {
  return `(${utcOffset(timeZone, now)}) ${cityFor(timeZone)}`;
}

export function branchTimeZoneOptions(currentTimeZone) {
  const current = BRANCH_TIME_ZONE_OPTIONS.some((option) => option.timeZone === currentTimeZone)
    ? []
    : [{ timeZone: currentTimeZone, city: cityFor(currentTimeZone) }];
  return Object.freeze([...current, ...BRANCH_TIME_ZONE_OPTIONS]);
}
