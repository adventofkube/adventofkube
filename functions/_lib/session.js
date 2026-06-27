// Signed session-cookie helpers (no external deps; Web Crypto HMAC-SHA256).
// A session token is `base64url(payloadJson).base64url(hmac)` where the HMAC is
// over the payload segment using SESSION_SECRET. Payload: { uid, login, avatar, exp }.

const COOKIE_NAME = 'aok_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function b64urlEncode(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlEncodeString(str) {
  return b64urlEncode(new TextEncoder().encode(str));
}

function b64urlDecodeToString(b64url) {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

async function sign(data, secret) {
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return b64urlEncode(new Uint8Array(sig));
}

// Constant-time string comparison.
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Parse the Cookie header into a plain object.
export function parseCookies(request) {
  const header = request.headers.get('Cookie') || '';
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i === -1) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

// Build a Set-Cookie value. Secure is safe on localhost (treated as secure context).
export function buildCookie(name, value, { maxAge, httpOnly = true } = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'SameSite=Lax', 'Secure'];
  if (httpOnly) parts.push('HttpOnly');
  if (maxAge === 0) parts.push('Max-Age=0');
  else if (maxAge) parts.push(`Max-Age=${maxAge}`);
  return parts.join('; ');
}

// Create the signed session token + its Set-Cookie header value.
export async function createSessionCookie(env, { uid, login, avatar }) {
  const payload = { uid, login, avatar, exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS };
  const payloadSeg = b64urlEncodeString(JSON.stringify(payload));
  const sig = await sign(payloadSeg, env.SESSION_SECRET);
  const token = `${payloadSeg}.${sig}`;
  return buildCookie(COOKIE_NAME, token, { maxAge: MAX_AGE_SECONDS });
}

// Verify the session cookie. Returns { uid, login, avatar } or null.
export async function verifySession(request, env) {
  const token = parseCookies(request)[COOKIE_NAME];
  if (!token) return null;
  const dot = token.indexOf('.');
  if (dot === -1) return null;
  const payloadSeg = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expected = await sign(payloadSeg, env.SESSION_SECRET);
  if (!timingSafeEqual(sig, expected)) return null;

  let payload;
  try {
    payload = JSON.parse(b64urlDecodeToString(payloadSeg));
  } catch {
    return null;
  }
  if (!payload || typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  return { uid: payload.uid, login: payload.login, avatar: payload.avatar };
}

export function clearSessionCookie() {
  return buildCookie(COOKIE_NAME, '', { maxAge: 0 });
}
