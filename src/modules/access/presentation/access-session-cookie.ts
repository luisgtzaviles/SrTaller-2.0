export const operationalSessionCookieName = 'sr_session';
export const operationalSessionCsrfCookieName = 'sr_session_csrf';
export const operationalSessionLoginCsrfCookieName = 'sr_session_login_csrf';
export const operationalSessionCsrfHeaderName = 'x-sr-csrf-token';

const tokenPattern = /^[A-Za-z0-9_-]{43}$/u;

export class OperationalSessionCookieError extends Error {
  constructor() {
    super('Session cookie is invalid.');
    this.name = 'OperationalSessionCookieError';
  }
}

function readUniqueCookie(header: string | undefined, name: string): string | null {
  if (typeof header !== 'string' || header.length > 8_192) return null;
  const values = header.split(';').map((entry) => entry.trim())
    .filter((entry) => entry.startsWith(`${name}=`))
    .map((entry) => entry.slice(name.length + 1));
  if (values.length === 0) return null;
  if (values.length !== 1 || !tokenPattern.test(values[0] ?? '')) {
    throw new OperationalSessionCookieError();
  }
  return values[0] ?? null;
}

export function readOperationalSessionCookies(header: string | undefined) {
  const bearer = readUniqueCookie(header, operationalSessionCookieName);
  const csrf = readUniqueCookie(header, operationalSessionCsrfCookieName);
  if (bearer && !csrf) throw new OperationalSessionCookieError();
  return Object.freeze({ bearer, csrf });
}

export function readOperationalSessionLoginCsrfCookie(header: string | undefined): string | null {
  return readUniqueCookie(header, operationalSessionLoginCsrfCookieName);
}

function attributes(secure: boolean): readonly string[] {
  return ['SameSite=Strict', 'Path=/', ...(secure ? ['Secure'] : [])];
}

export function serializeOperationalSessionCookies(bearer: string, csrf: string, secure: boolean): readonly string[] {
  if (!tokenPattern.test(bearer) || !tokenPattern.test(csrf)) throw new TypeError('Session cookie material is invalid.');
  return Object.freeze([
    [`${operationalSessionCookieName}=${bearer}`, 'HttpOnly', ...attributes(secure), 'Max-Age=43200'].join('; '),
    [`${operationalSessionCsrfCookieName}=${csrf}`, ...attributes(secure), 'Max-Age=43200'].join('; '),
  ]);
}

export function serializeOperationalSessionCsrfCookie(csrf: string, secure: boolean): string {
  if (!tokenPattern.test(csrf)) throw new TypeError('Session CSRF material is invalid.');
  return [`${operationalSessionCsrfCookieName}=${csrf}`, ...attributes(secure), 'Max-Age=43200'].join('; ');
}

export function serializeOperationalSessionLoginCsrfCookie(csrf: string, secure: boolean): string {
  if (!tokenPattern.test(csrf)) throw new TypeError('Login CSRF material is invalid.');
  return [
    `${operationalSessionLoginCsrfCookieName}=${csrf}`,
    'SameSite=Strict',
    'Path=/api/access/session',
    ...(secure ? ['Secure'] : []),
    'Max-Age=900',
  ].join('; ');
}

export function expireOperationalSessionCookies(secure: boolean): readonly string[] {
  return Object.freeze([
    [`${operationalSessionCookieName}=`, 'HttpOnly', ...attributes(secure), 'Max-Age=0'].join('; '),
    [`${operationalSessionCsrfCookieName}=`, ...attributes(secure), 'Max-Age=0'].join('; '),
  ]);
}

export function requestIsSameOrigin(input: Readonly<{
  origin?: string | undefined;
  host?: string | undefined;
  forwardedProto?: string | undefined;
  fetchSite?: string | undefined;
}>): boolean {
  if (input.fetchSite !== 'same-origin' || !input.origin || !input.host) return false;
  const protocol = input.forwardedProto === 'https' ? 'https' : 'http';
  return input.origin === `${protocol}://${input.host}`;
}
