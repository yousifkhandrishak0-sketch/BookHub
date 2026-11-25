import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const IN_MEMORY_SESSION_SECRET = crypto.randomBytes(32).toString('hex');

function getSessionSecret(): string {
  const envSecret = process.env.SESSION_SECRET?.trim();
  return envSecret && envSecret.length >= 16 ? envSecret : IN_MEMORY_SESSION_SECRET;
}

export type TokenRole = 'customer' | 'admin';

export interface SessionPayload {
  sub: string;
  role: TokenRole;
  jti: string;
  exp: number;
}

const revokedTokens = new Set<string>();

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, originalHex] = parts;
  if (!salt || !originalHex) return false;
  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const original = Buffer.from(originalHex, 'hex');
    if (derived.length !== original.length) return false;
    return crypto.timingSafeEqual(derived, original);
  } catch {
    return false;
  }
}

export function verifyPlaintextSecret(candidate: string, expected: string): boolean {
  const a = crypto.createHash('sha256').update(candidate).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

export function signSessionToken(sub: string, role: TokenRole, ttlSeconds = 60 * 60 * 24 * 7): string {
  const payload: SessionPayload = {
    sub,
    role,
    jti: crypto.randomUUID(),
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSessionSecret())
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, signature] = parts;
  if (!encoded || !signature) return null;
  const expectedSig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(encoded)
    .digest('base64url');
  const sigBuf = Buffer.from(signature, 'utf8');
  const expBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const decoded = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    if (!decoded.sub || !decoded.role || !decoded.jti || typeof decoded.exp !== 'number') {
      return null;
    }
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    if (revokedTokens.has(decoded.jti)) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function revokeSessionToken(token: string): void {
  const payload = verifySessionToken(token);
  if (payload) {
    revokedTokens.add(payload.jti);
  }
}

export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== 'string') return null;
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  return token.length > 0 ? token : null;
}

export interface AuthenticatedRequest extends Request {
  authSession?: SessionPayload;
}

export function requireCustomer(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  const session = verifySessionToken(token);
  if (!session || session.role !== 'customer') {
    res.status(401).json({ error: 'Invalid or expired customer session.' });
    return;
  }
  req.authSession = session;
  next();
}

export function optionalCustomer(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (token) {
    const session = verifySessionToken(token);
    if (session && session.role === 'customer') {
      req.authSession = session;
    }
  }
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Admin authentication required.' });
    return;
  }
  const session = verifySessionToken(token);
  if (!session || session.role !== 'admin') {
    res.status(403).json({ error: 'Admin privileges required.' });
    return;
  }
  req.authSession = session;
  next();
}

export function sanitizeText(input: unknown, maxLen: number): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 160;
}

export function isSafeMediaUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  if (url.startsWith('/src/assets/images/') || url.startsWith('/uploads/')) {
    return /^\/(src\/assets\/images|uploads)\/[a-zA-Z0-9._-]+$/.test(url);
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
}
