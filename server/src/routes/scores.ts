import { Router } from 'express';
import { getDb } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/scores — all user's high scores
router.get('/', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const scores = db.prepare(
      'SELECT song_id, difficulty, score, stars, accuracy, max_combo, played_at FROM high_scores WHERE user_id = ?'
    ).all(req.user!.userId) as Array<{
      song_id: string; difficulty: string; score: number; stars: number;
      accuracy: number; max_combo: number; played_at: string;
    }>;

    // Transform to the frontend format: { [songId]: { [difficulty]: HighScore } }
    const scoreMap: Record<string, Record<string, any>> = {};
    for (const s of scores) {
      if (!scoreMap[s.song_id]) scoreMap[s.song_id] = {};
      scoreMap[s.song_id][s.difficulty] = {
        songId: s.song_id,
        difficulty: s.difficulty,
        score: s.score,
        stars: s.stars,
        accuracy: s.accuracy,
        maxCombo: s.max_combo,
        date: s.played_at,
      };
    }

    res.json({ success: true, data: scoreMap });
  } catch (error) {
    console.error('[Scores] Get error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/scores — save/update high score (only if higher)
router.post('/', requireAuth, (req, res) => {
  try {
    const { songId, difficulty, score, stars, accuracy, maxCombo } = req.body;

    if (!songId || !difficulty || score == null) {
      res.status(400).json({ success: false, error: 'songId, difficulty, and score are required' });
      return;
    }

    const db = getDb();
    const existing = db.prepare(
      'SELECT score FROM high_scores WHERE user_id = ? AND song_id = ? AND difficulty = ?'
    ).get(req.user!.userId, songId, difficulty) as { score: number } | undefined;

    if (existing && existing.score >= score) {
      res.json({ success: true, data: { updated: false, message: 'Existing score is higher' } });
      return;
    }

    db.prepare(`
      INSERT INTO high_scores (user_id, song_id, difficulty, score, stars, accuracy, max_combo)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, song_id, difficulty)
      DO UPDATE SET score = ?, stars = ?, accuracy = ?, max_combo = ?, played_at = CURRENT_TIMESTAMP
    `).run(
      req.user!.userId, songId, difficulty, score, stars ?? 0, accuracy ?? 0, maxCombo ?? 0,
      score, stars ?? 0, accuracy ?? 0, maxCombo ?? 0
    );

    res.json({ success: true, data: { updated: true } });
  } catch (error) {
    console.error('[Scores] Save error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
