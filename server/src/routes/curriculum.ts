import { Router } from 'express';
import { getDb } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/curriculum — user's progress on all lessons
router.get('/', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const progress = db.prepare(
      'SELECT lesson_id, completed, best_accuracy, completed_at FROM curriculum_progress WHERE user_id = ?'
    ).all(req.user!.userId) as Array<{
      lesson_id: string; completed: number; best_accuracy: number; completed_at: string | null;
    }>;

    const completedLessons: string[] = [];
    const bestAccuracies: Record<string, number> = {};

    for (const p of progress) {
      if (p.completed) completedLessons.push(p.lesson_id);
      if (p.best_accuracy > 0) bestAccuracies[p.lesson_id] = p.best_accuracy;
    }

    res.json({
      success: true,
      data: { completedLessons, bestAccuracies },
    });
  } catch (error) {
    console.error('[Curriculum] Get error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/curriculum/:lessonId — mark complete, update best accuracy
router.put('/:lessonId', requireAuth, (req, res) => {
  try {
    const { lessonId } = req.params;
    const { completed, bestAccuracy } = req.body;

    const db = getDb();
    db.prepare(`
      INSERT INTO curriculum_progress (user_id, lesson_id, completed, best_accuracy, completed_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id, lesson_id)
      DO UPDATE SET
        completed = CASE WHEN ? THEN 1 ELSE completed END,
        best_accuracy = MAX(best_accuracy, ?),
        completed_at = CASE WHEN ? AND completed_at IS NULL THEN CURRENT_TIMESTAMP ELSE completed_at END
    `).run(
      req.user!.userId, lessonId,
      completed ? 1 : 0, bestAccuracy ?? 0,
      completed ? new Date().toISOString() : null,
      completed ? 1 : 0,
      bestAccuracy ?? 0,
      completed ? 1 : 0
    );

    res.json({ success: true });
  } catch (error) {
    console.error('[Curriculum] Update error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
