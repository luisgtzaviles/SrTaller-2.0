export const adminSessionCookieName = 'sr_admin_session';
export const adminSessionCsrfCookieName = 'sr_admin_session_csrf';
export const adminSessionLoginCsrfCookieName = 'sr_admin_login_csrf';
export const adminSessionCsrfHeaderName = 'x-sr-admin-csrf-token';

const tokenPattern = /^[A-Za-z0-9_-]{43}$/u;

export class AdminSessionCookieError extends Error {
  constructor() {
    super('Administrative Session cookie is invalid.');
    this.name = 'AdminSessionCookieError';
  }
}

function readUniqueCookie(header: string | undefined, name: string): string | null {
  if (typeof header !== 'string' || header.length > 8_192) return null;
  const values = header.split(';').map((entry) => entry.trim())
    .filter((entry) => entry.startsWith(`${name}=`))
    .map((entry) => entry.slice(name.length + 1));
  if (values.length === 0) return null;
  if (values.length !== 1 || !tokenPattern.test(values[0] ?? '')) {
    throw new AdminSessionCookieError();
  }
  return values[0] ?? null;
}

export function readAdminSessionCookies(header: string | undefined) {
  const bearer = readUniqueCookie(header, adminSessionCookieName);
  const csrf = readUniqueCookie(header, adminSessionCsrfCookieName);
  if (bearer && !csrf) throw new AdminSessionCookieError();
  return Object.freeze({ bearer, csrf });
}

export function readAdminSessionLoginCsrfCookie(header: string | undefined): string | null {
  return readUniqueCookie(header, adminSessionLoginCsrfCookieName);
}

function attributes(secure: boolean): readonly string[] {
  return ['SameSite=Strict', 'Path=/api/admin', ...(secure ? ['Secure'] : [])];
}

export function serializeAdminSessionCookies(bearer: string, csrf: string, secure: boolean): readonly string[] {
  if (!tokenPattern.test(bearer) || !tokenPattern.test(csrf)) throw new TypeError('Administrative Session cookie material is invalid.');
  return Object.freeze([
    [`${adminSessionCookieName}=${bearer}`, 'HttpOnly', ...attributes(secure), 'Max-Age=43200'].join('; '),
    [`${adminSessionCsrfCookieName}=${csrf}`, ...attributes(secure), 'Max-Age=43200'].join('; '),
  ]);
}

export function serializeAdminSessionLoginCsrfCookie(csrf: string, secure: boolean): string {
  if (!tokenPattern.test(csrf)) throw new TypeError('Administrative login CSRF material is invalid.');
  return [
    `${adminSessionLoginCsrfCookieName}=${csrf}`,
    'SameSite=Strict',
    'Path=/api/admin/session',
    ...(secure ? ['Secure'] : []),
    'Max-Age=900',
  ].join('; ');
}

export function expireAdminSessionCookies(secure: boolean): readonly string[] {
  return Object.freeze([
    [`${adminSessionCookieName}=`, 'HttpOnly', ...attributes(secure), 'Max-Age=0'].join('; '),
    [`${adminSessionCsrfCookieName}=`, ...attributes(secure), 'Max-Age=0'].join('; '),
  ]);
}
