# Architecture

## Component Diagram

```
┌──────────────────────────────────────────────────────────┐
│                         App.tsx                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                     Header.tsx                       │ │
│  │  [🏠Home] [🎮Game] [📖Practice] [📚Curriculum]      │ │
│  │  [📊Analytics] [🏆Leaderboard] [👤Profile] [⚙️Settings] │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌── Home/Library ─────┐  ┌───── Game Mode ───────────┐ │
│  │  SongLibrary.tsx     │  │ ScoreDisplay              │ │
│  │  ┌───┐ ┌───┐ ┌───┐  │  │ DifficultySelector       │ │
│  │  │   │ │   │ │   │  │  │ FallingNotes (canvas)     │ │
│  │  └───┘ └───┘ └───┘  │  │ PianoKeyboard             │ │
│  └──────────────────────┘  │ GameOverScreen + AIFeedback│ │
│                            └──────────────────────────-─┘ │
│  ┌── Practice Mode ────┐  ┌── Curriculum ─────────────┐ │
│  │  PracticeTools.tsx   │  │ Skill tree (5 paths)      │ │
│  │  Recorder.tsx        │  │ Lesson detail modal       │ │
│  │  SheetMusic.tsx      │  │ Practice plan generator   │ │
│  │  PianoKeyboard.tsx   │  └──────────────────────────-┘ │
│  └──────────────────────┘                                │
│  ┌── Analytics ────────┐  ┌── Social/Leaderboard ─────┐ │
│  │  Stats cards         │  │ Leaderboard.tsx (global/   │ │
│  │  Practice chart      │  │   friends tabs)            │ │
│  │  Accuracy trend      │  │ SocialFeed.tsx             │ │
│  │  Key heatmap         │  │  (challenges, achievements)│ │
│  │  Session history     │  └──────────────────────────-─┘ │
│  └──────────────────────┘                                │
│  ┌── Profile ──────────┐  ┌── Settings ──────────────-┐ │
│  │  Avatar & username   │  │ MidiConnection            │ │
│  │  Level & XP bar      │  │ Display options            │ │
│  │  Badges display      │  │ Audio options              │ │
│  │  Streak tracking     │  └──────────────────────────-┘ │
│  └──────────────────────┘                                │
└──────────────────────────────────────────────────────────┘
```

## Data Flow

```
                    ┌─────────────┐
                    │  MIDI Input │
                    │  (keyboard) │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  useMidi()  │
                    │  hook       │
                    └──────┬──────┘
                           │ MidiNoteEvent
           ┌───────────────┼───────────────┬──────────────────┐
           │               │               │                  │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐  ┌───────▼───────┐
    │  Keyboard   │ │ Game Engine │ │  Recording  │  │  Performance  │
    │  highlight  │ │ (scoring)   │ │  Engine     │  │  Analyzer     │
    └─────────────┘ └──────┬──────┘ └──────┬──────┘  └───────┬───────┘
                           │               │                  │
                    ┌──────▼──────┐ ┌──────▼──────┐  ┌───────▼───────┐
                    │  Canvas     │ │  Recording  │  │  AI Feedback  │
                    │  render     │ │  Library    │  │  Report       │
                    └─────────────┘ └──────┬──────┘  └───────┬───────┘
                                          │                  │
                                   ┌──────▼──────────────────▼───────┐
                                   │        localStorage             │
                                   │  (scores, analytics, profile,   │
                                   │   recordings, curriculum)       │
                                   └─────────────────────────────────┘
```

## Post-Game Flow

```
Game Complete
     │
     ├──▶ Save High Score (localStorage)
     │
     ├──▶ Generate Performance Report
     │     ├── Timing Analysis
     │     ├── Dynamics Analysis
     │     ├── Trouble Spots
     │     └── Practice Suggestions
     │
     ├──▶ Update Analytics
     │     ├── Session History
     │     ├── Daily Practice Data
     │     ├── Key Accuracy
     │     └── Song Accuracy Trends
     │
     └──▶ Update Profile
           ├── Add XP
           ├── Update Level
           ├── Update Streak
           └── Check Achievements
```

## Hook Architecture

### useMidi
- Manages Web MIDI API connection lifecycle
- Provides `activeNotes` set for real-time keyboard visualization
- Fires `onNoteOn`/`onNoteOff` callbacks for game engine input
- Auto-detects devices, handles connect/disconnect

### useGameEngine
- Wraps the pure game engine functions in React state
- Manages `requestAnimationFrame` game loop
- Handles countdown → playing → complete state machine
- Provides `handleNote()` for MIDI → game input bridge

### useSongLoader
- Generates all songs on first load (cached at module level)
- Applies difficulty filtering via `DIFFICULTY_PRESETS`
- Returns filtered `currentNotes` for the selected song + difficulty

