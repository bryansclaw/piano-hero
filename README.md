# 🎹 PianoHero

**Guitar Hero for Piano** — A full-stack web app for learning piano with falling notes, real-time scoring, and progress tracking.

## Architecture

- **Frontend**: React 19 + Vite + TypeScript + TailwindCSS v4 (`/client`)
- **Backend**: Express.js + TypeScript API server (`/server`)
- **Database**: SQLite via better-sqlite3
- **Auth**: JWT with bcrypt password hashing, httpOnly cookies

## Getting Started

### Prerequisites

- Node.js 22+
- npm 10+

### Install

```bash
# Install root dependencies (concurrently)
npm install

# Install client and server dependencies
npm run install:all
```

### Development

```bash
# Start both client (port 5173) and server (port 3001)
npm run dev

# Or start individually
npm run dev:client
npm run dev:server
```

### Build

```bash
npm run build
```

### Production

```bash
npm run build
npm start  # Serves built client + API on port 3001
```

### Test

```bash
npm test         # Unit tests (Vitest)
npm run test:e2e # E2E tests (Playwright)
```

## Project Structure

```
piano-hero/
├── client/                    # React frontend
│   ├── src/
│   │   ├── api/              # API client layer
│   │   ├── components/       # React components
│   │   ├── contexts/         # AuthContext
│   │   ├── data/             # Song catalog, curriculum
│   │   ├── engine/           # Game engine, scoring, analytics
│   │   ├── hooks/            # Custom hooks
│   │   ├── types/            # TypeScript types
│   │   └── utils/            # Utilities
│   ├── e2e/                  # Playwright E2E tests
│   └── ...
├── server/                    # Express API server
│   ├── src/
│   │   ├── routes/           # API route handlers
│   │   ├── middleware/       # Auth middleware
│   │   ├── db.ts             # SQLite setup + migrations
│   │   ├── auth.ts           # JWT + bcrypt helpers
│   │   └── index.ts          # Express app entry
│   └── ...
└── package.json               # Root monorepo scripts
```

## Features

- 🎵 Song library with multiple difficulty levels
- 🎮 Falling notes gameplay with real-time scoring
- 🎹 On-screen keyboard + MIDI device support
- 📊 Analytics dashboard with practice tracking
- 📚 Structured curriculum with 50+ lessons
- 🏆 Leaderboards and friend system
- 🎤 Recording and playback
- 👤 User accounts with persistent progress
- 🌙 Dark/light theme

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Log in |
| POST | /api/auth/logout | Log out |
| GET | /api/auth/me | Current user |
| GET/POST | /api/scores | High scores |
| GET | /api/leaderboard/:songId | Song leaderboard |
| GET/PUT | /api/profile | Player profile |
| POST | /api/profile/xp | Update XP/stats |
| GET | /api/analytics | Analytics data |
| POST | /api/analytics/session | Record session |
| POST | /api/analytics/keys | Key accuracy |
| GET/POST/DELETE | /api/recordings | Recordings CRUD |
| GET/PUT | /api/curriculum | Lesson progress |
| GET/POST/DELETE | /api/friends | Friends list |
