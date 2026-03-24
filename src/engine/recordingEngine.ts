import type { RecordedEvent, Recording, Difficulty, SongNote } from '../types';

const RECORDINGS_KEY = 'piano-hero-recordings';

// ===== Recording =====
export interface RecordingSession {
  songId: string;
  difficulty: Difficulty;
  events: RecordedEvent[];
  startTime: number;
  isRecording: boolean;
}

export function createRecordingSession(songId: string, difficulty: Difficulty): RecordingSession {
  return {
    songId,
    difficulty,
    events: [],
    startTime: 0,
    isRecording: false,
  };
}

export function startRecording(session: RecordingSession): RecordingSession {
  return {
    ...session,
    events: [],
    startTime: performance.now(),
    isRecording: true,
  };
}

export function stopRecording(session: RecordingSession): RecordingSession {
  return {
    ...session,
    isRecording: false,
  };
}

export function addRecordingEvent(
  session: RecordingSession,
  midi: number,
  velocity: number,
  type: 'noteOn' | 'noteOff',
): RecordingSession {
  if (!session.isRecording) return session;

  const timestamp = performance.now() - session.startTime;
  return {
    ...session,
    events: [...session.events, { midi, velocity, timestamp, type }],
  };
}

export function getRecordingDuration(session: RecordingSession): number {
  if (session.events.length === 0) return 0;
  return session.events[session.events.length - 1].timestamp / 1000;
}

// ===== Playback =====
export interface PlaybackState {
  recording: Recording;
  currentTime: number;
  isPlaying: boolean;
  activeNotes: Set<number>;
  eventIndex: number;
}

export function createPlaybackState(recording: Recording): PlaybackState {
  return {
    recording,
    currentTime: 0,
    isPlaying: false,
    activeNotes: new Set(),
    eventIndex: 0,
  };
}

export function updatePlayback(state: PlaybackState, deltaMs: number): PlaybackState {
  if (!state.isPlaying) return state;

  const newTime = state.currentTime + deltaMs;
  const activeNotes = new Set(state.activeNotes);
  let eventIndex = state.eventIndex;

  while (eventIndex < state.recording.events.length) {
    const event = state.recording.events[eventIndex];
    if (event.timestamp > newTime) break;

    if (event.type === 'noteOn') {
      activeNotes.add(event.midi);
    } else {
      activeNotes.delete(event.midi);
    }
    eventIndex++;
  }

  const isComplete = eventIndex >= state.recording.events.length;

  return {
    ...state,
    currentTime: newTime,
    activeNotes,
    eventIndex,
    isPlaying: !isComplete,
  };
}

// ===== Comparison =====
export interface ComparisonResult {
  timingDifferences: { time: number; perfectMidi: number; recordedMidi: number; deltaMs: number }[];
  missedNotes: number;
  extraNotes: number;
  matchRate: number;
}

export function compareWithPerfect(
  recording: Recording,
  perfectNotes: SongNote[],
  toleranceMs = 200,
): ComparisonResult {
  const noteOnEvents = recording.events.filter(e => e.type === 'noteOn');
  const matched = new Set<number>();
  const timingDifferences: ComparisonResult['timingDifferences'] = [];

  for (const event of noteOnEvents) {
    let bestMatch = -1;
    let bestDelta = Infinity;

    for (let i = 0; i < perfectNotes.length; i++) {
      if (matched.has(i)) continue;
      const perfect = perfectNotes[i];
      if (perfect.midi !== event.midi) continue;

      const delta = event.timestamp - perfect.time * 1000;
      if (Math.abs(delta) < Math.abs(bestDelta) && Math.abs(delta) <= toleranceMs) {
        bestDelta = delta;
        bestMatch = i;
      }
    }

    if (bestMatch >= 0) {
      matched.add(bestMatch);
      timingDifferences.push({
        time: perfectNotes[bestMatch].time,
        perfectMidi: perfectNotes[bestMatch].midi,
        recordedMidi: event.midi,
        deltaMs: Math.round(bestDelta),
      });
    }
  }

  const missedNotes = perfectNotes.length - matched.size;
  const extraNotes = noteOnEvents.length - matched.size;
  const matchRate = perfectNotes.length > 0
    ? Math.round((matched.size / perfectNotes.length) * 100)
    : 0;

  return { timingDifferences, missedNotes, extraNotes, matchRate };
}

// ===== Persistence =====
export function loadRecordings(): Recording[] {
  try {
    const data = localStorage.getItem(RECORDINGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveRecording(recording: Recording): void {
  const recordings = loadRecordings();
  recordings.push(recording);
  const trimmed = recordings.slice(-50);
  localStorage.setItem(RECORDINGS_KEY, JSON.stringify(trimmed));
}

export function deleteRecording(id: string): void {
  const recordings = loadRecordings().filter(r => r.id !== id);
  localStorage.setItem(RECORDINGS_KEY, JSON.stringify(recordings));
}

export function updateRecordingJournal(id: string, note: string): void {
  const recordings = loadRecordings();
  const recording = recordings.find(r => r.id === id);
  if (recording) {
    recording.journalNote = note;
    localStorage.setItem(RECORDINGS_KEY, JSON.stringify(recordings));
  }
}

export function exportRecordingSummary(recording: Recording): string {
  const date = new Date(recording.date).toLocaleDateString();
  return [
    `🎹 PianoHero Recording Summary`,
    `Song: ${recording.songId}`,
    `Difficulty: ${recording.difficulty}`,
    `Date: ${date}`,
    `Score: ${recording.score.toLocaleString()}`,
    `Accuracy: ${recording.accuracy}%`,
    `Duration: ${Math.round(recording.duration)}s`,
    recording.journalNote ? `Notes: ${recording.journalNote}` : '',
  ].filter(Boolean).join('\n');
}

export function generateRecordingId(): string {
  return `rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
