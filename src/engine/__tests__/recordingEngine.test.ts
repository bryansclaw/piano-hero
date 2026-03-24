import { describe, it, expect } from 'vitest';
import {
  createRecordingSession,
  startRecording,
  stopRecording,
  addRecordingEvent,
  getRecordingDuration,
  createPlaybackState,
  updatePlayback,
  compareWithPerfect,
  exportRecordingSummary,
  generateRecordingId,
} from '../recordingEngine';
import type { Recording, SongNote } from '../../types';

describe('Recording Session', () => {
  it('creates a recording session', () => {
    const session = createRecordingSession('test-song', 'easy');
    expect(session.songId).toBe('test-song');
    expect(session.difficulty).toBe('easy');
    expect(session.isRecording).toBe(false);
    expect(session.events.length).toBe(0);
  });

  it('starts recording', () => {
    const session = startRecording(createRecordingSession('test-song', 'easy'));
    expect(session.isRecording).toBe(true);
    expect(session.startTime).toBeGreaterThan(0);
  });

  it('stops recording', () => {
    let session = startRecording(createRecordingSession('test-song', 'easy'));
    session = stopRecording(session);
    expect(session.isRecording).toBe(false);
  });

  it('adds events when recording', () => {
    let session = startRecording(createRecordingSession('test-song', 'easy'));
    session = addRecordingEvent(session, 60, 100, 'noteOn');
    session = addRecordingEvent(session, 60, 0, 'noteOff');
    expect(session.events.length).toBe(2);
    expect(session.events[0].midi).toBe(60);
    expect(session.events[0].type).toBe('noteOn');
  });

  it('does not add events when not recording', () => {
    const session = createRecordingSession('test-song', 'easy');
    const updated = addRecordingEvent(session, 60, 100, 'noteOn');
    expect(updated.events.length).toBe(0);
  });

  it('calculates recording duration', () => {
    let session = startRecording(createRecordingSession('test-song', 'easy'));
    session = { ...session, events: [
      { midi: 60, velocity: 100, timestamp: 0, type: 'noteOn' as const },
      { midi: 60, velocity: 0, timestamp: 2000, type: 'noteOff' as const },
    ]};
    expect(getRecordingDuration(session)).toBe(2);
  });

  it('returns 0 duration for empty session', () => {
    const session = createRecordingSession('test-song', 'easy');
    expect(getRecordingDuration(session)).toBe(0);
  });
});

describe('Playback', () => {
  const mockRecording: Recording = {
    id: 'rec-1',
    name: 'Test Recording',
    songId: 'test-song',
    difficulty: 'easy',
    date: new Date().toISOString(),
    duration: 2,
    events: [
      { midi: 60, velocity: 100, timestamp: 500, type: 'noteOn' },
      { midi: 60, velocity: 0, timestamp: 1000, type: 'noteOff' },
      { midi: 62, velocity: 80, timestamp: 1500, type: 'noteOn' },
      { midi: 62, velocity: 0, timestamp: 2000, type: 'noteOff' },
    ],
    score: 5000,
    accuracy: 85,
    journalNote: '',
  };

  it('creates playback state', () => {
    const state = createPlaybackState(mockRecording);
    expect(state.currentTime).toBe(0);
    expect(state.isPlaying).toBe(false);
    expect(state.activeNotes.size).toBe(0);
  });

  it('updates playback and activates notes', () => {
    let state = createPlaybackState(mockRecording);
    state = { ...state, isPlaying: true };
    state = updatePlayback(state, 600); // Past first noteOn
    expect(state.activeNotes.has(60)).toBe(true);
    expect(state.eventIndex).toBe(1);
  });

  it('deactivates notes on noteOff', () => {
    let state = createPlaybackState(mockRecording);
    state = { ...state, isPlaying: true };
    state = updatePlayback(state, 1100); // Past first noteOff
    expect(state.activeNotes.has(60)).toBe(false);
  });

  it('stops playing when all events processed', () => {
    let state = createPlaybackState(mockRecording);
    state = { ...state, isPlaying: true };
    state = updatePlayback(state, 3000); // Past all events
    expect(state.isPlaying).toBe(false);
  });

  it('does not update when not playing', () => {
    const state = createPlaybackState(mockRecording);
    const updated = updatePlayback(state, 1000);
    expect(updated.currentTime).toBe(0);
  });
});

describe('Comparison', () => {
  const perfectNotes: SongNote[] = [
    { midi: 60, time: 0.5, duration: 0.5, velocity: 80, hand: 'right' },
    { midi: 62, time: 1.0, duration: 0.5, velocity: 80, hand: 'right' },
    { midi: 64, time: 1.5, duration: 0.5, velocity: 80, hand: 'right' },
  ];

  it('calculates match rate for perfect performance', () => {
    const recording: Recording = {
      id: 'rec-1', name: 'Test', songId: 'test', difficulty: 'easy',
      date: '', duration: 2, score: 0, accuracy: 0, journalNote: '',
      events: [
        { midi: 60, velocity: 100, timestamp: 500, type: 'noteOn' },
        { midi: 62, velocity: 100, timestamp: 1000, type: 'noteOn' },
        { midi: 64, velocity: 100, timestamp: 1500, type: 'noteOn' },
      ],
    };
    const result = compareWithPerfect(recording, perfectNotes);
    expect(result.matchRate).toBe(100);
    expect(result.missedNotes).toBe(0);
  });

  it('detects missed notes', () => {
    const recording: Recording = {
      id: 'rec-1', name: 'Test', songId: 'test', difficulty: 'easy',
      date: '', duration: 2, score: 0, accuracy: 0, journalNote: '',
      events: [
        { midi: 60, velocity: 100, timestamp: 500, type: 'noteOn' },
      ],
    };
    const result = compareWithPerfect(recording, perfectNotes);
    expect(result.missedNotes).toBe(2);
    expect(result.matchRate).toBeLessThan(100);
  });

  it('detects extra notes', () => {
    const recording: Recording = {
      id: 'rec-1', name: 'Test', songId: 'test', difficulty: 'easy',
      date: '', duration: 2, score: 0, accuracy: 0, journalNote: '',
      events: [
        { midi: 60, velocity: 100, timestamp: 500, type: 'noteOn' },
        { midi: 62, velocity: 100, timestamp: 1000, type: 'noteOn' },
        { midi: 64, velocity: 100, timestamp: 1500, type: 'noteOn' },
        { midi: 66, velocity: 100, timestamp: 1800, type: 'noteOn' },
      ],
    };
    const result = compareWithPerfect(recording, perfectNotes);
    expect(result.extraNotes).toBe(1);
  });
});

describe('Export', () => {
  it('generates summary string', () => {
    const recording: Recording = {
      id: 'rec-1', name: 'Test', songId: 'love-story', difficulty: 'medium',
      date: '2024-01-15T12:00:00Z', duration: 120, score: 50000,
      accuracy: 92.5, journalNote: 'Great session!', events: [],
    };
    const summary = exportRecordingSummary(recording);
    expect(summary).toContain('PianoHero');
    expect(summary).toContain('love-story');
    expect(summary).toContain('medium');
    expect(summary).toContain('92.5%');
    expect(summary).toContain('Great session!');
  });
});

describe('generateRecordingId', () => {
  it('generates unique IDs', () => {
    const id1 = generateRecordingId();
    const id2 = generateRecordingId();
    expect(id1).not.toBe(id2);
    expect(id1.startsWith('rec-')).toBe(true);
  });
});
