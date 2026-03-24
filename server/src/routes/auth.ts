import { Router } from 'express';
import { getDb } from '../db.js';
import { hashPassword, verifyPassword, generateToken } from '../auth.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Input validation helpers
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_-]{3,30}$/.test(username);
}

function isValidPassword(password: string): boolean {
  return typeof password === 'string' && password.length >= 8;
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      res.status(400).json({ success: false, error: 'Email, username, and password are required' });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({ success: false, error: 'Invalid email format' });
      return;
    }

    if (!isValidUsername(username)) {
      res.status(400).json({ success: false, error: 'Username must be 3-30 characters (letters, numbers, _ -)' });
      return;
    }

    if (!isValidPassword(password)) {
      res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
      return;
    }

    const db = getDb();

    // Check existing
    const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingEmail) {
      res.status(409).json({ success: false, error: 'Email already registered' });
      return;
    }

    const existingUsername = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existingUsername) {
      res.status(409).json({ success: false, error: 'Username already taken' });
      return;
    }

    const passwordHash = await hashPassword(password);

    const insertUser = db.prepare(
      'INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)'
    );
    const result = insertUser.run(email, username, passwordHash);
    const userId = result.lastInsertRowid as number;

    // Create profile
    db.prepare('INSERT INTO profiles (user_id) VALUES (?)').run(userId);

    // Create settings
    db.prepare('INSERT INTO settings (user_id) VALUES (?)').run(userId);

    const token = generateToken({ userId, email, username });

    res.cookie('token', token, COOKIE_OPTIONS);
    res.status(201).json({
      success: true,
      data: {
        user: { id: userId, email, username, avatarIndex: 0 },
      },
    });
  } catch (error) {
    console.error('[Auth] Register error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
      return;
    }

    const db = getDb();
    const user = db.prepare(
      'SELECT id, email, username, password_hash, avatar_index FROM users WHERE email = ?'
    ).get(email) as { id: number; email: string; username: string; password_hash: string; avatar_index: number } | undefined;

    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const token = generateToken({ userId: user.id, email: user.email, username: user.username });

    res.cookie('token', token, COOKIE_OPTIONS);
    res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, username: user.username, avatarIndex: user.avatar_index },
      },
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', (_req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ success: true });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare(
      'SELECT id, email, username, avatar_index FROM users WHERE id = ?'
    ).get(req.user!.userId) as { id: number; email: string; username: string; avatar_index: number } | undefined;

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, username: user.username, avatarIndex: user.avatar_index },
      },
    });
  } catch (error) {
    console.error('[Auth] Me error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
