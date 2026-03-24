# Game Design Document

## Scoring System

### Hit Detection

When a player presses a key (MIDI or on-screen click), the engine:

1. Finds all unhit falling notes matching that MIDI number
2. Calculates timing delta: `(currentGameTime - noteTargetTime) × 1000` (in ms)
3. Selects the closest note within the `good` timing window
4. Rates the hit based on the absolute timing delta

### Timing Windows (per difficulty)

| Difficulty | Perfect | Great | Good | Miss |
|-----------|---------|-------|------|------|
| Easy | ±80ms | ±150ms | ±250ms | >250ms |
| Medium | ±60ms | ±120ms | ±180ms | >180ms |
| Hard | ±50ms | ±100ms | ±150ms | >150ms |
| Expert | ±35ms | ±70ms | ±120ms | >120ms |

### Point Values

| Rating | Base Points |
|--------|------------|
| Perfect | 300 |
| Great | 200 |
| Good | 100 |
| Miss | 0 |

**Final points = Base Points × Combo Multiplier**

### Combo System

Consecutive hits (non-miss) build a combo. The combo determines the score multiplier:

| Combo Count | Multiplier |
|-------------|-----------|
| 0-9 | 1× |
| 10-24 | 2× |
| 25-49 | 3× |
| 50+ | 4× |

A miss resets the combo to 0 and multiplier to 1×.

### Accuracy

```
accuracy = (perfect + great + good) / (perfect + great + good + miss) × 100%
```

### Star Rating

Stars are calculated from the ratio of actual score to maximum possible score:

```
maxScore = sum of (300 × multiplierAtThatCombo) for each note if all were perfect
ratio = actualScore / maxScore
```

| Stars | Ratio Required |
|-------|---------------|
| 0 | < 30% |
| 1 | ≥ 30% |
| 2 | ≥ 50% |
| 3 | ≥ 70% |
| 4 | ≥ 85% |
| 5 | ≥ 95% |

## Difficulty Curves

### Fall Speed

Notes fall from the top of the canvas toward the hit line at a constant speed:

| Difficulty | Speed (px/sec) |
|-----------|---------------|
| Easy | 200 |
| Medium | 300 |
| Hard | 400 |
| Expert | 500 |

The hit line is positioned at 85% of canvas height.

### Note Filtering

Each difficulty applies a filter to the full expert arrangement:

- **Easy**: Right hand only, notes must be ≥0.3s apart (removes fast passages)
- **Medium**: Both hands, notes must be ≥0.15s apart
- **Hard**: Full arrangement, no filtering
- **Expert**: Full arrangement, no filtering (combined with fastest speed and tightest timing)

### Effective Difficulty

The combination of speed, timing, and note density creates a compounding difficulty curve:

| Difficulty | Notes | Speed | Timing | Effective |
|-----------|-------|-------|--------|-----------|
| Easy | ~30% | Slow | Wide | Accessible |
| Medium | ~60% | Normal | Moderate | Challenging |
| Hard | 100% | Fast | Tight | Demanding |
| Expert | 100% | Fastest | Tightest | Extreme |

## Unlock Mechanics

### Progressive Difficulty Unlock

- **Easy** — Always available for all songs
- **Medium** — Requires 3+ stars on Easy for that song
- **Hard** — Requires 3+ stars on Medium for that song
- **Expert** — Requires 3+ stars on Hard for that song

This ensures players build skill gradually rather than jumping to Expert.

### High Score Tracking

High scores are stored per song per difficulty in localStorage:

```json
{
  "love-story": {
    "easy": {
      "score": 15000,
      "stars": 4,
      "accuracy": 92.5,
      "maxCombo": 45,
      "date": "2024-01-15T10:30:00Z"
    }
  }
}
```

Only the best score for each song/difficulty combination is kept.

## Song Generation

### Blueprint System

Each song is defined by a "blueprint" containing:

- **Metadata**: title, artist, BPM, key, time signature
- **Sections**: verse, chorus, bridge, etc.
- **Chord progressions**: root + type (major, minor, dom7, etc.)
- **Melody patterns**: scale degrees (1-indexed)
- **Melody rhythm**: beat durations per melody note

### Generation Process

1. **Left hand (chords)**: For each chord event, randomly choose between block chord and arpeggio. Place in octave 3.
2. **Right hand (melody)**: Walk through melody pattern using scale degrees, transposed to the song's key. Add occasional harmony notes (30% chance).
3. **Humanization**: Slight timing variations (±20ms) and velocity variation (±15) for natural feel.
4. **Seeded random**: Uses song ID hash as seed for reproducible generation.

### Note Properties

