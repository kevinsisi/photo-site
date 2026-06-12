import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/requireAuth.js';

export const authRouter = Router();

// Rate limit: max 10 failures per 15 min window per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later' },
});

// POST /api/admin/login
authRouter.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body as {
    username?: string;
    password?: string;
  };

  if (
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    !username ||
    !password
  ) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const expectedUsername = process.env.ADMIN_USERNAME ?? '';
  const passwordHash = process.env.ADMIN_PASSWORD_HASH ?? '';

  // Unified error message — do not reveal which field is wrong
  const usernameMatch = username === expectedUsername;
  const passwordMatch = usernameMatch
    ? await bcrypt.compare(password, passwordHash)
    : false;

  if (!usernameMatch || !passwordMatch) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  (req.session as { adminLoggedIn?: boolean }).adminLoggedIn = true;
  req.session.save((err) => {
    if (err) {
      res.status(500).json({ error: 'Session error' });
      return;
    }
    res.json({ ok: true });
  });
});

// POST /api/admin/logout
authRouter.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: 'Logout error' });
      return;
    }
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

// GET /api/admin/me
authRouter.get('/me', requireAuth, (_req, res) => {
  res.json({ ok: true });
});
