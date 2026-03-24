import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'piano-hero.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    runMigrations(db);
  }
  return db;
}

function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS profiles (
      user_id INTEGER PRIMARY KEY REFERENCES users(id),
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      songs_played INTEGER DEFAULT 0,
      songs_mastered INTEGER DEFAULT 0,
      total_practice_time REAL DEFAULT 0,
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      last_played_date TEXT,
      streak_freezes INTEGER DEFAULT 3,
      badges TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS high_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      song_id TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      score INTEGER NOT NULL,
      stars INTEGER NOT NULL,
      accuracy REAL NOT NULL,
      max_combo INTEGER NOT NULL,
      played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, song_id, difficulty)
    );

    CREATE TABLE IF NOT EXISTS analytics_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      song_id TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      score INTEGER NOT NULL,
      accuracy REAL NOT NULL,
      duration REAL NOT NULL,
      played_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS key_accuracy (
      user_id INTEGER REFERENCES users(id),
      midi_note INTEGER NOT NULL,
      correct INTEGER DEFAULT 0,
      total INTEGER DEFAULT 0,
      PRIMARY KEY(user_id, midi_note)
    );

    CREATE TABLE IF NOT EXISTS recordings (
      id TEXT PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      name TEXT NOT NULL,
      song_id TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      score INTEGER DEFAULT 0,
      accuracy REAL DEFAULT 0,
      duration REAL NOT NULL,
      events TEXT NOT NULL,
      journal_note TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS curriculum_progress (
      user_id INTEGER REFERENCES users(id),
      lesson_id TEXT NOT NULL,
      completed BOOLEAN DEFAULT FALSE,
      best_accuracy REAL DEFAULT 0,
      completed_at DATETIME,
      PRIMARY KEY(user_id, lesson_id)
    );

    CREATE TABLE IF NOT EXISTS friends (
      user_id INTEGER REFERENCES users(id),
      friend_username TEXT NOT NULL,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(user_id, friend_username)
    );

    CREATE TABLE IF NOT EXISTS settings (
      user_id INTEGER PRIMARY KEY REFERENCES users(id),
      show_note_names BOOLEAN DEFAULT TRUE,
      volume INTEGER DEFAULT 80,
      theme TEXT DEFAULT 'system'
    );
  `);
}

export function closeDb(): void {
  if (db) {
    db.close();
  }
}
