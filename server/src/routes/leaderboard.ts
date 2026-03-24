import { Router } from 'express';
import { getDb } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/leaderboard/:songId?difficulty=easy — top 20 + user's rank
router.get('/:songId', requireAuth, (req, res) => {
  try {
    const { songId } = req.params;
    const difficulty = (req.query.difficulty as string) || 'easy';

    const db = getDb();

    const top20 = db.prepare(`
      SELECT u.username, u.avatar_index, hs.score, hs.accuracy, hs.stars, hs.played_at
      FROM high_scores hs
      JOIN users u ON u.id = hs.user_id
      WHERE hs.song_id = ? AND hs.difficulty = ?
      ORDER BY hs.score DESC
      LIMIT 20
    `).all(songId, difficulty) as Array<{
      username: string; avatar_index: number; score: number;
      accuracy: number; stars: number; played_at: string;
    }>;

    const entries = top20.map((row, i) => ({
      rank: i + 1,
      username: row.username,
      score: row.score,
      accuracy: row.accuracy,
      stars: row.stars,
      date: row.played_at,
      isPlayer: row.username === req.user!.username,
    }));

    // If user not in top 20, get their rank
    const isUserInTop = entries.some(e => e.isPlayer);
    let userEntry = null;

    if (!isUserInTop) {
      const userScore = db.prepare(
        'SELECT score, accuracy, stars, played_at FROM high_scores WHERE user_id = ? AND song_id = ? AND difficulty = ?'
      ).get(req.user!.userId, songId, difficulty) as { score: number; accuracy: number; stars: number; played_at: string } | undefined;

      if (userScore) {
        const rank = db.prepare(
          'SELECT COUNT(*) as count FROM high_scores WHERE song_id = ? AND difficulty = ? AND score > ?'
        ).get(songId, difficulty, userScore.score) as { count: number };

        userEntry = {
          rank: rank.count + 1,
          username: req.user!.username,
          score: userScore.score,
          accuracy: userScore.accuracy,
          stars: userScore.stars,
          date: userScore.played_at,
          isPlayer: true,
        };
      }
    }

    res.json({ success: true, data: { entries, userEntry } });
  } catch (error) {
    console.error('[Leaderboard] Error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
