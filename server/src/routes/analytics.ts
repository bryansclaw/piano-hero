import { Router } from 'express';
import { getDb } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/analytics — full analytics data
router.get('/', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const userId = req.user!.userId;

    // Session history
    const sessions = db.prepare(`
      SELECT song_id, difficulty, score, accuracy, duration, played_at
      FROM analytics_sessions
      WHERE user_id = ?
      ORDER BY played_at DESC
      LIMIT 200
    `).all(userId) as Array<{
      song_id: string; difficulty: string; score: number;
      accuracy: number; duration: number; played_at: string;
    }>;

    const sessionHistory = sessions.map(s => ({
      songId: s.song_id,
      difficulty: s.difficulty,
      date: s.played_at,
      score: s.score,
      accuracy: s.accuracy,
      duration: s.duration,
    }));

    // Key accuracy
    const keys = db.prepare(
      'SELECT midi_note, correct, total FROM key_accuracy WHERE user_id = ?'
    ).all(userId) as Array<{ midi_note: number; correct: number; total: number }>;

    const keyAccuracy = keys.map(k => ({
      midi: k.midi_note,
      totalHits: k.total,
      correctHits: k.correct,
      accuracy: k.total > 0 ? Math.round((k.correct / k.total) * 100) : 0,
    }));

    // Build daily practice and song accuracy trends from sessions
    const dailyMap = new Map<string, {
      date: string; totalMinutes: number; sessions: number;
      totalAccuracy: number; songsPlayed: Set<string>;
    }>();
    const songTrends: Record<string, { date: string; accuracy: number }[]> = {};

    for (const s of sessions) {
      const date = s.played_at.split('T')[0] || s.played_at.split(' ')[0];

      // Daily
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date, totalMinutes: 0, sessions: 0, totalAccuracy: 0,
          songsPlayed: new Set(),
        });
      }
      const day = dailyMap.get(date)!;
      day.totalMinutes += Math.round(s.duration / 60);
      day.sessions += 1;
      day.totalAccuracy += s.accuracy;
      day.songsPlayed.add(s.song_id);

      // Song trends
      if (!songTrends[s.song_id]) songTrends[s.song_id] = [];
      songTrends[s.song_id].push({ date: s.played_at, accuracy: s.accuracy });
    }

    const dailyPractice = Array.from(dailyMap.values()).map(d => ({
      date: d.date,
      totalMinutes: d.totalMinutes,
      sessions: d.sessions,
      averageAccuracy: d.sessions > 0 ? Math.round(d.totalAccuracy / d.sessions) : 0,
      songsPlayed: Array.from(d.songsPlayed),
    }));

    // Keep last 50 per song
    for (const songId of Object.keys(songTrends)) {
      if (songTrends[songId].length > 50) {
        songTrends[songId] = songTrends[songId].slice(-50);
      }
    }

    res.json({
      success: true,
      data: {
        dailyPractice,
        keyAccuracy,
        sessionHistory,
        songAccuracyTrends: songTrends,
      },
    });
  } catch (error) {
    console.error('[Analytics] Get error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/analytics/session — record a practice/game session
router.post('/session', requireAuth, (req, res) => {
  try {
    const { songId, difficulty, score, accuracy, duration } = req.body;

    if (!songId || !difficulty) {
      res.status(400).json({ success: false, error: 'songId and difficulty are required' });
      return;
    }

    const db = getDb();
    db.prepare(`
      INSERT INTO analytics_sessions (user_id, song_id, difficulty, score, accuracy, duration)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.user!.userId, songId, difficulty, score ?? 0, accuracy ?? 0, duration ?? 0);

    res.json({ success: true });
  } catch (error) {
    console.error('[Analytics] Session error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/analytics/keys — update key accuracy data
router.post('/keys', requireAuth, (req, res) => {
  try {
    const { keys } = req.body; // Array of { midi, correct, total }

    if (!Array.isArray(keys)) {
      res.status(400).json({ success: false, error: 'keys array is required' });
      return;
    }

    const db = getDb();
    const upsert = db.prepare(`
      INSERT INTO key_accuracy (user_id, midi_note, correct, total)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, midi_note)
      DO UPDATE SET correct = correct + ?, total = total + ?
    `);

    const insertMany = db.transaction((items: Array<{ midi: number; correct: number; total: number }>) => {
      for (const item of items) {
        upsert.run(req.user!.userId, item.midi, item.correct, item.total, item.correct, item.total);
      }
    });

    insertMany(keys);

    res.json({ success: true });
  } catch (error) {
    console.error('[Analytics] Keys error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
