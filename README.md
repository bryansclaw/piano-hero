# 🎹 PianoHero

A Guitar Hero-style falling-notes game for piano, built with React and Web MIDI API. Connect your real piano via MIDI, or use the on-screen keyboard. Features 20 Taylor Swift songs with progressive difficulty, structured curriculum, AI performance analysis, and social features.

## Features

### 🎮 Core Gameplay
- **Falling Notes Engine**: Guitar Hero-style gameplay with rainbow-colored notes
- **MIDI Support**: Connect any MIDI piano/keyboard via Web MIDI API
- **On-screen Keyboard**: Play with mouse/touch when no MIDI device available
- **4 Difficulty Levels**: Easy (melody only) → Medium → Hard → Expert (full arrangement)
- **Combo System**: Multiplier-based scoring with Perfect/Great/Good/Miss ratings
- **Star Rating**: 0-5 stars per song per difficulty

### 🎵 Song Library
- **20 Taylor Swift Songs** spanning all eras (Fearless → Tortured Poets Department)
- Procedurally generated arrangements with chords, melody, and harmony
- Search and filter by title, artist, album, or difficulty

### 📖 Practice Tools
- **Tempo Control**: Adjust speed from 25% to 150% without pitch change
- **Section Looping**: Set loop points on any measure range for focused practice
- **Metronome Overlay**: Toggleable click track synced to song BPM
- **Count-In**: 1-2-3-4 count before song starts
- **Auto Speed-Up**: Start slow, automatically increase by 5% each successful loop
- **Practice Mode Indicator**: Shows current tempo %, loop range, and metronome status

### 🤖 AI Performance Feedback
- **Post-session Analysis**: Timing accuracy, velocity consistency, rhythm steadiness
- **Letter Grades**: S/A/B/C/D/F based on overall accuracy
- **Timing Insights**: "You tend to rush notes in the left hand"
- **Dynamics Analysis**: Velocity uniformity detection and expression tips
- **Trouble Spot Detection**: Highlights weak measures with accuracy heatmap
- **Practice Suggestions**: AI-generated practice plans based on weaknesses
- **Improvement Tracking**: "Your accuracy improved from 72% to 85% over 5 sessions"

### 🏆 Social & Leaderboards
- **Global Leaderboard**: Top 20 per song with realistic mock data
- **Friends Leaderboard**: Add/manage friends, compare scores
- **Weekly Challenges**: Auto-generated themed challenges
- **Achievement Badges**: 20 achievements across Performance, Dedication, and Mastery
- **XP & Leveling**: Earn XP from playing, level up with progressive thresholds
- **Daily Streak**: Track consecutive days with streak freeze support

### 📊 Practice Analytics Dashboard
- **Practice Time Charts**: Daily/weekly/monthly bar charts (canvas-rendered)
- **Accuracy Trends**: Line graphs showing improvement over time per song
- **Key Heatmap**: Visual keyboard showing per-key accuracy (green-to-red gradient)
- **Session History**: Recent sessions with date, song, score, and duration
- **Stats Cards**: Total time, sessions, average accuracy, longest streak, favorite song

### 📚 Structured Curriculum
- **5 Skill Paths**: Fundamentals, Chords & Harmony, Sight Reading, Technique, Song Mastery
- **50+ Lessons**: Each with text explanation, interactive exercise, and passing criteria
- **Prerequisite System**: Unlock lessons by completing prerequisites
- **Daily Practice Plan Generator**: 15/30/60 minute plans based on analytics
- **Progress Tracking**: Visual skill tree with completion states

### 🎙️ Recording & Playback
- **Record Performances**: Capture all MIDI events with timestamps
- **Playback**: Replay recordings with visual note highlighting
- **Recording Library**: Save, name, and manage recordings
- **Practice Journal**: Add notes to any recording
- **Export**: Copy shareable text summary to clipboard

### 👤 Player Profile
- **Avatar Selection**: 12 emoji avatars
- **Username**: Customizable display name
- **Level & XP Display**: Progress bar with detailed stats
- **Badge Showcase**: Unlocked achievements
- **Streak Tracking**: Current and longest daily streaks

## Tech Stack

- **React 19** with TypeScript (strict mode)
- **Vite 8** for development and building
- **Tailwind CSS 4** for styling
- **Web MIDI API** for piano input
- **Tone.js** for audio
- **VexFlow** for sheet music rendering
- **Canvas API** for falling notes, charts, and heatmaps
- **localStorage** for all data persistence

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Connect a MIDI Piano
1. Connect your MIDI keyboard to your computer
2. Open PianoHero in Chrome/Edge (Web MIDI requires these browsers)
3. Go to Settings and select your device

### Without MIDI
Use the on-screen keyboard by clicking the piano keys.

## Scripts

```bash
npm run dev        # Start dev server
npm run build      # TypeScript check + production build
npm test           # Run 333 Vitest unit/component tests
npm run test:e2e   # Run 65 Playwright E2E tests
npm run test:all   # Run all tests
npm run lint       # ESLint
```

## Project Structure

```
src/
├── components/         # React components
│   ├── App.tsx         # Main app with routing
│   ├── Header.tsx      # Navigation header
│   ├── SongLibrary.tsx # Song browsing & search
│   ├── FallingNotes.tsx# Canvas game view
│   ├── PianoKeyboard.tsx # Interactive keyboard
│   ├── PracticeTools.tsx # Tempo, loop, metronome
│   ├── AIFeedback.tsx  # Performance analysis UI
│   ├── Leaderboard.tsx # Score rankings
│   ├── SocialFeed.tsx  # Achievements & challenges
│   ├── Analytics.tsx   # Practice dashboard
│   ├── Curriculum.tsx  # Lesson skill tree
│   ├── Recorder.tsx    # Record/playback UI
│   ├── Profile.tsx     # Player profile
│   └── __tests__/      # Component tests
├── engine/             # Game logic
│   ├── gameEngine.ts   # Core game state machine
│   ├── scoring.ts      # Score calculation
│   ├── difficulty.ts   # Difficulty presets
│   ├── songGenerator.ts# Procedural song generation
│   ├── noteMapper.ts   # MIDI-to-screen mapping
│   ├── performanceAnalyzer.ts # AI analysis engine
│   ├── socialEngine.ts # XP, achievements, leaderboards
│   ├── analyticsEngine.ts # Practice data aggregation
│   ├── recordingEngine.ts # MIDI recording/playback
│   └── __tests__/      # Engine tests
├── hooks/              # React hooks
│   ├── useGameEngine.ts
│   ├── useSongLoader.ts
│   ├── useMidi.ts
│   ├── usePracticeTools.ts
│   └── __tests__/
├── data/               # Static data
│   ├── songCatalog.ts  # Song metadata
│   ├── curriculum.ts   # Lesson definitions
│   └── __tests__/
├── types/index.ts      # TypeScript types
└── utils/              # Utilities
    ├── constants.ts    # Theme, timing, scoring constants
    └── midiUtils.ts    # MIDI conversion utilities
e2e/                    # Playwright E2E tests
docs/                   # Documentation
```

## License

MIT
