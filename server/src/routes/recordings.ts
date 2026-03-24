import { Router } from 'express';
import { getDb } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/recordings — list user's recordings
router.get('/', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const recordings = db.prepare(`
      SELECT id, name, song_id, difficulty, score, accuracy, duration, events, journal_note, created_at
      FROM recordings
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(req.user!.userId) as Array<{
      id: string; name: string; song_id: string; difficulty: string;
      score: number; accuracy: number; duration: number;
      events: string; journal_note: string; created_at: string;
    }>;

    const data = recordings.map(r => ({
      id: r.id,
      name: r.name,
      songId: r.song_id,
      difficulty: r.difficulty,
      date: r.created_at,
      duration: r.duration,
      events: JSON.parse(r.events),
      score: r.score,
      accuracy: r.accuracy,
      journalNote: r.journal_note,
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('[Recordings] Get error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/recordings — save a recording
router.post('/', requireAuth, (req, res) => {
  try {
    const { id, name, songId, difficulty, score, accuracy, duration, events, journalNote } = req.body;

    if (!id || !name || !songId || !difficulty || !events) {
      res.status(400).json({ success: false, error: 'id, name, songId, difficulty, and events are required' });
      return;
    }

    const db = getDb();
    db.prepare(`
      INSERT INTO recordings (id, user_id, name, song_id, difficulty, score, accuracy, duration, events, journal_note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, req.user!.userId, name, songId, difficulty,
      score ?? 0, accuracy ?? 0, duration ?? 0,
      JSON.stringify(events), journalNote ?? ''
    );

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('[Recordings] Save error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/recordings/:id — delete a recording
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare(
      'DELETE FROM recordings WHERE id = ? AND user_id = ?'
    ).run(req.params.id, req.user!.userId);

    if (result.changes === 0) {
      res.status(404).json({ success: false, error: 'Recording not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[Recordings] Delete error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/recordings/:id/journal — update journal note
router.put('/:id/journal', requireAuth, (req, res) => {
  try {
    const { journalNote } = req.body;

    const db = getDb();
    const result = db.prepare(
      'UPDATE recordings SET journal_note = ? WHERE id = ? AND user_id = ?'
    ).run(journalNote ?? '', req.params.id, req.user!.userId);

    if (result.changes === 0) {
      res.status(404).json({ success: false, error: 'Recording not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[Recordings] Journal error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
