// ===== MIDI Types =====
export interface MidiDevice {
  id: string;
  name: string;
  manufacturer: string;
  state: 'connected' | 'disconnected';
}

export interface MidiNoteEvent {
  note: number; // 0-127
  velocity: number; // 0-127
  timestamp: number; // performance.now()
  channel: number;
}

// ===== Song Types =====
export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface SongNote {
  midi: number; // MIDI note number
  time: number; // seconds from start
  duration: number; // seconds
  velocity: number;
  hand: 'left' | 'right';
}

export interface SongData {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  duration: number; // seconds
  notes: Record<Difficulty, SongNote[]>;
}

export interface SongMeta {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  duration: number;
  album: string;
  year: number;
  difficulty: Record<Difficulty, number>; // 1-10 difficulty rating per level
}

// ===== Game Types =====
export type GameState = 'idle' | 'countdown' | 'playing' | 'paused' | 'complete';

export type HitRating = 'perfect' | 'great' | 'good' | 'miss';

export interface FallingNote {
  id: string;
  midi: number;
  time: number;
  duration: number;
  y: number; // current y position
  hit: boolean;
  rating?: HitRating;
  hand: 'left' | 'right';
}

export interface GameScore {
  points: number;
  combo: number;
  maxCombo: number;
  multiplier: number;
  perfect: number;
  great: number;
  good: number;
  miss: number;
  accuracy: number;
  stars: number; // 0-5
}

export interface GameConfig {
  difficulty: Difficulty;
  songId: string;
  fallSpeed: number; // pixels per second
  timingWindows: TimingWindows;
}

export interface TimingWindows {
  perfect: number; // ms
  great: number;
  good: number;
}

export interface HighScore {
  songId: string;
  difficulty: Difficulty;
  score: number;
  stars: number;
  accuracy: number;
  maxCombo: number;
  date: string;
}

// ===== Particle Types =====
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

// ===== App Types =====
export type AppMode = 'library' | 'practice' | 'game' | 'settings' | 'curriculum' | 'analytics' | 'leaderboard' | 'profile';

export interface AppSettings {
  showNoteNames: boolean;
  volume: number;
  midiDeviceId: string | null;
}

// ===== Practice Tools Types =====
export interface LoopRange {
  startMeasure: number;
  endMeasure: number;
}

export interface PracticeToolsState {
  tempoPercent: number; // 25-150
  loopEnabled: boolean;
  loopRange: LoopRange | null;
  metronomeEnabled: boolean;
  countInEnabled: boolean;
  autoSpeedUp: boolean;
  autoSpeedUpTarget: number; // target tempo percent
  currentAutoTempo: number;
}

// ===== Performance Analysis Types =====
export type LetterGrade = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface NoteTimingData {
  noteId: string;
  midi: number;
  expectedTime: number;
  actualTime: number;
  deltaMs: number;
  velocity: number;
  hand: 'left' | 'right';
  rating: HitRating;
  measure: number;
}

export interface PerformanceReport {
  songId: string;
  difficulty: Difficulty;
  date: string;
  duration: number;
  overallAccuracy: number;
  letterGrade: LetterGrade;
  score: number;
  timingAnalysis: TimingAnalysis;
  dynamicsAnalysis: DynamicsAnalysis;
  troubleSpots: TroubleSpot[];
  practiceSuggestions: string[];
  noteTimings: NoteTimingData[];
}

export interface TimingAnalysis {
  averageDeltaMs: number;
  leftHandAvgDelta: number;
  rightHandAvgDelta: number;
  rushingTendency: boolean;
  draggingTendency: boolean;
  steadiness: number; // 0-100
  insights: string[];
}

export interface DynamicsAnalysis {
  averageVelocity: number;
  velocityRange: number;
  uniformity: number; // 0-100, high = too uniform
  insights: string[];
}

export interface TroubleSpot {
  measureStart: number;
  measureEnd: number;
  accuracy: number;
  description: string;
}

export interface SessionHistory {
  songId: string;
  difficulty: Difficulty;
  date: string;
  score: number;
  accuracy: number;
  duration: number;
}

// ===== Social / Leaderboard Types =====
export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  accuracy: number;
  stars: number;
  date: string;
  isPlayer: boolean;
}

export interface PlayerProfile {
  username: string;
  avatarIndex: number;
  xp: number;
  level: number;
  badges: string[];
  songsPlayed: number;
  songsMastered: number;
  totalPracticeTime: number;
  joinDate: string;
  dailyStreak: number;
  longestStreak: number;
  lastPlayedDate: string;
  streakFreezes: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedDate?: string;
  category: 'performance' | 'dedication' | 'mastery' | 'social';
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  songIds: string[];
  startDate: string;
  endDate: string;
  bestScore: number;
}

export interface Friend {
  username: string;
  avatarIndex: number;
  level: number;
  xp: number;
}

// ===== Analytics Types =====
export interface DailyPracticeData {
  date: string;
  totalMinutes: number;
  sessions: number;
  averageAccuracy: number;
  songsPlayed: string[];
}

export interface KeyAccuracyData {
  midi: number;
  totalHits: number;
  correctHits: number;
  accuracy: number;
}

export interface AnalyticsData {
  dailyPractice: DailyPracticeData[];
  keyAccuracy: KeyAccuracyData[];
  sessionHistory: SessionHistory[];
  songAccuracyTrends: Record<string, { date: string; accuracy: number }[]>;
}

// ===== Curriculum Types =====
export type SkillPath = 'fundamentals' | 'chords' | 'sightReading' | 'technique' | 'songMastery';

export interface Lesson {
  id: string;
  pathId: SkillPath;
  order: number;
  title: string;
  description: string;
  explanation: string;
  exerciseNotes: SongNote[];
  exerciseBpm: number;
  passingAccuracy: number;
  prerequisites: string[];
  completed: boolean;
  bestAccuracy: number;
}

export interface SkillPathData {
  id: SkillPath;
  name: string;
  icon: string;
  description: string;
  lessons: Lesson[];
}

export interface PracticePlan {
  duration: number; // minutes
  activities: PracticePlanActivity[];
}

export interface PracticePlanActivity {
  type: 'lesson' | 'song' | 'exercise';
  title: string;
  description: string;
  duration: number; // minutes
  targetId: string;
}

// ===== Recording Types =====
export interface RecordedEvent {
  midi: number;
  velocity: number;
  timestamp: number; // ms from start
  type: 'noteOn' | 'noteOff';
}

export interface Recording {
  id: string;
  name: string;
  songId: string;
  difficulty: Difficulty;
  date: string;
  duration: number;
  events: RecordedEvent[];
  score: number;
  accuracy: number;
  journalNote: string;
}
