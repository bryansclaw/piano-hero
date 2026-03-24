import { Router } from 'express';
import { getDb } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/friends — list friends with their public profiles
router.get('/', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const friends = db.prepare(`
      SELECT f.friend_username,
             u.avatar_index,
             COALESCE(p.level, 1) as level,
             COALESCE(p.xp, 0) as xp
      FROM friends f
      LEFT JOIN users u ON u.username = f.friend_username
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE f.user_id = ?
      ORDER BY f.added_at DESC
    `).all(req.user!.userId) as Array<{
      friend_username: string; avatar_index: number | null;
      level: number; xp: number;
    }>;

    const data = friends.map(f => ({
      username: f.friend_username,
      avatarIndex: f.avatar_index ?? Math.floor(Math.random() * 12),
      level: f.level,
      xp: f.xp,
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('[Friends] Get error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/friends — add friend by username
router.post('/', requireAuth, (req, res) => {
  try {
    const { username } = req.body;

    if (!username || typeof username !== 'string') {
      res.status(400).json({ success: false, error: 'Username is required' });
      return;
    }

    if (username === req.user!.username) {
      res.status(400).json({ success: false, error: 'Cannot add yourself as a friend' });
      return;
    }

    const db = getDb();

    // Check if already friends
    const existing = db.prepare(
      'SELECT 1 FROM friends WHERE user_id = ? AND friend_username = ?'
    ).get(req.user!.userId, username);

    if (existing) {
      res.status(409).json({ success: false, error: 'Already friends with this user' });
      return;
    }

    db.prepare(
      'INSERT INTO friends (user_id, friend_username) VALUES (?, ?)'
    ).run(req.user!.userId, username);

    // Get friend info if they exist
    const friendUser = db.prepare(`
      SELECT u.avatar_index, COALESCE(p.level, 1) as level, COALESCE(p.xp, 0) as xp
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE u.username = ?
    `).get(username) as { avatar_index: number; level: number; xp: number } | undefined;

    res.status(201).json({
      success: true,
      data: {
        username,
        avatarIndex: friendUser?.avatar_index ?? Math.floor(Math.random() * 12),
        level: friendUser?.level ?? 1,
        xp: friendUser?.xp ?? 0,
      },
    });
  } catch (error) {
    console.error('[Friends] Add error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/friends/:username — remove friend
router.delete('/:username', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare(
      'DELETE FROM friends WHERE user_id = ? AND friend_username = ?'
    ).run(req.user!.userId, req.params.username);

    if (result.changes === 0) {
      res.status(404).json({ success: false, error: 'Friend not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[Friends] Remove error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
