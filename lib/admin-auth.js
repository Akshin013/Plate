import { createHmac, timingSafeEqual } from 'node:crypto';

export const ADMIN_COOKIE = 'carid_admin_session';
const SESSION_TTL_SECONDS = 12 * 60 * 60;

function sessionSignature(expiresAt, password) {
  return createHmac('sha256', password).update(expiresAt).digest('hex');
}

export function createAdminSession(password) {
  const expiresAt = String(Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS);
  return `${expiresAt}.${sessionSignature(expiresAt, password)}`;
}

export function isValidAdminSession(value, password) {
  if (!value || !password) return false;

  const [expiresAt, signature, extra] = value.split('.');
  if (!expiresAt || !signature || extra || !/^\d+$/.test(expiresAt)) return false;
  if (Number(expiresAt) <= Math.floor(Date.now() / 1000)) return false;

  const expected = sessionSignature(expiresAt, password);
  const actualBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  return actualBuffer.length === expectedBuffer.length
    && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function hasAdminAccess(request) {
  return isValidAdminSession(
    request.cookies.get(ADMIN_COOKIE)?.value,
    process.env.ADMIN_PASSWORD,
  );
}
