import { Router } from 'express';
import { getDb } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/profile
router.get('/', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const profile = db.prepare(`
      SELECT p.*, u.username, u.email, u.avatar_index, u.created_at as join_date
      FROM profiles p
      JOIN users u ON u.id = p.user_id
      WHERE p.user_id = ?
    `).get(req.user!.userId) as any;

    if (!profile) {
      res.status(404).json({ success: false, error: 'Profile not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        username: profile.username,
        avatarIndex: profile.avatar_index,
        xp: profile.xp,
        level: profile.level,
        badges: JSON.parse(profile.badges || '[]'),
        songsPlayed: profile.songs_played,
        songsMastered: profile.songs_mastered,
        totalPracticeTime: profile.total_practice_time,
        joinDate: profile.join_date,
        dailyStreak: profile.current_streak,
        longestStreak: profile.longest_streak,
        lastPlayedDate: profile.last_played_date || '',
        streakFreezes: profile.streak_freezes,
      },
    });
  } catch (error) {
    console.error('[Profile] Get error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/profile — update profile
router.put('/', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const {
      username, avatarIndex, xp, level, badges, songsPlayed, songsMastered,
      totalPracticeTime, dailyStreak, longestStreak, lastPlayedDate, streakFreezes,
    } = req.body;

    // Update user table fields
    if (username !== undefined) {
      if (!/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
        res.status(400).json({ success: false, error: 'Invalid username format' });
        return;
      }
      const existing = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, req.user!.userId);
      if (existing) {
        res.status(409).json({ success: false, error: 'Username already taken' });
        return;
      }
      db.prepare('UPDATE users SET username = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(username, req.user!.userId);
    }

    if (avatarIndex !== undefined) {
      db.prepare('UPDATE users SET avatar_index = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(avatarIndex, req.user!.userId);
    }

    // Update profile table fields
    const updates: string[] = [];
    const values: any[] = [];

    const profileFields: Record<string, string> = {
      xp: 'xp',
      level: 'level',
      songsPlayed: 'songs_played',
      songsMastered: 'songs_mastered',
      totalPracticeTime: 'total_practice_time',
      dailyStreak: 'current_streak',
      longestStreak: 'longest_streak',
      lastPlayedDate: 'last_played_date',
      streakFreezes: 'streak_freezes',
    };

    for (const [jsKey, dbCol] of Object.entries(profileFields)) {
      const val = req.body[jsKey];
      if (val !== undefined) {
        updates.push(`${dbCol} = ?`);
        values.push(val);
      }
    }

    if (badges !== undefined) {
      updates.push('badges = ?');
      values.push(JSON.stringify(badges));
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(req.user!.userId);
      db.prepare(`UPDATE profiles SET ${updates.join(', ')} WHERE user_id = ?`).run(...values);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[Profile] Update error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/profile/xp — add XP after game
router.post('/xp', requireAuth, (req, res) => {
  try {
    const { xp, level, songsPlayed, songsMastered, totalPracticeTime,
      dailyStreak, longestStreak, lastPlayedDate, streakFreezes, badges } = req.body;

    if (xp == null) {
      res.status(400).json({ success: false, error: 'xp is required' });
      return;
    }

    const db = getDb();
    db.prepare(`
      UPDATE profiles SET
        xp = ?, level = ?, songs_played = ?, songs_mastered = ?,
        total_practice_time = ?, current_streak = ?, longest_streak = ?,
        last_played_date = ?, streak_freezes = ?, badges = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(
      xp, level ?? 1, songsPlayed ?? 0, songsMastered ?? 0,
      totalPracticeTime ?? 0, dailyStreak ?? 0, longestStreak ?? 0,
      lastPlayedDate ?? '', streakFreezes ?? 3, JSON.stringify(badges ?? []),
      req.user!.userId
    );

    res.json({ success: true });
  } catch (error) {
    console.error('[Profile] XP error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
