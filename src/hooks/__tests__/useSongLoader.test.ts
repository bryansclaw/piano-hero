import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSongLoader } from '../useSongLoader';

describe('useSongLoader', () => {
  it('starts with no current song', () => {
    const { result } = renderHook(() => useSongLoader());
    expect(result.current.currentSong).toBeNull();
    expect(result.current.currentNotes).toEqual([]);
  });

  it('loadSong sets currentSong correctly', () => {
    const { result } = renderHook(() => useSongLoader());

    // Pick the first available song
    const firstSong = result.current.songs[0];
    expect(firstSong).toBeDefined();

    act(() => {
      result.current.loadSong(firstSong.id, 'easy');
    });

    expect(result.current.currentSong).not.toBeNull();
    expect(result.current.currentSong!.id).toBe(firstSong.id);
    expect(result.current.currentNotes.length).toBeGreaterThan(0);
  });

  it('loadCustomSong sets custom song correctly', () => {
    const { result } = renderHook(() => useSongLoader());

    const customSong = {
      id: 'custom-test',
      title: 'Custom Test',
      artist: 'Test',
      bpm: 120,
      key: 'C',
      duration: 10,
      notes: {
        easy: [{ midi: 60, time: 0, duration: 1, velocity: 80, hand: 'right' as const }],
        medium: [{ midi: 60, time: 0, duration: 1, velocity: 80, hand: 'right' as const }],
        hard: [{ midi: 60, time: 0, duration: 1, velocity: 80, hand: 'right' as const }],
        expert: [{ midi: 60, time: 0, duration: 1, velocity: 80, hand: 'right' as const }],
      },
    };

    act(() => {
      result.current.loadCustomSong(customSong, 'easy');
    });

    expect(result.current.currentSong).not.toBeNull();
    expect(result.current.currentSong!.id).toBe('custom-test');
    expect(result.current.currentSong!.title).toBe('Custom Test');
    expect(result.current.currentNotes.length).toBeGreaterThan(0);
  });

  it('loadSong after loadCustomSong clears custom song', () => {
    const { result } = renderHook(() => useSongLoader());

    const customSong = {
      id: 'custom-test-2',
      title: 'Custom',
      artist: 'Test',
      bpm: 120,
      key: 'C',
      duration: 10,
      notes: {
        easy: [{ midi: 60, time: 0, duration: 1, velocity: 80, hand: 'right' as const }],
        medium: [{ midi: 60, time: 0, duration: 1, velocity: 80, hand: 'right' as const }],
        hard: [{ midi: 60, time: 0, duration: 1, velocity: 80, hand: 'right' as const }],
        expert: [{ midi: 60, time: 0, duration: 1, velocity: 80, hand: 'right' as const }],
      },
    };

    act(() => {
      result.current.loadCustomSong(customSong, 'easy');
    });
    expect(result.current.currentSong!.id).toBe('custom-test-2');

    // Now load a catalog song
    const catalogSong = result.current.songs[0];
    act(() => {
      result.current.loadSong(catalogSong.id, 'easy');
    });

    expect(result.current.currentSong!.id).toBe(catalogSong.id);
    expect(result.current.currentSong!.id).not.toBe('custom-test-2');
  });

  it('loading non-existent song ID returns null', () => {
    const { result } = renderHook(() => useSongLoader());

    act(() => {
      result.current.loadSong('nonexistent-song-id-xyz', 'easy');
    });

    expect(result.current.currentSong).toBeNull();
    expect(result.current.currentNotes).toEqual([]);
  });
});