Each generated note includes:
- `midi` — MIDI note number (0-127)
- `time` — Start time in seconds
- `duration` — Note duration in seconds
- `velocity` — MIDI velocity (0-127)
- `hand` — 'left' or 'right' (used by difficulty filters)

## Visual Design

### Color Scheme

- Background: Navy/black (#0a0a1a)
- Cards: Dark purple (#1a1a3e)
- Accent pink: #e040fb
- Accent blue: #40c4ff
- Accent green: #69f0ae
- Combo glow: #ffdd00

### Note Colors (Rainbow by Pitch Class)

| Note | Color |
|------|-------|
| C | Red (#ff4444) |
| C# | Red-orange (#ff6644) |
| D | Orange (#ff8800) |
| D# | Orange-yellow (#ffaa00) |
| E | Yellow (#ffdd00) |
| F | Green (#44dd44) |
| F# | Teal (#22bbaa) |
| G | Blue (#4488ff) |
| G# | Blue-indigo (#5566ff) |
| A | Indigo (#6644ff) |
| A# | Indigo-violet (#8844ff) |
| B | Violet (#aa44ff) |

### Particle Effects

On successful hits (non-miss):
- **Perfect**: 20 particles, full explosion
- **Great**: 12 particles
- **Good**: 6 particles

Particles have:
- Random velocity vectors in a radial pattern
- Gravity (300 px/s²)
- Fade out over 0.5-1.0 seconds
- Color matches the note color
- Glow shadow effect

## XP & Leveling System

### XP Earning Formula

```
baseXp = floor(score / 10)
accuracyBonus = floor(accuracy / 5)
starBonus = stars × 20
totalXp = baseXp + accuracyBonus + starBonus
```

### Leveling Curve

XP required for each level follows an exponential growth:

```
xpForLevel(n) = floor(500 × 1.2^(n-2))  // for n >= 2
```

| Level | XP to Next | Total XP |
|-------|-----------|----------|
| 1 | 500 | 0 |
| 2 | 600 | 500 |
| 3 | 720 | 1,100 |
| 5 | 1,036 | 2,854 |
| 10 | 2,579 | 12,442 |
| 15 | 6,420 | 37,850 |
| 20 | 15,984 | 100,825 |

### Achievement List

| ID | Name | Category | Criteria |
|----|------|----------|----------|
| first-perfect | First Perfect | Performance | Get a Perfect rating |
| combo-10 | Getting Started | Performance | 10x combo |
| combo-50 | Combo Master | Performance | 50x combo |
| combo-100 | Combo Legend | Performance | 100x combo |
| five-stars | Five Star Performance | Performance | 5 stars on any song |
| accuracy-95 | Precision Player | Performance | 95%+ accuracy |
| accuracy-100 | Flawless | Performance | 100% accuracy |
| streak-3 | 3 Day Streak | Dedication | 3 consecutive days |
| streak-7 | Weekly Warrior | Dedication | 7 consecutive days |
| streak-30 | Monthly Master | Dedication | 30 consecutive days |
| songs-5 | Song Explorer | Mastery | Play 5 different songs |
| songs-10 | 10 Song Streak | Mastery | Play 10 different songs |
| songs-all | Complete Collection | Mastery | Play every song |
| expert-clear | Speed Demon | Mastery | Clear any Expert song |
| taylor-superfan | Taylor Swift Superfan | Mastery | 5 stars on all TS songs |
| level-5 | Rising Star | Dedication | Reach level 5 |
| level-10 | Virtuoso | Dedication | Reach level 10 |
| level-20 | Grand Master | Dedication | Reach level 20 |
| practice-1hr | Dedicated Learner | Dedication | 1 hour total practice |
| practice-10hr | Practice Makes Perfect | Dedication | 10 hours total practice |

### Daily Streak

- Increments by 1 for each consecutive day played
- Resets to 1 if a day is missed (no freeze available)
- Streak freezes (3 initially) prevent reset on missed days
- Longest streak is tracked separately

## Performance Analysis

### Letter Grades

| Grade | Accuracy |
|-------|----------|
| S | ≥ 98% |
| A | ≥ 90% |
| B | ≥ 80% |
| C | ≥ 70% |
| D | ≥ 60% |
| F | < 60% |

### Timing Analysis

- Average delta: mean of all hit timing offsets
- Rushing: average delta < -15ms
- Dragging: average delta > +15ms
- Steadiness: 100 - standard deviation of deltas (0-100)
- Per-hand analysis for left/right independence

### Dynamics Analysis

- Average velocity of hit notes
- Velocity range (max - min)
- Uniformity: 100 - (stddev × 2), high = too uniform

### Trouble Spot Detection

- Groups notes by measure
- Flags measures with < 75% accuracy and >= 2 notes
- Merges consecutive trouble spots
- Reports top 5 trouble areas
