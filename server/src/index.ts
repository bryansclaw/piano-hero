import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import authRoutes from './routes/auth.js';
import scoresRoutes from './routes/scores.js';
import leaderboardRoutes from './routes/leaderboard.js';
import profileRoutes from './routes/profile.js';
import analyticsRoutes from './routes/analytics.js';
import recordingsRoutes from './routes/recordings.js';
import curriculumRoutes from './routes/curriculum.js';
import friendsRoutes from './routes/friends.js';
import { getDb, closeDb } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Rate limiting on auth endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { success: false, error: 'Too many attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Initialize database on startup
getDb();

// Routes
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/scores', scoresRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/recordings', recordingsRoutes);
app.use('/api/curriculum', curriculumRoutes);
app.use('/api/friends', friendsRoutes);

// In production, serve the built client
const clientDistPath = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('/{*path}', (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  closeDb();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDb();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`[PianoHero] Server running on http://localhost:${PORT}`);
});

export default app;
