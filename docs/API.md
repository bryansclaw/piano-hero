# API Documentation

## localStorage Data Structures

All data is persisted in `localStorage` with the following keys and structures.

### `piano-hero-scores`

High scores per song per difficulty.

```typescript
Record<string, Record<Difficulty, HighScore>>

interface HighScore {
  songId: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  score: number;
  stars: number;        // 0-5
  accuracy: number;     // 0-100
  maxCombo: number;
  date: string;         // ISO 8601
}
```

### `piano-hero-profile`

Player profile with XP, level, badges, and streak data.

```typescript
interface PlayerProfile {
  username: string;
  avatarIndex: number;          // Index into AVATARS array (0-11)
  xp: number;
  level: number;
  badges: string[];             // Achievement IDs
  songsPlayed: number;
  songsMastered: number;        // Songs with 5 stars
  totalPracticeTime: number;    // Minutes
  joinDate: string;             // ISO 8601
  dailyStreak: number;
  longestStreak: number;
  lastPlayedDate: string;       // YYYY-MM-DD
  streakFreezes: number;
}
```

### `piano-hero-friends`

Friends list for social features.

```typescript
interface Friend {
  username: string;
  avatarIndex: number;
  level: number;
  xp: number;
}
```

### `piano-hero-analytics`

Practice analytics with daily data, key accuracy, and session history.

```typescript
interface AnalyticsData {
  dailyPractice: DailyPracticeData[];
  keyAccuracy: KeyAccuracyData[];
  sessionHistory: SessionHistory[];          // Max 200 entries
  songAccuracyTrends: Record<string, {      // Max 50 per song
    date: string;
    accuracy: number;
  }[]>;
}

interface DailyPracticeData {
  date: string;             // YYYY-MM-DD
  totalMinutes: number;
  sessions: number;
  averageAccuracy: number;
  songsPlayed: string[];    // Song IDs
}

interface KeyAccuracyData {
  midi: number;
  totalHits: number;
  correctHits: number;
  accuracy: number;         // 0-100
}

interface SessionHistory {
  songId: string;
  difficulty: Difficulty;
  date: string;             // ISO 8601
  score: number;
  accuracy: number;
  duration: number;         // Seconds
}
```

### `piano-hero-performance-reports`

AI performance analysis reports. Max 100 entries.

```typescript
interface PerformanceReport {
  songId: string;
  difficulty: Difficulty;
  date: string;
  duration: number;
  overallAccuracy: number;
  letterGrade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  score: number;
  timingAnalysis: TimingAnalysis;
  dynamicsAnalysis: DynamicsAnalysis;
  troubleSpots: TroubleSpot[];
  practiceSuggestions: string[];
  noteTimings: NoteTimingData[];
}
```

### `piano-hero-recordings`

MIDI event recordings. Max 50 entries.

```typescript
interface Recording {
  id: string;               // "rec-{timestamp}-{random}"
  name: string;
  songId: string;
  difficulty: Difficulty;
  date: string;             // ISO 8601
  duration: number;         // Seconds
  events: RecordedEvent[];
  score: number;
  accuracy: number;
  journalNote: string;
}

interface RecordedEvent {
  midi: number;
  velocity: number;
  timestamp: number;        // ms from recording start
  type: 'noteOn' | 'noteOff';
}
```

### `piano-hero-curriculum`

Completed lesson IDs as a JSON array.

```typescript
string[]  // e.g., ["fund-01", "fund-02", "chord-01"]
```

### `piano-hero-curriculum-scores`

Best accuracy per lesson.

```typescript
Record<string, number>  // e.g., { "fund-01": 92.5, "fund-02": 85 }
```

## Engine Interfaces

### Performance Analyzer (`src/engine/performanceAnalyzer.ts`)

```typescript
calculateGrade(accuracy: number): LetterGrade
timeToMeasure(time: number, bpm: number, beatsPerMeasure?: number): number
analyzeTimings(timings: NoteTimingData[]): TimingAnalysis
analyzeDynamics(timings: NoteTimingData[]): DynamicsAnalysis
findTroubleSpots(timings: NoteTimingData[], bpm: number): TroubleSpot[]
generateSuggestions(timing, dynamics, spots, accuracy): string[]
generatePerformanceReport(songId, difficulty, timings, score, duration, bpm): PerformanceReport
getImprovementInsight(history: SessionHistory[], songId: string): string | null
loadPerformanceReports(): PerformanceReport[]
savePerformanceReport(report: PerformanceReport): void
```

### Social Engine (`src/engine/socialEngine.ts`)

```typescript
xpForLevel(level: number): number
totalXpForLevel(level: number): number
levelFromXp(xp: number): number
xpProgressInLevel(xp: number): { current, needed, percent }
calculateXpFromScore(score, accuracy, stars): number
checkAchievements(profile, highScores, combo, accuracy, stars, difficulty): string[]
updateStreak(profile: PlayerProfile): PlayerProfile
generateMockLeaderboard(songId, playerScore?, playerName?): LeaderboardEntry[]
getPlayerPercentile(leaderboard): number
generateWeeklyChallenge(): WeeklyChallenge
loadProfile(): PlayerProfile
saveProfile(profile): void
loadFriends(): Friend[]
saveFriends(friends): void
```

### Analytics Engine (`src/engine/analyticsEngine.ts`)

```typescript
loadAnalytics(): AnalyticsData
saveAnalytics(data): void
recordSession(analytics, session, noteTimings): AnalyticsData
aggregatePracticeTime(dailyData, period): { labels, values }
calculateAccuracyTrend(trends): { labels, values }
calculateTotalStats(analytics): { totalMinutes, songsCompleted, averageAccuracy, longestStreak, favoriteSong }
calculatePercentile(leaderboard): number
```

### Recording Engine (`src/engine/recordingEngine.ts`)

```typescript
createRecordingSession(songId, difficulty): RecordingSession
startRecording(session): RecordingSession
stopRecording(session): RecordingSession
addRecordingEvent(session, midi, velocity, type): RecordingSession
getRecordingDuration(session): number
createPlaybackState(recording): PlaybackState
updatePlayback(state, deltaMs): PlaybackState
compareWithPerfect(recording, perfectNotes, toleranceMs?): ComparisonResult
loadRecordings(): Recording[]
saveRecording(recording): void
deleteRecording(id): void
updateRecordingJournal(id, note): void
exportRecordingSummary(recording): string
generateRecordingId(): string
```

### Curriculum (`src/data/curriculum.ts`)

```typescript
getCurriculum(): SkillPathData[]
isLessonAvailable(lesson, completedLessons): boolean
checkPrerequisites(lessonId, allLessons, completedLessons): boolean
getLessonProgress(lessons, completedLessons): { total, completed, percent }
generatePracticePlan(durationMinutes, analytics, curriculum, completedLessons): PracticePlan
loadCompletedLessons(): Set<string>
saveCompletedLessons(completed): void
loadLessonBestAccuracies(): Record<string, number>
saveLessonBestAccuracy(lessonId, accuracy): void
```
