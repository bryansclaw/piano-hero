import type { GameState, GameScore, FallingNote, GameConfig, SongNote, HitRating } from '../types';
import { createInitialScore, processHit, getHitRating, calculateStars, calculateMaxScore } from './scoring';
import { HIT_LINE_Y_PERCENT } from '../utils/constants';

export interface GameEngineState {
  gameState: GameState;
  score: GameScore;
  fallingNotes: FallingNote[];
  currentTime: number; // seconds into the song
  countdown: number;
  config: GameConfig;
  songDuration: number;
  lastRating: HitRating | null;
  lastRatingTime: number;
}

// Lead-in time (seconds) before the first note arrives at the hit line
const LEAD_IN_TIME = 3;

export function createGameEngine(config: GameConfig, notes: SongNote[], songDuration: number): GameEngineState {
  const fallingNotes: FallingNote[] = notes.map((n, i) => ({
    id: `note-${i}-${n.midi}-${n.time}`,
    midi: n.midi,
    time: n.time + LEAD_IN_TIME, // Offset all notes so first one doesn't arrive immediately
    duration: n.duration,
    y: -100,
    hit: false,
    hand: n.hand,
  }));

  return {
    gameState: 'idle',
    score: createInitialScore(),
    fallingNotes,
    currentTime: 0,
    countdown: 3,
    config,
    songDuration: songDuration + LEAD_IN_TIME,
    lastRating: null,
    lastRatingTime: 0,
  };
}

export function startCountdown(state: GameEngineState): GameEngineState {
  return { ...state, gameState: 'countdown', countdown: 3 };
}

export function startPlaying(state: GameEngineState): GameEngineState {
  return { ...state, gameState: 'playing', currentTime: 0 };
}

export function pauseGame(state: GameEngineState): GameEngineState {
  if (state.gameState !== 'playing') return state;
  return { ...state, gameState: 'paused' };
}

export function resumeGame(state: GameEngineState): GameEngineState {
  if (state.gameState !== 'paused') return state;
  return { ...state, gameState: 'playing' };
}

export function completeGame(state: GameEngineState): GameEngineState {
  const maxScore = calculateMaxScore(state.fallingNotes.length);
  const stars = calculateStars(state.score.points, maxScore);
  return {
    ...state,
    gameState: 'complete',
    score: { ...state.score, stars },
  };
}

/**
 * Update game state each frame
 */
export function updateGame(
  state: GameEngineState,
  deltaMs: number,
  canvasHeight: number,
): GameEngineState {
  if (state.gameState !== 'playing') return state;

  // Clamp delta to max 100ms to prevent huge jumps when tab is backgrounded
  const clampedDeltaMs = Math.min(deltaMs, 100);
  const deltaSec = clampedDeltaMs / 1000;
  const newTime = state.currentTime + deltaSec;
  const hitLineY = canvasHeight * HIT_LINE_Y_PERCENT;
  const { fallSpeed } = state.config;

  let newScore = state.score;
  const newNotes = state.fallingNotes.map((note) => {
    if (note.hit) return note;

    // Calculate Y position based on timing
    const timeUntilHit = note.time - newTime;
    const y = hitLineY - timeUntilHit * fallSpeed;

    // Check if note has passed too far below hit line (missed)
    const missThreshold = hitLineY + state.config.timingWindows.good * fallSpeed / 1000;
    if (y > missThreshold && !note.hit) {
      newScore = processHit(newScore, 'miss');
      return { ...note, y, hit: true, rating: 'miss' as HitRating };
    }

    return { ...note, y };
  });

  // Check if song is complete (handles 0-note songs gracefully)
  const allNotesHit = newNotes.length === 0 || newNotes.every((n) => n.hit);
  const lastNoteTime = newNotes.length > 0 ? Math.max(...newNotes.map(n => n.time)) : 0;
  // Complete when: all notes are hit/missed AND we've passed the last note by 2 seconds,
  // OR we've exceeded the song duration + 2 seconds
  const allDone = allNotesHit && (newTime > lastNoteTime + 2 || newTime > state.songDuration);
  if (allDone || newTime > state.songDuration + 2) {
    const maxScore = calculateMaxScore(state.fallingNotes.length);
    const stars = calculateStars(newScore.points, maxScore);
    return {
      ...state,
      gameState: 'complete',
      currentTime: newTime,
      fallingNotes: newNotes,
      score: { ...newScore, stars },
    };
  }

  return {
    ...state,
    currentTime: newTime,
    fallingNotes: newNotes,
    score: newScore,
  };
}

/**
 * Handle a MIDI note input from the player
 */
export function handleNoteInput(
  state: GameEngineState,
  midiNote: number,
  _timestamp: number,
  _canvasHeight: number,
): GameEngineState {
  if (state.gameState !== 'playing') return state;

  const { timingWindows } = state.config;

  // Find the closest unhit note with matching MIDI number
  let bestNote: FallingNote | null = null;
  let bestDelta = Infinity;

  for (const note of state.fallingNotes) {
    if (note.hit || note.midi !== midiNote) continue;

    const expectedTime = note.time;
    const deltaMs = (state.currentTime - expectedTime) * 1000;
    const absDelta = Math.abs(deltaMs);

    if (absDelta < bestDelta && absDelta <= timingWindows.good) {
      bestDelta = absDelta;
      bestNote = note;
    }
  }

  if (!bestNote) return state;

  const deltaMs = (state.currentTime - bestNote.time) * 1000;
  const rating = getHitRating(deltaMs, timingWindows);
  const newScore = processHit(state.score, rating);

  const newNotes = state.fallingNotes.map((n) =>
    n.id === bestNote!.id ? { ...n, hit: true, rating } : n,
  );

  return {
    ...state,
    fallingNotes: newNotes,
    score: newScore,
    lastRating: rating,
    lastRatingTime: performance.now(),
  };
}