### usePracticeTools
- Manages tempo, looping, metronome, count-in, auto speed-up state
- Provides `getAdjustedTime()` for tempo-aware timing
- Manages metronome tick interval synced to adjusted BPM
- `onLoopComplete()` handles auto speed-up increments

## Engine Layer (Pure Functions)

All engine code is pure functional — no side effects, no DOM, no React.

### gameEngine.ts
- State machine: `idle → countdown → playing → paused → complete`
- `updateGame()` — called each frame, advances time, detects misses
- `handleNoteInput()` — matches MIDI input to closest unhit note

### scoring.ts
- `getHitRating()` — timing delta → perfect/great/good/miss
- `processHit()` — immutable score update
- `getMultiplier()` — combo → multiplier lookup
- `calculateStars()` — score ratio → 0-5 stars

### difficulty.ts
- Preset configs for each level (fall speed, timing windows)
- Note filter functions (easy=melody only, medium=thinned, hard/expert=full)
- Unlock logic based on previous difficulty stars

### songGenerator.ts
- Blueprint-based song generation from metadata
- Generates left-hand chord accompaniment and right-hand melody
- Seeded random for reproducible output

### performanceAnalyzer.ts
- `analyzeTimings()` — per-hand timing analysis, rushing/dragging detection
- `analyzeDynamics()` — velocity uniformity and range analysis
- `findTroubleSpots()` — groups notes by measure, flags low-accuracy zones
- `generatePerformanceReport()` — comprehensive post-session analysis
- `getImprovementInsight()` — tracks progress across sessions

### socialEngine.ts
- `xpForLevel()` / `levelFromXp()` — exponential leveling curve
- `calculateXpFromScore()` — converts game performance to XP
- `checkAchievements()` — evaluates 20 achievement criteria
- `updateStreak()` — manages daily streak with freeze support
- `generateMockLeaderboard()` — deterministic mock data per song
- `generateWeeklyChallenge()` — week-seeded challenge rotation

### analyticsEngine.ts
- `recordSession()` — updates all analytics on session complete
- `aggregatePracticeTime()` — daily/weekly/monthly aggregation
- `calculateTotalStats()` — overall stats computation
- `calculatePercentile()` — rank-based percentile calculation

### recordingEngine.ts
- `createRecordingSession()` / `startRecording()` / `stopRecording()` — session lifecycle
- `addRecordingEvent()` — captures MIDI events with timestamps
- `updatePlayback()` — advances playback state with active note tracking
- `compareWithPerfect()` — diff recording against ideal note sequence

## State Management

No external state library — uses React hooks + localStorage:

- **App state** (mode, settings) — `useState` in `App.tsx`
- **Game state** (score, falling notes, time) — `useGameEngine` hook
- **MIDI state** (devices, active notes) — `useMidi` hook
- **Song state** (loaded songs, current song) — `useSongLoader` hook
- **Practice tools** (tempo, loop, metronome) — `usePracticeTools` hook
- **Player profile** — localStorage via socialEngine
- **Analytics** — localStorage via analyticsEngine
- **Recordings** — localStorage via recordingEngine
- **Curriculum progress** — localStorage via curriculum data module
- **High scores** — localStorage via `loadHighScores()` / `saveHighScores()`

## localStorage Keys

| Key | Max Size | Description |
|-----|----------|-------------|
| `piano-hero-scores` | Unbounded | High scores per song/difficulty |
| `piano-hero-profile` | ~1KB | Player profile |
| `piano-hero-friends` | ~5KB | Friends list |
| `piano-hero-analytics` | ~50KB | Practice analytics data |
| `piano-hero-performance-reports` | ~100 entries | AI analysis reports |
| `piano-hero-recordings` | ~50 entries | MIDI recordings |
| `piano-hero-curriculum` | ~1KB | Completed lesson IDs |
| `piano-hero-curriculum-scores` | ~1KB | Best accuracy per lesson |

## Rendering Pipeline

### Falling Notes Canvas (60fps)
1. `requestAnimationFrame` calls `updateGame()` each frame
2. State updates propagate to `FallingNotes` component
3. Canvas re-renders: clear → grid → hit line → notes → particles → overlays

### Analytics Charts (Canvas)
- `drawBarChart()` — practice time visualization
- `drawLineChart()` — accuracy trends
- `drawKeyHeatmap()` — per-key accuracy on piano layout

### Piano Keyboard (DOM)
- 88 individual `<button>` elements positioned absolutely
- White keys as base layer (z-index: 1), black keys overlay (z-index: 2)
- Color updates via inline styles driven by `activeNotes` set
