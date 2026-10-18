import express from 'express';
import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

const COOKIE_NAME = 'mds_session';
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

export const createAuthentication = () => {
  const password = process.env.APP_ACCESS_PASSWORD;
  const sessionSecret = process.env.APP_SESSION_SECRET;

  if (!password || !sessionSecret) {
    throw new Error(
      'APP_ACCESS_PASSWORD and APP_SESSION_SECRET must be configured.'
    );
  }

  if (Buffer.byteLength(sessionSecret) < 32) {
    throw new Error(
      'APP_SESSION_SECRET must contain at least 32 bytes.'
    );
  }

  const expectedPasswordHash = createHash('sha256')
    .update(password, 'utf8')
    .digest();

  const failedAttempts = new Map();
  const router = express.Router();

  const sign = (value) =>
    createHmac('sha256', sessionSecret)
      .update(value)
      .digest('hex');

  const checkPassword = (value) => {
    const suppliedHash = createHash('sha256')
      .update(typeof value === 'string' ? value : '', 'utf8')
      .digest();

    return timingSafeEqual(
      suppliedHash,
      expectedPasswordHash
    );
  };

  const createSession = () => {
    const expiry = Date.now() + SESSION_DURATION_MS;
    const nonce = randomBytes(16).toString('hex');
    const payload = `${expiry}.${nonce}`;

    return `${payload}.${sign(payload)}`;
  };

  const getSessionCookie = (req) => {
    const prefix = `${COOKIE_NAME}=`;

    const entry = String(req.headers.cookie || '')
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(prefix));

    return entry ? entry.slice(prefix.length) : null;
  };

  const hasValidSession = (req) => {
    const token = getSessionCookie(req);

    if (!token) return false;

    const parts = token.split('.');

    if (parts.length !== 3) return false;

    const [expiryText, nonce, signature] = parts;

    if (
      !/^\d+$/.test(expiryText) ||
      !/^[a-f0-9]{32}$/.test(nonce) ||
      !/^[a-f0-9]{64}$/.test(signature)
    ) {
      return false;
    }

    const expiry = Number(expiryText);

    if (!Number.isSafeInteger(expiry) || expiry <= Date.now()) {
      return false;
    }

    const expectedSignature = Buffer.from(
      sign(`${expiryText}.${nonce}`),
      'hex'
    );

    const suppliedSignature = Buffer.from(signature, 'hex');

    return timingSafeEqual(
      suppliedSignature,
      expectedSignature
    );
  };

  const cookieOptions = () => {
    const secure =
      process.env.NODE_ENV === 'production'
        ? '; Secure'
        : '';

    return `Path=/api; HttpOnly; SameSite=Strict${secure}`;
  };

  const setSessionCookie = (res) => {
    res.setHeader(
      'Set-Cookie',
      `${COOKIE_NAME}=${createSession()}; Max-Age=${
        SESSION_DURATION_MS / 1000
      }; ${cookieOptions()}`
    );
  };

  const clearSessionCookie = (res) => {
    res.setHeader(
      'Set-Cookie',
      `${COOKIE_NAME}=; Max-Age=0; ${cookieOptions()}`
    );
  };

  const requireAuth = (req, res, next) => {
    if (!hasValidSession(req)) {
      return res.status(401).json({
        error: 'Authentication required.',
      });
    }

    next();
  };

  router.get('/session', (req, res) => {
    res.json({
      authenticated: hasValidSession(req),
    });
  });

  router.post('/login', (req, res) => {
    const key = req.ip;
    const now = Date.now();

    for (const [ip, attempt] of failedAttempts) {
      if (attempt.expiresAt <= now) {
        failedAttempts.delete(ip);
      }
    }

    const previous = failedAttempts.get(key);

    if (
      previous &&
      previous.count >= MAX_FAILED_ATTEMPTS &&
      previous.expiresAt > now
    ) {
      res.setHeader(
        'Retry-After',
        String(
          Math.ceil((previous.expiresAt - now) / 1000)
        )
      );

      return res.status(429).json({
        error: 'Too many login attempts.',
      });
    }

    const submittedPassword = req.body?.password;

    if (
      typeof submittedPassword !== 'string' ||
      submittedPassword.length > 128 ||
      !checkPassword(submittedPassword)
    ) {
      failedAttempts.set(key, {
        count: (previous?.count || 0) + 1,
        expiresAt: previous?.expiresAt || now + ATTEMPT_WINDOW_MS,
      });

      return res.status(401).json({
        error: 'Invalid password.',
      });
    }

    failedAttempts.delete(key);
    setSessionCookie(res);

    return res.json({
      authenticated: true,
    });
  });

  router.post('/logout', (req, res) => {
    clearSessionCookie(res);

    res.json({
      authenticated: false,
    });
  });

  return { router, requireAuth };
};